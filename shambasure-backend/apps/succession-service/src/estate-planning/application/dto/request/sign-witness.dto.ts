// sign-witness.dto.ts
import { SignatureType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SignWitnessDto {
  @IsEnum(SignatureType)
  signatureType: SignatureType;

  @IsString()
  @IsNotEmpty()
  signatureData: string;

  @IsString()
  @IsNotEmpty()
  signatureLocation: string;

  @IsString()
  @IsNotEmpty()
  witnessingMethod: string;

  @IsString()
  @IsOptional()
  signingNotes?: string;
}
