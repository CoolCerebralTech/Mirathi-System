import { AggregateRoot } from '@nestjs/cqrs';
import { BequestType, DistributionStatus, RelationshipType } from '@prisma/client';

import { DistributionCompletedEvent } from '../events/distribution-completed.event';
import { DistributionDeferredEvent } from '../events/distribution-deferred.event';
import { DistributionDisputedEvent } from '../events/distribution-disputed.event';
// Domain Events
import { DistributionStartedEvent } from '../events/distribution-started.event';

// Value Objects
export class DistributionShare {
  constructor(
    private readonly sharePercent?: number,
    private readonly fixedAmount?: number,
    private readonly currency: string = 'KES',
  ) {
    if (sharePercent && (sharePercent < 0 || sharePercent > 100)) {
      throw new Error('Share percentage must be between 0 and 100');
    }
    if (fixedAmount && fixedAmount < 0) {
      throw new Error('Fixed amount cannot be negative');
    }
    if (sharePercent && fixedAmount) {
      throw new Error('Cannot specify both share percentage and fixed amount');
    }
    if (!sharePercent && !fixedAmount) {
      throw new Error('Must specify either share percentage or fixed amount');
    }
  }

  getSharePercent(): number | undefined {
    return this.sharePercent;
  }
  getFixedAmount(): number | undefined {
    return this.fixedAmount;
  }
  getCurrency(): string {
    return this.currency;
  }

  calculateAmount(totalEstateValue: number): number {
    if (this.fixedAmount) return this.fixedAmount;
    if (this.sharePercent) return (totalEstateValue * this.sharePercent) / 100;
    return 0;
  }

  isPercentageBased(): boolean {
    return this.sharePercent !== undefined;
  }
}

// Main Entity
export class Distribution extends AggregateRoot {
  constructor(
    private readonly id: string,
    private readonly estateId: string,
    private beneficiaryType: BequestType,
    private share: DistributionShare,
    private status: DistributionStatus = DistributionStatus.PENDING,
    private beneficiaryUserId?: string,
    private beneficiaryFamilyMemberId?: string,
    private externalName?: string,
    private relationship?: RelationshipType,
    private lifeInterest: boolean = false,
    private lifeInterestEndsAt?: Date,
    private isMinor: boolean = false,
    private heldInTrustId?: string,
    private distributedAt?: Date,
    private priority: number = 1,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
  ) {
    super();
    this.validate();
  }

  // ==========================================================================
  // FACTORY METHODS (Creation & Reconstitution)
  // ==========================================================================

  static createForBeneficiary(
    id: string,
    estateId: string,
    beneficiaryType: BequestType,
    sharePercent?: number,
    fixedAmount?: number,
    options?: {
      beneficiaryUserId?: string;
      beneficiaryFamilyMemberId?: string;
      externalName?: string;
      relationship?: RelationshipType;
      lifeInterest?: boolean;
      lifeInterestEndsAt?: Date;
      isMinor?: boolean;
      heldInTrustId?: string;
      priority?: number;
    },
  ): Distribution {
    // Legal Validation: Kenyan succession rules
    Distribution.validateBeneficiaryType(beneficiaryType, options?.relationship);

    const share = new DistributionShare(sharePercent, fixedAmount, 'KES');

    const distribution = new Distribution(
      id,
      estateId,
      beneficiaryType,
      share,
      DistributionStatus.PENDING,
      options?.beneficiaryUserId,
      options?.beneficiaryFamilyMemberId,
      options?.externalName,
      options?.relationship,
      options?.lifeInterest || false,
      options?.lifeInterestEndsAt,
      options?.isMinor || false,
      options?.heldInTrustId,
      undefined, // distributedAt
      options?.priority || 1,
      new Date(), // createdAt
      new Date(), // updatedAt
    );

    // Legal Requirement: Minors must have trusts for property
    if (options?.isMinor && !options.heldInTrustId) {
      console.warn('Minor beneficiary should have testamentary trust for asset protection');
    }

    return distribution;
  }

