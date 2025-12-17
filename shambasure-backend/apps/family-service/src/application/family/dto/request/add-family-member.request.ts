// application/family/dto/request/add-family-member.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  ValidateNested,
} from 'class-validator';

import { KENYAN_VALIDATION } from './base.request';

export class DisabilityDetailsRequest {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Type of disability',
    example: 'PHYSICAL',
    enum: ['PHYSICAL', 'VISUAL', 'HEARING', 'INTELLECTUAL', 'MENTAL'],
  })
  disabilityType: string;

  @IsBoolean()
  @ApiProperty({
    description: 'Whether the member requires supported decision making',
    example: false,
  })
  requiresSupportedDecisionMaking: boolean;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Disability certificate ID if registered with NCPWD',
    example: 'NCPWD/A123456',
  })
  certificateId?: string;
}

export class AddFamilyMemberRequest {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'User ID if the member has a user account',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Family ID to add the member to',
    example: 'fam-1234567890',
  })
  familyId: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @Matches(KENYAN_VALIDATION.NAME, {
    message: 'First name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @ApiProperty({
    description: 'First name',
    example: 'John',
    minLength: 2,
    maxLength: 50,
  })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @Matches(KENYAN_VALIDATION.NAME)
  @ApiProperty({
    description: 'Last name',
    example: 'Mwangi',
    minLength: 2,
    maxLength: 50,
  })
  lastName: string;

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
  @Matches(KENYAN_VALIDATION.NATIONAL_ID)
  @ApiPropertyOptional({
    description: 'Kenyan National ID number (8-9 digits)',
    example: '12345678',
  })
  nationalId?: string;

  @IsString()
  @IsOptional()
  @Matches(KENYAN_VALIDATION.KRA_PIN)
  @ApiPropertyOptional({
    description: 'KRA PIN number',
    example: 'A123456789Z',
  })
  kraPin?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1990-01-15',
  })
  dateOfBirth?: Date;

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
  @IsEnum(['KENYAN', 'DUAL', 'FOREIGN'])
  @ApiPropertyOptional({
    description: 'Citizenship status',
    example: 'KENYAN',
    enum: ['KENYAN', 'DUAL', 'FOREIGN'],
  })
  citizenship?: string;

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
  @Length(2, 200)
  @ApiPropertyOptional({
    description: 'Place of birth',
    example: 'Nairobi Hospital, Nairobi',
    maxLength: 200,
  })
  placeOfBirth?: string;

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
  @Length(2, 50)
  @Matches(KENYAN_VALIDATION.NAME)
  @ApiPropertyOptional({
    description: 'Maiden name (for married women)',
    example: 'Wanjiru',
    maxLength: 50,
  })
  maidenName?: string;

  @ValidateIf((o) => o.disabilityType !== undefined)
  @ValidateNested()
  @Type(() => DisabilityDetailsRequest)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Disability details if applicable',
    type: DisabilityDetailsRequest,
  })
  disabilityDetails?: DisabilityDetailsRequest;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Whether the member is deceased',
    example: false,
  })
  isDeceased?: boolean;

  @ValidateIf((o) => o.isDeceased === true)
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Required if isDeceased is true',
    example: '2023-01-15',
  })
  dateOfDeath?: Date;

  @ValidateIf((o) => o.isDeceased === true)
  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Death certificate number',
    example: 'DC/2023/12345',
  })
  deathCertificateNumber?: string;

  @ValidateIf((o) => o.isDeceased === true)
  @IsString()
  @IsOptional()
  @Length(2, 200)
  @ApiPropertyOptional({
    description: 'Place of death',
    example: 'Kenyatta National Hospital, Nairobi',
    maxLength: 200,
  })
  placeOfDeath?: string;

  @IsString()
  @IsOptional()
  @Matches(KENYAN_VALIDATION.BIRTH_CERTIFICATE)
  @ApiPropertyOptional({
    description: 'Birth certificate entry number',
    example: '123456',
  })
  birthCertificateEntryNumber?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Whether to mark member as minor (based on age)',
    example: false,
  })
  isMinor?: boolean;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User ID of the person adding the member',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  addedByUserId: string;
}
