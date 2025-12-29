import { IsNotEmpty, IsUUID } from 'class-validator';

export class CompleteAssessmentDto {
  @IsUUID()
  @IsNotEmpty()
  assessmentId: string;
}
