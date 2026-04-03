import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetFavoriteDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  favorite: boolean;
}
