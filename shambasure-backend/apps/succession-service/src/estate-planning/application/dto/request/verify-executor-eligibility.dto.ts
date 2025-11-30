import { ExecutorEligibilityStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class VerifyExecutorEligibilityDto {
  @IsEnum(ExecutorEligibilityStatus)
  eligibilityStatus: ExecutorEligibilityStatus;

  @IsString()
  @IsNotEmpty()
  verifiedBy: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.eligibilityStatus !== ExecutorEligibilityStatus.ELIGIBLE)
  ineligibilityReason?: string;
}
