// witness.response.dto.ts
import {
  SignatureType,
  WitnessEligibilityStatus,
  WitnessStatus,
  WitnessType,
  WitnessVerificationMethod,
} from '@prisma/client';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class WitnessIdentityResponseDto {
  @Expose()
  witnessType: WitnessType;

  @Expose()
  witnessId: string | null;

  @Expose()
  fullName: string;

  @Expose()
  email: string | null;

  @Expose()
  phone: string | null;

  @Expose()
  get displayName(): string {
    return this.fullName;
  }

  @Expose()
  get contactInfo(): string {
    return [this.email, this.phone].filter(Boolean).join(' | ') || 'No contact info';
  }
}

@Exclude()
export class WitnessIdentificationResponseDto {
  @Expose()
  idNumber: string | null;

  @Expose()
  idType: WitnessVerificationMethod | null;

  @Expose()
  idDocumentId: string | null;

  @Expose()
  idVerified: boolean;

  @Expose()
  get hasIdentification(): boolean {
    return Boolean(this.idNumber || this.idDocumentId);
  }

  @Expose()
  get identificationSummary(): string {
    if (this.idVerified) return `Verified ${this.idType}`;
    if (this.idNumber) return `${this.idType} - Pending Verification`;
    return 'No ID provided';
  }
}

@Exclude()
export class WitnessProfessionalResponseDto {
  @Expose()
  isProfessionalWitness: boolean;

  @Expose()
  professionalCapacity: string | null;

  @Expose()
  professionalLicense: string | null;

  @Expose()
  get isQualified(): boolean {
    return this.isProfessionalWitness && Boolean(this.professionalCapacity);
  }

  @Expose()
  get professionalSummary(): string {
    if (!this.isProfessionalWitness) return 'Lay Witness';
    return `${this.professionalCapacity}${this.professionalLicense ? ` (${this.professionalLicense})` : ''}`;
  }
}

@Exclude()
export class WitnessRelationshipResponseDto {
  @Expose()
  relationship: string | null;

  @Expose()
  relationshipDuration: string | null;

  @Expose()
  knowsTestatorWell: boolean;

  @Expose()
  get relationshipDescription(): string {
    return this.relationship || 'Not specified';
  }

  @Expose()
  get relationshipQuality(): string {
    return this.knowsTestatorWell ? 'Knows testator well' : 'Acquaintance';
  }
}

@Exclude()
export class WitnessAddressResponseDto {
  @Expose()
  physicalAddress: Record<string, any> | null;

  @Expose()
  residentialCounty: string | null;

  @Expose()
  get hasAddress(): boolean {
    return Boolean(this.physicalAddress || this.residentialCounty);
  }

  @Expose()
  get addressSummary(): string {
    if (this.physicalAddress) return 'Full address provided';
    if (this.residentialCounty) return `Resident of ${this.residentialCounty}`;
    return 'No address info';
  }
}

@Exclude()
export class WitnessEligibilityResponseDto {
  @Expose()
  eligibilityStatus: WitnessEligibilityStatus;

  @Expose()
  eligibilityVerifiedAt: Date | null;

  @Expose()
  eligibilityVerifiedBy: string | null;

  @Expose()
  ineligibilityReason: string | null;

  @Expose()
  isEligible: boolean;

  @Expose()
  hasConflictOfInterest: boolean;

  @Expose()
  conflictDetails: string | null;

  @Expose()
  understandsObligation: boolean;

  @Expose()
  obligationAcknowledgedAt: Date | null;

  @Expose()
  get canSign(): boolean {
    return this.isEligible && !this.hasConflictOfInterest && this.understandsObligation;
  }

  @Expose()
  get eligibilitySummary(): string {
    if (this.hasConflictOfInterest) return 'Conflict of Interest';
    if (!this.isEligible) return `Ineligible: ${this.ineligibilityReason}`;
    if (!this.understandsObligation) return 'Pending Obligation';
    return 'Eligible to Sign';
  }

  @Expose()
  get missingRequirements(): string[] {
    const missing: string[] = [];
    if (!this.isEligible) missing.push('Eligibility verification');
    if (this.hasConflictOfInterest) missing.push('Conflict resolution');
    if (!this.understandsObligation) missing.push('Obligation acknowledgment');
    return missing;
  }
}

@Exclude()
export class WitnessSignatureResponseDto {
  @Expose()
  signedAt: Date | null;

