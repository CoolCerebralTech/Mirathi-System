// domain/entities/debt.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { DebtPriority, DebtTier, Money } from '../value-objects';

/**
 * Debt Entity
 *
 * Represents a liability against the Estate
 *
 * CRITICAL LEGAL REFERENCE: Section 45, Law of Succession Act (Cap 160)
 *
 * S.45 Order of Priority:
 * (a) Funeral, testamentary and administration expenses
 * (b) Debts secured by mortgage, charge or lien
 * (c) Taxes, rates, wages, salaries
 * (d) All other debts (unsecured general)
 *
 * Business Rules:
 * - Debts MUST be paid before distribution
 * - Higher priority debts must be satisfied first
 * - Secured debts can force asset liquidation
 * - Statute-barred debts cannot be enforced (Limitation Act)
 * - Distribution blocked if S.45(a)-(c) debts unpaid
 */

export enum DebtType {
  MORTGAGE = 'MORTGAGE',
  PERSONAL_LOAN = 'PERSONAL_LOAN',
  CREDIT_CARD = 'CREDIT_CARD',
  BUSINESS_DEBT = 'BUSINESS_DEBT',
  TAX_OBLIGATION = 'TAX_OBLIGATION',
  FUNERAL_EXPENSE = 'FUNERAL_EXPENSE',
  MEDICAL_BILL = 'MEDICAL_BILL',
  LEGAL_FEES = 'LEGAL_FEES',
  COURT_FEES = 'COURT_FEES',
  EXECUTOR_FEES = 'EXECUTOR_FEES',
  OTHER = 'OTHER',
}

export enum DebtStatus {
  OUTSTANDING = 'OUTSTANDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  SETTLED = 'SETTLED',
  WRITTEN_OFF = 'WRITTEN_OFF',
  DISPUTED = 'DISPUTED',
  STATUTE_BARRED = 'STATUTE_BARRED',
}

export interface DebtProps {
  estateId: UniqueEntityID;

  // Details
  description: string;
  type: DebtType;
  creditorName: string;
  creditorContact?: string;

  // Financial
  originalAmount: Money;
  outstandingBalance: Money;
  interestRate?: number;

  // Priority (S.45 LSA)
  priority: DebtPriority;
  tier: DebtTier;

  // Security
  isSecured: boolean;
  securedAssetId?: UniqueEntityID;
  securityDetails?: string;

  // Status
  status: DebtStatus;
  dueDate?: Date;
  isStatuteBarred: boolean;

  // Metadata
  contractReference?: string;
  metadata?: Record<string, any>;
}

export class Debt extends Entity<DebtProps> {
  private _paymentHistory: DebtPayment[] = [];

  private constructor(id: UniqueEntityID, props: DebtProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.validate();
  }

