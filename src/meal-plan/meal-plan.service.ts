import { Injectable, NotFoundException } from '@nestjs/common';
import { MealDay } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';

const WEEK_DAYS: MealDay[] = [
  MealDay.monday,
  MealDay.tuesday,
  MealDay.wednesday,
  MealDay.thursday,
  MealDay.friday,
  MealDay.saturday,
  MealDay.sunday,
];

@Injectable()
export class MealPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertForDay(createMealPlanDto: CreateMealPlanDto, userId: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        id: createMealPlanDto.recipeId,
        userId,
      },
      select: { id: true },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found for current user');
    }

    return this.prisma.mealPlan.upsert({
      where: {
        userId_day: {
          userId,
          day: createMealPlanDto.day,
        },
      },
      update: {
        recipeId: createMealPlanDto.recipeId,
      },
      create: {
        userId,
        day: createMealPlanDto.day,
        recipeId: createMealPlanDto.recipeId,
      },
    });
  }

  async getWeeklyPlan(userId: string) {
    const mealPlans = await this.prisma.mealPlan.findMany({
      where: { userId },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            cookTime: true,
          },
        },
      },
    });

    const mapByDay = new Map(mealPlans.map((mealPlan) => [mealPlan.day, mealPlan]));

    return WEEK_DAYS.map((day) => {
      const mealPlan = mapByDay.get(day);
      return {
        day,
        recipe: mealPlan
          ? {
              id: mealPlan.recipe.id,
              name: mealPlan.recipe.name,
              cookTime: mealPlan.recipe.cookTime,
            }
          : null,
      };
    });
  }

  async getDay(day: MealDay, userId: string) {
    const mealPlan = await this.prisma.mealPlan.findFirst({
      where: {
        day,
        userId,
      },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            cookTime: true,
          },
        },
      },
    });

    return {
      day,
      recipe: mealPlan
        ? {
            id: mealPlan.recipe.id,
            name: mealPlan.recipe.name,
            cookTime: mealPlan.recipe.cookTime,
          }
        : null,
    };
  }

  async removeByDay(day: MealDay, userId: string): Promise<void> {
    const result = await this.prisma.mealPlan.deleteMany({
      where: {
        day,
        userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(`No meal plan found for ${day}`);
    }
  }
}
