// domain/entities/beneficiary-assignment.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { BeneficiaryShare } from '../value-objects/beneficiary-share.vo';
import { BequestCondition } from '../value-objects/bequest-condition.vo';

/**
 * Beneficiary Assignment Entity
 *
 * Kenyan Legal Context:
 * - Testator has testamentary freedom (subject to S.26 dependants)
 * - Specific bequests are honored first
 * - Then residuary estate is divided
 * - If estate is insolvent, bequests may abate
 *
 * THE LINK:
 * This entity connects "WHAT" (Asset/Share) to "WHO" (Beneficiary)
 * with optional "WHEN/IF" (Conditions)
 *
 * ENTITY RESPONSIBILITIES:
 * - Define what beneficiary receives
 * - Apply conditions (age, education, etc.)
 * - Handle alternate beneficiaries
 * - Track fulfillment status
 * - Support abatement in insolvency
 *
 * Owned by: Will Aggregate
 */

export enum BeneficiaryType {
  USER = 'USER', // Registered user in system
  FAMILY_MEMBER = 'FAMILY_MEMBER', // From family-service
  EXTERNAL = 'EXTERNAL', // Not in system
  CHARITY = 'CHARITY', // Charitable organization
  ORGANIZATION = 'ORGANIZATION', // Company, trust
}

export enum AssignmentStatus {
  PENDING = 'PENDING', // Will not yet executed
  ACTIVE = 'ACTIVE', // Will executed, awaiting distribution
  CONDITION_PENDING = 'CONDITION_PENDING', // Waiting for condition to be met
  FULFILLED = 'FULFILLED', // Beneficiary received bequest
  LAPSED = 'LAPSED', // Beneficiary predeceased testator
  DISCLAIMED = 'DISCLAIMED', // Beneficiary rejected the bequest
  ABATED = 'ABATED', // Reduced due to insolvency
  CONTESTED = 'CONTESTED', // Under legal dispute
  REVOKED = 'REVOKED', // Testator revoked this bequest
}

interface BeneficiaryAssignmentProps {
  willId: string;

  // WHO: The Beneficiary
  beneficiaryType: BeneficiaryType;
  userId?: string;
  familyMemberId?: string;
  externalName?: string;
  externalNationalId?: string;
  charityRegistrationNumber?: string;
  organizationName?: string;

  // WHAT: The Share
  share: BeneficiaryShare;

  // WHEN/IF: Conditions
  condition: BequestCondition;

  // Alternate beneficiary
  alternateAssignmentId?: string;
  isAlternateFor?: string; // ID of primary assignment

  // Status
  status: AssignmentStatus;

  // Fulfillment tracking
  conditionFulfilledAt?: Date;
  distributedAt?: Date;
  distributedValueKES?: number;

  // Lapse (beneficiary predeceased)
  lapsedAt?: Date;
  lapseReason?: string;

  // Disclaimer
  disclaimedAt?: Date;
  disclaimerReason?: string;

  // Abatement (insolvency)
  originalValueKES?: number;
  abatedValueKES?: number;
  abatementFactor?: number;
  abatedAt?: Date;

  // Contest
  contestedAt?: Date;
  contestReason?: string;

  // Revocation
  revokedAt?: Date;
  revocationReason?: string;

  // Description for clarity
  description?: string;
  notes?: string;
}

export class BeneficiaryAssignment extends Entity<BeneficiaryAssignmentProps> {
  private constructor(id: UniqueEntityID, props: BeneficiaryAssignmentProps, createdAt?: Date) {
    super(id, props, createdAt);
  }

  // Factory: Create new assignment
  public static create(
    willId: string,
    beneficiaryType: BeneficiaryType,
    share: BeneficiaryShare,
    condition: BequestCondition,
    beneficiaryIdentifier: {
      userId?: string;
      familyMemberId?: string;
      externalName?: string;
      externalNationalId?: string;
      charityRegistrationNumber?: string;
      organizationName?: string;
    },
    description?: string,
  ): BeneficiaryAssignment {
    const id = new UniqueEntityID();

    const props: BeneficiaryAssignmentProps = {
      willId,
      beneficiaryType,
      share,
      condition,
      status: AssignmentStatus.PENDING,
      description,
      ...beneficiaryIdentifier,
    };

    // Validate beneficiary identifier
    BeneficiaryAssignment.validateBeneficiaryIdentifier(beneficiaryType, beneficiaryIdentifier);

    return new BeneficiaryAssignment(id, props);
  }

