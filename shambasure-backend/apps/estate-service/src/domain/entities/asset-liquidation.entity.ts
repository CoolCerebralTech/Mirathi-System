// src/estate-service/src/domain/entities/asset-liquidation.entity.ts
import { Entity } from '../../base/entity';
import { UniqueEntityID } from '../../base/unique-entity-id';
import { LiquidationStatus } from './enums/liquidation-status.enum';
import { LiquidationStatusHelper } from './enums/liquidation-status.enum';
import { LiquidationType } from './enums/liquidation-type.enum';
import { LiquidationTypeHelper } from './enums/liquidation-type.enum';
import {
  LiquidationApprovedEvent,
  LiquidationBidReceivedEvent,
  LiquidationCancelledEvent,
  LiquidationProceedsDistributedEvent,
  LiquidationReservePriceUpdatedEvent,
  LiquidationSaleCompletedEvent,
} from './events/asset-liquidation.event';
import {
  AssetCannotBeLiquidatedException,
  InvalidLiquidationAmountException,
  LiquidationApprovalRequiredException,
  LiquidationBelowReservePriceException,
  LiquidationCannotBeModifiedException,
  LiquidationCompletionFailedException,
} from './exceptions/asset-liquidation.exception';

/**
 * Asset Liquidation Entity Properties Interface
 */
