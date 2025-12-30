import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UnfreezeEstateRequestDto {
  @ApiProperty({
    example: 'Dispute resolved via mediation',
    description: 'Justification for unfreezing',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason: string;

  @ApiPropertyOptional({
    example: 'Mediation Agreement #456',
    description: 'Reference to resolution document',
  })
  @IsString()
  @IsOptional()
  resolutionReference?: string;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  unfrozenAt?: Date;
}