  /**
   * Factory: Create new debt
   */
  public static create(
    props: Omit<DebtProps, 'priority' | 'tier' | 'status' | 'isStatuteBarred'>,
    id?: UniqueEntityID,
  ): Debt {
    // Auto-determine priority from debt type
    const { tier, priority } = Debt.determineDebtPriority(props.type, props.isSecured);

    const debt = new Debt(id ?? new UniqueEntityID(), {
      ...props,
      tier,
      priority,
      status: DebtStatus.OUTSTANDING,
      isStatuteBarred: false,
    });

    return debt;
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(id: UniqueEntityID, props: DebtProps, createdAt: Date): Debt {
    return new Debt(id, props, createdAt);
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get estateId(): UniqueEntityID {
    return this.props.estateId;
  }

  get description(): string {
    return this.props.description;
  }

  get type(): DebtType {
    return this.props.type;
  }

  get creditorName(): string {
    return this.props.creditorName;
  }

  get originalAmount(): Money {
    return this.props.originalAmount;
  }

  get outstandingBalance(): Money {
    return this.props.outstandingBalance;
  }

  get priority(): DebtPriority {
    return this.props.priority;
  }

  get tier(): DebtTier {
    return this.props.tier;
  }

  get isSecured(): boolean {
    return this.props.isSecured;
  }

  get securedAssetId(): UniqueEntityID | undefined {
    return this.props.securedAssetId;
  }

  get status(): DebtStatus {
    return this.props.status;
  }

  get dueDate(): Date | undefined {
    return this.props.dueDate;
  }

  get isStatuteBarred(): boolean {
    return this.props.isStatuteBarred;
  }

  get paymentHistory(): ReadonlyArray<DebtPayment> {
    return Object.freeze([...this._paymentHistory]);
  }

  // =========================================================================
  // BUSINESS LOGIC - PRIORITY (S.45 LSA)
  // =========================================================================

  /**
   * Determine debt priority based on type and security
   * Implements S.45 Law of Succession Act logic
   */
  private static determineDebtPriority(
    debtType: DebtType,
    isSecured: boolean,
  ): { tier: DebtTier; priority: DebtPriority } {
    // S.45(a) - Funeral expenses (highest priority)
    if (debtType === DebtType.FUNERAL_EXPENSE) {
      return {
        tier: DebtTier.FUNERAL_EXPENSES,
        priority: DebtPriority.funeralExpenses(),
      };
    }

    // S.45(a) - Testamentary expenses
    if (
      debtType === DebtType.LEGAL_FEES ||
      debtType === DebtType.COURT_FEES ||
      debtType === DebtType.EXECUTOR_FEES
    ) {
      return {
        tier: DebtTier.TESTAMENTARY_EXPENSES,
        priority: DebtPriority.testamentaryExpenses(),
      };
    }

    // S.45(b) - Secured debts
    if (isSecured) {
      return {
        tier: DebtTier.SECURED_DEBTS,
        priority: DebtPriority.securedDebts(),
      };
    }

    // S.45(c) - Taxes, rates, wages
    if (debtType === DebtType.TAX_OBLIGATION) {
      return {
        tier: DebtTier.TAXES_RATES_WAGES,
        priority: DebtPriority.taxesRatesWages(),
      };
    }

    // S.45(d) - Unsecured general debts
    return {
      tier: DebtTier.UNSECURED_GENERAL,
      priority: DebtPriority.unsecuredGeneral(),
    };
  }

  /**
   * Check if debt blocks estate distribution
   */
  public blocksDistribution(): boolean {
    return (
      this.priority.isCritical() && this.status === DebtStatus.OUTSTANDING && !this.isStatuteBarred
    );
  }

  /**
   * Check if debt can force asset liquidation
   */
  public canForceLiquidation(): boolean {
    return this.isSecured && this.status === DebtStatus.OUTSTANDING;
  }

  /**
   * Check if debt must be paid before distribution
   */
  public mustBeSettledFirst(): boolean {
    return this.priority.isCritical() && !this.isStatuteBarred;
  }

  // =========================================================================
  // BUSINESS LOGIC - PAYMENT
  // =========================================================================

  /**
   * Record a payment against this debt
   */
  public recordPayment(amount: Money, paymentDate: Date, paymentMethod?: string): void {
    this.ensureNotDeleted();

    if (this.status === DebtStatus.SETTLED) {
      throw new Error('Cannot record payment on settled debt');
    }

    if (this.status === DebtStatus.STATUTE_BARRED) {
      throw new Error('Cannot record payment on statute-barred debt');
    }

    if (amount.isNegative() || amount.isZero()) {
      throw new Error('Payment amount must be positive');
    }

    if (amount.greaterThan(this.outstandingBalance)) {
      throw new Error('Payment amount cannot exceed outstanding balance');
    }

    // Update outstanding balance
    const newBalance = this.outstandingBalance.subtract(amount);
    (this.props as any).outstandingBalance = newBalance;

    // Record payment in history
    this._paymentHistory.push({
      amount,
      paymentDate,
      paymentMethod,
      balanceAfter: newBalance,
      recordedAt: new Date(),
    });

    // Update status
    if (newBalance.isZero()) {
      (this.props as any).status = DebtStatus.SETTLED;
    } else {
      (this.props as any).status = DebtStatus.PARTIALLY_PAID;
    }

    this.incrementVersion();
  }

  /**
   * Settle debt in full
   */
  public settle(paymentDate: Date, paymentMethod?: string): void {
    this.recordPayment(this.outstandingBalance, paymentDate, paymentMethod);
  }

  /**
   * Check if debt is fully settled
   */
  public isSettled(): boolean {
    return this.status === DebtStatus.SETTLED || this.outstandingBalance.isZero();
  }

  /**
   * Get total amount paid
   */
  public getTotalPaid(): Money {
    const paid = this.originalAmount.subtract(this.outstandingBalance);
    return paid.isNegative() ? Money.zero() : paid;
  }

  /**
   * Get payment progress percentage
   */
  public getPaymentProgress(): number {
    if (this.originalAmount.isZero()) {
      return 0;
    }

    const paid = this.getTotalPaid();
    const progress = (paid.getAmount() / this.originalAmount.getAmount()) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  // =========================================================================
  // BUSINESS LOGIC - STATUS MANAGEMENT
  // =========================================================================

  /**
   * Mark debt as disputed
   */
  public markAsDisputed(reason: string): void {
    this.ensureNotDeleted();

    if (this.status === DebtStatus.SETTLED) {
      throw new Error('Cannot dispute settled debt');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Dispute reason is required');
    }

    (this.props as any).status = DebtStatus.DISPUTED;
    (this.props as any).metadata = {
      ...this.props.metadata,
      disputeReason: reason,
      disputedAt: new Date(),
    };
    this.incrementVersion();
  }

  /**
   * Resolve dispute
   */
  public resolveDispute(newOutstandingAmount: Money): void {
    this.ensureNotDeleted();

    if (this.status !== DebtStatus.DISPUTED) {
      throw new Error('Debt is not in disputed status');
    }

    if (newOutstandingAmount.isNegative()) {
      throw new Error('Outstanding amount cannot be negative');
    }

    (this.props as any).outstandingBalance = newOutstandingAmount;
    (this.props as any).status = newOutstandingAmount.isZero()
      ? DebtStatus.SETTLED
      : DebtStatus.OUTSTANDING;

    (this.props as any).metadata = {
      ...this.props.metadata,
      disputeResolvedAt: new Date(),
      originalBalanceBeforeResolution: this.outstandingBalance,
    };

    this.incrementVersion();
  }

  /**
   * Mark as statute-barred (Limitation Act)
   * Debts over 6 years old (typically) cannot be enforced
   */
  public markAsStatuteBarred(reason: string): void {
    this.ensureNotDeleted();

    if (this.isStatuteBarred) {
      throw new Error('Debt is already statute-barred');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Statute-barred reason is required');
    }

    (this.props as any).isStatuteBarred = true;
    (this.props as any).status = DebtStatus.STATUTE_BARRED;
    (this.props as any).metadata = {
      ...this.props.metadata,
      statuteBarredReason: reason,
      statuteBarredAt: new Date(),
    };
    this.incrementVersion();
  }

  /**
   * Write off debt (executor decision)
   */
  public writeOff(reason: string): void {
    this.ensureNotDeleted();

    if (this.status === DebtStatus.SETTLED) {
      throw new Error('Cannot write off settled debt');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Write-off reason is required');
    }

    (this.props as any).status = DebtStatus.WRITTEN_OFF;
    (this.props as any).metadata = {
      ...this.props.metadata,
      writeOffReason: reason,
      writtenOffAt: new Date(),
      balanceWrittenOff: this.outstandingBalance,
    };
    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - SECURITY
  // =========================================================================

  /**
   * Attach security to debt
   */
  public attachSecurity(assetId: UniqueEntityID, securityDetails: string): void {
    this.ensureNotDeleted();

    if (this.isSecured) {
      throw new Error('Debt is already secured');
    }

    if (!securityDetails || securityDetails.trim().length === 0) {
      throw new Error('Security details are required');
    }

    (this.props as any).isSecured = true;
    (this.props as any).securedAssetId = assetId;
    (this.props as any).securityDetails = securityDetails;

    // Re-evaluate priority (secured debts have higher priority)
    const { tier, priority } = Debt.determineDebtPriority(this.type, true);
    (this.props as any).tier = tier;
    (this.props as any).priority = priority;

    this.incrementVersion();
  }

  /**
   * Release security
   */
  public releaseSecurity(): void {
    this.ensureNotDeleted();

    if (!this.isSecured) {
      throw new Error('Debt is not secured');
    }

    (this.props as any).isSecured = false;
    (this.props as any).securedAssetId = undefined;
    (this.props as any).securityDetails = undefined;

    // Re-evaluate priority (unsecured has lower priority)
    const { tier, priority } = Debt.determineDebtPriority(this.type, false);
    (this.props as any).tier = tier;
    (this.props as any).priority = priority;

    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - INTEREST
  // =========================================================================

  /**
   * Calculate accrued interest
   */
  public calculateAccruedInterest(asOfDate: Date): Money {
    if (!this.props.interestRate || this.props.interestRate === 0) {
      return Money.zero();
    }

    if (!this.dueDate) {
      return Money.zero();
    }

    // Calculate days overdue
    const daysOverdue = Math.max(
      0,
      Math.floor((asOfDate.getTime() - this.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    if (daysOverdue === 0) {
      return Money.zero();
    }

    // Simple interest: Principal × Rate × Time
    const annualInterest = this.outstandingBalance.multiply(this.props.interestRate / 100);
    const dailyInterest = annualInterest.divide(365);
    const accruedInterest = dailyInterest.multiply(daysOverdue);

    return accruedInterest;
  }

  /**
   * Get total amount due (balance + interest)
   */
  public getTotalAmountDue(asOfDate: Date = new Date()): Money {
    const interest = this.calculateAccruedInterest(asOfDate);
    return this.outstandingBalance.add(interest);
  }

  // =========================================================================
  // BUSINESS LOGIC - OVERDUE
  // =========================================================================

  /**
   * Check if debt is overdue
   */
  public isOverdue(asOfDate: Date = new Date()): boolean {
    if (!this.dueDate) {
      return false;
    }

    return (
      asOfDate > this.dueDate && this.status === DebtStatus.OUTSTANDING && !this.isStatuteBarred
    );
  }

  /**
   * Get days overdue
   */
  public getDaysOverdue(asOfDate: Date = new Date()): number {
    if (!this.isOverdue(asOfDate) || !this.dueDate) {
      return 0;
    }

    return Math.floor((asOfDate.getTime() - this.dueDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // =========================================================================
  // VALIDATION
  // =========================================================================

  private validate(): void {
    if (!this.props.estateId) {
      throw new Error('Estate ID is required');
    }

    if (!this.props.description || this.props.description.trim().length === 0) {
      throw new Error('Debt description is required');
    }

    if (!this.props.type) {
      throw new Error('Debt type is required');
    }

    if (!this.props.creditorName || this.props.creditorName.trim().length === 0) {
      throw new Error('Creditor name is required');
    }

    if (!this.props.originalAmount) {
      throw new Error('Original amount is required');
    }

    if (this.props.originalAmount.isNegative()) {
      throw new Error('Original amount cannot be negative');
    }

    if (!this.props.outstandingBalance) {
      throw new Error('Outstanding balance is required');
    }

    if (this.props.outstandingBalance.isNegative()) {
      throw new Error('Outstanding balance cannot be negative');
    }

    if (this.props.outstandingBalance.greaterThan(this.props.originalAmount)) {
      throw new Error('Outstanding balance cannot exceed original amount (without interest)');
    }

    if (!this.props.priority) {
      throw new Error('Debt priority is required');
    }

    if (!this.props.tier) {
      throw new Error('Debt tier is required');
    }

    if (this.props.isSecured && !this.props.securedAssetId) {
      throw new Error('Secured debts must specify the secured asset');
    }

    if (this.props.interestRate && (this.props.interestRate < 0 || this.props.interestRate > 100)) {
      throw new Error('Interest rate must be between 0 and 100');
    }
  }

  /**
   * Clone debt (for scenarios)
   */
  public clone(): Debt {
    const clonedProps = { ...this.props };
    const cloned = new Debt(new UniqueEntityID(), clonedProps);
    cloned._paymentHistory = [...this._paymentHistory];
    return cloned;
  }
}

/**
 * Debt Payment History Record
 */
export interface DebtPayment {
  amount: Money;
  paymentDate: Date;
  paymentMethod?: string;
  balanceAfter: Money;
  recordedAt: Date;
}
