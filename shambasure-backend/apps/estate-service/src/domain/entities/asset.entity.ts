// domain/entities/asset.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  AssetOwnershipType,
  AssetType,
  AssetVerificationStatus,
  Money,
  SharePercentage,
} from '../value-objects';

/**
 * Asset Entity
 *
 * Represents a single item of value in the Estate inventory
 *
 * Legal Context:
 * - S.83 LSA: Executors must maintain accurate inventory
 * - Asset ownership type determines if it enters estate
 * - Verification required before distribution
 *
 * Business Rules:
 * - Asset value must be positive
 * - Encumbered assets must have encumbrance details
 * - Co-owned assets track ownership percentages
 * - Only deceased's share is distributable
 *
 * Design: Strategy Pattern for asset-type-specific details
 */

export interface AssetProps {
  estateId: UniqueEntityID;
  ownerId: UniqueEntityID;

  // Core Details
  name: string;
  description?: string;
  type: AssetType;

  // Financial
  currentValue: Money;
  currency: string;
  valuationDate?: Date;

  // Ownership
  ownershipType: AssetOwnershipType;
  deceasedSharePercentage: SharePercentage; // Portion that enters estate

  // Status
  verificationStatus: AssetVerificationStatus;
  isActive: boolean;
  isEncumbered: boolean;
  encumbranceDetails?: string;

  // Metadata
  metadata?: Record<string, any>;
}

export interface AssetCoOwner {
  userId?: UniqueEntityID;
  externalName?: string;
  sharePercentage: SharePercentage;
}

export class Asset extends Entity<AssetProps> {
  private _coOwners: AssetCoOwner[] = [];
  private _valuationHistory: AssetValuation[] = [];

  private constructor(id: UniqueEntityID, props: AssetProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.validate();
  }

