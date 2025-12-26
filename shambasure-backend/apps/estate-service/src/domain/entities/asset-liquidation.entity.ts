// src/estate-service/src/domain/entities/asset-liquidation.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { LiquidationStatus, LiquidationStatusHelper } from '../enums/liquidation-status.enum';
import { LiquidationType, LiquidationTypeHelper } from '../enums/liquidation-type.enum';
import {
  AssetLiquidationCompletedEvent,
  AssetLiquidationCourtApprovedEvent,
  AssetLiquidationInitiatedEvent,
  AssetLiquidationStatusChangedEvent,
} from '../events/asset-liquidation.event';
import { AssetLiquidationException } from '../exceptions/asset-liquidation.exception';
import { MoneyVO } from '../value-objects/money.vo';

export interface AssetLiquidationProps {
  assetId: string;
  estateId: string;

  // Financial Details
  liquidationType: LiquidationType;
  targetAmount: MoneyVO;
  actualAmount?: MoneyVO;
  currency: string;

  // Status & Lifecycle
  status: LiquidationStatus;
  approvedByCourt: boolean;
  courtOrderRef?: string;

  // Buyer Information (for sale types)
  buyerName?: string;
  buyerIdNumber?: string;

  // Process Timeline
  saleDate?: Date;
  initiatedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;

  // Metadata
  commissionRate?: number;
  commissionAmount?: MoneyVO;
  netProceeds?: MoneyVO;
  liquidationNotes?: string;
  liquidatedBy?: string;
}

/**
 * Asset Liquidation Entity
 *
 * The "Cash Converter" of the Estate Aggregate.
 *
 * BUSINESS RULES:
 * 1. Only one active liquidation per asset at a time
 * 2. Court approval required for certain liquidation types
 * 3. Commission deducted from proceeds
 * 4. Net proceeds must be added to Estate.CashOnHand upon completion
 * 5. All liquidations must have audit trail for court review
 *
 * LEGAL CONTEXT:
 * - S.45 LSA: Debt payment may require forced liquidation
 * - S.83 LSA: Executor's duty to realize estate assets
 * - Auctioneers Act: Licensed auctioneers for public auctions
 */
export class AssetLiquidation extends Entity<AssetLiquidationProps> {
  private constructor(props: AssetLiquidationProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
    this.validate();
  }

  /**
   * Factory Method to create a new liquidation
   */
  public static create(
    props: Omit<
      AssetLiquidationProps,
      'status' | 'approvedByCourt' | 'currency' | 'createdAt' | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): AssetLiquidation {
    // Determine initial status based on liquidation type
    let initialStatus = LiquidationStatus.DRAFT;
    if (LiquidationTypeHelper.requiresCourtApproval(props.liquidationType)) {
      initialStatus = LiquidationStatus.PENDING_APPROVAL;
    }

    // Calculate commission
    const commissionRate = LiquidationTypeHelper.getCommissionRate(props.liquidationType);
    const commissionAmount = props.targetAmount.multiply(commissionRate);
    const netProceeds = props.targetAmount.subtract(commissionAmount);

    return new AssetLiquidation(
      {
        ...props,
        status: initialStatus,
        approvedByCourt: false,
        currency: props.targetAmount.currency,
        commissionRate,
        commissionAmount,
        netProceeds,
      },
      id,
    );
  }

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  private validate(): void {
    // Validate target amount is positive
    if (!this.props.targetAmount.isPositive()) {
      throw new AssetLiquidationException('Target amount must be positive');
    }

    // Validate actual amount if set
    if (this.props.actualAmount && this.props.actualAmount.isZero()) {
      throw new AssetLiquidationException('Actual amount must be positive if set');
    }

    // Validate sale date is not in the future
    if (this.props.saleDate && this.props.saleDate > new Date()) {
      throw new AssetLiquidationException('Sale date cannot be in the future');
    }

    // Validate commission calculation
    if (this.props.commissionRate && this.props.commissionRate < 0) {
      throw new AssetLiquidationException('Commission rate cannot be negative');
    }
  }

  // ===========================================================================
  // LIFE CYCLE MANAGEMENT
  // ===========================================================================

  /**
   * Submit for court approval (if required)
   */
  public submitForApproval(submittedBy: string, courtOrderRef?: string): void {
    if (!LiquidationTypeHelper.requiresCourtApproval(this.props.liquidationType)) {
      throw new AssetLiquidationException(
        `Liquidation type ${this.props.liquidationType} does not require court approval`,
      );
    }

    if (this.props.status !== LiquidationStatus.DRAFT) {
      throw new AssetLiquidationException(
        `Cannot submit for approval from status: ${this.props.status}`,
      );
    }

    this.updateState({
      status: LiquidationStatus.PENDING_APPROVAL,
      courtOrderRef,
      initiatedAt: new Date(),
      liquidatedBy: submittedBy,
    });

    this.addDomainEvent(
      new AssetLiquidationInitiatedEvent(
        this.id.toString(),
        this.props.assetId,
        this.props.liquidationType,
        this.props.targetAmount.amount,
        submittedBy,
        this.version,
      ),
    );
  }

