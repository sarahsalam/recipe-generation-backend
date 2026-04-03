import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MealDay } from '@prisma/client';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';
import { MealPlanService } from './meal-plan.service';

@ApiTags('meal-plan')
@ApiBearerAuth('supabase-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('meal-plan')
export class MealPlanController {
  constructor(private readonly mealPlanService: MealPlanService) {}

  @Post()
  @ApiOperation({ summary: 'Assign or replace a recipe for a day' })
  @ApiCreatedResponse({ description: 'Meal plan day assigned successfully' })
  assignDay(
    @Body() createMealPlanDto: CreateMealPlanDto,
    @CurrentUserId() userId: string,
  ) {
    return this.mealPlanService.upsertForDay(createMealPlanDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get weekly meal plan for current user' })
  @ApiOkResponse({ description: 'Weekly meal plan returned successfully' })
  getWeeklyPlan(@CurrentUserId() userId: string) {
    return this.mealPlanService.getWeeklyPlan(userId);
  }

  @Get(':day')
  @ApiOperation({ summary: 'Get meal plan for a specific day' })
  @ApiParam({ name: 'day', enum: MealDay, description: 'Day of week' })
  @ApiOkResponse({ description: 'Single day meal plan returned successfully' })
  getDay(
    @Param('day', new ParseEnumPipe(MealDay)) day: MealDay,
    @CurrentUserId() userId: string,
  ) {
    return this.mealPlanService.getDay(day, userId);
  }

  @Delete(':day')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove assigned recipe from a specific day' })
  @ApiParam({ name: 'day', enum: MealDay, description: 'Day of week' })
  @ApiNoContentResponse({ description: 'Meal plan day removed successfully' })
  removeDay(
    @Param('day', new ParseEnumPipe(MealDay)) day: MealDay,
    @CurrentUserId() userId: string,
  ) {
    return this.mealPlanService.removeByDay(day, userId);
  }
}
