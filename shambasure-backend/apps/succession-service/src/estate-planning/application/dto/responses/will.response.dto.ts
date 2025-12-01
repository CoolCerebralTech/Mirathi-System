import {
  LegalCapacityStatus,
  RevocationMethod,
  WillStatus,
  WillStorageLocation,
  WillType,
} from '@prisma/client';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class FuneralWishesResponseDto {
  @Expose()
  burialLocation?: string;

  @Expose()
  funeralType?: string;

  @Expose()
  specificInstructions?: string;

  @Expose()
  preferredOfficiant?: string;

  @Expose()
  traditionalRites?: string[];

  @Expose()
  clanInvolvement?: string;

  @Expose()
  get hasSpecificWishes(): boolean {
    return Boolean(this.burialLocation || this.funeralType || this.specificInstructions);
  }
}

@Exclude()
export class DigitalAssetInstructionsResponseDto {
  @Expose()
  socialMediaHandling?: string;

  @Expose()
  emailAccountHandling?: string;

  @Expose()
  cryptocurrencyInstructions?: string;

  @Expose()
  onlineAccountClosure?: string;

  @Expose()
  digitalLegacyContacts?: string[];

  @Expose()
  get hasDigitalInstructions(): boolean {
    return Boolean(
      this.socialMediaHandling ||
      this.emailAccountHandling ||
      this.cryptocurrencyInstructions ||
      this.onlineAccountClosure,
    );
  }
}

@Exclude()
export class LegalCapacityResponseDto {
  @Expose()
  legalCapacityStatus: LegalCapacityStatus;

  @Expose()
  legalCapacityAssessment: Record<string, any> | null;

  @Expose()
  legalCapacityAssessedBy: string | null;

  @Expose()
  legalCapacityAssessedAt: Date | null;

  @Expose()
  medicalCertificationId: string | null;

  @Expose()
  get isLegallyCompetent(): boolean {
    return this.legalCapacityStatus === LegalCapacityStatus.ASSESSED_COMPETENT;
  }

  @Expose()
  get requiresCapacityAssessment(): boolean {
    return this.legalCapacityStatus === LegalCapacityStatus.PENDING_ASSESSMENT;
  }

  @Expose()
  get capacitySummary(): string {
    switch (this.legalCapacityStatus) {
      case LegalCapacityStatus.ASSESSED_COMPETENT:
        return 'Legally Competent';

      case LegalCapacityStatus.ASSESSED_INCOMPETENT:
        return 'Legally Incompetent';

      case LegalCapacityStatus.PENDING_ASSESSMENT:
        return 'Pending Assessment';

      case LegalCapacityStatus.MEDICAL_CERTIFICATION:
        return 'Requires Medical Certification';

      case LegalCapacityStatus.COURT_DETERMINATION:
        return 'Court Determination Required';

      case LegalCapacityStatus.SELF_DECLARATION:
        return 'Self-Declared Capacity';

      default:
        return 'Unknown Status';
    }
  }
}

@Exclude()
export class WillLifecycleResponseDto {
  @Expose()
  willDate: Date;

  @Expose()
  lastModified: Date;

  @Expose()
  versionNumber: number;

  @Expose()
  activatedAt: Date | null;

  @Expose()
  activatedBy: string | null;

  @Expose()
  executedAt: Date | null;

  @Expose()
  executedBy: string | null;

  @Expose()
  supersedes: string | null;

  @Expose()
  get isActive(): boolean {
    return this.activatedAt !== null;
  }

  @Expose()
  get isExecuted(): boolean {
    return this.executedAt !== null;
  }

  @Expose()
  get daysSinceLastModified(): number {
    const today = new Date();
    const diffTime = today.getTime() - this.lastModified.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}

@Exclude()
export class WillRevocationResponseDto {
  @Expose()
  isRevoked: boolean;

  @Expose()
  revokedAt: Date | null;

  @Expose()
  revokedBy: string | null;

  @Expose()
  revocationMethod: RevocationMethod | null;

  @Expose()
  revocationReason: string | null;

  @Expose()
  get revocationSummary(): string {
    if (!this.isRevoked) return 'Will is valid';
    return `Revoked on ${this.revokedAt?.toLocaleDateString()} by ${this.revokedBy}`;
  }
}

@Exclude()
export class WillWitnessResponseDto {
  @Expose()
  requiresWitnesses: boolean;

