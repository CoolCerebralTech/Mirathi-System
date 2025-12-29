import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { ConsentMethod } from '../../../../domain/entities/family-consent.entity';

// ==============================================================================
// 1. Request Family Consent
// ==============================================================================
export class RequestFamilyConsentDto {
  @IsUUID()
  applicationId: string;

  @IsUUID()
  consentId: string;

  @IsIn(['SMS', 'EMAIL', 'BOTH'])
  method: 'SMS' | 'EMAIL' | 'BOTH';

  @IsUUID()
  triggeredByUserId: string;
}

// ==============================================================================
// 2. Record Consent Grant
// ==============================================================================
export class RecordConsentGrantDto {
  @IsUUID()
  applicationId: string;

  @IsUUID()
  consentId: string;

  @IsEnum(ConsentMethod)
  method: ConsentMethod;

  @IsString()
  @IsOptional()
  verificationToken?: string; // OTP or Token from email

  @IsString()
  @IsOptional()
  digitalSignatureId?: string;
}

// ==============================================================================
// 3. Record Consent Decline (Risk Trigger)
// ==============================================================================
export class RecordConsentDeclineDto {
  @IsUUID()
  applicationId: string;

  @IsUUID()
  consentId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsIn(['DISPUTE', 'NOT_INFORMED', 'DISAGREE_WITH_DISTRIBUTION', 'OTHER'])
  category: 'DISPUTE' | 'NOT_INFORMED' | 'DISAGREE_WITH_DISTRIBUTION' | 'OTHER';
}

// ==============================================================================
// 4. Mark Consent Not Required (Legal Override)
// ==============================================================================
export class MarkConsentNotRequiredDto {
  @IsUUID()
  applicationId: string;

  @IsUUID()
  consentId: string;

  @IsString()
  @IsNotEmpty()
  legalJustification: string; // Mandatory audit note

  @IsUUID()
  authorizedByUserId: string;
}
