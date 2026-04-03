import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GenerateFromPantryDto {
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