  @Expose()
  witnessCount: number;

  @Expose()
  hasAllWitnesses: boolean;

  @Expose()
  minimumWitnessesRequired: number;

  @Expose()
  witnessIds: string[];

  @Expose()
  get witnessStatus(): string {
    if (!this.requiresWitnesses) return 'Not Required';
    if (this.hasAllWitnesses) return `Complete (${this.witnessCount} witnesses)`;
    return `Incomplete (${this.witnessCount}/${this.minimumWitnessesRequired})`;
  }

  @Expose()
  get meetsWitnessRequirements(): boolean {
    return !this.requiresWitnesses || this.hasAllWitnesses;
  }
}

@Exclude()
export class WillFormalitiesResponseDto {
  @Expose()
  isHolographic: boolean;

  @Expose()
  isWrittenInTestatorsHand: boolean;

  @Expose()
  hasTestatorSignature: boolean;

  @Expose()
  signatureWitnessed: boolean;

  @Expose()
  meetsKenyanFormalities: boolean;

  @Expose()
  requiresWitnesses!: boolean;

  @Expose()
  hasAllWitnesses!: boolean;

  @Expose()
  get formalitiesStatus(): string {
    if (this.meetsKenyanFormalities) return 'Compliant with Kenyan Law';
    if (this.hasTestatorSignature && this.signatureWitnessed) return 'Partially Compliant';
    return 'Non-Compliant';
  }

  @Expose()
  get missingFormalities(): string[] {
    const missing: string[] = [];
    if (!this.hasTestatorSignature) missing.push('Testator signature');
    if (!this.signatureWitnessed) missing.push('Witnessed signature');
    if (this.requiresWitnesses && !this.hasAllWitnesses) missing.push('Sufficient witnesses');
    return missing;
  }
}

@Exclude()
export class WillStorageResponseDto {
  @Expose()
  storageLocation: WillStorageLocation | null;

  @Expose()
  storageDetails: string | null;

  @Expose()
  isEncrypted: boolean;

  @Expose()
  encryptionKeyId: string | null;

  @Expose()
  get storageSummary(): string {
    if (!this.storageLocation) return 'Not specified';
    return `${this.storageLocation}${this.storageDetails ? ` - ${this.storageDetails}` : ''}`;
  }

  @Expose()
  @Expose()
  get isSecurelyStored(): boolean {
    if (!this.storageLocation) return false;

    const SECURE_LOCATIONS = [
      WillStorageLocation.SAFE_DEPOSIT_BOX,
      WillStorageLocation.LAWYER_OFFICE,
      WillStorageLocation.DIGITAL_VAULT,
      WillStorageLocation.COURT_REGISTRY,
    ] as WillStorageLocation[];

    return SECURE_LOCATIONS.includes(this.storageLocation);
  }
}

@Exclude()
export class WillProbateResponseDto {
  @Expose()
  probateCaseNumber: string | null;

  @Expose()
  courtRegistry: string | null;

  @Expose()
  grantOfProbateIssued: boolean;

  @Expose()
  grantOfProbateDate: Date | null;

  @Expose()
  get isInProbate(): boolean {
    return this.probateCaseNumber !== null;
  }

  @Expose()
  get probateStatus(): string {
    if (this.grantOfProbateIssued) return 'Grant Issued';
    if (this.probateCaseNumber) return 'In Probate';
    return 'Not in Probate';
  }
}

@Exclude()
export class WillDependantResponseDto {
  @Expose()
  hasDependantProvision: boolean;

  @Expose()
  dependantProvisionDetails: string | null;

  @Expose()
  courtApprovedProvision: boolean;

  @Expose()
  get provisionStatus(): string {
    if (!this.hasDependantProvision) return 'No Dependant Provision';
    if (this.courtApprovedProvision) return 'Court Approved';
    return 'Requires Court Approval';
  }
}

@Exclude()
export class WillContentResponseDto {
  @Expose()
  @Type(() => FuneralWishesResponseDto)
  funeralWishes: FuneralWishesResponseDto;

  @Expose()
  burialLocation: string | null;

  @Expose()
  cremationInstructions: string | null;

  @Expose()
  organDonation: boolean;

  @Expose()
  organDonationDetails: string | null;

  @Expose()
  residuaryClause: string | null;

