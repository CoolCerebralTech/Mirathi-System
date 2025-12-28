import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class CloseEstateRequestDto {
  @ApiPropertyOptional({
    example: 'All assets distributed and final account approved.',
    description: 'Final closure notes',
  })
  @IsString()
  @IsOptional()
  closureNotes?: string;

  @ApiPropertyOptional({ description: 'Date of official closure' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  closedAt?: Date;
}
