// domain/entities/gift-inter-vivos.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { AssetType, Money } from '../value-objects';

/**
 * Gift Inter Vivos Entity
 *
 * Represents gifts made by deceased during their lifetime
 *
 * CRITICAL LEGAL REFERENCE: Section 35(3), Law of Succession Act
 *
 * S.35(3) Hotchpot Rule:
 * "Any gift made by the deceased during his lifetime shall be brought into
 * account in determining the entitlement of the person who received the gift."
 *
 * Example:
 * - Estate value: 1,000,000 KES
 * - Gift to Child A during life: 200,000 KES
 * - Hotchpot value: 1,200,000 KES
 * - If 3 children, each entitled to 400,000 KES
 * - Child A already got 200,000, receives only 200,000 more
 * - Child B and C get 400,000 each
 *
 * Business Rules:
 * - Only substantial gifts are subject to hotchpot (>10% of estate)
 * - Gifts made within reasonable contemplation of death
 * - Valuation at time of gift, not current value
 * - Executor decides if gift is subject to hotchpot
 * - Court can challenge hotchpot inclusion
 *
 * Design: Entity owned by Estate aggregate
 */

export interface GiftInterVivosProps {
  estateId: UniqueEntityID;
  recipientId: UniqueEntityID; // FamilyMember ID

  // Gift Details
  description: string;
  assetType: AssetType;

  // Financial
  valueAtGiftTime: Money; // Critical: Use value when gift was made
  currentEstimatedValue?: Money; // For information only

  // Timing
  dateOfGift: Date;

  // Hotchpot Logic
  isSubjectToHotchpot: boolean; // Immutable after creation
  hotchpotReason?: string; // Why included/excluded

  // Verification
  isVerified: boolean;
  verificationNotes?: string;

  // Evidence
  documentId?: UniqueEntityID; // Deed of gift, transfer document
  witnessNames?: string[];

  // Metadata
  metadata?: Record<string, any>;
}

export class GiftInterVivos extends Entity<GiftInterVivosProps> {
  private constructor(id: UniqueEntityID, props: GiftInterVivosProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.validate();
  }

