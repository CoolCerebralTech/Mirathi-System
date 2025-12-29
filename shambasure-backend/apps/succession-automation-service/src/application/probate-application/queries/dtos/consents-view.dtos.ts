import { IsUUID } from 'class-validator';

// ==============================================================================
// 1. Get Consent Status Matrix
// ==============================================================================
export class GetConsentStatusDto {
  @IsUUID()
  applicationId: string;
}

// ==============================================================================
// 2. Get Consent Audit Log (For Legal Verification)
// ==============================================================================
export class GetConsentAuditLogDto {
  @IsUUID()
  applicationId: string;

  @IsUUID()
  consentId: string;
}
