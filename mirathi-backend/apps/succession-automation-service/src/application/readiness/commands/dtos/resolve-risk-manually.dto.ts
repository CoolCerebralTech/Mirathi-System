import { IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class ResolveRiskManuallyDto {
  @IsUUID()
  @IsNotEmpty()
  assessmentId: string;

  @IsUUID()
  @IsNotEmpty()
  riskId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, {
    message:
      'Resolution notes must be at least 10 characters long to provide a valid legal audit trail.',
  })
  @MaxLength(1000)
  resolutionNotes: string;
}
