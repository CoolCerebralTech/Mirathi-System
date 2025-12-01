// create-witness-external.dto.ts
import { WitnessType, WitnessVerificationMethod } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWitnessExternalDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  relationship?: string;

  @IsString()
  @IsOptional()
  idNumber?: string;

  @IsEnum(WitnessVerificationMethod)
  @IsOptional()
  idType?: WitnessVerificationMethod;

  @IsEnum(WitnessType)
  witnessType: WitnessType = WitnessType.EXTERNAL_INDIVIDUAL;
}
