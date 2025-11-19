import { AggregateRoot } from '@nestjs/cqrs';
import { BequestType, BequestConditionType, DistributionStatus } from '@prisma/client';
import { SharePercentage } from '../value-objects/share-percentage.vo';
import { AssetValue } from '../value-objects/asset-value.vo';
import { BeneficiaryAssignedEvent } from '../events/beneficiary-assigned.event';

export interface BeneficiaryIdentity {
  userId?: string;
  familyMemberId?: string;
  externalName?: string;
  externalContact?: string;
  relationship?: string;
}

export class BeneficiaryAssignment extends AggregateRoot {
  private id: string;
  private willId: string;
  private assetId: string;

  private beneficiaryIdentity: BeneficiaryIdentity;

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

  private constructor(
    id: string,
    willId: string,
    assetId: string,
    identity: BeneficiaryIdentity,
    bequestType: BequestType,
    priority: number = 1,
  ) {
    super();
    this.validateIdentity(identity);

    this.id = id;
    this.willId = willId;
    this.assetId = assetId;
    this.beneficiaryIdentity = { ...identity };
    this.bequestType = bequestType;
    this.priority = priority;

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

  // --------------------------------------------------------------------------
  // FACTORY METHODS (Fixed TS2554 Error)
  // --------------------------------------------------------------------------

  static createForUser(
    id: string,
    willId: string,
    assetId: string,
    userId: string,
    bequestType: BequestType,
    relationship?: string,
  ): BeneficiaryAssignment {
    const identity: BeneficiaryIdentity = { userId, relationship };
    const assignment = new BeneficiaryAssignment(id, willId, assetId, identity, bequestType);

    // FIXED: Added bequestType as the 5th argument
    assignment.apply(new BeneficiaryAssignedEvent(id, willId, assetId, identity, bequestType));

    return assignment;
  }

  static createForFamilyMember(
    id: string,
    willId: string,
    assetId: string,
    familyMemberId: string,
    bequestType: BequestType,
  ): BeneficiaryAssignment {
    const identity: BeneficiaryIdentity = { familyMemberId };
    const assignment = new BeneficiaryAssignment(id, willId, assetId, identity, bequestType);

    // FIXED: Added bequestType as the 5th argument
    assignment.apply(new BeneficiaryAssignedEvent(id, willId, assetId, identity, bequestType));

    return assignment;
  }

  static createForExternal(
    id: string,
    willId: string,
    assetId: string,
    externalName: string,
    externalContact?: string,
    bequestType: BequestType = BequestType.SPECIFIC,
  ): BeneficiaryAssignment {
    const identity: BeneficiaryIdentity = { externalName, externalContact };
    const assignment = new BeneficiaryAssignment(id, willId, assetId, identity, bequestType);

    // FIXED: Added bequestType as the 5th argument
    assignment.apply(new BeneficiaryAssignedEvent(id, willId, assetId, identity, bequestType));

    return assignment;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC & MUTATORS
  // --------------------------------------------------------------------------

  updateShare(share: SharePercentage): void {
    if (this.bequestType !== BequestType.PERCENTAGE && this.bequestType !== BequestType.RESIDUARY) {
      throw new Error('Share percentage can only be set for PERCENTAGE or RESIDUARY bequests.');
    }
    this.sharePercentage = share;
    this.updatedAt = new Date();
    // Note: You should likely add `assignment.apply(new BeneficiaryShareUpdatedEvent(...))` here in the future
  }

  updateSpecificAmount(amount: AssetValue): void {
    if (this.bequestType !== BequestType.SPECIFIC) {
      throw new Error('Specific amount can only be set for SPECIFIC bequests.');
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
        throw new Error('Condition details are required for conditional bequests.');
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
      throw new Error('Priority must be at least 1.');
    }
    this.priority = priority;
    this.updatedAt = new Date();
  }

  markAsDistributed(notes?: string): void {
    if (this.distributionStatus === DistributionStatus.COMPLETED) return;

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

  // --------------------------------------------------------------------------
  // VALIDATION & UTILS
  // --------------------------------------------------------------------------

  private validateIdentity(info: BeneficiaryIdentity): void {
    const hasUserId = !!info.userId;
    const hasFamilyMemberId = !!info.familyMemberId;
    const hasExternalName = !!info.externalName;

    const count = (hasUserId ? 1 : 0) + (hasFamilyMemberId ? 1 : 0) + (hasExternalName ? 1 : 0);

    if (count === 0) {
      throw new Error(
        'Beneficiary must have exactly one form of identification (User ID, Family Member ID, or External Name).',
      );
    }
    if (count > 1) {
      throw new Error('Beneficiary cannot have multiple forms of identification simultaneously.');
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

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId(): string {
    return this.id;
  }
  getWillId(): string {
    return this.willId;
  }
  getAssetId(): string {
    return this.assetId;
  }
  getIdentity(): BeneficiaryIdentity {
    return { ...this.beneficiaryIdentity };
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
}
