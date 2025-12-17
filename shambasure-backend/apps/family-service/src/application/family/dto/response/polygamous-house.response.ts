// application/family/dto/response/polygamous-house.response.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseResponse } from './base.response';

export class HouseHeadResponse {
  @ApiProperty({ example: 'fm-1234567890' })
  id: string;

  @ApiProperty({ example: 'Amina Mwangi' })
  name: string;

  @ApiProperty({ example: 'FEMALE' })
  gender: string;

  @ApiProperty({ example: false })
  isDeceased: boolean;

  @ApiProperty({ example: 45 })
  age: number;

  @ApiProperty({ example: true })
  isIdentityVerified: boolean;
}

export class HouseMemberResponse {
  @ApiProperty({ example: 'fm-2345678901' })
  id: string;

  @ApiProperty({ example: 'Fatima Mwangi' })
  name: string;

  @ApiProperty({ example: 'DAUGHTER' })
  relationship: string;

  @ApiProperty({ example: 15 })
  age: number;

  @ApiProperty({ example: false })
  isMinor: boolean;
}

export class HouseMarriageResponse {
  @ApiProperty({ example: 'mrr-1234567890' })
  id: string;

  @ApiProperty({ example: 'John Kamau Mwangi' })
  spouse1Name: string;

  @ApiProperty({ example: 'Amina Mwangi' })
  spouse2Name: string;

  @ApiProperty({ example: 'CUSTOMARY' })
  type: string;

