// src/estate-service/src/domain/entities/debt.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { DebtStatus } from '../enums/debt-status.enum';
import { DebtStatusHelper } from '../enums/debt-status.enum';
import { DebtTier } from '../enums/debt-tier.enum';
import { DebtTierHelper } from '../enums/debt-tier.enum';
import { DebtType } from '../enums/debt-type.enum';
import { DebtTypeHelper } from '../enums/debt-type.enum';
import {
  DebtDisputedEvent,
  DebtPaymentRecordedEvent,
  DebtPriorityChangedEvent,
  DebtSettledEvent,
  DebtTransferredEvent,
  DebtWrittenOffEvent,
} from '../events/debt.event';
import {
  DebtCannotBeModifiedException,
  DebtPaymentExceedsBalanceException,
  DebtSettlementFailedException,
  InvalidDebtAmountException,
  StatuteBarredDebtException,
} from '../exceptions/debt.exception';

/**
 * Debt Entity Properties Interface
 */
export interface DebtProps {
  estateId: string;
  description: string;
  type: DebtType;
  amount: number; // Original debt amount
  outstandingBalance: number; // Current balance
  currency: string;
  tier: number; // S.45 tier (1-5, lower = higher priority)
  priority: string; // HIGHEST, HIGH, MEDIUM, LOW
  isSecured: boolean;
  securedAssetId?: string;
  dueDate?: Date;
  interestRate: number; // Annual interest rate (0-1)
  isStatuteBarred: boolean;
  status: DebtStatus;
  creditorName: string;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Debt Entity
 *
 * Represents a liability of the estate.
 * Critical for S.45 priority calculations and solvency checks.
 *
 * Legal Context:
 * - S.45 LSA: Order of payment (funeral > secured > unsecured)
 * - Limitation Act: Time-barred debts after specific periods
 * - Secured debts require asset liquidation before distribution
 */
export class Debt extends Entity<DebtProps> {
  // Getters
  get estateId(): string {
    return this.props.estateId;
  }
  get description(): string {
    return this.props.description;
  }
  get type(): DebtType {
    return this.props.type;
  }
  get amount(): number {
    return this.props.amount;
  }
  get outstandingBalance(): number {
    return this.props.outstandingBalance;
  }
  get currency(): string {
    return this.props.currency;
  }
  get tier(): number {
    return this.props.tier;
  }
  get priority(): string {
    return this.props.priority;
  }
  get isSecured(): boolean {
    return this.props.isSecured;
  }
  get securedAssetId(): string | undefined {
    return this.props.securedAssetId;
  }
  get dueDate(): Date | undefined {
    return this.props.dueDate;
  }
  get interestRate(): number {
    return this.props.interestRate;
  }
  get isStatuteBarred(): boolean {
    return this.props.isStatuteBarred;
  }
  get status(): DebtStatus {
    return this.props.status;
  }
  get creditorName(): string {
    return this.props.creditorName;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }

  /**
   * Get debt tier enum
   */
  get debtTier(): DebtTier {
    const tierNumber = this.props.tier;
    const tierMap: Record<number, DebtTier> = {
      1: DebtTier.FUNERAL_EXPENSES,
      2: DebtTier.TESTAMENTARY_EXPENSES,
      3: DebtTier.SECURED_DEBTS,
      4: DebtTier.TAXES_RATES_WAGES,
      5: DebtTier.UNSECURED_GENERAL,
    };
    return tierMap[tierNumber] || DebtTier.UNSECURED_GENERAL;
  }

  /**
   * Check if debt is overdue
   */
  get isOverdue(): boolean {
    if (!this.props.dueDate || this.props.status !== DebtStatus.OUTSTANDING) {
      return false;
    }
    return new Date() > this.props.dueDate;
  }

