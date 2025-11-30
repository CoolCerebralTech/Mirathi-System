// verify-witness.dto.ts
import { WitnessVerificationMethod } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyWitnessDto {
  @IsString()
  @IsNotEmpty()
  verifiedBy: string;

  @IsEnum(WitnessVerificationMethod)
  verificationMethod: WitnessVerificationMethod;

  @IsString()
  @IsOptional()
  verificationNotes?: string;
}
