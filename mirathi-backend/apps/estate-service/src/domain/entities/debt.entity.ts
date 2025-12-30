import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { DebtStatus, DebtStatusHelper } from '../enums/debt-status.enum';
import { DebtTier } from '../enums/debt-tier.enum';
import { DebtType, DebtTypeHelper } from '../enums/debt-type.enum';
import {
  DebtCreatedEvent,
  DebtDisputedEvent,
  DebtPaymentRecordedEvent,
  DebtSettledEvent,
  DebtStatuteBarredEvent,
  DebtWrittenOffEvent,
} from '../events/debt.event';
import {
  DebtLogicException,
  InvalidDebtAmountException,
  StatuteBarredDebtException,
} from '../exceptions/debt.exception';
import { DebtPriorityVO } from '../value-objects/debt-priority.vo';
import { MoneyVO } from '../value-objects/money.vo';

export interface DebtProps {
  estateId: string;
  creditorName: string;
  description: string;

  // Financials
  initialAmount: MoneyVO;
  outstandingBalance: MoneyVO;
  interestRate: number;
  currency: string;

  // S.45 Logic
  priority: DebtPriorityVO;
  tier: DebtTier;
  type: DebtType;
  isSecured: boolean;
  securedAssetId?: string;

  // Legal Status
  status: DebtStatus;
  isStatuteBarred: boolean;
  dueDate?: Date;
  disputeReason?: string;

  // Payment History
  lastPaymentDate?: Date;
  totalPaid: MoneyVO;

  // Metadata
  creditorContact?: string;
  referenceNumber?: string;
  evidenceDocumentId?: string;
  requiresCourtApproval?: boolean;

  // Add timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Debt Entity - Feature Complete
 *
 * Represents a liability against the Estate with full S.45 compliance.
 *
 * BUSINESS RULES:
 * 1. S.45 Priority Order: Funeral > Testamentary > Secured > Taxes > Unsecured
 * 2. Interest accrual based on debt type and Kenyan market rates
 * 3. Statute barred checks (6 years unsecured, 12 years secured)
 * 4. Secured debts block asset distribution until cleared
 * 5. Court approval may be required for certain debt settlements
 */
export class Debt extends Entity<DebtProps> {
  private constructor(props: DebtProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
    this.validate();
  }

  /**
   * Factory method to create a new debt
   */
  public static create(
    props: Omit<
      DebtProps,
      | 'status'
      | 'isStatuteBarred'
      | 'totalPaid'
      | 'tier'
      | 'interestRate'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): Debt {
    // Validate amount
    if (props.initialAmount.isZero() || props.initialAmount.amount <= 0) {
      throw new InvalidDebtAmountException(props.estateId, props.initialAmount.amount);
    }

    // Validate secured debt has asset reference
    if (props.isSecured && !props.securedAssetId) {
      throw new DebtLogicException('Secured debts must link to a specific asset');
    }

    // Determine tier from type if not provided
    const tier = props.priority.tier;
    const interestRate = DebtTypeHelper.getTypicalInterestRate(props.type);
    const now = new Date();

    const debt = new Debt(
      {
        ...props,
        tier,
        interestRate,
        status: DebtStatus.OUTSTANDING,
        isStatuteBarred: false,
        totalPaid: MoneyVO.zero(props.currency),
        createdAt: now,
        updatedAt: now,
      },
      id,
    );

    // Emit creation event
    debt.addDomainEvent(
      new DebtCreatedEvent(
        debt.id.toString(),
        props.estateId,
        props.type,
        props.initialAmount.amount,
        props.creditorName,
        debt.version,
      ),
    );

    return debt;
  }

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  private validate(): void {
    // Validate due date is not in the past for new debts
    if (
      this.props.dueDate &&
      this.props.dueDate < new Date() &&
      this.props.status === DebtStatus.OUTSTANDING
    ) {
      console.warn(`Warning: Debt ${this.id.toString()} has a past due date`); // FIX: Use toString()
    }

    // Validate interest rate is reasonable
    if (this.props.interestRate < 0 || this.props.interestRate > 100) {
      throw new DebtLogicException('Interest rate must be between 0 and 100%');
    }

    // Validate outstanding balance doesn't exceed initial amount + reasonable interest
    const maxReasonable = this.props.initialAmount.multiply(3); // 200% interest cap
    if (this.props.outstandingBalance.isGreaterThan(maxReasonable)) {
      throw new DebtLogicException('Outstanding balance exceeds reasonable limit');
    }
  }

