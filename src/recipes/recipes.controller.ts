import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  ParseUUIDPipe,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { SetFavoriteDto } from './dto/set-favorite.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipesService } from './recipes.service';

@ApiTags('recipes')
@ApiBearerAuth('supabase-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create and store a recipe' })
  @ApiCreatedResponse({ description: 'Recipe created successfully' })
  create(
    @Body() createRecipeDto: CreateRecipeDto,
    @CurrentUserId() userId: string,
  ) {
    return this.recipesService.create(createRecipeDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all saved recipes' })
  @ApiQuery({
    name: 'favorite',
    required: false,
    description: 'Filter by favorite recipes only (true/false)',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default 10, max 100)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in recipe name' })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort field: createdAt | name | cookTime | calories',
  })
  @ApiQuery({ name: 'order', required: false, description: 'Sort order: asc | desc' })
  @ApiOkResponse({ description: 'Recipes returned successfully' })
  findAll(
    @CurrentUserId() userId: string,
    @Query('favorite') favorite?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
  ) {
    const favoriteFilter =
      favorite === undefined
        ? undefined
        : favorite.toLowerCase() === 'true'
          ? true
          : favorite.toLowerCase() === 'false'
            ? false
            : undefined;

    return this.recipesService.findAll(userId, {
      favorite: favoriteFilter,
      page,
      limit,
      search,
      sort,
      order,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one recipe by ID' })
  @ApiParam({ name: 'id', description: 'Recipe UUID' })
  @ApiOkResponse({ description: 'Recipe returned successfully' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.recipesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a saved recipe by ID' })
  @ApiParam({ name: 'id', description: 'Recipe UUID' })
  @ApiOkResponse({ description: 'Recipe updated successfully' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateRecipeDto: UpdateRecipeDto,
    @CurrentUserId() userId: string,
  ) {
    return this.recipesService.update(id, updateRecipeDto, userId);
  }

  @Patch(':id/favorite')
  @ApiOperation({ summary: 'Set recipe favorite status' })
  @ApiParam({ name: 'id', description: 'Recipe UUID' })
  @ApiOkResponse({ description: 'Recipe favorite status updated successfully' })
  setFavorite(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() setFavoriteDto: SetFavoriteDto,
    @CurrentUserId() userId: string,
  ) {
    return this.recipesService.setFavorite(id, setFavoriteDto.favorite, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a saved recipe by ID' })
  @ApiParam({ name: 'id', description: 'Recipe UUID' })
  @ApiNoContentResponse({ description: 'Recipe deleted successfully' })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.recipesService.remove(id, userId);
  }
}
