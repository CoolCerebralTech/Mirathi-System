import { AggregateRoot } from '@nestjs/cqrs';
import { BequestType, BequestConditionType, DistributionStatus } from '@prisma/client';
import { SharePercentage } from '../value-objects/share-percentage.vo';
import { AssetValue } from '../value-objects/asset-value.vo';
import { BeneficiaryAssignedEvent } from '../events/beneficiary-assigned.event';
import { BeneficiaryConditionAddedEvent } from '../events/beneficiary-condition-added.event';
import { BeneficiaryShareUpdatedEvent } from '../events/beneficiary-share-updated.event';
import { BeneficiaryDistributedEvent } from '../events/beneficiary-distributed.event';
import { BeneficiaryRemovedEvent } from '../events/beneficiary-removed.event';

export interface BeneficiaryIdentity {
  userId?: string;
  familyMemberId?: string;
  externalName?: string;
  externalContact?: string;
  relationship?: string;
}

// Interface for AssetValue data structure
export interface AssetValueData {
  amount: number;
  currency: string;
  valuationDate: Date | string;
}

// Interface for reconstitute method
export interface BeneficiaryReconstituteProps {
  id: string;
  willId: string;
  assetId: string;
  beneficiaryIdentity: BeneficiaryIdentity;
  bequestType: BequestType;
  sharePercentage: any;
  specificAmount: AssetValueData | AssetValue | null;
  conditionType: BequestConditionType;
  conditionDetails: string | null;
  alternateBeneficiaryId: string | null;
  alternateShare: any;
  distributionStatus: DistributionStatus;
  distributedAt: Date | string | null;
  distributionNotes: string | null;
  priority: number;
  createdAt: Date | string;
  updatedAt: Date | string;
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

  // Private Constructor
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

    // Defaults
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
  // 1. FACTORY METHODS
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

    assignment.apply(new BeneficiaryAssignedEvent(id, willId, assetId, identity, bequestType));

