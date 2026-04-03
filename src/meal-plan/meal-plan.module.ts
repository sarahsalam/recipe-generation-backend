import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MealPlanController } from './meal-plan.controller';
import { MealPlanService } from './meal-plan.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MealPlanController],
  providers: [MealPlanService],
})
export class MealPlanModule {}
