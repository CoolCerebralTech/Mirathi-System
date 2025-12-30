import { IsNotEmpty, IsUUID } from 'class-validator';

export class InitializeAssessmentDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  familyId: string;
}
