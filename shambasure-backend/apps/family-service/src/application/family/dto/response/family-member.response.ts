// application/family/dto/response/family-member.response.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseResponse } from './base.response';

export class NameResponse {
  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Mwangi' })
  lastName: string;

  @ApiPropertyOptional({ example: 'Kamau' })
  middleName?: string;

  @ApiPropertyOptional({ example: 'Wanjiru' })
  maidenName?: string;

  @ApiProperty({ example: 'John Kamau Mwangi' })
  fullName: string;
}

export class IdentityDocumentResponse {
  @ApiProperty({ example: '12345678' })
  number: string;

  @ApiProperty({ example: 'NATIONAL_ID' })
  type: string;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  verifiedAt?: Date;

  @ApiPropertyOptional({ example: 'system' })
  verifiedBy?: string;

  @ApiPropertyOptional({ example: 'e-CITIZEN' })
  verificationMethod?: string;
}

export class KenyanIdentityResponse {
  @ApiProperty({ example: 'KENYAN' })
  citizenship: string;

  @ApiPropertyOptional({ type: IdentityDocumentResponse })
  nationalId?: IdentityDocumentResponse;

  @ApiPropertyOptional({ type: IdentityDocumentResponse })
  kraPin?: IdentityDocumentResponse;

  @ApiPropertyOptional({ type: IdentityDocumentResponse })
  birthCertificate?: IdentityDocumentResponse;

  @ApiPropertyOptional({ type: IdentityDocumentResponse })
  deathCertificate?: IdentityDocumentResponse;

  @ApiProperty({ example: true })
  isLegallyVerified: boolean;

  @ApiPropertyOptional({ example: 'Kikuyu' })
  ethnicity?: string;

  @ApiPropertyOptional({ example: 'Christian' })
  religion?: string;

  @ApiPropertyOptional({ example: 'Anjirũ' })
  clan?: string;

  @ApiProperty({ example: false })
  appliesCustomaryLaw: boolean;
}

export class ContactInfoResponse {
  @ApiProperty({ example: '+254712345678' })
  primaryPhone: string;

  @ApiPropertyOptional({ example: '+254711223344' })
  secondaryPhone?: string;