  /**
   * Mark as court approved
   */
  public markAsCourtApproved(approvedBy: string, courtOrderRef: string): void {
    if (!LiquidationTypeHelper.requiresCourtApproval(this.props.liquidationType)) {
      throw new AssetLiquidationException('This liquidation does not require court approval');
    }

    if (this.props.status !== LiquidationStatus.PENDING_APPROVAL) {
      throw new AssetLiquidationException(
        `Cannot approve liquidation in status: ${this.props.status}`,
      );
    }

    this.updateState({
      status: LiquidationStatus.APPROVED,
      approvedByCourt: true,
      courtOrderRef,
    });

    this.addDomainEvent(
      new AssetLiquidationCourtApprovedEvent(
        this.id.toString(),
        this.props.assetId,
        courtOrderRef,
        approvedBy,
        this.version,
      ),
    );
  }

  /**
   * List asset for sale/auction
   */
  public listForSale(saleDate?: Date): void {
    const validFromStatus = [
      LiquidationStatus.APPROVED,
      LiquidationStatus.FAILED, // Retry after failure
      LiquidationStatus.EXPIRED, // Re-list after expiry
    ];

    if (!validFromStatus.includes(this.props.status)) {
      throw new AssetLiquidationException(`Cannot list for sale from status: ${this.props.status}`);
    }

    const newStatus =
      this.props.liquidationType === LiquidationType.AUCTION
        ? LiquidationStatus.AUCTION_SCHEDULED
        : LiquidationStatus.LISTED_FOR_SALE;

    this.updateState({
      status: newStatus,
      saleDate,
    });
  }

  /**
   * Mark sale as completed
   */
  public markSaleCompleted(
    actualAmount: MoneyVO,
    buyerName?: string,
    buyerIdNumber?: string,
    completedBy?: string,
  ): void {
    // Validate status transition
    const validFromStatus = [LiquidationStatus.SALE_PENDING, LiquidationStatus.AUCTION_IN_PROGRESS];

    if (!validFromStatus.includes(this.props.status)) {
      throw new AssetLiquidationException(`Cannot complete sale from status: ${this.props.status}`);
    }

    // Validate actual amount is reasonable (within 30% of target)
    const minAcceptable = this.props.targetAmount.multiply(0.7);
    const maxAcceptable = this.props.targetAmount.multiply(1.3);

    if (actualAmount.isLessThan(minAcceptable) || actualAmount.isGreaterThan(maxAcceptable)) {
      throw new AssetLiquidationException(
        `Actual amount ${actualAmount.toString()} is outside acceptable range (70%-130% of target)`,
      );
    }

    // Recalculate commission and net proceeds
    const commissionRate =
      this.props.commissionRate ||
      LiquidationTypeHelper.getCommissionRate(this.props.liquidationType);
    const commissionAmount = actualAmount.multiply(commissionRate);
    const netProceeds = actualAmount.subtract(commissionAmount);

    this.updateState({
      status: LiquidationStatus.SALE_COMPLETED,
      actualAmount,
      buyerName,
      buyerIdNumber,
      commissionRate,
      commissionAmount,
      netProceeds,
      completedAt: new Date(),
      ...(completedBy && { liquidatedBy: completedBy }),
    });
  }

  /**
   * Mark proceeds as received
   */
  public markProceedsReceived(): void {
    if (this.props.status !== LiquidationStatus.SALE_COMPLETED) {
      throw new AssetLiquidationException(
        `Cannot mark proceeds received from status: ${this.props.status}`,
      );
    }

    if (!this.props.actualAmount) {
      throw new AssetLiquidationException(
        'Actual amount must be set before marking proceeds received',
      );
    }

    this.updateState({
      status: LiquidationStatus.PROCEEDS_RECEIVED,
    });
  }

  /**
   * Mark liquidation as distributed (proceeds added to estate)
   */
  public markAsDistributed(): void {
    if (this.props.status !== LiquidationStatus.PROCEEDS_RECEIVED) {
      throw new AssetLiquidationException(
        `Cannot mark as distributed from status: ${this.props.status}`,
      );
    }

    this.updateState({
      status: LiquidationStatus.DISTRIBUTED,
    });
  }

  /**
   * Close the liquidation process
   */
  public close(closedBy: string, closureNotes?: string): void {
    const validFromStatus = [
      LiquidationStatus.DISTRIBUTED,
      LiquidationStatus.CANCELLED,
      LiquidationStatus.FAILED,
      LiquidationStatus.EXPIRED,
    ];

    if (!validFromStatus.includes(this.props.status)) {
      throw new AssetLiquidationException(
        `Cannot close liquidation from status: ${this.props.status}`,
      );
    }

    this.updateState({
      status: LiquidationStatus.CLOSED,
      liquidationNotes: closureNotes,
    });

    this.addDomainEvent(
      new AssetLiquidationCompletedEvent(
        this.id.toString(),
        this.props.assetId,
        this.props.actualAmount?.amount || 0,
        this.props.targetAmount.amount,
        closedBy,
        this.version,
      ),
    );
  }

