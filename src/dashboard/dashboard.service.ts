import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const [pantryCount, recipesCount, favoritesCount, weeklyPlanCount] =
      await Promise.all([
        this.prisma.pantryItem.count({ where: { userId } }),
        this.prisma.recipe.count({ where: { userId } }),
        this.prisma.recipe.count({ where: { userId, favorite: true } }),
        this.prisma.mealPlan.count({ where: { userId } }),
      ]);

    return {
      pantryCount,
      recipesCount,
      favoritesCount,
      weeklyPlanCount,
    };
  }
}
