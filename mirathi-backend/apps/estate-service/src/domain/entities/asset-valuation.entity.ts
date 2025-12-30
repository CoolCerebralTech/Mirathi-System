// src/estate-service/src/domain/entities/asset-valuation.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { ValuationSource, ValuationSourceHelper } from '../enums/valuation-source.enum';
import { AssetValuationUpdatedEvent } from '../events/asset-valuation.event';
import { AssetValuationException } from '../exceptions/asset-valuation.exception';
import { MoneyVO } from '../value-objects/money.vo';

export interface AssetValuationProps {
  assetId: string;

  // Valuation Details
  value: MoneyVO;
  previousValue?: MoneyVO;
  valuationDate: Date;
  source: ValuationSource;
  reason?: string;

  // Verification & Credibility
  isProfessionalValuation: boolean;
  isTaxAcceptable: boolean;
  isCourtAcceptable: boolean;
  credibilityScore: number;

  // Valuer Information
  valuerName?: string;
  valuerLicenseNumber?: string;
  valuerInstitution?: string;

  // Methodology & Notes
  methodology?: string;
  notes?: string;
  supportingDocuments?: string[]; // Document IDs

  // Audit
  conductedBy: string;
  verifiedBy?: string;
  verifiedAt?: Date;
}

/**
 * Asset Valuation Entity
 *
 * Tracks the history of an asset's value over time.
 *
 * BUSINESS RULES:
 * 1. High-value assets require professional valuation
 * 2. Tax and court acceptable valuations have higher credibility
 * 3. Valuations must include methodology and evidence
 * 4. Only professional valuations can override previous values without verification
 *
 * LEGAL CONTEXT:
 * - S.83 LSA: Executor must ascertain estate value
 * - KRA Requirements: Professional valuation for high-value assets
 * - Court Evidence: Credible valuations required for distribution orders
 */
export class AssetValuation extends Entity<AssetValuationProps> {
  private constructor(props: AssetValuationProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
    this.validate();
  }

  /**
   * Factory Method to create a new valuation
   */
  public static create(
    props: Omit<
      AssetValuationProps,
      | 'isProfessionalValuation'
      | 'isTaxAcceptable'
      | 'isCourtAcceptable'
      | 'credibilityScore'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): AssetValuation {
    // Calculate credibility metrics
    const isProfessionalValuation = ValuationSourceHelper.isProfessionalSource(props.source);
    const isTaxAcceptable = ValuationSourceHelper.isTaxAcceptable(props.source);
    const isCourtAcceptable = ValuationSourceHelper.isCourtAcceptable(props.source);
    const credibilityScore = ValuationSourceHelper.getCredibilityScore(props.source);

    return new AssetValuation(
      {
        ...props,
        isProfessionalValuation,
        isTaxAcceptable,
        isCourtAcceptable,
        credibilityScore,
      },
      id,
    );
  }

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  private validate(): void {
    // Validate value is positive
    if (this.props.value.isZero()) {
      throw new AssetValuationException('Valuation amount must be positive');
    }

    // Validate valuation date is not in the future
    if (this.props.valuationDate > new Date()) {
      throw new AssetValuationException('Valuation date cannot be in the future');
    }

    // Validate professional valuers have license numbers
    if (this.props.isProfessionalValuation && !this.props.valuerLicenseNumber) {
      throw new AssetValuationException('Professional valuations require license number');
    }

    // Validate high credibility for tax purposes on high-value assets
    if (
      this.props.value.isGreaterThan(MoneyVO.createKES(10000000)) &&
      !this.props.isTaxAcceptable
    ) {
      console.warn('Warning: High-value asset valuation may not be acceptable for tax purposes');
    }
  }

  // ===========================================================================
  // BUSINESS LOGIC
  // ===========================================================================

  /**
   * Verify the valuation (e.g., by KRA or court officer)
   */
  public verify(verifiedBy: string, verificationNotes?: string): void {
    this.updateState({
      verifiedBy,
      verifiedAt: new Date(),
      notes: `${verificationNotes || 'Valuation verified'}. ${this.props.notes || ''}`,
    });

    // Emit verification event
    // Note: Asset entity handles the actual update to asset value
  }

  /**
   * Update valuation details
   */
  public updateDetails(
    updates: Partial<{
      value: MoneyVO;
      reason: string;
      methodology: string;
      notes: string;
      supportingDocuments: string[];
    }>,
    updatedBy: string,
  ): void {
    if (this.props.verifiedBy && !this.props.isProfessionalValuation) {
      throw new AssetValuationException(
        'Cannot update verified non-professional valuation without re-verification',
      );
    }

    const oldValue = this.props.value;

    this.updateState({
      ...updates,
      notes: `Updated by ${updatedBy}. ${updates.notes || this.props.notes || ''}`,
    });

    if (updates.value && !updates.value.equals(oldValue)) {
      this.addDomainEvent(
        new AssetValuationUpdatedEvent(
          this.id.toString(),
          this.props.assetId,
          oldValue.amount,
          updates.value.amount,
          updatedBy,
          this.version,
        ),
      );
    }
  }

  /**
   * Check if this valuation can override previous value
   */
  public canOverridePrevious(previousValuation?: AssetValuation): boolean {
    if (!previousValuation) return true;

    // Professional valuations can always override
    if (this.props.isProfessionalValuation) return true;

    // Same source type valuations can override each other
    if (this.props.source === previousValuation.source) return true;

    // Higher credibility can override lower credibility
    return this.props.credibilityScore > previousValuation.credibilityScore;
  }

  /**
   * Get percentage change from previous value
   */
  public getPercentageChange(previousValue?: MoneyVO): number | undefined {
    if (!previousValue || previousValue.isZero()) return undefined;

    const change = this.props.value.amount - previousValue.amount;
    return (change / previousValue.amount) * 100;
  }

  /**
   * Check if valuation requires reverification after update
   */
  public requiresReverification(): boolean {
    return this.props.verifiedBy !== undefined && !this.props.isProfessionalValuation;
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  get assetId(): string {
    return this.props.assetId;
  }

  get value(): MoneyVO {
    return this.props.value;
  }

  get previousValue(): MoneyVO | undefined {
    return this.props.previousValue;
  }

  get valuationDate(): Date {
    return this.props.valuationDate;
  }

  get source(): ValuationSource {
    return this.props.source;
  }

  get isProfessionalValuation(): boolean {
    return this.props.isProfessionalValuation;
  }

  get isTaxAcceptable(): boolean {
    return this.props.isTaxAcceptable;
  }

  get isCourtAcceptable(): boolean {
    return this.props.isCourtAcceptable;
  }

  get credibilityScore(): number {
    return this.props.credibilityScore;
  }

  get valuerName(): string | undefined {
    return this.props.valuerName;
  }

  get valuerLicenseNumber(): string | undefined {
    return this.props.valuerLicenseNumber;
  }

  get valuerInstitution(): string | undefined {
    return this.props.valuerInstitution;
  }

  get methodology(): string | undefined {
    return this.props.methodology;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get supportingDocuments(): string[] | undefined {
    return this.props.supportingDocuments;
  }

  get conductedBy(): string {
    return this.props.conductedBy;
  }

  get verifiedBy(): string | undefined {
    return this.props.verifiedBy;
  }

  get verifiedAt(): Date | undefined {
    return this.props.verifiedAt;
  }
}