export interface AssetLiquidationProps {
  assetId: string;
  estateId: string;
  liquidationType: LiquidationType;
  targetAmount: number;
  actualAmount?: number;
  currency: string;
  reason: string;
  status: LiquidationStatus;
  requiresCourtApproval: boolean;
  courtOrderRef?: string;
  reservePrice: number;
  agentId?: string;
  agentCommissionRate: number;
  buyerName?: string;
  buyerIdNumber?: string;
  saleDate?: Date;
  initiatedBy: string;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Asset Liquidation Entity
 *
 * Represents the conversion of an asset into cash.
 * Critical for S.45 debt payment and estate liquidity.
 *
 * Legal Context:
 * - S.45 LSA: Assets may be sold to pay debts
 * - Court approval required for certain sales
 * - Auctioneers Act governs auction sales
 * - Family consent required for private sales to non-family
 */
export class AssetLiquidation extends Entity<AssetLiquidationProps> {
  // Getters
  get assetId(): string {
    return this.props.assetId;
  }
  get estateId(): string {
    return this.props.estateId;
  }
  get liquidationType(): LiquidationType {
    return this.props.liquidationType;
  }
  get targetAmount(): number {
    return this.props.targetAmount;
  }
  get actualAmount(): number | undefined {
    return this.props.actualAmount;
  }
  get currency(): string {
    return this.props.currency;
  }
  get reason(): string {
    return this.props.reason;
  }
  get status(): LiquidationStatus {
    return this.props.status;
  }
  get requiresCourtApproval(): boolean {
    return this.props.requiresCourtApproval;
  }
  get courtOrderRef(): string | undefined {
    return this.props.courtOrderRef;
  }
  get reservePrice(): number {
    return this.props.reservePrice;
  }
  get agentId(): string | undefined {
    return this.props.agentId;
  }
  get agentCommissionRate(): number {
    return this.props.agentCommissionRate;
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
  get initiatedBy(): string {
    return this.props.initiatedBy;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }

  /**
   * Get net proceeds after commission
   */
  get netProceeds(): number | undefined {
    if (!this.props.actualAmount) return undefined;

    const commission = this.props.actualAmount * this.props.agentCommissionRate;
    return this.props.actualAmount - commission;
  }

  /**
   * Get commission amount
   */
  get commissionAmount(): number | undefined {
    if (!this.props.actualAmount) return undefined;
    return this.props.actualAmount * this.props.agentCommissionRate;
  }

  /**
   * Check if liquidation is approved
   */
  get isApproved(): boolean {
    return (
      !this.props.requiresCourtApproval || this.props.status !== LiquidationStatus.PENDING_APPROVAL
    );
  }

  /**
   * Check if liquidation generates cash
   */
  get generatesCash(): boolean {
    return LiquidationTypeHelper.generatesCash(this.props.liquidationType);
  }

  /**
   * Check if liquidation is completed
   */
  get isCompleted(): boolean {
    return LiquidationStatusHelper.isCompleted(this.props.status);
  }

  /**
   * Check if liquidation is active
   */
  get isActiveProcess(): boolean {
    return LiquidationStatusHelper.isActive(this.props.status);
  }

  /**
   * Private constructor - use factory methods
   */
  private constructor(id: UniqueEntityID, props: AssetLiquidationProps) {
    super(id, props, props.createdAt);
    this.validateLiquidation();
  }

  /**
   * Validate liquidation invariants
   */
  private validateLiquidation(): void {
    // Target amount validation
    if (this.props.targetAmount <= 0) {
      throw new InvalidLiquidationAmountException(this.props.assetId, this.props.targetAmount, 0);
    }

    // Reserve price validation
    if (this.props.reservePrice < 0) {
      throw new InvalidLiquidationAmountException(this.props.assetId, this.props.reservePrice, 0);
    }

    // Reserve price should not exceed target amount by too much
    if (this.props.reservePrice > this.props.targetAmount * 1.5) {
      throw new InvalidLiquidationAmountException(
        this.props.assetId,
        this.props.reservePrice,
        this.props.targetAmount,
      );
    }

    // Commission rate validation
    if (this.props.agentCommissionRate < 0 || this.props.agentCommissionRate > 0.5) {
      throw new LiquidationCannotBeModifiedException(
        this.id.toString(),
        `Invalid commission rate: ${this.props.agentCommissionRate}. Must be between 0 and 0.5.`,
      );
    }

    // Actual amount validation (if set)
    if (this.props.actualAmount !== undefined && this.props.actualAmount < 0) {
      throw new InvalidLiquidationAmountException(this.props.assetId, this.props.actualAmount, 0);
    }
  }

  /**
   * Approve liquidation
   */
  approve(approvedBy: string, approvalType: string, approvalDocumentRef?: string): void {
    if (!this.props.requiresCourtApproval) {
      throw new LiquidationCannotBeModifiedException(
        this.id.toString(),
        'Liquidation does not require approval',
      );
    }

    if (this.props.status !== LiquidationStatus.PENDING_APPROVAL) {
      throw new LiquidationCannotBeModifiedException(
        this.id.toString(),
        `Cannot approve liquidation in ${this.props.status} status`,
      );
    }

    this.updateState({
      status: LiquidationStatus.APPROVED,
      courtOrderRef: approvalDocumentRef,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new LiquidationApprovedEvent(
        this.props.assetId,
        this.id.toString(),
        approvedBy,
        approvalType,
        new Date(),
        approvalDocumentRef,
        this.props.version,
      ),
    );
  }

  /**
   * Update liquidation status
   */
  updateStatus(newStatus: LiquidationStatus, updatedBy: string, reason?: string): void {
    this.ensureCanBeModified();

    if (!LiquidationStatusHelper.isValidTransition(this.props.status, newStatus)) {
      throw new LiquidationCannotBeModifiedException(
        this.id.toString(),
        `Cannot transition from ${this.props.status} to ${newStatus}`,
      );
    }

    // Special validation for certain transitions
    if (newStatus === LiquidationStatus.SALE_COMPLETED && !this.props.actualAmount) {
      throw new LiquidationCompletionFailedException(
        this.id.toString(),
        'Actual sale amount required to mark as completed',
      );
    }

    const oldStatus = this.props.status;

    this.updateState({
      status: newStatus,
      updatedAt: new Date(),
    });

    // If sale completed, record sale date
    if (newStatus === LiquidationStatus.SALE_COMPLETED && !this.props.saleDate) {
      this.updateState({
        saleDate: new Date(),
      });
    }

    // Add appropriate domain events based on status change
    this.handleStatusChangeEvents(oldStatus, newStatus, updatedBy, reason);
  }

  /**
   * Record sale completion
   */
  recordSaleCompletion(
    actualAmount: number,
    buyerName: string,
    buyerIdNumber?: string,
    completedBy?: string,
  ): void {
    this.ensureCanBeModified();

    if (actualAmount < this.props.reservePrice) {
      throw new LiquidationBelowReservePriceException(
        this.props.assetId,
        actualAmount,
        this.props.reservePrice,
      );
    }

    if (actualAmount <= 0) {
      throw new InvalidLiquidationAmountException(this.props.assetId, actualAmount, 0);
    }

    this.updateState({
      actualAmount,
      buyerName,
      buyerIdNumber,
      saleDate: new Date(),
      updatedAt: new Date(),
    });

    // Calculate net proceeds
    const netProceeds = this.netProceeds || actualAmount;

    // Add domain event
    this.addDomainEvent(
      new LiquidationSaleCompletedEvent(
        this.props.assetId,
        this.id.toString(),
        actualAmount,
        this.props.currency,
        buyerName,
        buyerIdNumber,
        new Date(),
        this.commissionAmount,
        netProceeds,
        completedBy || 'system',
        this.props.version,
      ),
    );

    // Update status to sale completed
    this.updateStatus(LiquidationStatus.SALE_COMPLETED, completedBy || 'system');
  }

  /**
   * Record bid received (for auctions)
   */
  recordBid(bidAmount: number, bidderName: string, recordedBy: string): void {
    if (this.props.liquidationType !== LiquidationType.AUCTION) {
      throw new LiquidationCannotBeModifiedException(
        this.id.toString(),
        'Bids can only be recorded for auctions',
      );
    }

    if (!this.isActiveProcess) {
      throw new LiquidationCannotBeModifiedException(
        this.id.toString(),
        'Cannot record bid on inactive liquidation',
      );
    }

    if (bidAmount <= 0) {
      throw new InvalidLiquidationAmountException(this.props.assetId, bidAmount, 0);
    }

    const isHighestBid = !this.props.actualAmount || bidAmount > this.props.actualAmount;

    // Update highest bid
    if (isHighestBid) {
      this.updateState({
        actualAmount: bidAmount,
        buyerName: bidderName,
        updatedAt: new Date(),
      });
    }

    // Add domain event
    this.addDomainEvent(
      new LiquidationBidReceivedEvent(
        this.props.assetId,
        this.id.toString(),
        bidAmount,
        bidderName,
        new Date(),
        isHighestBid,
        this.props.version,
      ),
    );
  }

  /**
   * Update reserve price
   */
  updateReservePrice(newReservePrice: number, updatedBy: string, reason: string): void {
    this.ensureCanBeModified();

    if (newReservePrice < 0) {
      throw new InvalidLiquidationAmountException(this.props.assetId, newReservePrice, 0);
    }

    const oldReservePrice = this.props.reservePrice;

    this.updateState({
      reservePrice: newReservePrice,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new LiquidationReservePriceUpdatedEvent(
        this.props.assetId,
        this.id.toString(),
        oldReservePrice,
        newReservePrice,
        updatedBy,
        reason,
        this.props.version,
      ),
    );
  }

  /**
   * Mark proceeds as distributed to estate
   */
  markProceedsDistributed(distributedBy: string, notes?: string): void {
    if (this.props.status !== LiquidationStatus.PROCEEDS_RECEIVED) {
      throw new LiquidationCannotBeModifiedException(
        this.id.toString(),
        `Cannot distribute proceeds from ${this.props.status} status`,
      );
    }

    if (!this.props.actualAmount) {
      throw new LiquidationCompletionFailedException(this.id.toString(), 'Actual amount not set');
    }

    this.updateState({
      status: LiquidationStatus.DISTRIBUTED,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new LiquidationProceedsDistributedEvent(
        this.props.assetId,
        this.id.toString(),
        this.props.estateId,
        this.netProceeds || this.props.actualAmount,
        this.props.currency,
        new Date(),
        distributedBy,
        notes,
        this.props.version,
      ),
    );
  }

  /**
   * Cancel liquidation
   */
  cancel(cancelledBy: string, reason: string): void {
    if (LiquidationStatusHelper.isTerminal(this.props.status)) {
      throw new LiquidationCannotBeModifiedException(
        this.id.toString(),
        `Cannot cancel liquidation in ${this.props.status} status`,
      );
    }

    this.updateState({
      status: LiquidationStatus.CANCELLED,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new LiquidationCancelledEvent(
        this.props.assetId,
        this.id.toString(),
        cancelledBy,
        reason,
        new Date(),
        this.props.version,
      ),
    );
  }

  /**
   * Calculate days remaining in process
   */
  getDaysRemaining(): number | undefined {
    if (!this.isActiveProcess) return undefined;

    const timeframe = LiquidationTypeHelper.getTimeframe(this.props.liquidationType);
    const startDate = this.props.createdAt;
    const currentDate = new Date();

    const elapsedDays = Math.floor(
      (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Math.max(0, timeframe - elapsedDays);
  }

  /**
   * Check if liquidation is overdue
   */
  isOverdue(): boolean {
    const daysRemaining = this.getDaysRemaining();
    return daysRemaining !== undefined && daysRemaining <= 0;
  }

  /**
   * Get liquidation summary
   */
  getSummary(): {
    id: string;
    assetId: string;
    type: string;
    status: string;
    targetAmount: number;
    actualAmount?: number;
    netProceeds?: number;
    currency: string;
    requiresApproval: boolean;
    isApproved: boolean;
    isCompleted: boolean;
    daysRemaining?: number;
    isOverdue: boolean;
  } {
    return {
      id: this.id.toString(),
      assetId: this.props.assetId,
      type: this.props.liquidationType,
      status: this.props.status,
      targetAmount: this.props.targetAmount,
      actualAmount: this.props.actualAmount,
      netProceeds: this.netProceeds,
      currency: this.props.currency,
      requiresApproval: this.props.requiresCourtApproval,
      isApproved: this.isApproved,
      isCompleted: this.isCompleted,
      daysRemaining: this.getDaysRemaining(),
      isOverdue: this.isOverdue(),
    };
  }

  /**
   * Handle domain events for status changes
   */
  private handleStatusChangeEvents(
    oldStatus: LiquidationStatus,
    newStatus: LiquidationStatus,
    updatedBy: string,
    reason?: string,
  ): void {
    // Events are already handled in specific methods
    // This is a placeholder for any additional event handling
  }

  /**
   * Ensure liquidation can be modified
   */
  private ensureCanBeModified(): void {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      throw new LiquidationCannotBeModifiedException(
        this.id.toString(),
        'Liquidation is not active',
      );
    }

    if (LiquidationStatusHelper.isTerminal(this.props.status)) {
      throw new LiquidationCannotBeModifiedException(
        this.id.toString(),
        `Liquidation is in terminal status: ${this.props.status}`,
      );
    }

    // Check if approval is required but not obtained
    if (
      this.props.requiresCourtApproval &&
      this.props.status === LiquidationStatus.PENDING_APPROVAL
    ) {
      throw new LiquidationApprovalRequiredException(this.id.toString(), 'court');
    }
  }

  /**
   * Clone liquidation properties for snapshot
   */
  protected cloneProps(): AssetLiquidationProps {
    return { ...this.props };
  }
}