  /**
   * Cancel the liquidation
   */
  public cancel(reason: string): void {
    if (LiquidationStatusHelper.isTerminal(this.props.status)) {
      throw new AssetLiquidationException(
        `Cannot cancel liquidation in terminal status: ${this.props.status}`,
      );
    }

    this.updateState({
      status: LiquidationStatus.CANCELLED,
      liquidationNotes: `Cancelled: ${reason}. ${this.props.liquidationNotes || ''}`,
      cancelledAt: new Date(),
    });
  }

  /**
   * Update status with validation
   */
  public updateStatus(newStatus: LiquidationStatus, reason: string, updatedBy: string): void {
    if (!LiquidationStatusHelper.isValidTransition(this.props.status, newStatus)) {
      throw new AssetLiquidationException(
        `Invalid status transition: ${this.props.status} -> ${newStatus}`,
      );
    }

    const oldStatus = this.props.status;
    this.updateState({
      status: newStatus,
      liquidationNotes: `Status changed: ${oldStatus} -> ${newStatus}. Reason: ${reason}. ${this.props.liquidationNotes || ''}`,
    });

    this.addDomainEvent(
      new AssetLiquidationStatusChangedEvent(
        this.id.toString(),
        this.props.assetId,
        oldStatus,
        newStatus,
        reason,
        updatedBy,
        this.version,
      ),
    );
  }

  // ===========================================================================
  // BUSINESS LOGIC & QUERIES
  // ===========================================================================

  /**
   * Check if liquidation generates cash for estate
   */
  public generatesCash(): boolean {
    return LiquidationTypeHelper.generatesCash(this.props.liquidationType);
  }

  /**
   * Get expected timeframe for completion (in days)
   */
  public getExpectedTimeframe(): number {
    return LiquidationTypeHelper.getTimeframe(this.props.liquidationType);
  }

  /**
   * Check if liquidation requires professional (auctioneer, lawyer)
   */
  public requiresProfessional(): boolean {
    return LiquidationTypeHelper.requiresProfessional(this.props.liquidationType);
  }

  /**
   * Get net proceeds expected for estate
   */
  public getNetProceeds(): MoneyVO {
    if (this.props.netProceeds) {
      return this.props.netProceeds;
    }

    if (this.props.actualAmount && this.props.commissionRate) {
      const commission = this.props.actualAmount.multiply(this.props.commissionRate);
      return this.props.actualAmount.subtract(commission);
    }

    if (this.props.targetAmount && this.props.commissionRate) {
      const commission = this.props.targetAmount.multiply(this.props.commissionRate);
      return this.props.targetAmount.subtract(commission);
    }

    return this.props.targetAmount; // Fallback
  }
  public toString(): string {
    return `AssetLiquidation[${this.id.toString()}]: ${this.props.liquidationType} - ${this.props.targetAmount.toString()}`;
  }
  /**
   * Check if liquidation is active (in process)
   */
  public isActive(): boolean {
    return LiquidationStatusHelper.isActive(this.props.status);
  }

  /**
   * Check if liquidation is completed (finalized)
   */
  public isCompleted(): boolean {
    return LiquidationStatusHelper.isCompleted(this.props.status);
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  get assetId(): string {
    return this.props.assetId;
  }

  get estateId(): string {
    return this.props.estateId;
  }

  get liquidationType(): LiquidationType {
    return this.props.liquidationType;
  }

  get targetAmount(): MoneyVO {
    return this.props.targetAmount;
  }

  get actualAmount(): MoneyVO | undefined {
    return this.props.actualAmount;
  }

  get status(): LiquidationStatus {
    return this.props.status;
  }

  get netProceeds(): MoneyVO | undefined {
    return this.props.netProceeds;
  }

  get approvedByCourt(): boolean {
    return this.props.approvedByCourt;
  }

  get courtOrderRef(): string | undefined {
    return this.props.courtOrderRef;
  }

  get buyerName(): string | undefined {
    return this.props.buyerName;
  }

  get buyerIdNumber(): string | undefined {
    return this.props.buyerIdNumber;
  }

  get saleDate(): Date | undefined {
    return this.props.saleDate;
  }

  get commissionRate(): number | undefined {
    return this.props.commissionRate;
  }

  get commissionAmount(): MoneyVO | undefined {
    return this.props.commissionAmount;
  }

  get liquidationNotes(): string | undefined {
    return this.props.liquidationNotes;
  }
  get currency(): string {
    return this.props.currency;
  }
}
