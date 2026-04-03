import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateRecipeDto {
  @ApiProperty({
    type: [String],
    example: ['chicken', 'rice', 'garlic'],
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
}