  @ApiProperty({ example: '2010-05-20T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: true })
  isActive: boolean;
}

export class HouseBusinessResponse {
  @ApiProperty({ example: 'Amina Boutique' })
  name: string;

  @ApiProperty({ example: 'B123456789C' })
  kraPin: string;

  @ApiProperty({ example: 'Retail' })
  industry: string;

  @ApiProperty({ example: 5000000 })
  estimatedValue: number;

  @ApiProperty({ example: 'KES' })
  currency: string;
}

export class HouseAssetResponse {
  @ApiProperty({ example: 'LAND' })
  type: string;

  @ApiProperty({ example: 'Plot No. 123, Gatundu' })
  description: string;

  @ApiProperty({ example: 10000000 })
  estimatedValue: number;

  @ApiProperty({ example: 'KES' })
  currency: string;

  @ApiProperty({ example: true })
  isRegistered: boolean;

  @ApiPropertyOptional({ example: 'Title No. KIAMBU/GATUNDU/123' })
  registrationNumber?: string;
}

export class HouseSuccessionResponse {
  @ApiProperty({ example: 'PRIMOGENITURE' })
  method: string;

  @ApiProperty({ example: 'Eldest son inherits house leadership' })
  instructions: string;

  @ApiPropertyOptional({ example: 'fm-3456789012' })
  designatedSuccessorId?: string;

  @ApiPropertyOptional({ example: 'Mohamed Mwangi' })
  designatedSuccessorName?: string;

  @ApiProperty({ example: '2022-12-01T00:00:00.000Z' })
  lastUpdated: Date;
}

export class PolygamousHouseResponse extends BaseResponse {
  @ApiProperty({
    description: 'Family ID',
    example: 'fam-1234567890',
  })
  familyId: string;

  @ApiProperty({
    description: 'House name',
    example: 'House of Amina',
  })
  houseName: string;

  @ApiProperty({
    description: 'House order (1 = first house)',
    example: 1,
  })
  houseOrder: number;

  @ApiProperty({
    description: 'Date house was established',
    example: '2010-05-20T00:00:00.000Z',
  })
  establishedDate: Date;

  @ApiPropertyOptional({ type: HouseHeadResponse })
  houseHead?: HouseHeadResponse;

  @ApiPropertyOptional({
    description: 'House head member ID',
    example: 'fm-1234567890',
  })
  houseHeadId?: string;

  @ApiProperty({
    description: 'Whether court recognized under S.40',
    example: true,
  })
  courtRecognized: boolean;

  @ApiPropertyOptional({
    description: 'Court order number',
    example: 'HC/NAI/CIV/123/2010',
  })
  courtOrderNumber?: string;

  @ApiPropertyOptional({
    description: 'S.40 certificate number',
    example: 'S40/2010/456',
  })
  s40CertificateNumber?: string;

  @ApiPropertyOptional({
    description: 'Certificate issued date',
    example: '2010-05-25T00:00:00.000Z',
  })
  certificateIssuedDate?: Date;

  @ApiPropertyOptional({
    description: 'Certificate issuing court',
    example: 'High Court of Kenya, Nairobi',
  })
  certificateIssuingCourt?: string;

  @ApiPropertyOptional({
    description: 'House share percentage for estate distribution',
    example: 33.33,
  })
  houseSharePercentage?: number;

  @ApiPropertyOptional({ type: HouseBusinessResponse })
  business?: HouseBusinessResponse;

  @ApiProperty({
    description: 'Whether house has separate property',
    example: true,
  })
  separateProperty: boolean;

  @ApiProperty({
    description: 'Whether wives consent was obtained',
    example: true,
  })
  wivesConsentObtained: boolean;

  @ApiPropertyOptional({
    description: 'Wives consent document ID',
    example: 'doc-1234567890',
  })
  wivesConsentDocument?: string;

  @ApiPropertyOptional({
    description: 'Wives agreement details',
    example: {
      consentGiven: true,
      witnesses: ['Wife1', 'Wife2'],
      agreementDate: '2010-05-15T00:00:00.000Z',
    },
  })
  wivesAgreementDetails?: any;

  @ApiPropertyOptional({ type: HouseSuccessionResponse })
  successionInstructions?: HouseSuccessionResponse;

  @ApiPropertyOptional({
    description: 'House dissolution date',
    example: null,
  })
  houseDissolvedAt?: Date;

  @ApiProperty({
    description: 'Whether house assets are frozen',
    example: false,
  })
  houseAssetsFrozen: boolean;

  @ApiProperty({
    description: 'Number of members in house',
    example: 5,
  })
  memberCount: number;

  @ApiProperty({
    description: 'Number of marriages in house',
    example: 1,
  })
  marriageCount: number;

  @ApiProperty({
    description: 'Number of children in house',
    example: 3,
  })
  childrenCount: number;

  @ApiProperty({
    description: 'Number of minors in house',
    example: 2,
  })
  minorCount: number;

  @ApiProperty({
    description: 'House members',
    type: [HouseMemberResponse],
  })
  members: HouseMemberResponse[];

  @ApiProperty({
    description: 'House marriages',
    type: [HouseMarriageResponse],
  })
  marriages: HouseMarriageResponse[];

  @ApiProperty({
    description: 'House assets',
    type: [HouseAssetResponse],
  })
  assets: HouseAssetResponse[];

  @ApiProperty({
    description: 'Total estimated asset value',
    example: 25000000,
  })
  totalAssetValue: number;

  @ApiProperty({
    description: 'House income per month (estimate)',
    example: 150000,
  })
  monthlyIncome: number;

  @ApiProperty({
    description: 'House expenses per month (estimate)',
    example: 80000,
  })
  monthlyExpenses: number;

  @ApiProperty({
    description: 'Whether house is dissolved',
    example: false,
  })
  isDissolved: boolean;

  @ApiProperty({
    description: 'S.40 compliance status',
    example: 'COMPLIANT',
    enum: ['COMPLIANT', 'NON_COMPLIANT', 'PENDING'],
  })
  s40ComplianceStatus: string;

  @ApiProperty({
    description: 'Legal compliance notes',
    example: [
      'Court recognized under S.40',
      'Wives consent documented and notarized',
      'House share percentage set at 33.33%',
    ],
    type: [String],
  })
  complianceNotes: string[];

  @ApiProperty({
    description: 'House history/notes',
    example: [
      'Established in 2010 with traditional ceremony',
      'Registered with court in 2010',
      'Business started in 2012',
    ],
    type: [String],
  })
  history: string[];

  @ApiProperty({
    description: 'Optimistic locking version',
    example: 1,
  })
  version: number;

  @ApiProperty({
    description: 'House performance metrics',
    example: {
      yearsActive: 14,
      averageMemberAge: 28.5,
      educationLevel: 'SECONDARY',
      employmentRate: 0.6,
    },
  })
  metrics: {
    yearsActive: number;
    averageMemberAge: number;
    educationLevel: string;
    employmentRate: number;
    dependencyRatio: number;
  };
}