  /**
   * Factory: Create new gift record
   */
  public static create(
    props: Omit<GiftInterVivosProps, 'isVerified'>,
    id?: UniqueEntityID,
  ): GiftInterVivos {
    const gift = new GiftInterVivos(id ?? new UniqueEntityID(), {
      ...props,
      isVerified: false,
    });

    return gift;
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: UniqueEntityID,
    props: GiftInterVivosProps,
    createdAt: Date,
  ): GiftInterVivos {
    return new GiftInterVivos(id, props, createdAt);
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get estateId(): UniqueEntityID {
    return this.props.estateId;
  }

  get recipientId(): UniqueEntityID {
    return this.props.recipientId;
  }

  get description(): string {
    return this.props.description;
  }

  get assetType(): AssetType {
    return this.props.assetType;
  }

  get valueAtGiftTime(): Money {
    return this.props.valueAtGiftTime;
  }

  get currentEstimatedValue(): Money | undefined {
    return this.props.currentEstimatedValue;
  }

  get dateOfGift(): Date {
    return this.props.dateOfGift;
  }

  get isSubjectToHotchpot(): boolean {
    return this.props.isSubjectToHotchpot;
  }

  get hotchpotReason(): string | undefined {
    return this.props.hotchpotReason;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get documentId(): UniqueEntityID | undefined {
    return this.props.documentId;
  }

  get witnessNames(): string[] | undefined {
    return this.props.witnessNames;
  }

  // =========================================================================
  // BUSINESS LOGIC - HOTCHPOT CALCULATION (S.35(3))
  // =========================================================================

  /**
   * Get value to add back to estate for hotchpot
   * CRITICAL: Use value at time of gift, not current value
   */
  public getHotchpotValue(): Money {
    if (!this.isSubjectToHotchpot) {
      return Money.zero();
    }

    return this.valueAtGiftTime;
  }

  /**
   * Calculate appreciation (for information only)
   * Not used in hotchpot calculation per S.35(3)
   */
  public getAppreciation(): Money {
    if (!this.currentEstimatedValue) {
      return Money.zero();
    }

    return this.currentEstimatedValue.subtract(this.valueAtGiftTime);
  }

  /**
   * Get appreciation percentage
   */
  public getAppreciationPercentage(): number {
    if (!this.currentEstimatedValue || this.valueAtGiftTime.isZero()) {
      return 0;
    }

    const appreciation = this.getAppreciation();
    const percentChange = (appreciation.getAmount() / this.valueAtGiftTime.getAmount()) * 100;
    return percentChange;
  }

  /**
   * Check if gift is substantial (>10% of estate value)
   * Used to determine if hotchpot should apply
   */
  public isSubstantial(estateGrossValue: Money): boolean {
    const tenPercent = estateGrossValue.percentage(10);
    return this.valueAtGiftTime.greaterThanOrEqual(tenPercent);
  }

  /**
   * Calculate years since gift
   */
  public getYearsSinceGift(asOfDate: Date = new Date()): number {
    const milliseconds = asOfDate.getTime() - this.dateOfGift.getTime();
    const years = milliseconds / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(years);
  }

  /**
   * Check if gift was recent (within 5 years)
   * Recent gifts more likely subject to hotchpot
   */
  public isRecentGift(asOfDate: Date = new Date()): boolean {
    return this.getYearsSinceGift(asOfDate) <= 5;
  }

  // =========================================================================
  // BUSINESS LOGIC - VERIFICATION
  // =========================================================================

  /**
   * Verify gift (by executor)
   */
  public verify(notes?: string): void {
    this.ensureNotDeleted();

    if (this.isVerified) {
      throw new Error('Gift is already verified');
    }

    (this.props as any).isVerified = true;
    (this.props as any).verificationNotes = notes;
    (this.props as any).metadata = {
      ...this.props.metadata,
      verifiedAt: new Date(),
    };

    this.incrementVersion();
  }

  /**
   * Reject verification
   */
  public rejectVerification(reason: string): void {
    this.ensureNotDeleted();

    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    (this.props as any).isVerified = false;
    (this.props as any).verificationNotes = reason;
    (this.props as any).metadata = {
      ...this.props.metadata,
      verificationRejectedAt: new Date(),
      rejectionReason: reason,
    };

    this.incrementVersion();
  }

  /**
   * Add supporting document
   */
  public addDocument(documentId: UniqueEntityID): void {
    this.ensureNotDeleted();

    (this.props as any).documentId = documentId;
    this.incrementVersion();
  }

  /**
   * Add witnesses
   */
  public addWitnesses(witnessNames: string[]): void {
    this.ensureNotDeleted();

    if (!witnessNames || witnessNames.length === 0) {
      throw new Error('At least one witness is required');
    }

    (this.props as any).witnessNames = witnessNames;
    this.incrementVersion();
  }

  /**
   * Check if has sufficient evidence
   */
  public hasSufficientEvidence(): boolean {
    // Must have either document or witnesses
    return !!(this.documentId || (this.witnessNames && this.witnessNames.length > 0));
  }

  // =========================================================================
  // BUSINESS LOGIC - VALUE UPDATES
  // =========================================================================

  /**
   * Update current estimated value (for tracking only)
   * Does NOT affect hotchpot calculation
   */
  public updateCurrentValue(newValue: Money, notes?: string): void {
    this.ensureNotDeleted();

    if (newValue.isNegative()) {
      throw new Error('Current value cannot be negative');
    }

    (this.props as any).currentEstimatedValue = newValue;

    if (notes) {
      (this.props as any).metadata = {
        ...this.props.metadata,
        lastValueUpdateNotes: notes,
        lastValueUpdateAt: new Date(),
      };
    }

    this.incrementVersion();
  }

  /**
   * Correct value at gift time (if error discovered)
   * Requires explanation since hotchpot depends on this
   */
  public correctGiftTimeValue(correctedValue: Money, reason: string): void {
    this.ensureNotDeleted();

    if (correctedValue.isNegative()) {
      throw new Error('Gift value cannot be negative');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason for correction is required');
    }

    const oldValue = this.valueAtGiftTime;
    (this.props as any).valueAtGiftTime = correctedValue;
    (this.props as any).metadata = {
      ...this.props.metadata,
      valueCorrectedAt: new Date(),
      oldValue: oldValue.getAmount(),
      correctionReason: reason,
    };

    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - HOTCHPOT DECISION
  // =========================================================================

  /**
   * Exclude from hotchpot (executor decision)
   * Note: isSubjectToHotchpot is immutable after creation,
   * but can be challenged in court
   */
  public recordHotchpotExclusion(reason: string): void {
    this.ensureNotDeleted();

    if (!this.isSubjectToHotchpot) {
      throw new Error('Gift is already excluded from hotchpot');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Exclusion reason is required');
    }

    (this.props as any).metadata = {
      ...this.props.metadata,
      hotchpotExclusionRequested: true,
      hotchpotExclusionReason: reason,
      hotchpotExclusionRequestedAt: new Date(),
    };

    this.incrementVersion();
  }

  /**
   * Include in hotchpot (court order)
   */
  public recordHotchpotInclusion(courtOrderRef: string): void {
    this.ensureNotDeleted();

    if (this.isSubjectToHotchpot) {
      throw new Error('Gift is already included in hotchpot');
    }

    if (!courtOrderRef || courtOrderRef.trim().length === 0) {
      throw new Error('Court order reference is required');
    }

    (this.props as any).metadata = {
      ...this.props.metadata,
      hotchpotInclusionOrdered: true,
      courtOrderReference: courtOrderRef,
      hotchpotInclusionOrderedAt: new Date(),
    };

    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - GIFT TYPE ASSESSMENT
  // =========================================================================

  /**
   * Assess if gift should be subject to hotchpot
   * Helper for executor decision-making
   */
  public assessHotchpotEligibility(
    estateGrossValue: Money,
    dateOfDeath: Date,
  ): {
    shouldInclude: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let shouldInclude = true;

    // Factor 1: Gift value relative to estate
    if (!this.isSubstantial(estateGrossValue)) {
      shouldInclude = false;
      reasons.push('Gift is not substantial (<10% of estate)');
    } else {
      reasons.push('Gift is substantial (>10% of estate)');
    }

    // Factor 2: Timing relative to death
    const yearsBeforeDeath = this.getYearsSinceGift(dateOfDeath);
    if (yearsBeforeDeath > 5) {
      shouldInclude = false;
      reasons.push(`Gift made ${yearsBeforeDeath} years before death (>5 years)`);
    } else {
      reasons.push(`Gift made ${yearsBeforeDeath} years before death (within 5 years)`);
    }

    // Factor 3: Asset type (land gifts more likely included)
    if (this.assetType.value === 'LAND_PARCEL' || this.assetType.value === 'PROPERTY') {
      reasons.push('Gift involves land/property (typically included)');
    }

    return { shouldInclude, reasons };
  }

  // =========================================================================
  // VALIDATION
  // =========================================================================

  private validate(): void {
    if (!this.props.estateId) {
      throw new Error('Estate ID is required');
    }

    if (!this.props.recipientId) {
      throw new Error('Recipient ID is required');
    }

    if (!this.props.description || this.props.description.trim().length === 0) {
      throw new Error('Gift description is required');
    }

    if (!this.props.assetType) {
      throw new Error('Asset type is required');
    }

    if (!this.props.valueAtGiftTime) {
      throw new Error('Value at gift time is required');
    }

    if (this.props.valueAtGiftTime.isNegative()) {
      throw new Error('Gift value cannot be negative');
    }

    if (!this.props.dateOfGift) {
      throw new Error('Date of gift is required');
    }

    if (this.props.dateOfGift > new Date()) {
      throw new Error('Date of gift cannot be in the future');
    }

    if (this.props.currentEstimatedValue && this.props.currentEstimatedValue.isNegative()) {
      throw new Error('Current estimated value cannot be negative');
    }
  }

  /**
   * Clone gift (for scenarios)
   */
  public clone(): GiftInterVivos {
    const clonedProps = { ...this.props };
    return new GiftInterVivos(new UniqueEntityID(), clonedProps);
  }
}
