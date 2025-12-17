// application/family/dto/request/update-family-member.request.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';

import { KENYAN_VALIDATION } from './base.request';

export class UpdateFamilyMemberRequest {
  @IsString()
  @IsOptional()
  @Length(2, 50)
  @Matches(KENYAN_VALIDATION.NAME)
  @ApiPropertyOptional({
    description: 'First name',
    example: 'John',
    minLength: 2,
    maxLength: 50,
  })
  firstName?: string;

  @IsString()
  @IsOptional()
  @Length(2, 50)
  @Matches(KENYAN_VALIDATION.NAME)
  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Mwangi',
    minLength: 2,
    maxLength: 50,
  })
  lastName?: string;

  @IsString()
  @IsOptional()
  @Length(1, 50)
  @Matches(KENYAN_VALIDATION.NAME)
  @ApiPropertyOptional({
    description: 'Middle name',
    example: 'Kamau',
    maxLength: 50,
  })
  middleName?: string;

  @IsString()
  @IsOptional()
  @Length(2, 50)
  @Matches(KENYAN_VALIDATION.NAME)
  @ApiPropertyOptional({
    description: 'Maiden name (for married women)',
    example: 'Wanjiru',
    maxLength: 50,
  })
  maidenName?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Occupation',
    example: 'Software Engineer',
    maxLength: 100,
  })
  occupation?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  @ApiPropertyOptional({
    description: 'Gender',
    example: 'MALE',
    enum: ['MALE', 'FEMALE', 'OTHER'],
  })
  gender?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Religion',
    example: 'CHRISTIAN',
    enum: ['CHRISTIAN', 'MUSLIM', 'HINDU', 'TRADITIONAL', 'OTHER', 'NONE'],
  })
  religion?: string;

  @IsString()
  @IsOptional()
  @Length(2, 50)
  @ApiPropertyOptional({
    description: 'Ethnicity/Tribe',
    example: 'Kikuyu',
    maxLength: 50,
  })
  ethnicity?: string;

  @IsString()
  @IsOptional()
  @Length(2, 50)
  @ApiPropertyOptional({
    description: 'Clan',
    example: 'Anjirũ',
    maxLength: 50,
  })
  clan?: string;

  @IsString()
  @IsOptional()
  @Length(2, 50)
  @ApiPropertyOptional({
    description: 'Sub-clan',
    example: 'Mũcemanio',
    maxLength: 50,
  })
  subClan?: string;

  @IsPhoneNumber('KE')
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Phone number (Kenyan format)',
    example: '+254712345678',
  })
  phoneNumber?: string;

  @IsEmail()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.mwangi@example.com',
  })
  email?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Alternative phone number',
    example: '+254711223344',
  })
  alternativePhone?: string;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({
    description: 'User ID of the person updating the member',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  updatedByUserId: string;

  @ValidateIf((o) => o.disabilityType !== undefined)
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Type of disability',
    example: 'PHYSICAL',
    enum: ['PHYSICAL', 'VISUAL', 'HEARING', 'INTELLECTUAL', 'MENTAL'],
  })
  disabilityType?: string;

  @ValidateIf((o) => o.disabilityType !== undefined)
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Whether the member requires supported decision making',
    example: false,
  })
  requiresSupportedDecisionMaking?: boolean;

  @ValidateIf((o) => o.disabilityType !== undefined)
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Disability certificate ID',
    example: 'NCPWD/A123456',
  })
  disabilityCertificateId?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Whether to mark member as deceased',
    example: false,
  })
  markAsDeceased?: boolean;

  @ValidateIf((o) => o.markAsDeceased === true)
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Date of death (required if marking as deceased)',
    example: '2023-01-15',
  })
  dateOfDeath?: Date;

  @ValidateIf((o) => o.markAsDeceased === true)
  @IsString()
  @IsOptional()
  @Length(2, 200)
  @ApiPropertyOptional({
    description: 'Place of death',
    example: 'Kenyatta National Hospital, Nairobi',
    maxLength: 200,
  })
  placeOfDeath?: string;

  @ValidateIf((o) => o.markAsDeceased === true)
  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Death certificate number',
    example: 'DC/2023/12345',
  })
  deathCertificateNumber?: string;

  @ValidateIf((o) => o.markAsDeceased === true)
  @IsString()
  @IsOptional()
  @Length(2, 200)
  @ApiPropertyOptional({
    description: 'Cause of death',
    example: 'Cardiac Arrest',
    maxLength: 200,
  })
  causeOfDeath?: string;

  @ValidateIf((o) => o.markAsDeceased === true)
  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Issuing authority for death certificate',
    example: 'Civil Registry Nairobi',
    maxLength: 100,
  })
  deathCertificateIssuingAuthority?: string;
}
