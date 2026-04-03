import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Sara Salam' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
