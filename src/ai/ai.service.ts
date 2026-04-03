import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateFromPantryDto } from './dto/generate-from-pantry.dto';
import { GenerateMultipleRecipesDto } from './dto/generate-multiple-recipes.dto';
import { GenerateRecipeDto } from './dto/generate-recipe.dto';

type ParsedRecipe = {
    name: string;
    ingredients: string[];
    steps: string[];
    cookTime?: string;
    calories?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
};

@Injectable()
export class AiService {
    private readonly genAI: GoogleGenerativeAI;
    private readonly geminiApiKey: string;
    private readonly modelCandidates: string[];
    private selectedModelName: string | null = null;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');

        if (!geminiApiKey) {
            throw new Error('Missing GEMINI_API_KEY environment variable');
        }

        this.geminiApiKey = geminiApiKey;
        this.genAI = new GoogleGenerativeAI(geminiApiKey);

        const configuredModel =
            this.configService.get<string>('GEMINI_MODEL')?.trim() || 'gemini-2.5-flash';

        const fallbackModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

        this.modelCandidates = [
            configuredModel,
            ...fallbackModels.filter((model) => model !== configuredModel),
        ];
    }

    async generateAndSaveRecipe(input: GenerateRecipeDto, userId: string) {
        this.validateTimeLimit(input.time_limit);
        const parsedRecipe = await this.generateRecipeWithGemini(input.ingredients, input);

        const savedRecipe = await this.prisma.recipe.create({
            data: {
                name: parsedRecipe.name,
                ingredients: parsedRecipe.ingredients,
                steps: parsedRecipe.steps,
                cookTime: parsedRecipe.cookTime ?? 'Not specified',
                calories: parsedRecipe.calories,
                userId,
            },
        });

        return {
            ...savedRecipe,
            difficulty: parsedRecipe.difficulty ?? input.difficulty ?? null,
        };
    }

    async previewRecipe(input: GenerateRecipeDto) {
        this.validateTimeLimit(input.time_limit);
        const parsedRecipe = await this.generateRecipeWithGemini(input.ingredients, input);

        return {
            name: parsedRecipe.name,
            ingredients: parsedRecipe.ingredients,
            steps: parsedRecipe.steps,
            cookTime: parsedRecipe.cookTime,
            calories: parsedRecipe.calories,
            difficulty: parsedRecipe.difficulty,
        };
    }

    async generateMultipleRecipes(input: GenerateMultipleRecipesDto, userId: string) {
        this.validateTimeLimit(input.time_limit);

        const generated = await Promise.all(
            Array.from({ length: input.count }).map((_, index) =>
                this.generateRecipeWithGemini(input.ingredients, {
                    diet: input.diet,
                    cuisine: input.cuisine,
                    difficulty: input.difficulty,
                    time_limit: input.time_limit,
                    variationIndex: index + 1,
                }),
            ),
        );

        const savedRecipes = await Promise.all(
            generated.map((recipe) =>
                this.prisma.recipe.create({
                    data: {
                        name: recipe.name,
                        ingredients: recipe.ingredients,
                        steps: recipe.steps,
                        cookTime: recipe.cookTime ?? 'Not specified',
                        calories: recipe.calories,
                        userId,
                    },
                }),
            ),
        );

        return savedRecipes.map((savedRecipe, index) => ({
            ...savedRecipe,
            difficulty: generated[index].difficulty ?? input.difficulty ?? null,
        }));
    }

    async generateFromPantry(input: GenerateFromPantryDto, userId: string) {
        const pantryItems = await this.prisma.pantryItem.findMany({
            where: { userId },
            orderBy: { id: 'desc' },
        });

        if (pantryItems.length === 0) {
            throw new BadRequestException('Pantry is empty. Add pantry items first.');
        }

        const ingredients = pantryItems.map((item) => item.name);
        return this.generateAndSaveRecipe(
            {
                ingredients,
                diet: input.diet,
                cuisine: input.cuisine,
                difficulty: input.difficulty,
                time_limit: input.time_limit,
            },
            userId,
        );
    }

    private async generateRecipeWithGemini(
        ingredients: string[],
        options: Omit<GenerateRecipeDto, 'ingredients'> & { variationIndex?: number },
    ): Promise<ParsedRecipe> {
        const prompt = this.buildRecipePrompt(ingredients, options);
        let lastError: unknown;
        const modelOrder = await this.getModelOrder();

        for (const modelName of modelOrder) {
            try {
                const model = this.genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                this.selectedModelName = modelName;
                const text = result.response.text();
                const parsed = this.parseRecipeJson(text);

                if (!parsed.name || !parsed.ingredients?.length || !parsed.steps?.length) {
                    throw new Error('AI response missing required recipe fields');
                }

                const normalizedDifficulty = this.normalizeDifficulty(
                    parsed.difficulty ?? options.difficulty,
                );
                const normalizedCookTime = this.normalizeCookTime(
                    parsed.cook_time ?? parsed.cookTime ?? options.time_limit,
                );

                return {
                    name: parsed.name,
                    ingredients: parsed.ingredients,
                    steps: parsed.steps,
                    cookTime: normalizedCookTime,
                    calories:
                        typeof parsed.calories === 'number'
                            ? parsed.calories
                            : Number.isFinite(Number(parsed.calories))
                                ? Number(parsed.calories)
                                : undefined,
                    difficulty: normalizedDifficulty,
                };
            } catch (error) {
                lastError = error;
            }
        }

        throw new InternalServerErrorException(
            `Failed to generate recipe with AI: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`,
        );
    }

    private async getModelOrder(): Promise<string[]> {
        if (this.selectedModelName) {
            return [
                this.selectedModelName,
                ...this.modelCandidates.filter((m) => m !== this.selectedModelName),
            ];
        }

        try {
            const availableModels = await this.listGenerateContentModels();

            const preferredAvailable = this.modelCandidates.filter((candidate) =>
                availableModels.includes(candidate),
            );

            if (preferredAvailable.length > 0) {
                return preferredAvailable;
            }

            if (availableModels.length > 0) {
                return availableModels;
            }
        } catch {
            // If listing fails, fall back to static model candidates and let generate call determine availability.
        }

        return this.modelCandidates;
    }

    private async listGenerateContentModels(): Promise<string[]> {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${this.geminiApiKey}`,
        );

        if (!response.ok) {
            throw new Error(`Gemini ListModels failed with status ${response.status}`);
        }

        const body = (await response.json()) as {
            models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
        };

        return (body.models ?? [])
            .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
            .map((model) => model.name ?? '')
            .filter((name) => name.startsWith('models/'))
            .map((name) => name.replace('models/', ''));
    }

    private buildRecipePrompt(
        ingredients: string[],
        options: Omit<GenerateRecipeDto, 'ingredients'> & { variationIndex?: number },
    ): string {
        return [
            "ROLE:",
            "You are a professional chef and recipe generator.",

            "",
            "TASK:",
            "Generate exactly ONE recipe using the provided ingredients and constraints.",

            "",
            "OUTPUT FORMAT:",
            "Return ONLY a valid JSON object with this exact structure:",
            "{",
            '  "name": "string",',
            '  "ingredients": ["string"],',
            '  "steps": ["string"],',
            '  "cook_time": "string",',
            '  "calories": 0,',
            '  "difficulty": "easy | medium | hard"',
            "}",

            "",
            "INPUT:",
            `Ingredients: ${ingredients.join(", ")}`,
            `Diet: ${options.diet ?? "none"}`,
            `Cuisine: ${options.cuisine ?? "none"}`,
            `Difficulty: ${options.difficulty ?? "none"}`,
            `Time limit: ${options.time_limit ?? "none"}`,
            `Variation index: ${options.variationIndex ?? 1}`,

            "",
            "RULES:",
            "- Use the provided ingredients as the PRIMARY ingredients.",
            "- Do not ignore the provided ingredients unless they conflict with the diet.",
            "- You may add small supporting ingredients (salt, oil, broth, herbs, spices) if required for cooking.",
            "- Keep ingredients realistic for the selected cuisine.",
            "- Steps must be clear, concise, and in logical order.",
            "- Ingredients should include quantities where appropriate.",
            '- cook_time must be formatted like "25 minutes".',
            "- calories must be an integer estimate.",
            "- difficulty must be exactly one of: easy, medium, hard.",
            "- Respond with ONLY the JSON object.",
            "- Do NOT include explanations, markdown, or text outside JSON.",
        ].join('\n');
    }

    private validateTimeLimit(timeLimit?: string) {
        if (!timeLimit) {
            return;
        }

        const match = timeLimit.match(/(\d+)/);
        if (!match) {
            return;
        }

        const minutes = Number(match[1]);
        if (Number.isFinite(minutes) && minutes > 120) {
            throw new BadRequestException('time_limit must be 120 minutes or less');
        }
    }

    private normalizeDifficulty(value?: string): 'easy' | 'medium' | 'hard' {
        const normalized = value?.toLowerCase().trim();

        if (!normalized) {
            return 'medium';
        }

        if (normalized.includes('easy') || normalized.includes('beginner')) {
            return 'easy';
        }

        if (
            normalized.includes('hard') ||
            normalized.includes('advanced') ||
            normalized.includes('challenging')
        ) {
            return 'hard';
        }

        return 'medium';
    }

    private normalizeCookTime(value?: string): string {
        const trimmed = value?.trim();

        if (!trimmed) {
            return '30 minutes';
        }

        const minuteMatch = trimmed.match(/(\d+)/);
        if (minuteMatch) {
            return `${minuteMatch[1]} minutes`;
        }

        if (trimmed.toLowerCase().includes('half')) {
            return '30 minutes';
        }

        return trimmed.toLowerCase().includes('minute') ? trimmed : `${trimmed} minutes`;
    }

    private parseRecipeJson(rawText: string): Record<string, any> {
        const cleaned = rawText
            .trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/, '')
            .trim();

        return JSON.parse(cleaned) as Record<string, any>;
    }
}