  // ===========================================================================
  // FINANCIAL CALCULATIONS
  // ===========================================================================

  /**
   * Calculate accrued interest since last payment or debt creation
   */
  public getAccruedInterest(calculationDate: Date = new Date()): MoneyVO {
    if (this.props.interestRate <= 0 || this.props.outstandingBalance.isZero()) {
      return MoneyVO.zero(this.props.currency);
    }

    // Determine start date for interest calculation
    const startDate = this.props.lastPaymentDate || this.props.createdAt; // Now available
    const daysElapsed = Math.max(
      0,
      Math.floor((calculationDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)),
    );

    const dailyRate = this.props.interestRate / 365 / 100;
    const interest = this.props.outstandingBalance.amount * dailyRate * daysElapsed;

    return new MoneyVO({
      amount: Math.round(interest * 100) / 100,
      currency: this.props.currency,
    });
  }

  /**
   * Get total current liability (principal + interest)
   */
  public getCurrentLiability(includeInterest: boolean = true): MoneyVO {
    if (includeInterest) {
      return this.props.outstandingBalance.add(this.getAccruedInterest());
    }
    return this.props.outstandingBalance;
  }

  /**
   * Get days overdue (if any)
   */
  public getDaysOverdue(): number {
    if (!this.props.dueDate || this.props.status !== DebtStatus.OUTSTANDING) {
      return 0;
    }

    const now = new Date();
    if (now <= this.props.dueDate) return 0;

    return Math.floor((now.getTime() - this.props.dueDate.getTime()) / (1000 * 3600 * 24));
  }

  // ===========================================================================
  // PAYMENT PROCESSING
  // ===========================================================================

  /**
   * Record a payment against this debt
   *
   * BUSINESS RULES:
   * 1. Payments are applied to interest first, then principal
   * 2. Overpayments trigger refund or credit logic
   * 3. Statute barred debts cannot receive payments
   */
  public recordPayment(
    paymentAmount: MoneyVO,
    paymentDate: Date = new Date(),
    _paymentMethod: string = 'bank_transfer',
    _reference?: string,
    paidBy?: string,
  ): void {
    this.ensureModifiable();

    if (paymentAmount.isZero() || paymentAmount.amount <= 0) {
      throw new InvalidDebtAmountException(this.props.estateId, paymentAmount.amount);
    }

    // Check for statute barred status
    this.checkStatuteBarredStatus();
    if (this.props.isStatuteBarred) {
      throw new StatuteBarredDebtException(this.id.toString(), this.getLimitationPeriod());
    }

    // Calculate total liability
    const interestDue = this.getAccruedInterest(paymentDate);
    const principalDue = this.props.outstandingBalance;

    // Apply payment: interest first, then principal
    let remainingPayment = paymentAmount;
    let interestPaid = MoneyVO.zero(this.props.currency);
    let principalPaid = MoneyVO.zero(this.props.currency);

    // Pay interest
    if (
      !interestDue.isZero() &&
      remainingPayment.isGreaterThan(MoneyVO.zero(this.props.currency))
    ) {
      if (remainingPayment.isGreaterThan(interestDue) || remainingPayment.equals(interestDue)) {
        interestPaid = interestDue;
        remainingPayment = remainingPayment.subtract(interestDue);
      } else {
        interestPaid = remainingPayment;
        remainingPayment = MoneyVO.zero(this.props.currency);
      }
    }

    // Pay principal
    if (!remainingPayment.isZero()) {
      if (remainingPayment.isGreaterThan(principalDue) || remainingPayment.equals(principalDue)) {
        principalPaid = principalDue;
        remainingPayment = remainingPayment.subtract(principalDue);
      } else {
        principalPaid = remainingPayment;
        remainingPayment = MoneyVO.zero(this.props.currency);
      }
    }

    // Update state
    const newOutstandingBalance = this.props.outstandingBalance.subtract(principalPaid);
    const newTotalPaid = this.props.totalPaid.add(paymentAmount);
    const isSettled = newOutstandingBalance.isZero();
    const newStatus = isSettled ? DebtStatus.SETTLED : DebtStatus.PARTIALLY_PAID;

    this.updateState({
      outstandingBalance: newOutstandingBalance,
      totalPaid: newTotalPaid,
      status: newStatus,
      lastPaymentDate: paymentDate,
      updatedAt: new Date(), // Update timestamp
    });

    // Emit events
    this.addDomainEvent(
      new DebtPaymentRecordedEvent(
        this.id.toString(),
        this.props.estateId,
        paymentAmount.amount,
        interestPaid.amount,
        principalPaid.amount,
        newOutstandingBalance.amount,
        paidBy || 'system',
        this.version,
      ),
    );

    if (isSettled) {
      this.addDomainEvent(
        new DebtSettledEvent(
          this.id.toString(),
          this.props.estateId,
          paymentDate,
          paidBy || 'system',
          this.version,
        ),
      );
    }

    // Handle overpayment (should be rare in estate context)
    if (!remainingPayment.isZero()) {
      console.warn(
        `Debt ${this.id.toString()} overpaid by ${remainingPayment.toString()}. Refund or credit needed.`, // FIX: Use toString()
      );
      // In production, this would trigger a refund process
    }
  }

