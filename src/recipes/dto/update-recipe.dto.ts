import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateRecipeDto {
  @ApiPropertyOptional({ example: 'Healthy Chickpea Pasta' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['200g pasta', '1 cup chickpeas', '2 tbsp olive oil'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ingredients?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Boil pasta', 'Saute chickpeas', 'Combine and serve'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  steps?: string[];

  @ApiPropertyOptional({ example: '20 minutes' })
  @IsOptional()
  @IsString()
  cookTime?: string;

  @ApiPropertyOptional({ example: 480 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  calories?: number;
}
