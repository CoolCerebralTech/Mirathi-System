import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class DisputeRiskDto {
  @IsUUID()
  @IsNotEmpty()
  assessmentId: string;

  @IsUUID()
  @IsNotEmpty()
  riskId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'Dispute reason must be detailed for legal review.' })
  reason: string;
}
