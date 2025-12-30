import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActivateGuardianshipDto {
  @ApiPropertyOptional({
    description: 'The effective date of activation. Defaults to NOW if empty.',
  })
  @IsOptional()
  @IsDateString()
  activationDate?: Date;

  @ApiPropertyOptional({
    description: 'Optional comment regarding activation (e.g., "Court fees paid")',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  activationNotes?: string;
}
