// verify-witness-eligibility.dto.ts
import { WitnessEligibilityStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class VerifyWitnessEligibilityDto {
  @IsEnum(WitnessEligibilityStatus)
  eligibilityStatus: WitnessEligibilityStatus;

  @IsString()
  @IsNotEmpty()
  verifiedBy: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.eligibilityStatus !== WitnessEligibilityStatus.ELIGIBLE)
  ineligibilityReason?: string;
}
