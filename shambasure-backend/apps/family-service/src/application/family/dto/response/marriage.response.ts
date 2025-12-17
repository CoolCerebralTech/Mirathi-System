// application/family/dto/response/marriage.response.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarriageEndReason, MarriageType } from '@prisma/client';

import { BaseResponse } from './base.response';

export class MarriageDetailsResponse {
  @ApiProperty({ example: 'CIVIL' })
  type: MarriageType;

  @ApiProperty({ example: 'REGISTERED' })
  status: string;

  @ApiProperty({ example: false })
  isPolygamous: boolean;

  @ApiPropertyOptional({ example: 'hse-1234567890' })
  polygamousHouseId?: string;

  @ApiProperty({ example: false })
  isEnded: boolean;

  @ApiPropertyOptional({ example: 'STILL_ACTIVE' })
  endReason?: MarriageEndReason;

  @ApiPropertyOptional({ example: 'MR/2020/12345' })
  registrationNumber?: string;

  @ApiPropertyOptional({ example: 'Office of the Attorney General' })
  issuingAuthority?: string;

  @ApiPropertyOptional({ example: '2020-06-20T00:00:00.000Z' })
  certificateIssueDate?: Date;

  @ApiPropertyOptional({ example: 'Nairobi Central' })
  registrationDistrict?: string;

  @ApiPropertyOptional({ example: 'S40/2021/123' })
  s40CertificateNumber?: string;

  @ApiProperty({ example: true })
  isMatrimonialPropertyRegime: boolean;

  @ApiProperty({ example: false })
  matrimonialPropertySettled: boolean;

  @ApiPropertyOptional({ example: 'KIKUYU_NGURARIO' })
  customaryType?: string;

  @ApiPropertyOptional({ example: true })
  dowryPaid?: boolean;

  @ApiPropertyOptional({ example: 50000 })
  dowryAmount?: number;

  @ApiPropertyOptional({ example: 'KES' })
  dowryCurrency?: string;

  @ApiPropertyOptional({ example: '2020-06-15T00:00:00.000Z' })
  nikahDate?: Date;

  @ApiPropertyOptional({ example: 10000 })
  mahrAmount?: number;

  @ApiPropertyOptional({ example: 'KES' })
  mahrCurrency?: string;

  @ApiPropertyOptional({ example: 'Mzee Abdul' })
  waliName?: string;

  @ApiProperty({ example: true })
  isValidUnderKenyanLaw: boolean;

  @ApiPropertyOptional({ example: null })
  invalidityReason?: string;
}

export class MarriageDatesResponse {
  @ApiProperty({ example: '2020-06-15T00:00:00.000Z' })
  marriageDate: Date;

  @ApiPropertyOptional({ example: '2020-06-20T00:00:00.000Z' })
  registrationDate?: Date;

  @ApiPropertyOptional({ example: '2020-06-25T00:00:00.000Z' })
  polygamousHouseDate?: Date;

  @ApiPropertyOptional({ example: null })
  dissolutionDate?: Date;

  @ApiProperty({ example: 3 })
  durationYears: number;

  @ApiProperty({ example: 36 })
  durationMonths: number;
}

export class BridePricePaymentResponse {
  @ApiProperty({ example: 'CASH' })
  type: string;

  @ApiProperty({ example: 50000 })
  totalValue: number;

  @ApiProperty({ example: 'KES' })
  currency: string;

  @ApiProperty({ example: 'Initial bride price payment' })
  description: string;

  @ApiProperty({ example: '2020-06-15T00:00:00.000Z' })
  date: Date;

  @ApiProperty({ example: 50000 })
  paidAmount: number;

  @ApiProperty({ example: 0 })
  outstandingAmount: number;
}

export class BridePriceResponse {
  @ApiProperty({ example: 50000 })
  totalAmount: number;

  @ApiProperty({ example: 'KES' })
  currency: string;

  @ApiProperty({ example: 'FULLY_PAID' })
  status: string;

  @ApiProperty({ example: true })
  isPaid: boolean;

