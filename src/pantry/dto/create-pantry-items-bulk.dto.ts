import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreatePantryItemsBulkDto {
  @ApiProperty({
    type: [String],
    example: ['egg', 'tomato', 'garlic'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  items: string[];
}