  @ApiPropertyOptional({ example: 'john.mwangi@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'Nairobi' })
  county?: string;

  @ApiPropertyOptional({ example: 'Westlands' })
  subCounty?: string;

  @ApiPropertyOptional({ example: 'Kileleshwa' })
  ward?: string;

  @ApiPropertyOptional({ example: '123 Main Street' })
  streetAddress?: string;

  @ApiPropertyOptional({ example: 'P.O Box 12345-00100' })
  postalAddress?: string;
}

export class DisabilityStatusResponse {
  @ApiProperty({ example: true })
  hasDisability: boolean;

  @ApiPropertyOptional({ example: 'PHYSICAL' })
  disabilityType?: string;

  @ApiProperty({ example: false })
  requiresSupportedDecisionMaking: boolean;

  @ApiPropertyOptional({ example: 'NCPWD/A123456' })
  disabilityCardNumber?: string;

  @ApiProperty({ example: true })
  registeredWithNCPWD: boolean;

  @ApiProperty({ example: false })
  qualifiesForDependantStatus: boolean;
}

export class LifeStatusResponse {
  @ApiProperty({ example: 'ALIVE' })
  status: 'ALIVE' | 'DECEASED' | 'MISSING';

  @ApiProperty({ example: false })
  isDeceased: boolean;

  @ApiProperty({ example: true })
  isAlive: boolean;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  dateOfDeath?: Date;

  @ApiPropertyOptional({ example: 'Cardiac Arrest' })
  causeOfDeath?: string;

  @ApiPropertyOptional({ example: 'Kenyatta National Hospital' })
  placeOfDeath?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  missingSince?: Date;

  @ApiPropertyOptional({ example: 'Nairobi CBD' })
  lastSeenLocation?: string;
}

export class DemographicInfoResponse {
  @ApiProperty({ example: 'MALE' })
  gender: string;

  @ApiPropertyOptional({ example: 'Christian' })
  religion?: string;

  @ApiPropertyOptional({ example: 'Kikuyu' })
  ethnicGroup?: string;

  @ApiPropertyOptional({ example: 'Anjirũ' })
  subEthnicGroup?: string;

  @ApiProperty({ example: false })
  isMuslim: boolean;

  @ApiProperty({ example: false })
  isCustomaryLawApplicable: boolean;
}

export class AgeCalculationResponse {
  @ApiProperty({ example: '1990-01-15T00:00:00.000Z' })
  dateOfBirth: Date;

  @ApiProperty({ example: 34 })
  age: number;

  @ApiProperty({ example: false })
  isMinor: boolean;

  @ApiProperty({ example: false })
  isYoungAdult: boolean;

  @ApiProperty({ example: false })
  isElderly: boolean;

  @ApiProperty({ example: false })
  isOfMajorityAge: boolean;
}

export class KenyanLocationResponse {
  @ApiProperty({ example: 'KIAMBU' })
  county: string;

  @ApiPropertyOptional({ example: 'Gatundu North' })
  subCounty?: string;

  @ApiPropertyOptional({ example: 'Gatundu' })
  ward?: string;

  @ApiProperty({ example: 'Kiamwangi' })
  placeName: string;

  @ApiProperty({ example: true })
  isRural: boolean;

  @ApiProperty({ example: false })
  isUrban: boolean;
}

export class FamilyMemberResponse extends BaseResponse {
  @ApiPropertyOptional({
    description: 'User ID if member has user account',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId?: string;

  @ApiProperty({
    description: 'Family ID',
    example: 'fam-1234567890',
  })
  familyId: string;

  @ApiProperty({ type: NameResponse })
  name: NameResponse;

  @ApiProperty({ type: KenyanIdentityResponse })
  identity: KenyanIdentityResponse;

  @ApiPropertyOptional({ type: ContactInfoResponse })
  contactInfo?: ContactInfoResponse;

  @ApiPropertyOptional({ type: DisabilityStatusResponse })
  disabilityStatus?: DisabilityStatusResponse;

  @ApiProperty({ type: LifeStatusResponse })
  lifeStatus: LifeStatusResponse;

  @ApiPropertyOptional({ type: DemographicInfoResponse })
  demographicInfo?: DemographicInfoResponse;

  @ApiPropertyOptional({ type: AgeCalculationResponse })
  ageCalculation?: AgeCalculationResponse;

  @ApiPropertyOptional({ type: KenyanLocationResponse })
  birthLocation?: KenyanLocationResponse;

  @ApiPropertyOptional({ type: KenyanLocationResponse })
  deathLocation?: KenyanLocationResponse;

  @ApiPropertyOptional({
    description: 'Occupation',
    example: 'Software Engineer',
  })
  occupation?: string;

  @ApiPropertyOptional({
    description: 'Polygamous house ID if assigned',
    example: 'hse-1234567890',
  })
  polygamousHouseId?: string;

  @ApiProperty({
    description: 'Whether member is deceased',
    example: false,
  })
  isDeceased: boolean;

  @ApiProperty({
    description: 'Whether member is a minor',
    example: false,
  })
  isMinor: boolean;

  @ApiProperty({
    description: 'Current age (null if date of birth unknown)',
    example: 34,
    nullable: true,
  })
  currentAge: number | null;

  @ApiProperty({
    description: 'Whether member is a potential S.29 dependant',
    example: false,
  })
  isPotentialDependant: boolean;

  @ApiProperty({
    description: 'Whether identity is verified',
    example: true,
  })
  isIdentityVerified: boolean;

  @ApiProperty({
    description: 'Whether member has disability',
    example: false,
  })
  hasDisability: boolean;

  @ApiProperty({
    description: 'Whether member requires supported decision making',
    example: false,
  })
  requiresSupportedDecisionMaking: boolean;

  @ApiProperty({
    description: 'Whether member is presumed alive',
    example: true,
  })
  isPresumedAlive: boolean;

  @ApiProperty({
    description: 'Whether member has death certificate issued',
    example: false,
  })
  deathCertificateIssued: boolean;

  @ApiProperty({
    description: 'Whether member is active (not archived or deceased)',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether member is eligible for inheritance',
    example: true,
  })
  isEligibleForInheritance: boolean;

  @ApiProperty({
    description: 'Gender',
    example: 'MALE',
  })
  gender: string;

  @ApiPropertyOptional({
    description: 'Religion',
    example: 'CHRISTIAN',
  })
  religion?: string;

  @ApiPropertyOptional({
    description: 'Ethnicity',
    example: 'Kikuyu',
  })
  ethnicity?: string;

  @ApiProperty({
    description: 'Whether Muslim (affects inheritance law)',
    example: false,
  })
  isMuslim: boolean;

  @ApiProperty({
    description: 'Whether customary law applies',
    example: false,
  })
  isCustomaryLawApplicable: boolean;

  @ApiProperty({
    description: 'Whether member is archived',
    example: false,
  })
  isArchived: boolean;

  @ApiPropertyOptional({
    description: 'Deletion timestamp if archived',
    example: null,
  })
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: 'User who archived the member',
    example: null,
  })
  deletedBy?: string;

  @ApiPropertyOptional({
    description: 'Reason for archiving',
    example: null,
  })
  deletionReason?: string;

  @ApiPropertyOptional({
    description: 'Missing since date if missing',
    example: null,
  })
  missingSince?: Date;

  @ApiProperty({
    description: 'Optimistic locking version',
    example: 1,
  })
  version: number;
}