  static reconstitute(props: {
    id: string;
    estateId: string;
    beneficiaryType: BequestType;
    sharePercent?: number;
    fixedAmount?: number;
    status: DistributionStatus;
    beneficiaryUserId?: string;
    beneficiaryFamilyMemberId?: string;
    externalName?: string;
    relationship?: RelationshipType;
    lifeInterest?: boolean;
    lifeInterestEndsAt?: Date;
    isMinor?: boolean;
    heldInTrustId?: string;
    distributedAt?: Date;
    priority?: number;
    createdAt: Date;
    updatedAt: Date;
  }): Distribution {
    const share = new DistributionShare(props.sharePercent, props.fixedAmount, 'KES');

    return new Distribution(
      props.id,
      props.estateId,
      props.beneficiaryType,
      share,
      props.status,
      props.beneficiaryUserId,
      props.beneficiaryFamilyMemberId,
      props.externalName,
      props.relationship,
      props.lifeInterest || false,
      props.lifeInterestEndsAt,
      props.isMinor || false,
      props.heldInTrustId,
      props.distributedAt,
      props.priority || 1,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ==========================================================================
  // BUSINESS LOGIC (Domain Behavior)
  // ==========================================================================

  // Legal Requirement: Section 35-40 of Law of Succession Act - Distribution order
  startDistribution(initiatedBy: string): void {
    if (this.status !== DistributionStatus.PENDING) {
      throw new Error('Only pending distributions can be started');
    }

    // Legal Requirement: Minors require trust setup before distribution
    if (this.isMinor && !this.heldInTrustId) {
      throw new Error('Minor beneficiaries require testamentary trust before distribution');
    }

    // Legal Requirement: Life interest validation
    if (this.lifeInterest && !this.lifeInterestEndsAt) {
      throw new Error('Life interest distributions must have an end date');
    }

    this.status = DistributionStatus.IN_PROGRESS;
    this.updatedAt = new Date();

    this.apply(
      new DistributionStartedEvent(
        this.id,
        this.estateId,
        this.getBeneficiaryIdentifier(),
        this.share.calculateAmount(0), // Will be calculated with actual estate value
        initiatedBy,
      ),
    );
  }

  // Legal Requirement: Proper completion with Kenyan transfer formalities
  completeDistribution(
    distributedAt: Date = new Date(),
    options?: {
      transferMethod?: string;
      transactionReference?: string;
      completedBy?: string;
    },
  ): void {
    if (this.status !== DistributionStatus.IN_PROGRESS) {
      throw new Error('Only distributions in progress can be completed');
    }

    // Legal Requirement: Life interest validation
    if (this.lifeInterest && this.lifeInterestEndsAt && distributedAt > this.lifeInterestEndsAt) {
      throw new Error('Cannot complete life interest distribution after interest end date');
    }

    this.status = DistributionStatus.COMPLETED;
    this.distributedAt = distributedAt;
    this.updatedAt = new Date();

    this.apply(
      new DistributionCompletedEvent(
        this.id,
        this.estateId,
        this.getBeneficiaryIdentifier(),
        distributedAt,
        options?.transferMethod,
        options?.transactionReference,
        options?.completedBy,
      ),
    );
  }

  // Legal Requirement: Dispute handling for contested distributions
  markAsDisputed(disputeReason: string, disputedBy: string): void {
    if (this.status === DistributionStatus.COMPLETED) {
      // Legal Requirement: 6-month limitation for challenging distributions
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      if (this.distributedAt && this.distributedAt < sixMonthsAgo) {
        throw new Error(
          'Distributions cannot be disputed after 6 months under Kenyan limitation laws',
        );
      }
    }

    this.status = DistributionStatus.DISPUTED;
    this.updatedAt = new Date();

    this.apply(new DistributionDisputedEvent(this.id, this.estateId, disputeReason, disputedBy));
  }

  // Legal Requirement: Deferral for minors and conditional bequests
  deferDistribution(deferralReason: string, deferredUntil: Date, deferredBy: string): void {
    if (this.status !== DistributionStatus.PENDING) {
      throw new Error('Only pending distributions can be deferred');
    }

    // Legal Requirement: Maximum deferral period for minors (age 18)
    if (this.isMinor) {
      const maxAgeDate = new Date();
      maxAgeDate.setFullYear(maxAgeDate.getFullYear() + 18); // Until age 18

      if (deferredUntil > maxAgeDate) {
        throw new Error('Deferral for minors cannot extend beyond age 18');
      }
    }

    this.status = DistributionStatus.DEFERRED;
    this.updatedAt = new Date();

    this.apply(
      new DistributionDeferredEvent(
        this.id,
        this.estateId,
        deferralReason,
        deferredUntil,
        deferredBy,
      ),
    );
  }

  resolveDispute(resolution: string, resolvedBy: string): void {
    if (this.status !== DistributionStatus.DISPUTED) {
      throw new Error('Only disputed distributions can be resolved');
    }

    // Determine appropriate status after dispute resolution
    const newStatus = this.distributedAt
      ? DistributionStatus.COMPLETED
      : DistributionStatus.PENDING;

    this.status = newStatus;
    this.updatedAt = new Date();

    // Additional business logic for dispute resolution
    if (this.isMinor) {
      console.warn('Minor beneficiary distribution resolved - ensure proper trust management');
    }
  }

  // ==========================================================================
  // LEGAL COMPLIANCE & VALIDATION
  // ==========================================================================

  private validate(): void {
    if (!this.id) throw new Error('Distribution ID is required');
    if (!this.estateId) throw new Error('Estate ID is required');
    if (!this.beneficiaryType) throw new Error('Beneficiary type is required');
    if (!this.share) throw new Error('Distribution share is required');
    if (!this.status) throw new Error('Distribution status is required');

    // Legal Requirement: Beneficiary identification
    if (!this.beneficiaryUserId && !this.beneficiaryFamilyMemberId && !this.externalName) {
      throw new Error('Distribution must have a beneficiary (user, family member, or external)');
    }

    // Legal Requirement: Life interest validation
    if (this.lifeInterest && !this.lifeInterestEndsAt) {
      throw new Error('Life interest distributions must specify an end date');
    }

    // Legal Requirement: Minor beneficiary protection
    if (this.isMinor && this.beneficiaryType === BequestType.SPECIFIC) {
      console.warn('Specific bequests to minors should be held in trust for protection');
    }
  }

  private static validateBeneficiaryType(
    beneficiaryType: BequestType,
    relationship?: RelationshipType,
  ): void {
    // Legal Requirement: Relationship validation for family distributions
    if (beneficiaryType === BequestType.SPECIFIC && !relationship) {
      console.warn('Specific bequests should specify relationship for legal clarity');
    }

    // Legal Requirement: Conditional bequest validation
    if (beneficiaryType === BequestType.CONDITIONAL) {
      console.warn('Conditional bequests require careful legal drafting and monitoring');
    }
  }

  // ==========================================================================
  // QUERY METHODS & BUSINESS RULES
  // ==========================================================================

  getBeneficiaryIdentifier(): string {
    if (this.beneficiaryUserId) return `USER:${this.beneficiaryUserId}`;
    if (this.beneficiaryFamilyMemberId) return `FAMILY:${this.beneficiaryFamilyMemberId}`;
    if (this.externalName) return `EXTERNAL:${this.externalName}`;
    return 'UNKNOWN';
  }

  calculateDistributionAmount(totalEstateValue: number): number {
    return this.share.calculateAmount(totalEstateValue);
  }

  isReadyForDistribution(): boolean {
    if (this.status !== DistributionStatus.PENDING) return false;

    // Legal Restrictions
    if (this.isMinor && !this.heldInTrustId) return false;
    if (this.lifeInterest && this.lifeInterestEndsAt && new Date() > this.lifeInterestEndsAt) {
      return false; // Life interest has expired
    }

    return true;
  }

  requiresCourtConfirmation(totalEstateValue: number): boolean {
    const distributionAmount = this.calculateDistributionAmount(totalEstateValue);

    // Legal Requirement: Large distributions may require court confirmation
    return distributionAmount > 5000000; // 5 million KES threshold
  }

  isLifeInterestActive(): boolean {
    if (!this.lifeInterest || !this.lifeInterestEndsAt) return false;
    return new Date() <= this.lifeInterestEndsAt;
  }

  getDaysSinceCreation(): number {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  canBeModified(): boolean {
    return [DistributionStatus.PENDING, DistributionStatus.DEFERRED].includes(this.status);
  }

  // ==========================================================================
  // GETTERS (Persistence Interface)
  // ==========================================================================

  getId(): string {
    return this.id;
  }
  getEstateId(): string {
    return this.estateId;
  }
  getBeneficiaryType(): BequestType {
    return this.beneficiaryType;
  }
  getSharePercent(): number | undefined {
    return this.share.getSharePercent();
  }
  getFixedAmount(): number | undefined {
    return this.share.getFixedAmount();
  }
  getStatus(): DistributionStatus {
    return this.status;
  }
  getBeneficiaryUserId(): string | undefined {
    return this.beneficiaryUserId;
  }
  getBeneficiaryFamilyMemberId(): string | undefined {
    return this.beneficiaryFamilyMemberId;
  }
  getExternalName(): string | undefined {
    return this.externalName;
  }
  getRelationship(): RelationshipType | undefined {
    return this.relationship;
  }
  getLifeInterest(): boolean {
    return this.lifeInterest;
  }
  getLifeInterestEndsAt(): Date | undefined {
    return this.lifeInterestEndsAt;
  }
  getIsMinor(): boolean {
    return this.isMinor;
  }
  getHeldInTrustId(): string | undefined {
    return this.heldInTrustId;
  }
  getDistributedAt(): Date | undefined {
    return this.distributedAt;
  }
  getPriority(): number {
    return this.priority;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // For persistence reconstitution
  getProps() {
    return {
      id: this.id,
      estateId: this.estateId,
      beneficiaryType: this.beneficiaryType,
      sharePercent: this.share.getSharePercent(),
      fixedAmount: this.share.getFixedAmount(),
      status: this.status,
      beneficiaryUserId: this.beneficiaryUserId,
      beneficiaryFamilyMemberId: this.beneficiaryFamilyMemberId,
      externalName: this.externalName,
      relationship: this.relationship,
      lifeInterest: this.lifeInterest,
      lifeInterestEndsAt: this.lifeInterestEndsAt,
      isMinor: this.isMinor,
      heldInTrustId: this.heldInTrustId,
      distributedAt: this.distributedAt,
      priority: this.priority,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
