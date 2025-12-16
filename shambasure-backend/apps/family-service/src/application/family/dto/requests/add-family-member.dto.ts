import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AddFamilyMemberDto {
  @IsNotEmpty()
  @IsUUID()
  familyId: string;

  @IsOptional()
  @IsUUID()
  userId?: string; // If the member is also a registered user

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  maidenName?: string;

  // Identity
  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  kraPin?: string;

  @IsOptional()
  @IsString()
  birthCertificateEntryNumber?: string;

  // Demographics
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string; // Use string for input, transform to Date in service

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  ethnicity?: string;

  @IsOptional()
  @IsString()
  subClan?: string;

  @IsOptional()
  @IsString()
  citizenship?: string;

  // Contact
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  placeOfBirth?: string;

  // Status
  @IsOptional()
  @IsBoolean()
  isDeceased?: boolean;

  @IsOptional()
  @IsDateString()
  dateOfDeath?: string;

  @IsOptional()
  @IsBoolean()
  isMinor?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresSupportedDecisionMaking?: boolean;
}