  /**
   * Get days overdue
   */
  get daysOverdue(): number {
    if (!this.isOverdue || !this.props.dueDate) return 0;

    const now = new Date();
    const overdueMs = now.getTime() - this.props.dueDate.getTime();
    return Math.floor(overdueMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Get total paid amount
   */
  get totalPaid(): number {
    return this.props.amount - this.props.outstandingBalance;
  }

  /**
   * Get percentage paid
   */
  get percentagePaid(): number {
    if (this.props.amount === 0) return 100;
    return (this.totalPaid / this.props.amount) * 100;
  }

  /**
   * Get accrued interest
   */
  get accruedInterest(): number {
    if (this.props.interestRate <= 0 || this.props.outstandingBalance <= 0) {
      return 0;
    }

    // Simple interest calculation
    const now = new Date();
    const creationDate = this.props.createdAt;
    const daysElapsed = Math.floor(
      (now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const yearsElapsed = daysElapsed / 365.25;

    return this.props.outstandingBalance * this.props.interestRate * yearsElapsed;
  }

  /**
   * Get total liability (balance + interest)
   */
  get totalLiability(): number {
    return this.props.outstandingBalance + this.accruedInterest;
  }

  /**
   * Private constructor - use factory methods
   */
  private constructor(id: UniqueEntityID, props: DebtProps) {
    super(id, props, props.createdAt);
    this.validateDebt();
  }

  /**
   * Validate debt invariants
   */
  private validateDebt(): void {
    // Amount validation
    if (this.props.amount <= 0) {
      throw new InvalidDebtAmountException(this.id.toString(), this.props.amount);
    }

    // Outstanding balance validation
    if (this.props.outstandingBalance < 0 || this.props.outstandingBalance > this.props.amount) {
      throw new InvalidDebtAmountException(this.id.toString(), this.props.outstandingBalance);
    }

    // Interest rate validation
    if (this.props.interestRate < 0 || this.props.interestRate > 1) {
      throw new DebtCannotBeModifiedException(
        this.id.toString(),
        `Invalid interest rate: ${this.props.interestRate}. Must be between 0 and 1.`,
      );
    }

    // Secured debt validation
    if (this.props.isSecured && !this.props.securedAssetId) {
      throw new DebtCannotBeModifiedException(
        this.id.toString(),
        'Secured debt must have a secured asset ID',
      );
    }

    // Status consistency
    if (this.props.outstandingBalance === 0 && this.props.status !== DebtStatus.SETTLED) {
      throw new DebtCannotBeModifiedException(
        this.id.toString(),
        'Debt with zero balance should be marked as SETTLED',
      );
    }
  }

  /**
   * Record a payment against the debt
   */
  recordPayment(
    paymentAmount: number,
    paymentMethod: string,
    referenceNumber?: string,
    paidBy?: string,
  ): void {
    this.ensureCanBeModified();

    if (paymentAmount <= 0) {
      throw new InvalidDebtAmountException(this.id.toString(), paymentAmount);
    }

    if (paymentAmount > this.props.outstandingBalance) {
      throw new DebtPaymentExceedsBalanceException(
        this.id.toString(),
        paymentAmount,
        this.props.outstandingBalance,
      );
    }

    const oldBalance = this.props.outstandingBalance;
    const newBalance = oldBalance - paymentAmount;

    this.updateState({
      outstandingBalance: newBalance,
      status: newBalance === 0 ? DebtStatus.SETTLED : DebtStatus.PARTIALLY_PAID,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new DebtPaymentRecordedEvent(
        this.id.toString(),
        this.props.estateId,
        paymentAmount,
        this.props.currency,
        oldBalance,
        newBalance,
        new Date(),
        paymentMethod,
        referenceNumber,
        paidBy || 'system',
        this.props.version,
      ),
    );

    // If fully paid, add settlement event
    if (newBalance === 0) {
      this.addDomainEvent(
        new DebtSettledEvent(
          this.id.toString(),
          this.props.estateId,
          this.props.amount,
          this.totalPaid,
          this.props.currency,
          new Date(),
          paidBy || 'system',
          `Debt fully settled through payment`,
          this.props.version,
        ),
      );
    }
  }

  /**
   * Mark debt as statute barred
   */
  markAsStatuteBarred(markedBy: string, reason?: string): void {
    this.ensureCanBeModified();

    if (this.props.isStatuteBarred) {
      throw new DebtCannotBeModifiedException(this.id.toString(), 'Debt is already statute barred');
    }

    // Check if actually statute barred
    const limitationPeriod = DebtTypeHelper.getLimitationPeriod(this.props.type);
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - limitationPeriod);

    if (this.props.createdAt > cutoffDate) {
      throw new StatuteBarredDebtException(this.id.toString(), limitationPeriod);
    }

    this.updateState({
      isStatuteBarred: true,
      status: DebtStatus.STATUTE_BARRED,
      updatedAt: new Date(),
    });

    // Update priority (statute barred debts have lowest priority)
    const oldPriority = this.props.priority;
    this.updateState({
      priority: 'LOWEST',
      tier: 6, // Below all other tiers
    });

    // Add domain event
    this.addDomainEvent(
      new DebtPriorityChangedEvent(
        this.id.toString(),
        this.props.estateId,
        oldPriority,
        'LOWEST',
        this.debtTier.toString(),
        'STATUTE_BARRED',
        markedBy,
        reason || 'Debt became statute barred under Limitation Act',
        this.props.version,
      ),
    );
  }

  /**
   * Write off debt (uncollectible)
   */
  writeOff(
    writeOffAmount: number,
    writeOffReason: string,
    writtenOffBy: string,
    notes?: string,
  ): void {
    this.ensureCanBeModified();

    if (writeOffAmount <= 0 || writeOffAmount > this.props.outstandingBalance) {
      throw new InvalidDebtAmountException(this.id.toString(), writeOffAmount);
    }

    const oldBalance = this.props.outstandingBalance;
    const newBalance = oldBalance - writeOffAmount;

    this.updateState({
      outstandingBalance: newBalance,
      status: newBalance === 0 ? DebtStatus.WRITTEN_OFF : DebtStatus.PARTIALLY_PAID,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new DebtWrittenOffEvent(
        this.id.toString(),
        this.props.estateId,
        writeOffAmount,
        this.props.currency,
        writeOffReason,
        writtenOffBy,
        new Date(),
        notes,
        this.props.version,
      ),
    );
  }

  /**
   * Dispute debt
   */
  dispute(disputedBy: string, disputeReason: string, evidence?: string[]): void {
    this.ensureCanBeModified();

    if (this.props.status === DebtStatus.DISPUTED) {
      throw new DebtCannotBeModifiedException(this.id.toString(), 'Debt is already disputed');
    }

    const oldStatus = this.props.status;

    this.updateState({
      status: DebtStatus.DISPUTED,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new DebtDisputedEvent(
        this.id.toString(),
        this.props.estateId,
        disputedBy,
        disputeReason,
        new Date(),
        evidence,
        this.props.version,
      ),
    );
  }

  /**
   * Transfer debt to new creditor
   */
  transfer(newCreditorName: string, transferredBy: string, transferDocumentRef?: string): void {
    this.ensureCanBeModified();

    const oldCreditor = this.props.creditorName;

    this.updateState({
      creditorName: newCreditorName,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new DebtTransferredEvent(
        this.id.toString(),
        this.props.estateId,
        oldCreditor,
        newCreditorName,
        new Date(),
        transferredBy,
        transferDocumentRef,
        this.props.version,
      ),
    );
  }

  /**
   * Update debt status
   */
  updateStatus(newStatus: DebtStatus, updatedBy: string, reason?: string): void {
    this.ensureCanBeModified();

    if (!DebtStatusHelper.isValidTransition(this.props.status, newStatus)) {
      throw new DebtCannotBeModifiedException(
        this.id.toString(),
        `Cannot transition from ${this.props.status} to ${newStatus}`,
      );
    }

    const oldStatus = this.props.status;

    this.updateState({
      status: newStatus,
      updatedAt: new Date(),
    });

    // If marking as settled with outstanding balance, throw error
    if (newStatus === DebtStatus.SETTLED && this.props.outstandingBalance > 0) {
      throw new DebtSettlementFailedException(
        this.id.toString(),
        'Cannot mark as settled with outstanding balance',
      );
    }

    // Add settlement event if fully settled
    if (newStatus === DebtStatus.SETTLED && this.props.outstandingBalance === 0) {
      this.addDomainEvent(
        new DebtSettledEvent(
          this.id.toString(),
          this.props.estateId,
          this.props.amount,
          this.totalPaid,
          this.props.currency,
          new Date(),
          updatedBy,
          reason,
          this.props.version,
        ),
      );
    }
  }

  /**
   * Check if debt is included in S.45 calculations
   */
  isIncludedInS45(): boolean {
    return DebtStatusHelper.isIncludedInS45(this.props.status);
  }

  /**
   * Check if debt is collectible
   */
  isCollectible(): boolean {
    return DebtStatusHelper.isCollectible(this.props.status);
  }

  /**
   * Compare priority with another debt
   */
  comparePriority(other: Debt): number {
    return DebtTierHelper.compareTiers(this.debtTier, other.debtTier);
  }

  /**
   * Check if this debt has higher priority than another
   */
  hasHigherPriorityThan(other: Debt): boolean {
    return this.comparePriority(other) < 0;
  }

  /**
   * Get debt summary
   */
  getSummary(): {
    id: string;
    estateId: string;
    description: string;
    type: string;
    amount: number;
    outstandingBalance: number;
    currency: string;
    tier: string;
    priority: string;
    status: string;
    creditorName: string;
    isSecured: boolean;
    isStatuteBarred: boolean;
    isOverdue: boolean;
    daysOverdue: number;
    percentagePaid: number;
  } {
    return {
      id: this.id.toString(),
      estateId: this.props.estateId,
      description: this.props.description,
      type: this.props.type,
      amount: this.props.amount,
      outstandingBalance: this.props.outstandingBalance,
      currency: this.props.currency,
      tier: this.debtTier,
      priority: this.props.priority,
      status: this.props.status,
      creditorName: this.props.creditorName,
      isSecured: this.props.isSecured,
      isStatuteBarred: this.props.isStatuteBarred,
      isOverdue: this.isOverdue,
      daysOverdue: this.daysOverdue,
      percentagePaid: this.percentagePaid,
    };
  }

  /**
   * Ensure debt can be modified
   */
  private ensureCanBeModified(): void {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      throw new DebtCannotBeModifiedException(this.id.toString(), 'Debt is not active');
    }

    if (this.props.isStatuteBarred) {
      throw new StatuteBarredDebtException(
        this.id.toString(),
        DebtTypeHelper.getLimitationPeriod(this.props.type),
      );
    }

    if (DebtStatusHelper.isResolved(this.props.status)) {
      throw new DebtCannotBeModifiedException(
        this.id.toString(),
        `Debt is in resolved status: ${this.props.status}`,
      );
    }
  }

  /**
   * Clone debt properties for snapshot
   */
  protected cloneProps(): DebtProps {
    return { ...this.props };
  }
}
