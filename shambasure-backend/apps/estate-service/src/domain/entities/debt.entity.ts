// src/estate-service/src/domain/entities/debt.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { DebtStatus } from '../enums/debt-status.enum';
import {
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
  outstandingBalance: MoneyVO; // Principal only
  interestRate: number; // Annual percentage (e.g., 14.5 for 14.5%)
  currency: string;

  // S.45 Logic
  priority: DebtPriorityVO; // Tier 1-5
  isSecured: boolean;
  securedAssetId?: string; // If secured, which asset backs it?

  // Legal Status
  status: DebtStatus;
  isStatuteBarred: boolean; // Limitation of Actions Act
  dueDate?: Date;
  disputeReason?: string;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Debt Entity (Feature-Complete)
 *
 * Represents a Liability against the Estate.
 *
 * ADVANCED FEATURES:
 * 1. Interest Accrual: Calculates real-time liability including interest.
 * 2. Statute Barred Check: Prevents payment of debts older than 6 years (Contract law).
 * 3. Secured Logic: Links to Inventory Assets.
 * 4. Dispute Handling: Freezes payment if Creditor claim is contested.
 */
export class Debt extends Entity<DebtProps> {
  private constructor(props: DebtProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
  }

  public static create(
    props: Omit<
      DebtProps,
      'createdAt' | 'updatedAt' | 'version' | 'status' | 'outstandingBalance' | 'isStatuteBarred'
    >,
    id?: UniqueEntityID,
  ): Debt {
    if (props.initialAmount.amount <= 0) {
      throw new InvalidDebtAmountException(props.estateId, props.initialAmount.amount);
    }

    if (props.isSecured && !props.securedAssetId) {
      throw new DebtLogicException('Secured Debts must link to a specific Asset ID');
    }

    return new Debt(
      {
        ...props,
        outstandingBalance: props.initialAmount,
        status: DebtStatus.OUTSTANDING,
        isStatuteBarred: false,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
  }

  // ===========================================================================
  // GETTERS & COMPUTED PROPERTIES
  // ===========================================================================

  get priority(): DebtPriorityVO {
    return this.props.priority;
  }
  get outstandingPrincipal(): MoneyVO {
    return this.props.outstandingBalance;
  }
  get status(): DebtStatus {
    return this.props.status;
  }
  get isSecured(): boolean {
    return this.props.isSecured;
  }

  /**
   * Calculates the Interest accrued since creation.
   * Formula: Principal * (Rate/100) * (Days / 365)
   */
  get accruedInterest(): MoneyVO {
    if (this.props.interestRate <= 0 || this.props.outstandingBalance.isZero()) {
      return MoneyVO.zero(this.props.currency);
    }

    const daysOpen = Math.floor(
      (new Date().getTime() - this.props.createdAt.getTime()) / (1000 * 3600 * 24),
    );
    const annualInterest = this.props.outstandingBalance.amount * (this.props.interestRate / 100);
    const accrued = (annualInterest / 365) * daysOpen;

    return new MoneyVO({
      amount: Math.round(accrued * 100) / 100,
      currency: this.props.currency,
    });
  }

  /**
   * Returns the Total Payout required to clear this debt today.
   * (Principal + Interest)
   */
  get currentTotalLiability(): MoneyVO {
    return this.props.outstandingBalance.add(this.accruedInterest);
  }

  // ===========================================================================
  // BUSINESS LOGIC: PAYMENTS
  // ===========================================================================

  public recordPayment(amount: MoneyVO, paidBy: string): void {
    this.ensureModifiable();

    if (amount.amount <= 0)
      throw new InvalidDebtAmountException(this.props.estateId, amount.amount);

    // Note: In reality, payments usually cover Interest first, then Principal.
    // For this system, we simplify to reducing Principal for the "Solvency" check,
    // assuming Interest is handled in the final settlement statement.

    if (amount.amount > this.currentTotalLiability.amount) {
      throw new DebtLogicException('Payment exceeds Total Liability (Principal + Interest)');
    }

    // Logic: Reduce principal
    // (A real accounting system would split this, but for Estate Solvency, we reduce the balance)
    let newPrincipal = this.props.outstandingBalance.amount - amount.amount;

    // If negative (meaning they paid off interest + some principal), handle graceful clamping or logic
    // Simplified:
    if (newPrincipal < 0) newPrincipal = 0;

    const newBalanceVO = new MoneyVO({ amount: newPrincipal, currency: this.props.currency });
    const isSettled = newBalanceVO.isZero();

    this.updateState({
      outstandingBalance: newBalanceVO,
      status: isSettled ? DebtStatus.SETTLED : DebtStatus.PARTIALLY_PAID,
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new DebtPaymentRecordedEvent(
        this.id.toString(),
        this.props.estateId,
        amount.amount,
        newBalanceVO.amount,
        paidBy,
        this.props.version,
      ),
    );

    if (isSettled) {
      this.addDomainEvent(
        new DebtSettledEvent(this.id.toString(), this.props.estateId, paidBy, this.props.version),
      );
    }
  }

  // ===========================================================================
  // BUSINESS LOGIC: DISPUTES & WRITE-OFFS
  // ===========================================================================

  public dispute(reason: string, disputedBy: string): void {
    if (this.props.status === DebtStatus.SETTLED) {
      throw new DebtLogicException('Cannot dispute a settled debt');
    }

    this.updateState({
      status: DebtStatus.DISPUTED,
      disputeReason: reason,
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new DebtDisputedEvent(
        this.id.toString(),
        this.props.estateId,
        reason,
        disputedBy,
        this.props.version,
      ),
    );
  }

  public writeOff(reason: string, authorizedBy: string): void {
    this.ensureModifiable();

    const amountWrittenOff = this.props.outstandingBalance;

    this.updateState({
      outstandingBalance: MoneyVO.zero(this.props.currency),
      status: DebtStatus.WRITTEN_OFF,
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new DebtWrittenOffEvent(
        this.id.toString(),
        this.props.estateId,
        amountWrittenOff.amount,
        reason,
        authorizedBy,
        this.props.version,
      ),
    );
  }

  // ===========================================================================
  // BUSINESS LOGIC: LEGAL (Limitation of Actions)
  // ===========================================================================

  /**
   * Checks against Kenyan Limitation of Actions Act (Cap 22).
   * Contracts = 6 years.
   * If strictly overdue > 6 years, it becomes unenforceable.
   */
  public checkStatuteBarredStatus(): void {
    if (this.props.isStatuteBarred) return; // Already barred

    const LIMITATION_YEARS = 6;
    const now = new Date();
    // Use dueDate if available, else createdAt
    const referenceDate = this.props.dueDate || this.props.createdAt;

    const ageInYears = (now.getTime() - referenceDate.getTime()) / (1000 * 3600 * 24 * 365);

    if (ageInYears >= LIMITATION_YEARS) {
      this.updateState({
        isStatuteBarred: true,
        status: DebtStatus.STATUTE_BARRED,
        updatedAt: new Date(),
      });

      this.addDomainEvent(
        new DebtStatuteBarredEvent(
          this.id.toString(),
          this.props.estateId,
          ageInYears,
          this.props.version,
        ),
      );
    }
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /**
   * Used for S.45 Sorting.
   */
  public comparePriority(other: Debt): number {
    return this.props.priority.getValue().tier - other.priority.getValue().tier;
  }

  private ensureModifiable(): void {
    if (this.props.status === DebtStatus.SETTLED)
      throw new DebtLogicException('Debt is already settled');
    if (this.props.status === DebtStatus.WRITTEN_OFF)
      throw new DebtLogicException('Debt is written off');
    if (this.props.status === DebtStatus.STATUTE_BARRED)
      throw new StatuteBarredDebtException(this.id.toString(), 6);
    if (this.props.status === DebtStatus.DISPUTED)
      throw new DebtLogicException('Debt is currently disputed');
  }
}