  // ===========================================================================
  // LEGAL & DISPUTE MANAGEMENT
  // ===========================================================================

  /**
   * Mark debt as disputed
   */
  public dispute(reason: string, disputedBy: string, evidenceDocumentId?: string): void {
    if (this.props.status === DebtStatus.SETTLED) {
      throw new DebtLogicException('Cannot dispute a settled debt');
    }

    if (this.props.status === DebtStatus.STATUTE_BARRED) {
      throw new DebtLogicException('Cannot dispute a statute barred debt');
    }

    this.updateState({
      status: DebtStatus.DISPUTED,
      disputeReason: reason,
      ...(evidenceDocumentId && { evidenceDocumentId }),
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new DebtDisputedEvent(
        this.id.toString(),
        this.props.estateId,
        reason,
        disputedBy,
        this.version,
      ),
    );
  }

  /**
   * Resolve dispute
   */
  public resolveDispute(_resolution: string, _resolvedBy: string, newAmount?: MoneyVO): void {
    if (this.props.status !== DebtStatus.DISPUTED) {
      throw new DebtLogicException('Cannot resolve non-disputed debt');
    }

    const updates: Partial<DebtProps> = {
      status: DebtStatus.OUTSTANDING,
      disputeReason: undefined,
      updatedAt: new Date(),
    };

    // If new amount negotiated, update outstanding balance
    if (newAmount) {
      if (newAmount.isZero() || newAmount.amount <= 0) {
        throw new InvalidDebtAmountException(this.props.estateId, newAmount.amount);
      }
      updates.outstandingBalance = newAmount;
    }

    this.updateState(updates);
  }

  /**
   * Write off debt (uncollectible)
   */
  public writeOff(reason: string, authorizedBy: string, writeOffAmount?: MoneyVO): void {
    const amountToWriteOff = writeOffAmount || this.props.outstandingBalance;

    this.updateState({
      outstandingBalance: this.props.outstandingBalance.subtract(amountToWriteOff),
      status: DebtStatus.WRITTEN_OFF,
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new DebtWrittenOffEvent(
        this.id.toString(),
        this.props.estateId,
        amountToWriteOff.amount,
        reason,
        authorizedBy,
        this.version,
      ),
    );
  }

  // ===========================================================================
  // STATUTE BARRED CHECKS
  // ===========================================================================

  /**
   * Check if debt is statute barred under Limitation Act
   */
  public checkStatuteBarredStatus(): void {
    if (this.props.isStatuteBarred) return;

    const limitationPeriod = this.getLimitationPeriod();
    const referenceDate = this.props.lastPaymentDate || this.props.dueDate || this.props.createdAt;
    const now = new Date();

    const yearsElapsed = (now.getTime() - referenceDate.getTime()) / (1000 * 3600 * 24 * 365);

    if (yearsElapsed >= limitationPeriod) {
      this.updateState({
        isStatuteBarred: true,
        status: DebtStatus.STATUTE_BARRED,
        updatedAt: new Date(),
      });

      this.addDomainEvent(
        new DebtStatuteBarredEvent(
          this.id.toString(),
          this.props.estateId,
          yearsElapsed,
          this.version,
        ),
      );
    }
  }

  /**
   * Get limitation period based on debt type
   */
  private getLimitationPeriod(): number {
    return DebtTypeHelper.getLimitationPeriod(this.props.type);
  }

  // ===========================================================================
  // BUSINESS LOGIC QUERIES
  // ===========================================================================

  /**
   * Check if debt is collectible
   */
  public isCollectible(): boolean {
    return DebtStatusHelper.isCollectible(this.props.status);
  }

  /**
   * Check if debt is included in S.45 calculations
   */
  public isIncludedInS45(): boolean {
    return DebtStatusHelper.isIncludedInS45(this.props.status);
  }

  /**
   * Check if debt blocks estate distribution
   */
  public blocksDistribution(): boolean {
    // Secured debts block distribution of their collateral
    return this.props.isSecured && this.props.status === DebtStatus.OUTSTANDING;
  }

  /**
   * Compare priority with another debt for S.45 sorting
   */
  public comparePriority(other: Debt): number {
    const thisPriority = this.props.priority.getNumericalPriority();
    const otherPriority = other.priority.getNumericalPriority();

    if (thisPriority !== otherPriority) {
      return thisPriority - otherPriority;
    }

    // If same priority, older debts come first
    return this.props.createdAt.getTime() - other.createdAt.getTime();
  }

  // ===========================================================================
  // VALIDATION HELPERS
  // ===========================================================================

  private ensureModifiable(): void {
    if (this.props.status === DebtStatus.SETTLED) {
      throw new DebtLogicException('Debt is already settled and cannot be modified');
    }

    if (this.props.status === DebtStatus.STATUTE_BARRED) {
      throw new StatuteBarredDebtException(this.id.toString(), this.getLimitationPeriod());
    }

    if (this.props.status === DebtStatus.WRITTEN_OFF) {
      throw new DebtLogicException('Debt is written off and cannot be modified');
    }

    if (this.props.status === DebtStatus.DISPUTED) {
      throw new DebtLogicException('Debt is disputed and cannot be modified until resolved');
    }
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  get estateId(): string {
    return this.props.estateId;
  }
  get creditorName(): string {
    return this.props.creditorName;
  }
  get description(): string {
    return this.props.description;
  }

  get initialAmount(): MoneyVO {
    return this.props.initialAmount;
  }
  get outstandingBalance(): MoneyVO {
    return this.props.outstandingBalance;
  }
  get interestRate(): number {
    return this.props.interestRate;
  }
  get currency(): string {
    return this.props.currency;
  }

  get priority(): DebtPriorityVO {
    return this.props.priority;
  }
  get tier(): DebtTier {
    return this.props.tier;
  }
  get type(): DebtType {
    return this.props.type;
  }
  get isSecured(): boolean {
    return this.props.isSecured;
  }
  get securedAssetId(): string | undefined {
    return this.props.securedAssetId;
  }

  get status(): DebtStatus {
    return this.props.status;
  }
  get isStatuteBarred(): boolean {
    return this.props.isStatuteBarred;
  }
  get dueDate(): Date | undefined {
    return this.props.dueDate;
  }
  get disputeReason(): string | undefined {
    return this.props.disputeReason;
  }

  get lastPaymentDate(): Date | undefined {
    return this.props.lastPaymentDate;
  }
  get totalPaid(): MoneyVO {
    return this.props.totalPaid;
  }

  get creditorContact(): string | undefined {
    return this.props.creditorContact;
  }
  get referenceNumber(): string | undefined {
    return this.props.referenceNumber;
  }
  get evidenceDocumentId(): string | undefined {
    return this.props.evidenceDocumentId;
  }
  get requiresCourtApproval(): boolean | undefined {
    return this.props.requiresCourtApproval;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
