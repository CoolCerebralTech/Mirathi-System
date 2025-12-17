// application/family/dto/request/register-marriage.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarriageType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class ElderWitnessRequest {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  @ApiProperty({
    description: 'Name of elder witness',
    example: 'Mzee Kariuki',
    minLength: 2,
    maxLength: 100,
  })
  name: string;

  @IsNumber()
  @ApiProperty({
    description: 'Age of elder witness',
    example: 65,
    minimum: 40,
  })
  age: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Relationship to the couple',
    example: 'Uncle of the groom',
  })
  relationship: string;
}

export class RegisterMarriageRequest {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Family ID',
    example: 'fam-1234567890',
  })
  familyId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Spouse 1 member ID',
    example: 'fm-1234567890',
  })
  spouse1Id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Spouse 2 member ID',
    example: 'fm-0987654321',
  })
  spouse2Id: string;

  @IsEnum(MarriageType)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Type of marriage',
    enum: MarriageType,
    example: MarriageType.CIVIL,
  })
  type: MarriageType;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Marriage start date',
    example: '2020-06-15',
  })
  startDate: Date;

  @IsString()
  @IsOptional()
  @Length(2, 50)
  @ApiPropertyOptional({
    description: 'Marriage registration number',
    example: 'MR/2020/12345',
    maxLength: 50,
  })
  registrationNumber?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Issuing authority',
    example: 'Office of the Attorney General',
    maxLength: 100,
  })
  issuingAuthority?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Certificate issue date',
    example: '2020-06-20',
  })
  certificateIssueDate?: Date;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Registration district',
    example: 'Nairobi Central',
    maxLength: 100,
  })
  registrationDistrict?: string;

  // Customary marriage specific fields
  @ValidateIf((o) => o.type === MarriageType.CUSTOMARY || o.type === MarriageType.TRADITIONAL)
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Customary marriage type (e.g., KIKUYU_NGURARIO)',
    example: 'KIKUYU_NGURARIO',
  })
  customaryType?: string;

  @ValidateIf((o) => o.type === MarriageType.CUSTOMARY || o.type === MarriageType.TRADITIONAL)
  @IsString()
  @IsOptional()
  @Length(2, 50)
  @ApiPropertyOptional({
    description: 'Ethnic group',
    example: 'Kikuyu',
    maxLength: 50,
  })
  ethnicGroup?: string;

  @ValidateIf((o) => o.type === MarriageType.CUSTOMARY || o.type === MarriageType.TRADITIONAL)
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Whether dowry/bride price was paid',
    example: true,
  })
  dowryPaid?: boolean;

  @ValidateIf((o) => o.type === MarriageType.CUSTOMARY || o.type === MarriageType.TRADITIONAL)
  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Dowry amount',
    example: 50000,
    minimum: 0,
  })
  dowryAmount?: number;

  @ValidateIf((o) => o.type === MarriageType.CUSTOMARY || o.type === MarriageType.TRADITIONAL)
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Dowry currency',
    example: 'KES',
    default: 'KES',
  })
  dowryCurrency?: string;

  @ValidateIf((o) => o.type === MarriageType.CUSTOMARY || o.type === MarriageType.TRADITIONAL)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ElderWitnessRequest)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'List of elder witnesses',
    type: [ElderWitnessRequest],
  })
  elderWitnesses?: ElderWitnessRequest[];

  @ValidateIf((o) => o.type === MarriageType.CUSTOMARY || o.type === MarriageType.TRADITIONAL)
  @IsString()
  @IsOptional()
  @Length(2, 200)
  @ApiPropertyOptional({
    description: 'Ceremony location',
    example: 'Gatundu Home, Kiambu',
    maxLength: 200,
  })
  ceremonyLocation?: string;

  @ValidateIf((o) => o.type === MarriageType.CUSTOMARY || o.type === MarriageType.TRADITIONAL)
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Whether clan approval was obtained',
    example: true,
  })
  clanApproval?: boolean;

  @ValidateIf((o) => o.type === MarriageType.CUSTOMARY || o.type === MarriageType.TRADITIONAL)
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Clan approval date',
    example: '2020-06-10',
  })
  clanApprovalDate?: Date;

  @ValidateIf((o) => o.type === MarriageType.CUSTOMARY || o.type === MarriageType.TRADITIONAL)
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Whether family consent was obtained',
    example: true,
  })
  familyConsent?: boolean;

  @ValidateIf((o) => o.type === MarriageType.CUSTOMARY || o.type === MarriageType.TRADITIONAL)
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Family consent date',
    example: '2020-06-12',
  })
  familyConsentDate?: Date;

  // Islamic marriage specific fields
  @ValidateIf((o) => o.type === MarriageType.ISLAMIC)
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Nikah date (if different from start date)',
    example: '2020-06-15',
  })
  nikahDate?: Date;

  @ValidateIf((o) => o.type === MarriageType.ISLAMIC)
  @IsString()
  @IsOptional()
  @Length(2, 200)
  @ApiPropertyOptional({
    description: 'Nikah location',
    example: 'Jamia Mosque, Nairobi',
    maxLength: 200,
  })
  nikahLocation?: string;

  @ValidateIf((o) => o.type === MarriageType.ISLAMIC)
  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Imam name',
    example: 'Sheikh Ali',
    maxLength: 100,
  })
  imamName?: string;

  @ValidateIf((o) => o.type === MarriageType.ISLAMIC)
  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Wali name (guardian)',
    example: 'Mzee Abdul',
    maxLength: 100,
  })
  waliName?: string;

  @ValidateIf((o) => o.type === MarriageType.ISLAMIC)
  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Mahr amount',
    example: 10000,
    minimum: 0,
  })
  mahrAmount?: number;

  @ValidateIf((o) => o.type === MarriageType.ISLAMIC)
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Mahr currency',
    example: 'KES',
    default: 'KES',
  })
  mahrCurrency?: string;

  // S.40 Polygamy specific fields
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Whether this is a polygamous marriage under S.40',
    example: false,
  })
  isPolygamous?: boolean;

  @ValidateIf((o) => o.isPolygamous === true)
  @IsString()
  @IsOptional()
  @Length(2, 50)
  @ApiPropertyOptional({
    description: 'S.40 certificate number (required for polygamous marriages)',
    example: 'S40/2021/123',
    maxLength: 50,
  })
  s40CertificateNumber?: string;

  // Matrimonial property
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Whether matrimonial property regime applies',
    example: true,
    default: true,
  })
  isMatrimonialPropertyRegime?: boolean;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Spouse 1 marital status at marriage',
    example: 'SINGLE',
    enum: ['SINGLE', 'DIVORCED', 'WIDOWED'],
  })
  spouse1MaritalStatusAtMarriage?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Spouse 2 marital status at marriage',
    example: 'SINGLE',
    enum: ['SINGLE', 'DIVORCED', 'WIDOWED'],
  })
  spouse2MaritalStatusAtMarriage?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User ID registering the marriage',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  registeredByUserId: string;
}
