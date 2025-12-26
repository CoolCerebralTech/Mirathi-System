// src/estate-service/src/domain/entities/asset-liquidation.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { LiquidationStatus, LiquidationStatusHelper } from '../enums/liquidation-status.enum';
import { LiquidationType } from '../enums/liquidation-type.enum';
import { LiquidationCannotBeModifiedException } from '../exceptions/asset-liquidation.exception';
import { AssetLiquidationFailedException } from '../exceptions/asset.exception';
import { MoneyVO } from '../value-objects/money.vo';

export interface AssetLiquidationProps {
  assetId: string;
  estateId: string;
  liquidationType: LiquidationType;
  targetAmount: number; // Expected/Listing Price
  actualAmount?: number; // Final Sale Price
  currency: string;
  status: LiquidationStatus;

  // Details
  reason: string;
  buyerName?: string;
  saleDate?: Date;
  initiatedBy: string;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Asset Liquidation Entity
 *
 * Represents the process of converting an Asset into Cash.
 * Managed by the Asset Entity.
 */
export class AssetLiquidation extends Entity<AssetLiquidationProps> {
  private constructor(props: AssetLiquidationProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
  }

  public static create(
    props: Omit<AssetLiquidationProps, 'createdAt' | 'updatedAt' | 'version' | 'status'>,
    id?: UniqueEntityID,
  ): AssetLiquidation {
    // Validation
    if (props.targetAmount <= 0) {
      throw new AssetLiquidationFailedException(props.assetId, 'Target amount must be positive');
    }

    return new AssetLiquidation(
      {
        ...props,
        status: LiquidationStatus.PENDING_APPROVAL, // Default start state
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
  }

  // Getters
  get targetAmount(): number {
    return this.props.targetAmount;
  }
  get actualAmount(): number | undefined {
    return this.props.actualAmount;
  }
  get status(): LiquidationStatus {
    return this.props.status;
  }
  get netProceeds(): number | undefined {
    // Logic: Net Proceeds = Actual Amount - (Commissions + Taxes)
    // For now, returning actual amount. Can be expanded.
    return this.props.actualAmount;
  }

  /**
   * Called when the sale is finalized and money is received.
   */
  public markAsCompleted(actualAmount: MoneyVO, _completedBy: string): void {
    if (this.props.status === LiquidationStatus.SALE_COMPLETED) {
      return; // Idempotent
    }

    if (actualAmount.amount <= 0) {
      throw new AssetLiquidationFailedException(this.props.assetId, 'Sale amount must be positive');
    }

    this.updateState({
      status: LiquidationStatus.SALE_COMPLETED,
      actualAmount: actualAmount.amount,
      saleDate: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Cancel the liquidation process (e.g., family decided not to sell).
   */
  public cancel(_cancelledBy: string, _reason: string): void {
    if (LiquidationStatusHelper.isTerminal(this.props.status)) {
      throw new LiquidationCannotBeModifiedException(
        this.id.toString(),
        'Cannot cancel completed liquidation',
      );
    }

    this.updateState({
      status: LiquidationStatus.CANCELLED,
      updatedAt: new Date(),
    });
  }

  /**
   * Calculate how many days this asset has been on the market.
   */
  getDaysOnMarket(): number {
    const end = this.props.saleDate || new Date();
    const start = this.props.createdAt;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
