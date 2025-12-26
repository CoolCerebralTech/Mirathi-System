// src/estate-service/src/domain/entities/asset-valuation.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { ValuationSource } from '../enums/valuation-source.enum';
import { AssetLogicException, AssetValueInvalidException } from '../exceptions/asset.exception';
import { MoneyVO } from '../value-objects/money.vo';

export interface AssetValuationProps {
  assetId: string;
  value: MoneyVO;
  valuationDate: Date;
  source: ValuationSource; // e.g., "MARKET_LISTING", "PROFESSIONAL_VALUER", "GOVT_ASSESSMENT"
  sourceDetails?: string; // e.g., "Knight Frank Report #123"
  performedBy: string; // User who entered this
  isTaxAcceptable: boolean; // Does KRA accept this?
  isProfessionalValuation: boolean;
  notes?: string;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Asset Valuation Entity
 *
 * Represents a historical record of an asset's worth.
 * The Asset Aggregate holds a collection of these.
 */
export class AssetValuation extends Entity<AssetValuationProps> {
  private constructor(props: AssetValuationProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
  }

  public static create(
    props: Omit<AssetValuationProps, 'createdAt' | 'updatedAt' | 'version'>,
    id?: UniqueEntityID,
  ): AssetValuation {
    if (props.value.amount <= 0) {
      throw new AssetValueInvalidException(props.assetId, props.value.amount);
    }

    // Future date check
    if (props.valuationDate > new Date()) {
      throw new AssetLogicException('Valuation date cannot be in the future');
    }

    return new AssetValuation(
      {
        ...props,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
  }

  // Getters
  get value(): MoneyVO {
    return this.props.value;
  }
  get valuationDate(): Date {
    return this.props.valuationDate;
  }
  get source(): ValuationSource {
    return this.props.source;
  }
  get isTaxAcceptable(): boolean {
    return this.props.isTaxAcceptable;
  }
  get isProfessionalValuation(): boolean {
    return this.props.isProfessionalValuation;
  }
  get credibilityScore(): number {
    // Simple heuristic for sorting reliability
    if (this.props.source === ValuationSource.GOVT_ASSESSMENT) return 10;
    if (this.props.isProfessionalValuation) return 9;
    if (this.props.source === ValuationSource.MARKET_LISTING) return 5;
    return 1; // Self-declared
  }

  /**
   * Updates the value (Correction).
   * Note: Usually, you create a NEW valuation rather than editing an old one.
   * This is strictly for data entry error correction.
   */
  public correction(newValue: MoneyVO, reason: string, correctedBy: string): void {
    this.updateState({
      value: newValue,
      notes: `${this.props.notes || ''}\n[Correction] ${reason} by ${correctedBy}`,
      updatedAt: new Date(),
    });

    // We assume the parent Asset Aggregate will emit the event if needed,
    // or we can emit here if this entity is accessed directly (rare).
  }
}
