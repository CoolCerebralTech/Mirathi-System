import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AcknowledgeWarningDto {
  @IsUUID()
  assessmentId: string;

  @IsUUID()
  riskId: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Notes for acknowledgement should be brief.' })
  notes?: string;
}