  @Expose()
  signatureType: SignatureType | null;

  @Expose()
  signatureLocation: string | null;

  @Expose()
  witnessingMethod: string | null;

  @Expose()
  get hasSigned(): boolean {
    return this.signedAt !== null;
  }

  @Expose()
  get signatureSummary(): string {
    if (!this.hasSigned) return 'Not signed';
    return `Signed on ${this.signedAt?.toLocaleDateString()} via ${this.witnessingMethod}`;
  }
}

@Exclude()
export class WitnessVerificationResponseDto {
  @Expose()
  verifiedAt: Date | null;

  @Expose()
  verifiedBy: string | null;

  @Expose()
  verificationMethod: WitnessVerificationMethod | null;

  @Expose()
  verificationNotes: string | null;

  @Expose()
  get isVerified(): boolean {
    return this.verifiedAt !== null;
  }

  @Expose()
  get verificationSummary(): string {
    if (!this.isVerified) return 'Pending verification';
    return `Verified on ${this.verifiedAt?.toLocaleDateString()} by ${this.verifiedBy}`;
  }
}

@Exclude()
export class WitnessCommunicationResponseDto {
  @Expose()
  invitationSentAt: Date | null;

  @Expose()
  invitationMethod: string | null;

  @Expose()
  reminderSentAt: Date | null;

  @Expose()
  responseReceivedAt: Date | null;

  @Expose()
  get invitationStatus(): string {
    if (this.responseReceivedAt) return 'Responded';
    if (this.reminderSentAt) return 'Reminder Sent';
    if (this.invitationSentAt) return 'Invited';
    return 'Not Invited';
  }

  @Expose()
  get communicationSummary(): string {
    if (this.responseReceivedAt)
      return `Responded on ${this.responseReceivedAt.toLocaleDateString()}`;
    if (this.reminderSentAt) return `Reminder sent on ${this.reminderSentAt.toLocaleDateString()}`;
    if (this.invitationSentAt) return `Invited via ${this.invitationMethod}`;
    return 'No communication sent';
  }
}

@Exclude()
export class WitnessResponseDto {
  @Expose()
  id: string;

  @Expose()
  willId: string;

  @Expose()
  status: WitnessStatus;

  // Nested DTOs
  @Expose()
  @Type(() => WitnessIdentityResponseDto)
  identity: WitnessIdentityResponseDto;

  @Expose()
  @Type(() => WitnessIdentificationResponseDto)
  identification: WitnessIdentificationResponseDto;

  @Expose()
  @Type(() => WitnessProfessionalResponseDto)
  professional: WitnessProfessionalResponseDto;

  @Expose()
  @Type(() => WitnessRelationshipResponseDto)
  relationship: WitnessRelationshipResponseDto;

  @Expose()
  @Type(() => WitnessAddressResponseDto)
  address: WitnessAddressResponseDto;

  @Expose()
  @Type(() => WitnessEligibilityResponseDto)
  eligibility: WitnessEligibilityResponseDto;

  @Expose()
  @Type(() => WitnessSignatureResponseDto)
  signature: WitnessSignatureResponseDto;

  @Expose()
  @Type(() => WitnessVerificationResponseDto)
  verification: WitnessVerificationResponseDto;

  @Expose()
  @Type(() => WitnessCommunicationResponseDto)
  communication: WitnessCommunicationResponseDto;

  // Domain Logic Exposed
  @Expose()
  get canSign(): boolean {
    return this.status === WitnessStatus.PENDING && this.eligibility.canSign;
  }

  @Expose()
  get canBeVerified(): boolean {
    return this.status === WitnessStatus.SIGNED && this.identification.hasIdentification;
  }

  @Expose()
  get isFullyQualified(): boolean {
    return (
      this.status === WitnessStatus.VERIFIED &&
      this.eligibility.isEligible &&
      this.verification.isVerified
    );
  }

  @Expose()
  get statusSummary(): string {
    if (this.status === WitnessStatus.PENDING && !this.eligibility.canSign) {
      return 'Pending Requirements';
    }
    return this.status;
  }

  @Expose()
  get legalCompliance(): string {
    if (this.eligibility.hasConflictOfInterest) return 'Conflict of Interest';
    if (!this.eligibility.isEligible) return 'Ineligible';
    if (this.isFullyQualified) return 'Fully Compliant';
    return 'Partially Compliant';
  }

  // Timestamps
  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
