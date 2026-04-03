import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class GenerateMultipleRecipesDto {
  @ApiProperty({
    type: [String],
    example: ['egg', 'tomato'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ingredients: string[];

  @ApiPropertyOptional({ example: 'high-protein' })
  @IsOptional()
  @IsString()
  diet?: string;

  @ApiPropertyOptional({ example: 'asian' })
  @IsOptional()
  @IsString()
  cuisine?: string;

  @ApiPropertyOptional({ example: 'easy' })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ example: '30 minutes' })
  @IsOptional()
  @IsString()
  time_limit?: string;

  @ApiProperty({ example: 3, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  count: number;
}
