import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePantryItemDto {
  @ApiProperty({ example: 'green onion' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
