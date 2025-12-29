import { IsUUID, ValidateIf } from 'class-validator';

export class GetAssessmentDto {
  @ValidateIf((o) => !o.estateId)
  @IsUUID()
  assessmentId?: string;

  @ValidateIf((o) => !o.assessmentId)
  @IsUUID()
  estateId?: string;
}
