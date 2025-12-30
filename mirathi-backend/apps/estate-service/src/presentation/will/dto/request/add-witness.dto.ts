import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import type { WitnessType } from '../../../../domain/entities/will-witness.entity';

class WitnessIdentityDto {
  @ApiProperty({
    enum: [
      'REGISTERED_USER',
      'EXTERNAL_INDIVIDUAL',
      'PROFESSIONAL_WITNESS',
      'COURT_OFFICER',
      'NOTARY_PUBLIC',
    ],
  })
  @IsString()
  type: WitnessType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalFullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalNationalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relationshipToTestator?: string;
}

class ContactInfoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPhoneNumber('KE')
  phone?: string;
}

class EligibilityDto {
  @ApiProperty()
  @IsBoolean()
  isOver18: boolean;

  @ApiProperty()
  @IsBoolean()
  isMentallyCompetent: boolean;

  @ApiProperty()
  @IsBoolean()
  isNotBeneficiary: boolean;
}

export class AddWitnessRequestDto {
  @ApiProperty({ type: WitnessIdentityDto })
  @ValidateNested()
  @Type(() => WitnessIdentityDto)
  witnessIdentity: WitnessIdentityDto;

  @ApiPropertyOptional({ type: ContactInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo?: ContactInfoDto;

  @ApiProperty({ type: EligibilityDto })
  @ValidateNested()
  @Type(() => EligibilityDto)
  eligibilityConfirmation: EligibilityDto;
}