  @ApiProperty({ type: [BridePricePaymentResponse] })
  payments: BridePricePaymentResponse[];

  @ApiProperty({ example: 50000 })
  totalPaid: number;

  @ApiProperty({ example: 0 })
  totalOutstanding: number;
}

export class ElderWitnessResponse {
  @ApiProperty({ example: 'Mzee Kariuki' })
  name: string;

  @ApiProperty({ example: 65 })
  age: number;

  @ApiProperty({ example: 'Uncle of the groom' })
  relationship: string;
}

export class CustomaryMarriageResponse {
  @ApiProperty({ example: 'Kikuyu' })
  ethnicGroup: string;

  @ApiProperty({ example: 'KIKUYU_NGURARIO' })
  customaryType: string;

  @ApiProperty({ example: '2020-06-15T00:00:00.000Z' })
  ceremonyDate: Date;

  @ApiProperty({ example: 'Gatundu Home, Kiambu' })
  ceremonyLocation: string;

  @ApiProperty({ example: true })
  clanApproval: boolean;

  @ApiPropertyOptional({ example: '2020-06-10T00:00:00.000Z' })
  clanApprovalDate?: Date;

  @ApiProperty({ example: true })
  familyConsent: boolean;

  @ApiPropertyOptional({ example: '2020-06-12T00:00:00.000Z' })
  familyConsentDate?: Date;

  @ApiProperty({ type: [ElderWitnessResponse] })
  elderWitnesses: ElderWitnessResponse[];

  @ApiProperty({ example: false })
  isDissolved: boolean;

  @ApiPropertyOptional({ example: null })
  dissolutionDate?: Date;

  @ApiPropertyOptional({ example: null })
  dissolutionReason?: string;
}

export class IslamicMarriageResponse {
  @ApiProperty({ example: '2020-06-15T00:00:00.000Z' })
  nikahDate: Date;

  @ApiProperty({ example: 'Jamia Mosque, Nairobi' })
  nikahLocation: string;

  @ApiProperty({ example: 'Sheikh Ali' })
  imamName: string;

  @ApiProperty({ example: 'Mzee Abdul' })
  waliName: string;

  @ApiProperty({ example: 10000 })
  mahrAmount: number;

  @ApiProperty({ example: 'KES' })
  mahrCurrency: string;

  @ApiProperty({ example: 'DEFERRED' })
  mahrStatus: string;

  @ApiProperty({ example: false })
  talaqIssued: boolean;

  @ApiPropertyOptional({ example: null })
  talaqDate?: Date;

  @ApiPropertyOptional({ example: null })
  talaqType?: string;

  @ApiProperty({ example: 0 })
  talaqCount: number;
}

export class MarriageResponse extends BaseResponse {
  @ApiProperty({
    description: 'Family ID',
    example: 'fam-1234567890',
  })
  familyId: string;

  @ApiProperty({
    description: 'Spouse 1 member ID',
    example: 'fm-1234567890',
  })
  spouse1Id: string;

  @ApiProperty({
    description: 'Spouse 2 member ID',
    example: 'fm-0987654321',
  })
  spouse2Id: string;

  @ApiProperty({
    description: 'Spouse 1 details (summary)',
    example: {
      id: 'fm-1234567890',
      name: 'John Kamau Mwangi',
      gender: 'MALE',
      isDeceased: false,
    },
  })
  spouse1: {
    id: string;
    name: string;
    gender: string;
    isDeceased: boolean;
  };

  @ApiProperty({
    description: 'Spouse 2 details (summary)',
    example: {
      id: 'fm-0987654321',
      name: 'Mary Wanjiru Mwangi',
      gender: 'FEMALE',
      isDeceased: false,
    },
  })
  spouse2: {
    id: string;
    name: string;
    gender: string;
    isDeceased: boolean;
  };

  @ApiProperty({
    description: 'Marriage type',
    enum: MarriageType,
    example: MarriageType.CIVIL,
  })
  type: MarriageType;

