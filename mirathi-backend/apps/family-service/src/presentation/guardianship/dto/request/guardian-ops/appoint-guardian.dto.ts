import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  GuardianAppointmentSource,
  GuardianRole,
} from '../../../../../domain/entities/guardian-assignment.entity';

class ContactInfoDto {
  @ApiProperty({ description: 'Primary mobile number (Kenyan format e.g., 2547...)' })
  @IsString()
  @Matches(/^(?:254|\+254|0)?(7\d{8})$/, { message: 'Invalid Kenyan phone number' })
  primaryPhone: string;

  @ApiPropertyOptional({ description: 'Email address for notifications' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Physical residence for legal service' })
  @IsString()
  @IsNotEmpty()
  physicalAddress: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalAddress?: string;
}

class InitialPowersDto {
  @ApiProperty({ description: 'Can they manage assets/money?' })
  @IsBoolean()
  canManageProperty: boolean;

  @ApiProperty({ description: 'Can they sign for surgeries/medication?' })
  @IsBoolean()
  canMakeMedicalDecisions: boolean;

  @ApiProperty({ description: 'Can they choose schools?' })
  @IsBoolean()
  canChooseEducation: boolean;

  @ApiProperty({ description: 'Can they take the ward out of the country?' })
  @IsBoolean()
  canTravelInternationally: boolean;

  @ApiPropertyOptional({ description: 'Max amount allowed per transaction without court order' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  spendingLimitPerTransaction?: number;
}

export class AppointGuardianDto {
  // ---------------------------------------------------------
  // Identity
  // ---------------------------------------------------------
  @ApiProperty({ description: 'The Member ID from Family Service' })
  @IsUUID()
  guardianMemberId: string;

  @ApiProperty({ description: 'Full legal name' })
  @IsString()
  @IsNotEmpty()
  guardianName: string;

  @ApiProperty({ description: 'Relationship to ward (e.g., UNCLE, GRANDMOTHER)' })
  @IsString()
  @IsNotEmpty()
  relationshipToWard: string;

  // ---------------------------------------------------------
  // Role Configuration
  // ---------------------------------------------------------
  @ApiProperty({ enum: GuardianRole })
  @IsEnum(GuardianRole)
  role: GuardianRole;

  @ApiProperty({ description: 'Is this the main contact person?' })
  @IsBoolean()
  isPrimary: boolean;

  @ApiProperty({ enum: GuardianAppointmentSource })
  @IsEnum(GuardianAppointmentSource)
  appointmentSource: GuardianAppointmentSource;

  @ApiProperty({ description: 'Date the appointment takes effect' })
  @IsDateString()
  appointmentDate: Date;

  // ---------------------------------------------------------
  // Details
  // ---------------------------------------------------------
  @ApiProperty()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo: ContactInfoDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => InitialPowersDto)
  initialPowers: InitialPowersDto;

  @ApiPropertyOptional({ description: 'Reference if specific to a court ruling' })
  @IsOptional()
  @IsString()
  courtOrderReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
