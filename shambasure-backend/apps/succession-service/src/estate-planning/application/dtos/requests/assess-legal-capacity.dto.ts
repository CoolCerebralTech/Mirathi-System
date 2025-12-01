import { LegalCapacityStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

import { LegalCapacityAssessmentDto } from './create-will.dto';

export class AssessLegalCapacityDto {
  @ValidateNested()
  @Type(() => LegalCapacityAssessmentDto)
  assessment: LegalCapacityAssessmentDto;

  @IsString()
  @IsNotEmpty()
  assessedBy: string;

  @IsEnum(LegalCapacityStatus)
  legalCapacityStatus: LegalCapacityStatus;
}