  @ApiProperty({ type: MarriageDetailsResponse })
  details: MarriageDetailsResponse;

  @ApiProperty({ type: MarriageDatesResponse })
  dates: MarriageDatesResponse;

  @ApiPropertyOptional({ type: BridePriceResponse })
  bridePrice?: BridePriceResponse;

  @ApiPropertyOptional({ type: CustomaryMarriageResponse })
  customaryMarriage?: CustomaryMarriageResponse;

  @ApiPropertyOptional({ type: IslamicMarriageResponse })
  islamicMarriage?: IslamicMarriageResponse;

  @ApiProperty({
    description: 'Deceased spouse ID if marriage ended by death',
    example: null,
  })
  deceasedSpouseId?: string;

  @ApiProperty({
    description: 'Divorce decree number if divorced',
    example: null,
  })
  divorceDecreeNumber?: string;

  @ApiProperty({
    description: 'Divorce court',
    example: null,
  })
  divorceCourt?: string;

  @ApiProperty({
    description: 'Divorce date',
    example: null,
  })
  divorceDate?: Date;

  @ApiProperty({
    description: 'Separation date',
    example: null,
  })
  separationDate?: Date;

  @ApiProperty({
    description: 'Separation reason',
    example: null,
  })
  separationReason?: string;

  @ApiProperty({
    description: 'Maintenance order issued',
    example: false,
  })
  maintenanceOrderIssued: boolean;

  @ApiProperty({
    description: 'Maintenance order number',
    example: null,
  })
  maintenanceOrderNumber?: string;

  @ApiProperty({
    description: 'Court validation date',
    example: null,
  })
  courtValidationDate?: Date;

  @ApiProperty({
    description: 'Spouse 1 marital status at marriage',
    example: 'SINGLE',
  })
  spouse1MaritalStatusAtMarriage?: string;

  @ApiProperty({
    description: 'Spouse 2 marital status at marriage',
    example: 'SINGLE',
  })
  spouse2MaritalStatusAtMarriage?: string;

  @ApiProperty({
    description: 'Whether marriage is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'End reason if not active',
    enum: MarriageEndReason,
    example: MarriageEndReason.STILL_ACTIVE,
  })
  endReason: MarriageEndReason;

  @ApiProperty({
    description: 'Whether marriage is polygamous under S.40',
    example: false,
  })
  isPolygamousUnderS40: boolean;

  @ApiProperty({
    description: 'Polygamous house ID if assigned',
    example: null,
  })
  polygamousHouseId?: string;

  @ApiProperty({
    description: 'Polygamous house name if assigned',
    example: null,
  })
  polygamousHouseName?: string;

  @ApiProperty({
    description: 'Whether marriage has matrimonial property',
    example: true,
  })
  hasMatrimonialProperty: boolean;

  @ApiProperty({
    description: 'Whether marriage is Islamic',
    example: false,
  })
  isIslamic: boolean;

  @ApiProperty({
    description: 'Whether marriage is customary',
    example: false,
  })
  isCustomary: boolean;

  @ApiProperty({
    description: 'Whether spouse is a dependant (S.29)',
    example: false,
  })
  isSpouseDependant: boolean;

  @ApiProperty({
    description: 'Marriage compliance status',
    example: 'COMPLIANT',
    enum: ['COMPLIANT', 'NON_COMPLIANT', 'PENDING'],
  })
  complianceStatus: string;

  @ApiProperty({
    description: 'Number of children from this marriage',
    example: 2,
  })
  childrenCount: number;

  @ApiProperty({
    description: 'Children IDs from this marriage',
    example: ['fm-2345678901', 'fm-3456789012'],
    type: [String],
  })
  childrenIds: string[];

  @ApiProperty({
    description: 'Marriage legal notes',
    example: ['Civil marriage registered with Attorney General', 'Both spouses Kenyan citizens'],
    type: [String],
  })
  legalNotes: string[];

  @ApiProperty({
    description: 'Optimistic locking version',
    example: 1,
  })
  version: number;
}
