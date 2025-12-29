import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateRiskMitigationDto {
  @IsUUID()
  @IsNotEmpty()
  assessmentId: string;

  @IsUUID()
  @IsNotEmpty()
  riskId: string;

  @IsString()
  @IsNotEmpty()
  actionTaken: string;

  @IsDateString()
  @IsOptional()
  followUpDate?: string;
}