  /**
   * Factory: Create new asset
   */
  public static create(
    props: Omit<AssetProps, 'verificationStatus' | 'isActive' | 'isEncumbered'>,
    id?: UniqueEntityID,
  ): Asset {
    const asset = new Asset(id ?? new UniqueEntityID(), {
      ...props,
      verificationStatus: AssetVerificationStatus.unverified(),
      isActive: true,
      isEncumbered: false,
    });

    return asset;
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(id: UniqueEntityID, props: AssetProps, createdAt: Date): Asset {
    return new Asset(id, props, createdAt);
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get estateId(): UniqueEntityID {
    return this.props.estateId;
  }

  get ownerId(): UniqueEntityID {
    return this.props.ownerId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get type(): AssetType {
    return this.props.type;
  }

  get currentValue(): Money {
    return this.props.currentValue;
  }

  get valuationDate(): Date | undefined {
    return this.props.valuationDate;
  }

  get ownershipType(): AssetOwnershipType {
    return this.props.ownershipType;
  }

  get deceasedSharePercentage(): SharePercentage {
    return this.props.deceasedSharePercentage;
  }

  get verificationStatus(): AssetVerificationStatus {
    return this.props.verificationStatus;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isEncumbered(): boolean {
    return this.props.isEncumbered;
  }

  get encumbranceDetails(): string | undefined {
    return this.props.encumbranceDetails;
  }

  get coOwners(): ReadonlyArray<AssetCoOwner> {
    return Object.freeze([...this._coOwners]);
  }

  get valuationHistory(): ReadonlyArray<AssetValuation> {
    return Object.freeze([...this._valuationHistory]);
  }

  // =========================================================================
  // BUSINESS LOGIC - VALUE CALCULATIONS
  // =========================================================================

  /**
   * Get the value that enters the estate (deceased's share)
   * Critical: Only this amount is distributable
   */
  public getDistributableValue(): Money {
    // Joint tenancy bypasses estate
    if (this.ownershipType.bypassesEstate()) {
      return Money.zero();
    }

    // Calculate deceased's share
    return this.currentValue.multiply(this.deceasedSharePercentage.getDecimal());
  }

  /**
   * Get full market value (for reporting)
   */
  public getFullValue(): Money {
    return this.currentValue;
  }

  /**
   * Get net value (after encumbrances)
   * If asset has mortgage/charge, net value is reduced
   */
  public getNetValue(encumbranceAmount?: Money): Money {
    if (!this.isEncumbered || !encumbranceAmount) {
      return this.getDistributableValue();
    }

    const distributableValue = this.getDistributableValue();
    const netValue = distributableValue.subtract(encumbranceAmount);

    // Net value cannot be negative
    return netValue.isNegative() ? Money.zero() : netValue;
  }

  // =========================================================================
  // BUSINESS LOGIC - OWNERSHIP
  // =========================================================================

  /**
   * Add co-owner (for tenancy in common / community property)
   */
  public addCoOwner(coOwner: AssetCoOwner): void {
    this.ensureNotDeleted();

    // Validate ownership type allows co-owners
    if (this.ownershipType.isSole()) {
      throw new Error('Cannot add co-owner to solely owned asset');
    }

    // Validate total shares don't exceed 100%
    const totalShares = this.calculateTotalOwnershipShares([coOwner]);
    if (totalShares.greaterThan(SharePercentage.full())) {
      throw new Error('Total ownership shares cannot exceed 100%');
    }

    this._coOwners.push(coOwner);
    this.incrementVersion();
  }

  /**
   * Remove co-owner
   */
  public removeCoOwner(index: number): void {
    this.ensureNotDeleted();

    if (index < 0 || index >= this._coOwners.length) {
      throw new Error('Invalid co-owner index');
    }

    this._coOwners.splice(index, 1);
    this.incrementVersion();
  }

  /**
   * Update deceased's share percentage
   */
  public updateDeceasedShare(newShare: SharePercentage): void {
    this.ensureNotDeleted();

    if (this.ownershipType.isSole() && !newShare.isFull()) {
      throw new Error('Sole ownership must have 100% deceased share');
    }

    (this.props as any).deceasedSharePercentage = newShare;
    this.incrementVersion();
  }

  /**
   * Calculate total ownership shares (including deceased)
   */
  private calculateTotalOwnershipShares(additionalCoOwners: AssetCoOwner[] = []): SharePercentage {
    let total = this.deceasedSharePercentage;

    for (const coOwner of [...this._coOwners, ...additionalCoOwners]) {
      total = total.add(coOwner.sharePercentage);
    }

    return total;
  }

  // =========================================================================
  // BUSINESS LOGIC - VERIFICATION
  // =========================================================================

  /**
   * Submit asset for verification
   */
  public submitForVerification(): void {
    this.ensureNotDeleted();

    if (!this.verificationStatus.isUnverified()) {
      throw new Error(`Cannot submit asset in status: ${this.verificationStatus.value}`);
    }

    (this.props as any).verificationStatus = AssetVerificationStatus.pendingVerification();
    this.incrementVersion();
  }

  /**
   * Verify asset (by verifier/auditor)
   */
  public verify(): void {
    this.ensureNotDeleted();

    if (!this.verificationStatus.isPending()) {
      throw new Error(`Cannot verify asset in status: ${this.verificationStatus.value}`);
    }

    (this.props as any).verificationStatus = AssetVerificationStatus.verified();
    this.incrementVersion();
  }

  /**
   * Reject asset verification
   */
  public reject(reason: string): void {
    this.ensureNotDeleted();

    if (!this.verificationStatus.isPending()) {
      throw new Error(`Cannot reject asset in status: ${this.verificationStatus.value}`);
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    (this.props as any).verificationStatus = AssetVerificationStatus.rejected();
    (this.props as any).metadata = {
      ...this.props.metadata,
      rejectionReason: reason,
      rejectedAt: new Date(),
    };
    this.incrementVersion();
  }

  /**
   * Mark asset as disputed
   */
  public markAsDisputed(reason: string): void {
    this.ensureNotDeleted();

    if (!reason || reason.trim().length === 0) {
      throw new Error('Dispute reason is required');
    }

    (this.props as any).verificationStatus = AssetVerificationStatus.disputed();
    (this.props as any).metadata = {
      ...this.props.metadata,
      disputeReason: reason,
      disputedAt: new Date(),
    };
    this.incrementVersion();
  }

  /**
   * Check if asset is ready for distribution
   */
  public isReadyForDistribution(): boolean {
    return (
      this.isActive &&
      !this.isDeleted &&
      this.verificationStatus.isVerified() &&
      this.ownershipType.entersEstate()
    );
  }

  // =========================================================================
  // BUSINESS LOGIC - VALUATION
  // =========================================================================

  /**
   * Update asset value (creates valuation history)
   */
  public updateValue(newValue: Money, valuationDate: Date, source?: string, notes?: string): void {
    this.ensureNotDeleted();

    if (newValue.isNegative()) {
      throw new Error('Asset value cannot be negative');
    }

    // Store old valuation in history
    this._valuationHistory.push({
      value: this.currentValue,
      valuationDate: this.valuationDate ?? this.createdAt,
      source: 'Previous valuation',
      recordedAt: new Date(),
    });

    // Update current value
    (this.props as any).currentValue = newValue;
    (this.props as any).valuationDate = valuationDate;

    if (source || notes) {
      (this.props as any).metadata = {
        ...this.props.metadata,
        lastValuationSource: source,
        lastValuationNotes: notes,
      };
    }

    this.incrementVersion();
  }

  /**
   * Get latest valuation
   */
  public getLatestValuation(): { value: Money; date: Date } {
    return {
      value: this.currentValue,
      date: this.valuationDate ?? this.createdAt,
    };
  }

  // =========================================================================
  // BUSINESS LOGIC - ENCUMBRANCE
  // =========================================================================

  /**
   * Mark asset as encumbered (mortgage, charge, lien)
   */
  public markAsEncumbered(details: string): void {
    this.ensureNotDeleted();

    if (!details || details.trim().length === 0) {
      throw new Error('Encumbrance details are required');
    }

    (this.props as any).isEncumbered = true;
    (this.props as any).encumbranceDetails = details;
    this.incrementVersion();
  }

  /**
   * Clear encumbrance
   */
  public clearEncumbrance(): void {
    this.ensureNotDeleted();

    (this.props as any).isEncumbered = false;
    (this.props as any).encumbranceDetails = undefined;
    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - LIFECYCLE
  // =========================================================================

  /**
   * Deactivate asset (soft delete from estate)
   */
  public deactivate(reason: string): void {
    this.ensureNotDeleted();

    if (!this.isActive) {
      throw new Error('Asset is already inactive');
    }

    (this.props as any).isActive = false;
    (this.props as any).metadata = {
      ...this.props.metadata,
      deactivationReason: reason,
      deactivatedAt: new Date(),
    };
    this.incrementVersion();
  }

  /**
   * Reactivate asset
   */
  public reactivate(): void {
    this.ensureNotDeleted();

    if (this.isActive) {
      throw new Error('Asset is already active');
    }

    (this.props as any).isActive = true;
    (this.props as any).metadata = {
      ...this.props.metadata,
      reactivatedAt: new Date(),
    };
    this.incrementVersion();
  }

  // =========================================================================
  // VALIDATION
  // =========================================================================

  private validate(): void {
    if (!this.props.estateId) {
      throw new Error('Estate ID is required');
    }

    if (!this.props.ownerId) {
      throw new Error('Owner ID is required');
    }

    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error('Asset name is required');
    }

    if (this.props.name.length > 200) {
      throw new Error('Asset name cannot exceed 200 characters');
    }

    if (!this.props.type) {
      throw new Error('Asset type is required');
    }

    if (!this.props.currentValue) {
      throw new Error('Asset value is required');
    }

    if (this.props.currentValue.isNegative()) {
      throw new Error('Asset value cannot be negative');
    }

    if (!this.props.ownershipType) {
      throw new Error('Ownership type is required');
    }

    if (!this.props.deceasedSharePercentage) {
      throw new Error('Deceased share percentage is required');
    }

    // Sole ownership must be 100%
    if (this.props.ownershipType.isSole() && !this.props.deceasedSharePercentage.isFull()) {
      throw new Error('Sole ownership must have 100% deceased share');
    }

    // Joint tenancy should have 0% distributable
    if (this.props.ownershipType.bypassesEstate() && !this.props.deceasedSharePercentage.isZero()) {
      throw new Error('Joint tenancy assets should have 0% distributable share');
    }

    if (!this.props.verificationStatus) {
      throw new Error('Verification status is required');
    }

    if (this.props.isEncumbered && !this.props.encumbranceDetails) {
      throw new Error('Encumbered assets must have encumbrance details');
    }

    if (this.props.currency !== 'KES') {
      throw new Error('Only KES currency is supported');
    }
  }

  /**
   * Clone asset (for scenarios/simulations)
   */
  public clone(): Asset {
    const clonedProps = { ...this.props };
    const cloned = new Asset(new UniqueEntityID(), clonedProps);
    cloned._coOwners = [...this._coOwners];
    cloned._valuationHistory = [...this._valuationHistory];
    return cloned;
  }
}

/**
 * Asset Valuation History Record
 */
export interface AssetValuation {
  value: Money;
  valuationDate: Date;
  source?: string;
  notes?: string;
  recordedAt: Date;
}
