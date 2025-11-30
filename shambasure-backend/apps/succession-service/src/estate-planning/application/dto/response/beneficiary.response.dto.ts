import {
  BeneficiaryType,
  BequestConditionType,
  BequestPriority,
  BequestType,
  DistributionStatus,
  KenyanRelationshipCategory,
} from '@prisma/client';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class BeneficiaryIdentityResponseDto {
  @Expose()
  beneficiaryType: BeneficiaryType;

  @Expose()
  userId: string | null;

  @Expose()
  familyMemberId: string | null;

  @Expose()
  externalName: string | null;

  @Expose()
  externalContact: string | null;

  @Expose()
  externalIdentification: string | null;

  @Expose()
  externalAddress: Record<string, any> | null;

  @Expose()
  get displayName(): string {
    switch (this.beneficiaryType) {
      case BeneficiaryType.USER:
        return `User ${this.userId}`;
      case BeneficiaryType.FAMILY_MEMBER:
        return `Family Member ${this.familyMemberId}`;
      case BeneficiaryType.EXTERNAL:
      case BeneficiaryType.CHARITY:
        return this.externalName || 'Unknown Beneficiary';
      default:
        return 'Unknown Type';
    }
  }

  @Expose()
  get contactInfo(): string {
    return this.externalContact || 'Not provided';
  }
}

@Exclude()
export class BeneficiaryRelationshipResponseDto {
  @Expose()
  relationshipCategory: KenyanRelationshipCategory;

  @Expose()
  specificRelationship: string | null;

  @Expose()
  isDependant: boolean;

  @Expose()
  get relationshipDescription(): string {
    return this.specificRelationship || this.relationshipCategory;
  }

  @Expose()
  get hasLegalProtection(): boolean {
    // Dependants have protection under Section 26-29
    return this.isDependant;
  }
}

@Exclude()
export class BeneficiaryBequestResponseDto {
  @Expose()
  bequestType: BequestType;

  @Expose()
  sharePercent: number | null;

  @Expose()
  specificAmount: number | null;

  @Expose()
  currency: string;

  @Expose()
  get allocationDescription(): string {
    switch (this.bequestType) {
      case BequestType.PERCENTAGE:
        return `${this.sharePercent}% of asset`;
      case BequestType.SPECIFIC:
        return `${this.currency} ${this.specificAmount?.toLocaleString()}`;
      case BequestType.RESIDUARY:
        return `Residuary share (${this.sharePercent}%)`;
      case BequestType.CONDITIONAL:
        return 'Conditional bequest';
      default:
        return 'Unknown allocation';
    }
  }

  @Expose()
  get calculatedAmount(): number | null {
    // This would need asset value context from application service
    return null;
  }
}

@Exclude()
export class BeneficiaryConditionResponseDto {
  @Expose()
  conditionType: BequestConditionType;

  @Expose()
  conditionDetails: string | null;

  @Expose()
  conditionMet: boolean | null;

  @Expose()
  conditionDeadline: Date | null;

  @Expose()
  get isConditional(): boolean {
    return this.conditionType !== BequestConditionType.NONE;
  }

  @Expose()
  get isConditionSatisfied(): boolean {
    if (!this.isConditional) return true;
    return this.conditionMet === true;
  }

  @Expose()
  get isConditionExpired(): boolean {
    if (!this.isConditional || !this.conditionDeadline) return false;
    return this.conditionDeadline < new Date();
  }

  @Expose()
  get canDistributeBasedOnCondition(): boolean {
    if (!this.isConditional) return true;
    if (this.isConditionSatisfied) return true;
    if (this.isConditionExpired) return false;
    return false; // Condition pending
  }
}

@Exclude()
export class BeneficiaryDistributionResponseDto {
  @Expose()
  distributionStatus: DistributionStatus;

  @Expose()
  distributedAt: Date | null;

  @Expose()
  distributionNotes: string | null;

  @Expose()
  distributionMethod: string | null;

  @Expose()
  get isDistributed(): boolean {
    return this.distributionStatus === DistributionStatus.COMPLETED;
  }

  @Expose()
  get distributionSummary(): string {
    if (this.isDistributed) {
      return `Distributed on ${this.distributedAt?.toLocaleDateString()} via ${this.distributionMethod}`;
    }
    return 'Pending distribution';
  }
}

@Exclude()
export class BeneficiaryLegalResponseDto {
  @Expose()
  isSubjectToDependantsProvision: boolean;

  @Expose()
  courtApprovalRequired: boolean;

  @Expose()
  courtApprovalObtained: boolean;

  @Expose()
  get requiresCourtApproval(): boolean {
    return this.courtApprovalRequired;
  }

  @Expose()
  get hasCourtApproval(): boolean {
    return this.courtApprovalObtained;
  }

  @Expose()
  get canProceedWithDistribution(): boolean {
    if (this.requiresCourtApproval && !this.hasCourtApproval) return false;
    return true;
  }

  @Expose()
  get legalStatus(): string {
    if (this.requiresCourtApproval && !this.hasCourtApproval) {
      return 'Awaiting Court Approval';
    }
    if (this.isSubjectToDependantsProvision) {
      return 'Subject to Dependants Provision';
    }
    return 'Legally Clear';
  }
}

@Exclude()
export class BeneficiaryAssignmentResponseDto {
  @Expose()
  id: string;

  @Expose()
  willId: string;

  @Expose()
  assetId: string;

  // Nested DTOs
  @Expose()
  @Type(() => BeneficiaryIdentityResponseDto)
  identity: BeneficiaryIdentityResponseDto;

  @Expose()
  @Type(() => BeneficiaryRelationshipResponseDto)
  relationship: BeneficiaryRelationshipResponseDto;

  @Expose()
  @Type(() => BeneficiaryBequestResponseDto)
  bequest: BeneficiaryBequestResponseDto;

  @Expose()
  @Type(() => BeneficiaryConditionResponseDto)
  condition: BeneficiaryConditionResponseDto;

  @Expose()
  @Type(() => BeneficiaryDistributionResponseDto)
  distribution: BeneficiaryDistributionResponseDto;

  @Expose()
  @Type(() => BeneficiaryLegalResponseDto)
  legal: BeneficiaryLegalResponseDto;

  // Alternate beneficiary
  @Expose()
  alternateAssignmentId: string | null;

  // Priority
  @Expose()
  priority: number;

  @Expose()
  bequestPriority: BequestPriority;

  // Domain Logic Exposed
  @Expose()
  get canBeDistributed(): boolean {
    if (this.distribution.isDistributed) return false;
    if (!this.legal.canProceedWithDistribution) return false;
    if (!this.condition.canDistributeBasedOnCondition) return false;
    if (!this.hasValidAllocation) return false;
    return true;
  }

  @Expose()
  get hasValidAllocation(): boolean {
    switch (this.bequest.bequestType) {
      case BequestType.PERCENTAGE:
      case BequestType.RESIDUARY:
        return Boolean(this.bequest.sharePercent && this.bequest.sharePercent > 0);
      case BequestType.SPECIFIC:
        return Boolean(this.bequest.specificAmount && this.bequest.specificAmount > 0);
      case BequestType.CONDITIONAL:
        return this.condition.isConditional;
      default:
        return false;
    }
  }

  @Expose()
  get statusSummary(): string {
    if (this.distribution.isDistributed) return 'Distributed';
    if (!this.canBeDistributed) return 'Cannot Distribute';
    return 'Ready for Distribution';
  }

  // Timestamps
  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
