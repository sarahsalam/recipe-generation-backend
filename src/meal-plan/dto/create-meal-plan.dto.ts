import { ApiProperty } from '@nestjs/swagger';
import { MealDay } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class CreateMealPlanDto {
  @ApiProperty({ enum: MealDay, example: MealDay.monday })
  @IsEnum(MealDay)
  day: MealDay;

  @ApiProperty({ example: 'd6cb2f0f-e66c-4d8f-a6a2-1630d2a6d001' })
  @IsUUID()
  recipeId: string;
}
