// create-witness-professional.dto.ts
import { WitnessType } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWitnessProfessionalDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  professionalCapacity: string;

  @IsString()
  @IsOptional()
  professionalLicense?: string;

  @IsString()
  @IsOptional()
  relationship?: string = 'Professional Witness';

  @IsEnum(WitnessType)
  witnessType: WitnessType = WitnessType.PROFESSIONAL_WITNESS;
}