  // Factory: Reconstitute from persistence
  public static reconstitute(
    id: string,
    props: BeneficiaryAssignmentProps,
    createdAt: Date,
    updatedAt: Date,
  ): BeneficiaryAssignment {
    const assignment = new BeneficiaryAssignment(new UniqueEntityID(id), props, createdAt);
    (assignment as any)._updatedAt = updatedAt;
    return assignment;
  }

  // Validation helper
  private static validateBeneficiaryIdentifier(type: BeneficiaryType, identifier: any): void {
    switch (type) {
      case BeneficiaryType.USER:
        if (!identifier.userId) {
          throw new Error('USER beneficiary requires userId');
        }
        break;
      case BeneficiaryType.FAMILY_MEMBER:
        if (!identifier.familyMemberId) {
          throw new Error('FAMILY_MEMBER beneficiary requires familyMemberId');
        }
        break;
      case BeneficiaryType.EXTERNAL:
        if (!identifier.externalName) {
          throw new Error('EXTERNAL beneficiary requires externalName');
        }
        break;
      case BeneficiaryType.CHARITY:
        if (!identifier.charityRegistrationNumber) {
          throw new Error('CHARITY beneficiary requires charityRegistrationNumber');
        }
        break;
      case BeneficiaryType.ORGANIZATION:
        if (!identifier.organizationName) {
          throw new Error('ORGANIZATION beneficiary requires organizationName');
        }
        break;
    }
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get willId(): string {
    return this.props.willId;
  }

  get beneficiaryType(): BeneficiaryType {
    return this.props.beneficiaryType;
  }

  get share(): BeneficiaryShare {
    return this.props.share;
  }

  get condition(): BequestCondition {
    return this.props.condition;
  }

  get status(): AssignmentStatus {
    return this.props.status;
  }

  get isAlternate(): boolean {
    return !!this.props.isAlternateFor;
  }

  get hasAlternate(): boolean {
    return !!this.props.alternateAssignmentId;
  }

  get description(): string {
    return this.props.description ?? this.generateDescription();
  }

  // =========================================================================
  // BUSINESS LOGIC - ACTIVATION (WILL EXECUTION)
  // =========================================================================

  /**
   * Activate assignment when will is executed (testator died)
   */
  public activate(): void {
    this.ensureNotDeleted();

    if (this.status !== AssignmentStatus.PENDING) {
      throw new Error('Can only activate pending assignments');
    }

    // Check if there's a condition
    if (!this.props.condition.isUnconditional()) {
      (this.props as any).status = AssignmentStatus.CONDITION_PENDING;
    } else {
      (this.props as any).status = AssignmentStatus.ACTIVE;
    }

    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - CONDITION FULFILLMENT
  // =========================================================================

  /**
   * Mark condition as fulfilled
   */
  public fulfillCondition(fulfilledAt?: Date): void {
    this.ensureNotDeleted();

    if (this.status !== AssignmentStatus.CONDITION_PENDING) {
      throw new Error('Can only fulfill conditions for CONDITION_PENDING assignments');
    }

    if (this.props.condition.isUnconditional()) {
      throw new Error('This assignment has no condition to fulfill');
    }

    (this.props as any).conditionFulfilledAt = fulfilledAt ?? new Date();
    (this.props as any).status = AssignmentStatus.ACTIVE;
    this.incrementVersion();
  }

  /**
   * Check if age condition is fulfilled
   */
  public checkAgeCondition(beneficiaryDateOfBirth: Date): boolean {
    if (!this.props.condition.isAgeCondition()) {
      return false;
    }

    return this.props.condition.checkAgeFulfillment(beneficiaryDateOfBirth);
  }

  /**
   * Check if survival condition is fulfilled
   */
  public checkSurvivalCondition(testatorDeathDate: Date, beneficiaryAliveAt: Date): boolean {
    if (!this.props.condition.isSurvivalCondition()) {
      return false;
    }

    return this.props.condition.checkSurvivalFulfillment(testatorDeathDate, beneficiaryAliveAt);
  }

  // =========================================================================
  // BUSINESS LOGIC - DISTRIBUTION
  // =========================================================================

  /**
   * Mark as distributed (beneficiary received the bequest)
   */
  public distribute(valueKES: number): void {
    this.ensureNotDeleted();

    if (this.status !== AssignmentStatus.ACTIVE) {
      throw new Error('Can only distribute ACTIVE assignments');
    }

    if (valueKES <= 0) {
      throw new Error('Distribution value must be positive');
    }

    (this.props as any).status = AssignmentStatus.FULFILLED;
    (this.props as any).distributedAt = new Date();
    (this.props as any).distributedValueKES = valueKES;
    this.incrementVersion();
  }

  /**
   * Calculate distribution value
   */
  public calculateDistributionValue(totalEstateValue: number, assetValue?: number): number {
    return this.props.share.calculateValue(totalEstateValue, assetValue);
  }

  // =========================================================================
  // BUSINESS LOGIC - LAPSE (BENEFICIARY PREDECEASED)
  // =========================================================================

  /**
   * Mark assignment as lapsed (beneficiary died before testator)
   */
  public lapse(reason: string): void {
    this.ensureNotDeleted();

    if (this.status === AssignmentStatus.FULFILLED) {
      throw new Error('Cannot lapse fulfilled assignment');
    }

    (this.props as any).status = AssignmentStatus.LAPSED;
    (this.props as any).lapsedAt = new Date();
    (this.props as any).lapseReason = reason;
    this.incrementVersion();
  }

  public isLapsed(): boolean {
    return this.status === AssignmentStatus.LAPSED;
  }

  // =========================================================================
  // BUSINESS LOGIC - DISCLAIMER
  // =========================================================================

  /**
   * Beneficiary disclaims (rejects) the bequest
   */
  public disclaim(reason?: string): void {
    this.ensureNotDeleted();

    if (this.status === AssignmentStatus.FULFILLED) {
      throw new Error('Cannot disclaim fulfilled assignment');
    }

    if (this.status === AssignmentStatus.PENDING) {
      throw new Error('Cannot disclaim before will execution');
    }

    (this.props as any).status = AssignmentStatus.DISCLAIMED;
    (this.props as any).disclaimedAt = new Date();
    (this.props as any).disclaimerReason = reason;
    this.incrementVersion();
  }

  public isDisclaimed(): boolean {
    return this.status === AssignmentStatus.DISCLAIMED;
  }

  // =========================================================================
  // BUSINESS LOGIC - ABATEMENT (INSOLVENCY)
  // =========================================================================

  /**
   * Apply abatement (reduce bequest due to estate insolvency)
   * Section 45 LSA: Debts must be paid before distribution
   */
  public abate(abatementFactor: number, originalValueKES: number): void {
    this.ensureNotDeleted();

    if (abatementFactor < 0 || abatementFactor > 1) {
      throw new Error('Abatement factor must be between 0 and 1');
    }

    if (this.status !== AssignmentStatus.ACTIVE) {
      throw new Error('Can only abate ACTIVE assignments');
    }

    const abatedShare = this.props.share.applyAbatement(abatementFactor);
    const abatedValue = originalValueKES * abatementFactor;

    (this.props as any).share = abatedShare;
    (this.props as any).status = AssignmentStatus.ABATED;
    (this.props as any).originalValueKES = originalValueKES;
    (this.props as any).abatedValueKES = abatedValue;
    (this.props as any).abatementFactor = abatementFactor;
    (this.props as any).abatedAt = new Date();
    this.incrementVersion();
  }

  public isAbated(): boolean {
    return this.status === AssignmentStatus.ABATED;
  }

  public getAbatementPercentage(): number {
    if (!this.props.abatementFactor) return 0;
    return (1 - this.props.abatementFactor) * 100;
  }

  // =========================================================================
  // BUSINESS LOGIC - CONTEST
  // =========================================================================

  /**
   * Mark assignment as contested (legal dispute)
   */
  public contest(reason: string): void {
    this.ensureNotDeleted();

    (this.props as any).status = AssignmentStatus.CONTESTED;
    (this.props as any).contestedAt = new Date();
    (this.props as any).contestReason = reason;
    this.incrementVersion();
  }

  /**
   * Resolve contest (return to appropriate status)
   */
  public resolveContest(outcome: 'UPHELD' | 'OVERTURNED'): void {
    this.ensureNotDeleted();

    if (this.status !== AssignmentStatus.CONTESTED) {
      throw new Error('Can only resolve contested assignments');
    }

    if (outcome === 'UPHELD') {
      // Contest failed, return to active
      (this.props as any).status = this.props.condition.isUnconditional()
        ? AssignmentStatus.ACTIVE
        : AssignmentStatus.CONDITION_PENDING;
    } else {
      // Contest succeeded, revoke assignment
      (this.props as any).status = AssignmentStatus.REVOKED;
      (this.props as any).revokedAt = new Date();
      (this.props as any).revocationReason = 'Court order following successful contest';
    }

    this.incrementVersion();
  }

  public isContested(): boolean {
    return this.status === AssignmentStatus.CONTESTED;
  }

  // =========================================================================
  // BUSINESS LOGIC - REVOCATION
  // =========================================================================

  /**
   * Testator revokes this specific bequest (via codicil)
   */
  public revoke(reason?: string): void {
    this.ensureNotDeleted();

    if (this.status === AssignmentStatus.FULFILLED) {
      throw new Error('Cannot revoke fulfilled assignment');
    }

    (this.props as any).status = AssignmentStatus.REVOKED;
    (this.props as any).revokedAt = new Date();
    (this.props as any).revocationReason = reason;
    this.incrementVersion();
  }

  public isRevoked(): boolean {
    return this.status === AssignmentStatus.REVOKED;
  }

  // =========================================================================
  // BUSINESS LOGIC - ALTERNATE BENEFICIARY
  // =========================================================================

  /**
   * Link alternate beneficiary
   */
  public setAlternate(alternateAssignmentId: string): void {
    this.ensureNotDeleted();

    if (this.props.alternateAssignmentId) {
      throw new Error('Alternate beneficiary already set');
    }

    (this.props as any).alternateAssignmentId = alternateAssignmentId;
    this.incrementVersion();
  }

  /**
   * Check if alternate should be triggered
   */
  public shouldTriggerAlternate(): boolean {
    return this.isLapsed() || this.isDisclaimed() || this.isRevoked();
  }

  // =========================================================================
  // BUSINESS LOGIC - SHARE MODIFICATION
  // =========================================================================

  /**
   * Update share (e.g., testator changes percentage)
   */
  public updateShare(newShare: BeneficiaryShare): void {
    this.ensureNotDeleted();

    if (this.status !== AssignmentStatus.PENDING) {
      throw new Error('Cannot update share after will execution');
    }

    (this.props as any).share = newShare;
    this.incrementVersion();
  }

  /**
   * Update condition (e.g., change age requirement)
   */
  public updateCondition(newCondition: BequestCondition): void {
    this.ensureNotDeleted();

    if (this.status !== AssignmentStatus.PENDING) {
      throw new Error('Cannot update condition after will execution');
    }

    // Validate condition is legally valid
    const validity = newCondition.isLegallyValid();
    if (!validity.valid) {
      throw new Error(`Invalid condition: ${validity.reason}`);
    }

    (this.props as any).condition = newCondition;
    this.incrementVersion();
  }

  /**
   * Update description/notes
   */
  public updateDescription(description: string, notes?: string): void {
    this.ensureNotDeleted();

    (this.props as any).description = description;
    if (notes !== undefined) {
      (this.props as any).notes = notes;
    }
    this.incrementVersion();
  }

  // =========================================================================
  // QUERY METHODS
  // =========================================================================

  public isPending(): boolean {
    return this.status === AssignmentStatus.PENDING;
  }

  public isActive(): boolean {
    return this.status === AssignmentStatus.ACTIVE;
  }

  public isConditionPending(): boolean {
    return this.status === AssignmentStatus.CONDITION_PENDING;
  }

  public isFulfilled(): boolean {
    return this.status === AssignmentStatus.FULFILLED;
  }

  public isConditional(): boolean {
    return !this.props.condition.isUnconditional();
  }

  public isSpecificAsset(): boolean {
    return this.props.share.isSpecific();
  }

  public isResiduary(): boolean {
    return this.props.share.isResiduary();
  }

  public canBeDistributed(): boolean {
    return (
      this.isActive() &&
      !this.isLapsed() &&
      !this.isDisclaimed() &&
      !this.isRevoked() &&
      !this.isContested()
    );
  }

  public getAssetId(): string | undefined {
    return this.props.share.getAssetId();
  }

  public getSharePercentage(): number | undefined {
    return this.props.share.getPercentage();
  }

  public getBeneficiaryName(): string {
    return (
      this.props.externalName ||
      this.props.organizationName ||
      this.props.userId ||
      this.props.familyMemberId ||
      'Unknown beneficiary'
    );
  }

  // =========================================================================
  // BUSINESS LOGIC - VALIDATION
  // =========================================================================

  /**
   * Validate assignment completeness
   */
  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Beneficiary validation
    try {
      BeneficiaryAssignment.validateBeneficiaryIdentifier(this.props.beneficiaryType, this.props);
    } catch (error: any) {
      errors.push(error.message);
    }

    // Condition validation
    const conditionValidity = this.props.condition.isLegallyValid();
    if (!conditionValidity.valid) {
      errors.push(`Condition issue: ${conditionValidity.reason}`);
    }

    // Share validation
    if (this.props.share.isSpecific() && !this.props.share.getAssetId()) {
      errors.push('Specific bequest must reference an asset');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  private generateDescription(): string {
    const beneficiaryName = this.getBeneficiaryName();
    const shareDesc = this.props.share.getDescription();
    const conditionDesc = this.props.condition.isUnconditional()
      ? ''
      : `, ${this.props.condition.getDescription()}`;

    return `${beneficiaryName} receives ${shareDesc}${conditionDesc}`;
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  public toJSON() {
    return {
      id: this.id.toString(),
      willId: this.props.willId,
      beneficiaryType: this.props.beneficiaryType,
      beneficiaryName: this.getBeneficiaryName(),
      userId: this.props.userId,
      familyMemberId: this.props.familyMemberId,
      externalName: this.props.externalName,
      externalNationalId: this.props.externalNationalId,
      charityRegistrationNumber: this.props.charityRegistrationNumber,
      organizationName: this.props.organizationName,
      share: this.props.share.toJSON(),
      condition: this.props.condition.toJSON(),
      alternateAssignmentId: this.props.alternateAssignmentId,
      isAlternateFor: this.props.isAlternateFor,
      status: this.props.status,
      conditionFulfilledAt: this.props.conditionFulfilledAt?.toISOString(),
      distributedAt: this.props.distributedAt?.toISOString(),
      distributedValueKES: this.props.distributedValueKES,
      lapsedAt: this.props.lapsedAt?.toISOString(),
      lapseReason: this.props.lapseReason,
      disclaimedAt: this.props.disclaimedAt?.toISOString(),
      disclaimerReason: this.props.disclaimerReason,
      originalValueKES: this.props.originalValueKES,
      abatedValueKES: this.props.abatedValueKES,
      abatementFactor: this.props.abatementFactor,
      abatedAt: this.props.abatedAt?.toISOString(),
      contestedAt: this.props.contestedAt?.toISOString(),
      contestReason: this.props.contestReason,
      revokedAt: this.props.revokedAt?.toISOString(),
      revocationReason: this.props.revocationReason,
      description: this.description,
      notes: this.props.notes,
      canBeDistributed: this.canBeDistributed(),
      validation: this.validate(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      version: this.version,
    };
  }
}
