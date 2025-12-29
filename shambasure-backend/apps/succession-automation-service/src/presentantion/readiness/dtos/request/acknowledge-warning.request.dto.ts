import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AcknowledgeWarningRequestDto {
  @ApiPropertyOptional({
    description: 'Optional notes on why this warning is being acknowledged/ignored',
    example: 'Client is aware of the potential delay but wishes to proceed.',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  notes?: string;
}
