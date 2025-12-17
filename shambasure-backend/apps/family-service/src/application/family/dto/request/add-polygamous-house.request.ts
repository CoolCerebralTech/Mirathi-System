// application/family/dto/request/add-polygamous-house.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

import { KENYAN_VALIDATION } from './base.request';

export class AddPolygamousHouseRequest {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Family ID',
    example: 'fam-1234567890',
  })
  familyId: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'House head member ID (wife)',
    example: 'fm-1234567890',
  })
  houseHeadId?: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @Matches(KENYAN_VALIDATION.HOUSE_NAME, {
    message: 'House name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @ApiProperty({
    description: 'House name',
    example: 'House of Amina',
    minLength: 2,
    maxLength: 50,
  })
  houseName: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(20)
  @ApiProperty({
    description: 'House order (1 for first house, 2 for second, etc.)',
    example: 1,
    minimum: 1,
    maximum: 20,
  })
  houseOrder: number;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Date the house was established',
    example: '2010-05-20',
  })
  establishedDate: Date;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Whether the house is court recognized',
    example: false,
    default: false,
  })
  courtRecognized?: boolean;

  @ValidateIf((o) => o.courtRecognized === true)
  @IsString()
  @IsOptional()
  @Length(2, 50)
  @ApiPropertyOptional({
    description: 'S.40 certificate number (required if court recognized)',
    example: 'S40/2010/456',
    maxLength: 50,
  })
  s40CertificateNumber?: string;

  @ValidateIf((o) => o.courtRecognized === true)
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Certificate issued date',
    example: '2010-05-25',
  })
  certificateIssuedDate?: Date;

  @ValidateIf((o) => o.courtRecognized === true)
  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Certificate issuing court',
    example: 'High Court of Kenya, Nairobi',
    maxLength: 100,
  })
  certificateIssuingCourt?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Whether wives consent was obtained',
    example: false,
    default: false,
  })
  wivesConsentObtained?: boolean;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Wives consent document ID',
    example: 'doc-1234567890',
  })
  wivesConsentDocument?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({
    description: 'House share percentage for estate distribution',
    example: 33.33,
    minimum: 0,
    maximum: 100,
  })
  houseSharePercentage?: number;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'House business name',
    example: 'Amina Boutique',
    maxLength: 100,
  })
  houseBusinessName?: string;

  @IsString()
  @IsOptional()
  @Matches(KENYAN_VALIDATION.KRA_PIN)
  @ApiPropertyOptional({
    description: 'House business KRA PIN',
    example: 'B123456789C',
  })
  houseBusinessKraPin?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Wives agreement details (JSON string)',
    example: '{"consentGiven": true, "witnesses": ["Wife1", "Wife2"]}',
  })
  wivesAgreementDetails?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User ID creating the house',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  createdByUserId: string;
}
