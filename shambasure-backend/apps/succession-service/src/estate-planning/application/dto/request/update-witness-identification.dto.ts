// update-witness-identification.dto.ts
import { WitnessVerificationMethod } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateWitnessIdentificationDto {
  @IsString()
  @IsOptional()
  idNumber?: string;

  @IsEnum(WitnessVerificationMethod)
  @IsOptional()
  idType?: WitnessVerificationMethod;

  @IsString()
  @IsOptional()
  idDocumentId?: string;
}
