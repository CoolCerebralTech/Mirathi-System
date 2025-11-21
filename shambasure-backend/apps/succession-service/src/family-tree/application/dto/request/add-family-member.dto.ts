import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsUUID,
  ValidateIf,
  Matches,
} from 'class-validator';
import { RelationshipType } from '@prisma/client';

export class AddFamilyMemberDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  // --- Vital Statistics ---
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsBoolean()
  @IsOptional()
  isDeceased?: boolean;

  @ValidateIf((o) => o.isDeceased === true)
  @IsDateString()
  dateOfDeath?: string;

  // --- Contact Info (Optional) ---
  @IsString()
  @IsOptional()
  email?: string; // We don't force IsEmail here as legacy data might be messy

  @IsString()
  @IsOptional()
  @Matches(/^(?:\+254|254|0)((7|1)\d{8})$/, { message: 'Invalid Kenyan phone number' })
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  // --- Initial Graph Link ---
  @IsEnum(RelationshipType, { message: 'Invalid Relationship Type' })
  role: RelationshipType; // e.g. "FATHER", "CHILD" relative to the Creator
}
