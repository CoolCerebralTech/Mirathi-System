import { IsNotEmpty, IsString } from 'class-validator';

export class SetAlternateBeneficiaryDto {
  @IsString()
  @IsNotEmpty()
  alternateAssignmentId: string;
}
