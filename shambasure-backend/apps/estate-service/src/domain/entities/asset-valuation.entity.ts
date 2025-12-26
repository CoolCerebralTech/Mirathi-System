// src/estate-service/src/domain/entities/asset-valuation.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { ValuationSource } from '../enums/valuation-source.enum';
import { ValuationSourceHelper } from '../enums/valuation-source.enum';
import { ValuationDeletedEvent, ValuationUpdatedEvent } from '../events/asset-valuation.event';
import {
  InvalidValuationDateException,
  ValuationAmountInvalidException,
  ValuationCannotBeModifiedException,
  ValuationSourceInvalidException,
} from '../exceptions/asset-valuation.exception';
import { MoneyVO } from '../value-objects/money.vo';

/**
 * Asset Valuation Entity Properties Interface
 */
export interface AssetValuationProps {
  assetId: string;
  value: MoneyVO;
  valuationDate: Date;
  source: ValuationSource;
  sourceDetails?: string;
  performedBy: string;
  notes?: string;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Asset Valuation Entity
 *
 * Represents a historical valuation record for an asset.
 * Immutable by design - new valuations are created, existing ones are rarely updated.
 *
 * Legal Context:
 * - Required for capital gains tax calculations (CGT)
 * - Used for estate duty valuation (if applicable)
 * - Provides audit trail for asset value changes
 * - Different sources have different legal weight
 */
export class AssetValuation extends Entity<AssetValuationProps> {
  // Getters
  get assetId(): string {
    return this.props.assetId;
  }

  get value(): MoneyVO {
    return this.props.value;
  }

  get valuationDate(): Date {
    return this.props.valuationDate;
  }

  get source(): ValuationSource {
    return this.props.source;
  }

  get sourceDetails(): string | undefined {
    return this.props.sourceDetails;
  }

