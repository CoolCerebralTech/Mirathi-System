import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ArchiveFamilyDto {
  @ApiProperty({ example: 'User requested deletion via account settings.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason: string;
}
