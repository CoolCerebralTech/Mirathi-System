import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class FreezeEstateRequestDto {
  @ApiProperty({
    example: 'Court Order regarding disputed validity of Will',
    description: 'Reason for freezing administration',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason: string;

  @ApiPropertyOptional({
    example: 'HC/MISC/123/2024',
    description: 'Court Order Reference if applicable',
  })
  @IsString()
  @IsOptional()
  courtOrderReference?: string;

  @ApiPropertyOptional({ description: 'Date the freeze takes effect (defaults to now)' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  frozenAt?: Date;
}
