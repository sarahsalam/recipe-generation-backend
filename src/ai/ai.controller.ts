import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { AiService } from './ai.service';
import { GenerateFromPantryDto } from './dto/generate-from-pantry.dto';
import { GenerateMultipleRecipesDto } from './dto/generate-multiple-recipes.dto';
import { GenerateRecipeDto } from './dto/generate-recipe.dto';

@ApiTags('ai')
@ApiBearerAuth('supabase-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-recipe')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a recipe with AI and save it for current user' })
  @ApiCreatedResponse({ description: 'Recipe generated and saved successfully' })
  generateRecipe(
    @Body() generateRecipeDto: GenerateRecipeDto,
    @CurrentUserId() userId: string,
  ) {
    return this.aiService.generateAndSaveRecipe(generateRecipeDto, userId);
  }

  @Post('generate-from-pantry')
  @ApiOperation({ summary: 'Generate a recipe from current user pantry and save it' })
  @ApiOkResponse({ description: 'Recipe generated from pantry and saved successfully' })
  generateFromPantry(
    @Body() generateFromPantryDto: GenerateFromPantryDto,
    @CurrentUserId() userId: string,
  ) {
    return this.aiService.generateFromPantry(generateFromPantryDto, userId);
  }

  @Post('preview-recipe')
  @ApiOperation({ summary: 'Generate a recipe preview with AI without saving' })
  @ApiOkResponse({ description: 'Recipe preview generated successfully' })
  previewRecipe(@Body() generateRecipeDto: GenerateRecipeDto) {
    return this.aiService.previewRecipe(generateRecipeDto);
  }

  @Post('generate-multiple')
  @ApiOperation({ summary: 'Generate multiple recipe suggestions with AI and save all' })
  @ApiCreatedResponse({ description: 'Multiple recipes generated and saved successfully' })
  generateMultiple(
    @Body() generateMultipleRecipesDto: GenerateMultipleRecipesDto,
    @CurrentUserId() userId: string,
  ) {
    return this.aiService.generateMultipleRecipes(generateMultipleRecipesDto, userId);
  }
}
