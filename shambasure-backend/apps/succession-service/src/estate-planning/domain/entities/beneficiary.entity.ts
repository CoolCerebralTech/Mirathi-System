import { BequestType, BequestConditionType, DistributionStatus } from '@prisma/client';
import { SharePercentage } from '../value-objects/share-percentage.vo';
import { AssetValue } from '../value-objects/asset-value.vo';

export interface BeneficiaryInfo {
  userId?: string;
  familyMemberId?: string;
  externalName?: string;
  externalContact?: string;
  relationship?: string;
}

export class Beneficiary {
  private id: string;
  private willId: string;
  private assetId: string;
  private beneficiaryInfo: BeneficiaryInfo;
  private bequestType: BequestType;
  private sharePercentage: SharePercentage | null;
  private specificAmount: AssetValue | null;
  private conditionType: BequestConditionType;
  private conditionDetails: string | null;
  private alternateBeneficiaryId: string | null;
  private alternateShare: SharePercentage | null;
  private distributionStatus: DistributionStatus;
  private distributedAt: Date | null;
  private distributionNotes: string | null;
  private priority: number;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: string,
    willId: string,
    assetId: string,
    beneficiaryInfo: BeneficiaryInfo,
    bequestType: BequestType,
    priority: number = 1,
  ) {
    this.validateBeneficiaryInfo(beneficiaryInfo);

    this.id = id;
    this.willId = willId;
    this.assetId = assetId;
    this.beneficiaryInfo = { ...beneficiaryInfo };
    this.bequestType = bequestType;
    this.priority = priority;

    // Default values
    this.sharePercentage = null;
    this.specificAmount = null;
    this.conditionType = BequestConditionType.NONE;
    this.conditionDetails = null;
    this.alternateBeneficiaryId = null;
    this.alternateShare = null;
    this.distributionStatus = DistributionStatus.PENDING;
    this.distributedAt = null;
    this.distributionNotes = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Getters
  getId(): string {
    return this.id;
  }
  getWillId(): string {
    return this.willId;
  }
  getAssetId(): string {
    return this.assetId;
  }
  getBeneficiaryInfo(): BeneficiaryInfo {
    return { ...this.beneficiaryInfo };
  }
  getBequestType(): BequestType {
    return this.bequestType;
  }
  getSharePercentage(): SharePercentage | null {
    return this.sharePercentage;
  }
  getSpecificAmount(): AssetValue | null {
    return this.specificAmount;
  }
  getConditionType(): BequestConditionType {
    return this.conditionType;
  }
  getConditionDetails(): string | null {
    return this.conditionDetails;
  }
  getAlternateBeneficiaryId(): string | null {
    return this.alternateBeneficiaryId;
  }
  getAlternateShare(): SharePercentage | null {
    return this.alternateShare;
  }
  getDistributionStatus(): DistributionStatus {
    return this.distributionStatus;
  }
  getDistributedAt(): Date | null {
    return this.distributedAt ? new Date(this.distributedAt) : null;
  }
  getDistributionNotes(): string | null {
    return this.distributionNotes;
  }
  getPriority(): number {
    return this.priority;
  }
  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }
  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  // Business methods
  updateShare(share: SharePercentage): void {
    if (this.bequestType !== BequestType.PERCENTAGE && this.bequestType !== BequestType.RESIDUARY) {
      throw new Error('Share percentage can only be set for percentage or residuary bequests');
    }

    this.sharePercentage = share;
    this.updatedAt = new Date();
  }

  updateSpecificAmount(amount: AssetValue): void {
    if (this.bequestType !== BequestType.SPECIFIC) {
      throw new Error('Specific amount can only be set for specific bequests');
    }

    this.specificAmount = amount;
    this.updatedAt = new Date();
  }

  addCondition(conditionType: BequestConditionType, details: string): void {
    if (conditionType === BequestConditionType.NONE) {
      this.conditionType = BequestConditionType.NONE;
      this.conditionDetails = null;
    } else {
      if (!details?.trim()) {
        throw new Error('Condition details are required for conditional bequests');
      }
      this.conditionType = conditionType;
      this.conditionDetails = details.trim();
    }
    this.updatedAt = new Date();
  }

  setAlternateBeneficiary(alternateBeneficiaryId: string, share: SharePercentage): void {
    this.alternateBeneficiaryId = alternateBeneficiaryId;
    this.alternateShare = share;
    this.updatedAt = new Date();
  }

  updatePriority(priority: number): void {
    if (priority < 1) {
      throw new Error('Priority must be at least 1');
    }
    this.priority = priority;
    this.updatedAt = new Date();
  }

  markAsDistributed(notes?: string): void {
    this.distributionStatus = DistributionStatus.COMPLETED;
    this.distributedAt = new Date();
    this.distributionNotes = notes || null;
    this.updatedAt = new Date();
  }

  markAsInProgress(): void {
    this.distributionStatus = DistributionStatus.IN_PROGRESS;
    this.updatedAt = new Date();
  }

  markAsDisputed(): void {
    this.distributionStatus = DistributionStatus.DISPUTED;
    this.updatedAt = new Date();
  }

  markAsDeferred(): void {
    this.distributionStatus = DistributionStatus.DEFERRED;
    this.updatedAt = new Date();
  }

  // Validation methods
  private validateBeneficiaryInfo(info: BeneficiaryInfo): void {
    const hasUserId = !!info.userId;
    const hasFamilyMemberId = !!info.familyMemberId;
    const hasExternalName = !!info.externalName;

    if (!hasUserId && !hasFamilyMemberId && !hasExternalName) {
      throw new Error('Beneficiary must have either user ID, family member ID, or external name');
    }

    if (
      (hasUserId && hasFamilyMemberId) ||
      (hasUserId && hasExternalName) ||
      (hasFamilyMemberId && hasExternalName)
    ) {
      throw new Error('Beneficiary can only have one type of identification');
    }
  }

  isConditional(): boolean {
    return this.conditionType !== BequestConditionType.NONE;
  }

  hasAlternate(): boolean {
    return !!this.alternateBeneficiaryId && !!this.alternateShare;
  }

  isDistributed(): boolean {
    return this.distributionStatus === DistributionStatus.COMPLETED;
  }

  getBeneficiaryName(): string {
    if (this.beneficiaryInfo.externalName) {
      return this.beneficiaryInfo.externalName;
    }
    // In real implementation, we'd fetch the name from user or family member
    return `Beneficiary ${this.id.substring(0, 8)}`;
  }

  // Static factory method
  static createForUser(
    id: string,
    willId: string,
    assetId: string,
    userId: string,
    bequestType: BequestType,
    relationship?: string,
  ): Beneficiary {
    const beneficiaryInfo: BeneficiaryInfo = {
      userId,
      relationship,
    };

    return new Beneficiary(id, willId, assetId, beneficiaryInfo, bequestType);
  }

  static createForFamilyMember(
    id: string,
    willId: string,
    assetId: string,
    familyMemberId: string,
    bequestType: BequestType,
  ): Beneficiary {
    const beneficiaryInfo: BeneficiaryInfo = {
      familyMemberId,
    };

    return new Beneficiary(id, willId, assetId, beneficiaryInfo, bequestType);
  }

  static createForExternal(
    id: string,
    willId: string,
    assetId: string,
    externalName: string,
    externalContact?: string,
    bequestType: BequestType = BequestType.SPECIFIC,
  ): Beneficiary {
    const beneficiaryInfo: BeneficiaryInfo = {
      externalName,
      externalContact,
    };

    return new Beneficiary(id, willId, assetId, beneficiaryInfo, bequestType);
  }
}