  @Expose()
  @Type(() => DigitalAssetInstructionsResponseDto)
  digitalAssetInstructions: DigitalAssetInstructionsResponseDto;

  @Expose()
  specialInstructions: string | null;

  @Expose()
  get hasSpecialInstructions(): boolean {
    return Boolean(
      this.funeralWishes.hasSpecificWishes ||
      this.organDonation ||
      this.residuaryClause ||
      this.digitalAssetInstructions.hasDigitalInstructions ||
      this.specialInstructions,
    );
  }
}

@Exclude()
export class WillAggregateResponseDto {
  @Expose()
  assetIds: string[];

  @Expose()
  beneficiaryIds: string[];

  @Expose()
  witnessIds: string[];

  @Expose()
  executorIds: string[];

  @Expose()
  get assetCount(): number {
    return this.assetIds.length;
  }

  @Expose()
  get beneficiaryCount(): number {
    return this.beneficiaryIds.length;
  }

  @Expose()
  get executorCount(): number {
    return this.executorIds.length;
  }

  @Expose()
  get isPopulated(): boolean {
    return this.assetCount > 0 && this.beneficiaryCount > 0 && this.executorCount > 0;
  }
}

@Exclude()
export class WillResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  testatorId: string;

  @Expose()
  type: WillType;

  @Expose()
  status: WillStatus;

  // Nested DTOs
  @Expose()
  @Type(() => LegalCapacityResponseDto)
  legalCapacity: LegalCapacityResponseDto;

  @Expose()
  @Type(() => WillLifecycleResponseDto)
  lifecycle: WillLifecycleResponseDto;

  @Expose()
  @Type(() => WillRevocationResponseDto)
  revocation: WillRevocationResponseDto;

  @Expose()
  @Type(() => WillContentResponseDto)
  content: WillContentResponseDto;

  @Expose()
  @Type(() => WillWitnessResponseDto)
  witnesses: WillWitnessResponseDto;

  @Expose()
  @Type(() => WillFormalitiesResponseDto)
  formalities: WillFormalitiesResponseDto;

  @Expose()
  @Type(() => WillStorageResponseDto)
  storage: WillStorageResponseDto;

  @Expose()
  @Type(() => WillProbateResponseDto)
  probate: WillProbateResponseDto;

  @Expose()
  @Type(() => WillDependantResponseDto)
  dependant: WillDependantResponseDto;

  @Expose()
  @Type(() => WillAggregateResponseDto)
  aggregate: WillAggregateResponseDto;

  // Domain Logic Exposed
  @Expose()
  get isEditable(): boolean {
    return this.status === WillStatus.DRAFT || this.status === WillStatus.PENDING_WITNESS;
  }

  @Expose()
  get canAddWitnesses(): boolean {
    return this.status === WillStatus.DRAFT || this.status === WillStatus.PENDING_WITNESS;
  }

  @Expose()
  get canBeActivated(): boolean {
    return (
      this.status === WillStatus.WITNESSED &&
      this.legalCapacity.isLegallyCompetent &&
      this.witnesses.meetsWitnessRequirements &&
      this.formalities.meetsKenyanFormalities
    );
  }

  @Expose()
  get canBeExecuted(): boolean {
    return this.status === WillStatus.ACTIVE && !this.revocation.isRevoked;
  }

  @Expose()
  get isLegallyValid(): boolean {
    return (
      this.legalCapacity.isLegallyCompetent &&
      this.formalities.meetsKenyanFormalities &&
      !this.revocation.isRevoked
    );
  }

  @Expose()
  get missingActivationRequirements(): string[] {
    const missing: string[] = [];
    if (!this.legalCapacity.isLegallyCompetent) missing.push('Legal capacity assessment');
    if (!this.witnesses.meetsWitnessRequirements) missing.push('Sufficient witnesses');
    if (!this.formalities.meetsKenyanFormalities) missing.push('Legal formalities');
    if (this.status !== WillStatus.WITNESSED) missing.push('Witnessed status');
    return missing;
  }

  @Expose()
  get statusSummary(): string {
    if (this.revocation.isRevoked) return 'Revoked';
    if (this.status === WillStatus.WITNESSED && !this.canBeActivated) {
      return 'Witnessed (Pending Requirements)';
    }
    return this.status;
  }

  // System
  @Expose()
  isActiveRecord: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  deletedAt: Date | null;
}
