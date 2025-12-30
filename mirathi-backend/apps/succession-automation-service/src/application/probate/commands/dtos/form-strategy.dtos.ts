import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { SignatureType } from '../../../../domain/entities/generated-form.entity';

// ==============================================================================
// 1. Generate Form Bundle
// ==============================================================================
export class GenerateFormBundleDto {
  @IsUUID()
  applicationId: string;

  @IsUUID()
  triggeredByUserId: string;

  @IsOptional()
  forceRegeneration?: boolean; // If true, overwrites existing DRAFT forms
}

// ==============================================================================
// 2. Regenerate Forms (Context Changed)
// ==============================================================================
export class RegenerateFormsDto {
  @IsUUID()
  applicationId: string;

  @IsString()
  @IsNotEmpty()
  reason: string; // Audit log: "Will discovered", "Assets value updated"

  @IsUUID()
  triggeredByUserId: string;
}

// ==============================================================================
// 3. Review Form (User Approval)
// ==============================================================================
export class ReviewFormDto {
  @IsUUID()
  applicationId: string;

  @IsUUID()
  formId: string;

  @IsUUID()
  reviewedByUserId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// ==============================================================================
// 4. Sign Form
// ==============================================================================
export class SignFormDto {
  @IsUUID()
  applicationId: string;

  @IsUUID()
  formId: string;

  @IsUUID()
  signatoryId: string; // Links to Family Member or Applicant

  @IsString()
  @IsNotEmpty()
  signatoryName: string;

  @IsEnum(SignatureType)
  signatureType: SignatureType;

  @IsString()
  @IsOptional()
  digitalSignatureId?: string; // Reference to external provider (e.g., DocuSign ID)

  @IsString()
  @IsOptional()
  ipAddress?: string; // For audit trail
}

// ==============================================================================
// 5. Amend Form (Fixing Rejections)
// ==============================================================================
export class AmendFormDto {
  @IsUUID()
  applicationId: string;

  @IsUUID()
  formId: string;

  @IsString()
  @IsNotEmpty()
  newStorageUrl: string;

  @IsString()
  @IsNotEmpty()
  checksum: string;

  @IsString()
  @IsNotEmpty()
  changesDescription: string;

  @IsUUID()
  amendedByUserId: string;
}
