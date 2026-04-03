import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { PrismaService } from '../prisma/prisma.service';

type FindRecipesOptions = {
  favorite?: boolean;
  page?: string;
  limit?: string;
  search?: string;
  sort?: string;
  order?: string;
};

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createRecipeDto: CreateRecipeDto, userId: string) {
    return this.prisma.recipe.create({
      data: {
        name: createRecipeDto.name,
        ingredients: createRecipeDto.ingredients,
        steps: createRecipeDto.steps,
        cookTime: createRecipeDto.cookTime ?? 'Not specified',
        calories: createRecipeDto.calories,
        userId,
      },
    });
  }

  async findAll(userId: string, options: FindRecipesOptions) {
    const page = Math.max(Number(options.page ?? 1) || 1, 1);
    const limit = Math.min(Math.max(Number(options.limit ?? 10) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const order = options.order === 'asc' ? 'asc' : 'desc';

    const allowedSortFields: Array<'createdAt' | 'name' | 'cookTime' | 'calories'> = [
      'createdAt',
      'name',
      'cookTime',
      'calories',
    ];

    const sortField = allowedSortFields.includes(options.sort as never)
      ? (options.sort as 'createdAt' | 'name' | 'cookTime' | 'calories')
      : 'createdAt';

    const where = {
      userId,
      ...(options.favorite === undefined ? {} : { favorite: options.favorite }),
      ...(options.search?.trim()
        ? {
            name: {
              contains: options.search.trim(),
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        orderBy: {
          [sortField]: order,
        },
        skip,
        take: limit,
      }),
      this.prisma.recipe.count({ where }),
    ]);

    return {
      data,
      page,
      limit,
      total,
    };
  }

  async findOne(id: string, userId: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }

    return recipe;
  }

  async update(id: string, updateRecipeDto: UpdateRecipeDto, userId: string) {
    const result = await this.prisma.recipe.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        ...(updateRecipeDto.name !== undefined ? { name: updateRecipeDto.name } : {}),
        ...(updateRecipeDto.ingredients !== undefined
          ? { ingredients: updateRecipeDto.ingredients }
          : {}),
        ...(updateRecipeDto.steps !== undefined ? { steps: updateRecipeDto.steps } : {}),
        ...(updateRecipeDto.cookTime !== undefined
          ? { cookTime: updateRecipeDto.cookTime || 'Not specified' }
          : {}),
        ...(updateRecipeDto.calories !== undefined
          ? { calories: updateRecipeDto.calories }
          : {}),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }

    return this.findOne(id, userId);
  }

  async setFavorite(id: string, favorite: boolean, userId: string) {
    const result = await this.prisma.recipe.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        favorite,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.prisma.recipe.deleteMany({
      where: {
        id,
        userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }
  }
}
