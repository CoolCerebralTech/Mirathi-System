import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMitigationRequestDto {
  @ApiProperty({
    description: 'The specific action taken to mitigate (but not resolve) the risk',
    example: 'Applied for letter from Chief, waiting for appointment.',
  })
  @IsString()
  @IsNotEmpty()
  actionTaken: string;

  @ApiPropertyOptional({
    description: 'When the next follow-up action should occur (ISO 8601 Date)',
    example: '2025-02-15T09:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  followUpDate?: string;
}