    return assignment;
  }

  /**
   * Rehydrate from Database (No Events)
   */
  static reconstitute(props: BeneficiaryReconstituteProps): BeneficiaryAssignment {
    const assignment = new BeneficiaryAssignment(
      props.id,
      props.willId,
      props.assetId,
      props.beneficiaryIdentity,
      props.bequestType,
      props.priority,
    );

    // Hydrate properties safely with proper typing
    assignment.conditionType = props.conditionType;
    assignment.conditionDetails = props.conditionDetails;
    assignment.alternateBeneficiaryId = props.alternateBeneficiaryId;
    assignment.distributionStatus = props.distributionStatus;
    assignment.distributionNotes = props.distributionNotes;

    // Reconstruct Value Objects
    if (props.sharePercentage) {
      assignment.sharePercentage = BeneficiaryAssignment.reconstructSharePercentage(
        props.sharePercentage,
      );
    }

    if (props.specificAmount) {
      assignment.specificAmount = BeneficiaryAssignment.reconstructAssetValue(props.specificAmount);
    }

    if (props.alternateShare) {
      assignment.alternateShare = BeneficiaryAssignment.reconstructSharePercentage(
        props.alternateShare,
      );
    }

    // Handle date conversions safely
    assignment.distributedAt = props.distributedAt ? new Date(props.distributedAt) : null;
    assignment.createdAt = new Date(props.createdAt);
    assignment.updatedAt = new Date(props.updatedAt);

    return assignment;
  }

  /**
   * Helper method to reconstruct SharePercentage from raw data or existing instance
   */
  private static reconstructSharePercentage(shareData: any): SharePercentage {
    if (shareData instanceof SharePercentage) {
      return shareData;
    }

    // Handle raw data
    return new SharePercentage(Number(shareData));
  }

  /**
   * Helper method to reconstruct AssetValue from raw data or existing instance
   */
  private static reconstructAssetValue(valueData: AssetValueData | AssetValue): AssetValue {
    if (valueData instanceof AssetValue) {
      return valueData;
    }

    // Handle raw data object with proper typing
    const valuationDate =
      typeof valueData.valuationDate === 'string'
        ? new Date(valueData.valuationDate)
        : valueData.valuationDate;

    return new AssetValue(valueData.amount, valueData.currency, valuationDate);
  }

  // --------------------------------------------------------------------------
  // 2. BUSINESS LOGIC & MUTATORS
  // --------------------------------------------------------------------------

  /**
   * Assign a Percentage Share (0-100%)
   */
  updateShare(share: SharePercentage, updatedBy?: string): void {
    if (this.bequestType !== BequestType.PERCENTAGE && this.bequestType !== BequestType.RESIDUARY) {
      throw new Error('Share percentage can only be set for PERCENTAGE or RESIDUARY bequests.');
    }

    this.sharePercentage = share;
    this.specificAmount = null; // Mutual exclusion
    this.updatedAt = new Date();

    if (updatedBy) {
      this.apply(
        new BeneficiaryShareUpdatedEvent(
          this.id,
          this.willId,
          this.bequestType,
          share,
          null,
          updatedBy,
        ),
      );
    }
  }

  /**
   * Assign a Fixed Amount (e.g. 100,000 KES from a bank account)
   */
  updateSpecificAmount(amount: AssetValue, updatedBy?: string): void {
    if (this.bequestType !== BequestType.SPECIFIC) {
      throw new Error('Specific amount can only be set for SPECIFIC bequests.');
    }

    this.specificAmount = amount;
    this.sharePercentage = null; // Mutual exclusion
    this.updatedAt = new Date();

    if (updatedBy) {
      this.apply(
        new BeneficiaryShareUpdatedEvent(
          this.id,
          this.willId,
          this.bequestType,
          null,
          amount,
          updatedBy,
        ),
      );
    }
  }

  /**
   * Add a condition (e.g., "Must be 25 years old")
   */
  addCondition(type: BequestConditionType, details: string): void {
    if (type === BequestConditionType.NONE) {
      this.removeCondition();
      return;
    }

    if (!details.trim()) throw new Error('Condition details are required.');

    this.conditionType = type;
    this.conditionDetails = details.trim();
    this.updatedAt = new Date();

    this.apply(new BeneficiaryConditionAddedEvent(this.id, this.willId, type, details));
  }

  removeCondition(): void {
    this.conditionType = BequestConditionType.NONE;
    this.conditionDetails = null;
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

  /**
   * Mark as Distributed (Succession Execution Phase)
   */
  markAsDistributed(notes?: string): void {
    if (this.distributionStatus === DistributionStatus.COMPLETED) return;

    this.distributionStatus = DistributionStatus.COMPLETED;
    this.distributedAt = new Date();
    this.distributionNotes = notes || null;
    this.updatedAt = new Date();

    this.apply(
      new BeneficiaryDistributedEvent(
        this.id,
        this.willId,
        this.assetId,
        this.distributedAt,
        notes,
      ),
    );
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

  /**
   * Soft remove/delete the assignment
   */
  remove(reason?: string): void {
    this.apply(new BeneficiaryRemovedEvent(this.id, this.willId, reason));
    // The actual deletion handling is usually done in the Command Handler
    // via the repository, but the event notifies the system.
  }

  // --------------------------------------------------------------------------
  // 3. VALIDATION & HELPERS
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
  // 4. GETTERS & HELPER METHODS
  // --------------------------------------------------------------------------

  // Core Properties
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

  // Business Logic Helpers
  getBeneficiaryName(): string {
    if (this.beneficiaryIdentity.userId) {
      return `User ${this.beneficiaryIdentity.userId}`;
    } else if (this.beneficiaryIdentity.familyMemberId) {
      return `Family Member ${this.beneficiaryIdentity.familyMemberId}`;
    } else if (this.beneficiaryIdentity.externalName) {
      return this.beneficiaryIdentity.externalName;
    }
    return 'Unknown Beneficiary';
  }

  getBeneficiaryType(): 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL' {
    if (this.beneficiaryIdentity.userId) return 'USER';
    if (this.beneficiaryIdentity.familyMemberId) return 'FAMILY_MEMBER';
    if (this.beneficiaryIdentity.externalName) return 'EXTERNAL';
    throw new Error('Invalid beneficiary identity');
  }

  getExpectedValue(assetTotalValue?: number): AssetValue | null {
    if (this.sharePercentage && assetTotalValue) {
      const amount = assetTotalValue * (this.sharePercentage.getValue() / 100);
      return new AssetValue(amount, 'KES'); // Assuming KES as default
    }
    return this.specificAmount;
  }

  canBeDistributed(): boolean {
    return (
      this.distributionStatus === DistributionStatus.PENDING ||
      this.distributionStatus === DistributionStatus.IN_PROGRESS
    );
  }

  isPending(): boolean {
    return this.distributionStatus === DistributionStatus.PENDING;
  }

  isInProgress(): boolean {
    return this.distributionStatus === DistributionStatus.IN_PROGRESS;
  }

  isDisputed(): boolean {
    return this.distributionStatus === DistributionStatus.DISPUTED;
  }

  isDeferred(): boolean {
    return this.distributionStatus === DistributionStatus.DEFERRED;
  }

  // Validation methods
  isValidForExecution(): boolean {
    // Check if beneficiary assignment has valid configuration
    const hasValidAllocation = Boolean(
      (this.sharePercentage && this.sharePercentage.getValue() > 0) ||
        (this.specificAmount && this.specificAmount.getAmount() > 0),
    );

    const hasValidIdentity = Boolean(
      this.beneficiaryIdentity.userId ||
        this.beneficiaryIdentity.familyMemberId ||
        this.beneficiaryIdentity.externalName,
    );

    return hasValidAllocation && hasValidIdentity && !this.isDistributed();
  }

  requiresAlternateActivation(): boolean {
    // Check if conditions are met that would require activating alternate beneficiary
    return this.isConditional() && this.hasAlternate();
  }

  // Additional validation helpers
  hasValidAllocation(): boolean {
    if (this.bequestType === BequestType.PERCENTAGE || this.bequestType === BequestType.RESIDUARY) {
      return Boolean(this.sharePercentage && this.sharePercentage.getValue() > 0);
    } else if (this.bequestType === BequestType.SPECIFIC) {
      return Boolean(this.specificAmount && this.specificAmount.getAmount() > 0);
    }
    return false;
  }

  isFullyConfigured(): boolean {
    return this.hasValidAllocation() && this.isValidForExecution();
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];

    if (!this.hasValidAllocation()) {
      errors.push('Beneficiary assignment has no valid allocation configured');
    }

    const hasValidIdentity = Boolean(
      this.beneficiaryIdentity.userId ||
        this.beneficiaryIdentity.familyMemberId ||
        this.beneficiaryIdentity.externalName,
    );

    if (!hasValidIdentity) {
      errors.push('Beneficiary has no valid identity information');
    }

    if (this.isDistributed()) {
      errors.push('Beneficiary assignment has already been distributed');
    }

    return errors;
  }
}
