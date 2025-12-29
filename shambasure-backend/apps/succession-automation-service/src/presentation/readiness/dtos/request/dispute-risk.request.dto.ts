import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class DisputeRiskRequestDto {
  @ApiProperty({
    description: 'Legal or factual reason for disputing this risk',
    example: 'The cohabitation period was only 6 months, so S.3(5) LSA does not apply.',
    minLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  reason: string;
}
