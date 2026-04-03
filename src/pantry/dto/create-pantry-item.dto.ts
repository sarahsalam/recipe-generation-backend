import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePantryItemDto {
  @ApiProperty({ example: 'Eggs' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