  get performedBy(): string {
    return this.props.performedBy;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  /**
   * Check if valuation is from a professional source
   */
  get isProfessionalValuation(): boolean {
    return ValuationSourceHelper.isProfessionalSource(this.props.source);
  }

  /**
   * Check if valuation is acceptable for court evidence
   */
  get isCourtAcceptable(): boolean {
    return ValuationSourceHelper.isCourtAcceptable(this.props.source);
  }

  /**
   * Check if valuation is acceptable for tax purposes
   */
  get isTaxAcceptable(): boolean {
    return ValuationSourceHelper.isTaxAcceptable(this.props.source);
  }

  /**
   * Get credibility score (1-10)
   */
  get credibilityScore(): number {
    return ValuationSourceHelper.getCredibilityScore(this.props.source);
  }

  /**
   * Private constructor - use factory methods
   */
  private constructor(id: UniqueEntityID, props: AssetValuationProps) {
    super(id, props, props.createdAt);
    this.validateValuation();
  }

  /**
   * Validate valuation invariants
   */
  private validateValuation(): void {
    // Value validation
    if (this.props.value.amount <= 0) {
      throw new ValuationAmountInvalidException(this.props.assetId, this.props.value.amount);
    }

    // Date validation
    const now = new Date();
    if (this.props.valuationDate > now) {
      throw new InvalidValuationDateException(
        this.props.assetId,
        this.props.valuationDate,
        'Valuation date cannot be in the future',
      );
    }

    // Source validation
    if (!Object.values(ValuationSource).includes(this.props.source)) {
      throw new ValuationSourceInvalidException(this.props.assetId, this.props.source);
    }

    // Professional sources require details
    if (
      ValuationSourceHelper.isProfessionalSource(this.props.source) &&
      (!this.props.sourceDetails || this.props.sourceDetails.trim().length === 0)
    ) {
      throw new ValuationSourceInvalidException(
        this.props.assetId,
        'Professional source requires source details',
      );
    }
  }

  /**
   * Update valuation value (rare, for corrections only)
   */
  updateValue(newValue: MoneyVO, updatedBy: string, reason: string): void {
    this.ensureCanBeModified();

    // Professional valuations cannot be easily modified
    if (this.isProfessionalValuation) {
      throw new ValuationCannotBeModifiedException(
        this.id.toString(),
        'Professional valuations cannot be modified',
      );
    }

    const oldValue = this.props.value;

    this.updateState({
      value: newValue,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new ValuationUpdatedEvent(
        this.props.assetId,
        this.id.toString(),
        oldValue,
        newValue,
        updatedBy,
        reason,
        this.props.version,
      ),
    );

    this.validateValuation();
  }

  /**
   * Update source details (e.g., add missing information)
   */
  updateSourceDetails(newSourceDetails: string, updatedBy: string): void {
    this.ensureCanBeModified();

    this.updateState({
      sourceDetails: newSourceDetails,
      updatedAt: new Date(),
    });
  }

  /**
   * Add notes to valuation
   */
  addNotes(additionalNotes: string, addedBy: string): void {
    this.ensureCanBeModified();

    const currentNotes = this.props.notes || '';
    const newNotes =
      currentNotes +
      (currentNotes ? '\n\n' : '') +
      `[${new Date().toISOString()}] ${addedBy}: ${additionalNotes}`;

    this.updateState({
      notes: newNotes,
      updatedAt: new Date(),
    });
  }

  /**
   * Activate valuation
   */
  activate(): void {
    if (this.props.isActive) {
      return;
    }

    this.updateState({
      isActive: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Deactivate valuation (soft delete)
   */
  deactivate(deletedBy: string, reason: string): void {
    if (!this.props.isActive) {
      return;
    }

    this.updateState({
      isActive: false,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new ValuationDeletedEvent(
        this.props.assetId,
        this.id.toString(),
        this.props.value,
        deletedBy,
        reason,
        this.props.version,
      ),
    );
  }

  /**
   * Check if valuation is within acceptable age
   * @param maxAgeMonths Maximum age in months (default 36)
   */
  isWithinAge(maxAgeMonths: number = 36): boolean {
    const now = new Date();
    const ageInMilliseconds = now.getTime() - this.props.valuationDate.getTime();
    const ageInMonths = ageInMilliseconds / (1000 * 60 * 60 * 24 * 30.44);

    return ageInMonths <= maxAgeMonths;
  }

  /**
   * Get age of valuation in months
   */
  getAgeInMonths(): number {
    const now = new Date();
    const ageInMilliseconds = now.getTime() - this.props.valuationDate.getTime();
    return ageInMilliseconds / (1000 * 60 * 60 * 24 * 30.44);
  }

  /**
   * Calculate depreciation based on asset type and age
   */
  calculateDepreciatedValue(
    depreciationRate: number, // Annual depreciation rate (e.g., 0.05 for 5%)
    asOfDate: Date = new Date(),
  ): MoneyVO {
    if (depreciationRate <= 0 || depreciationRate >= 1) {
      throw new Error('Depreciation rate must be between 0 and 1');
    }

    const ageInYears =
      (asOfDate.getTime() - this.props.valuationDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    const depreciationFactor = Math.pow(1 - depreciationRate, ageInYears);
    const depreciatedAmount = this.props.value.amount * depreciationFactor;

    return new MoneyVO({
      amount: depreciatedAmount,
      currency: this.props.value.currency,
    });
  }

  /**
   * Compare with another valuation
   */
  compareWith(other: AssetValuation): {
    percentageDifference: number;
    isWithinTolerance: boolean;
    newerValuation: AssetValuation;
  } {
    const valueDifference = Math.abs(this.props.value.amount - other.value.amount);
    const averageValue = (this.props.value.amount + other.value.amount) / 2;
    const percentageDifference = (valueDifference / averageValue) * 100;

    // Check if valuations are comparable
    const areComparable = ValuationSourceHelper.areComparable(this.props.source, other.source);

    // Determine tolerance based on source credibility
    const tolerance = Math.max(
      100 - Math.min(this.credibilityScore, other.credibilityScore) * 10,
      10,
    );

    // Determine newer valuation
    const newerValuation = this.props.valuationDate > other.valuationDate ? this : other;

    return {
      percentageDifference,
      isWithinTolerance: percentageDifference <= tolerance && areComparable,
      newerValuation,
    };
  }

  /**
   * Get summary for reporting
   */
  getSummary(): {
    id: string;
    assetId: string;
    value: number;
    currency: string;
    valuationDate: Date;
    source: string;
    isProfessional: boolean;
    credibilityScore: number;
    ageInMonths: number;
  } {
    return {
      id: this.id.toString(),
      assetId: this.props.assetId,
      value: this.props.value.amount,
      currency: this.props.value.currency,
      valuationDate: this.props.valuationDate,
      source: this.props.source,
      isProfessional: this.isProfessionalValuation,
      credibilityScore: this.credibilityScore,
      ageInMonths: this.getAgeInMonths(),
    };
  }

  /**
   * Ensure valuation can be modified
   */
  private ensureCanBeModified(): void {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      throw new ValuationCannotBeModifiedException(this.id.toString(), 'Valuation is not active');
    }

    // Professional valuations have stricter rules
    if (this.isProfessionalValuation) {
      // Only allow adding notes or source details
      throw new ValuationCannotBeModifiedException(
        this.id.toString(),
        'Professional valuations have restricted modification rules',
      );
    }
  }

  /**
   * Clone valuation properties for snapshot
   */
  protected cloneProps(): AssetValuationProps {
    return {
      ...this.props,
      value: this.props.value.clone(),
    };
  }
}
