import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateRecipeDto {
  @ApiProperty({ example: 'Spicy Chickpea Pasta' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: [String],
    example: ['200g pasta', '1 cup chickpeas', '2 tbsp olive oil'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ingredients: string[];

  @ApiProperty({
    type: [String],
    example: ['Boil pasta', 'Saute chickpeas', 'Combine and serve'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  steps: string[];

  @ApiPropertyOptional({ example: '25 minutes' })
  @IsOptional()
  @IsString()
  cookTime?: string;

  @ApiPropertyOptional({ example: 520 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  calories?: number;
}
