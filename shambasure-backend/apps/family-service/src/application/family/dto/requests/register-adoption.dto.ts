import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class RegisterAdoptionDto {
  @IsNotEmpty()
  @IsUUID()
  familyId: string;

  @IsNotEmpty()
  @IsUUID()
  adopteeId: string;

  @IsNotEmpty()
  @IsUUID()
  adopterId: string;

  @IsNotEmpty()
  @IsString()
  adoptionType: string; // 'CUSTOMARY', 'STATUTORY'

  @IsNotEmpty()
  @IsDateString()
  adoptionDate: string;

  @IsOptional()
  @IsString()
  courtOrderNumber?: string;

  @IsOptional()
  @IsDateString()
  registrationDate?: string;

  @IsOptional()
  @IsString()
  childWelfareReport?: string; // Document ID
}
