import { AggregateRoot } from '../../../base/aggregate-root';
import { UniqueEntityID } from '../../../base/entity';
import { Guard } from '../../../core/guard';
import { Result } from '../../../core/result';
import { Currency, Money } from '../../../shared/money.vo';
import { DebtPriorityAssignedEvent } from '../events/debt-priority-assigned.event';
import { DebtRecordedEvent } from '../events/debt-recorded.event';
import { DebtSettledEvent } from '../events/debt-settled.event';
import { DebtStatusUpdatedEvent } from '../events/debt-status-updated.event';
import { DebtTerms, LiabilityTier } from '../value-objects/debt-terms.vo';

export enum DebtType {
  MORTGAGE = 'MORTGAGE',
  PERSONAL_LOAN = 'PERSONAL_LOAN',
  CREDIT_CARD = 'CREDIT_CARD',
  BUSINESS_DEBT = 'BUSINESS_DEBT',
  TAX_OBLIGATION = 'TAX_OBLIGATION',
  FUNERAL_EXPENSE = 'FUNERAL_EXPENSE',
  MEDICAL_BILL = 'MEDICAL_BILL',
  LAND_RATES = 'LAND_RATES',
  UTILITY_BILLS = 'UTILITY_BILLS',
  EMPLOYEE_WAGES = 'EMPLOYEE_WAGES',
  COURT_FINES = 'COURT_FINES',
  OTHER = 'OTHER',
}

export enum KenyanTaxType {
  INCOME_TAX = 'INCOME_TAX',
  CAPITAL_GAINS_TAX = 'CAPITAL_GAINS_TAX',
  STAMP_DUTY = 'STAMP_DUTY',
  WITHHOLDING_TAX = 'WITHHOLDING_TAX',
  VALUE_ADDED_TAX = 'VALUE_ADDED_TAX',
  EXCISE_DUTY = 'EXCISE_DUTY',
  CUSTOMS_DUTY = 'CUSTOMS_DUTY',
  OTHER = 'OTHER',
}

export enum DebtStatus {
  OUTSTANDING = 'OUTSTANDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  SETTLED = 'SETTLED',
  WRITTEN_OFF = 'WRITTEN_OFF',
  DISPUTED = 'DISPUTED',
  STATUTE_BARRED = 'STATUTE_BARRED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum DebtPriority {
  HIGHEST = 'HIGHEST', // Funeral expenses, taxes (S.45(a) LSA)
  HIGH = 'HIGH', // Secured debts (S.45(b) LSA)
  MEDIUM = 'MEDIUM', // Unsecured priority debts (S.45(c) LSA)
  LOW = 'LOW', // Unsecured non-priority debts (S.45(d) LSA)
}

interface DebtProps {
  estateId: UniqueEntityID;

  // Debt Information
  type: DebtType;
  description: string;

  // Financial Details
  principalAmount: Money;
  outstandingBalance: Money;
  currency: Currency;

  // Debt Terms
  terms: DebtTerms;

  // S.45 Priority Classification
  liabilityTier: LiabilityTier;
  priority: DebtPriority;
  status: DebtStatus;

  // Kenyan Tax-Specific Fields
  taxType: KenyanTaxType | null;
  kraPin: string | null;
  taxPeriod: string | null;

  // Creditor Information
  creditorName: string;
  creditorContact: string | null;
  creditorAccountNumber: string | null;
  creditorKraPin: string | null;
  creditorAddress: string | null;

  // Asset Linkage (for secured debts)
  securedAssetId: UniqueEntityID | null;

  // Payment Tracking
  lastPaymentDate: Date | null;
  lastPaymentAmount: Money | null;
  totalPaid: Money;

  // Legal & Compliance
  isStatuteBarred: boolean;
  statuteBarredDate: Date | null;
  requiresCourtApproval: boolean;
  courtApprovalObtained: boolean;
  courtApprovalDate: Date | null;
  courtOrderReference: string | null;

  // Dispute Tracking
  isDisputed: boolean;
  disputeReason: string | null;
  disputeResolvedAt: Date | null;

  // Timeline
  incurredDate: Date;
  dueDate: Date | null;

  // Management
  isActive: boolean;
  deletedAt: Date | null;
}

export class Debt extends AggregateRoot<DebtProps> {
  private constructor(props: DebtProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: {
      estateId: string;
      type: DebtType;
      description: string;
      principalAmount: Money;
      creditorName: string;
      incurredDate: Date;
      terms: DebtTerms;
      liabilityTier?: LiabilityTier;
      taxType?: KenyanTaxType;
      kraPin?: string;
      taxPeriod?: string;
      creditorContact?: string;
      creditorAccountNumber?: string;
      creditorKraPin?: string;
      creditorAddress?: string;
      securedAssetId?: string;
      dueDate?: Date;
    },
    id?: string,
  ): Result<Debt> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.estateId, argumentName: 'estateId' },
      { argument: props.type, argumentName: 'type' },
      { argument: props.description, argumentName: 'description' },
      { argument: props.principalAmount, argumentName: 'principalAmount' },
      { argument: props.creditorName, argumentName: 'creditorName' },
      { argument: props.incurredDate, argumentName: 'incurredDate' },
      { argument: props.terms, argumentName: 'terms' },
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<Debt>(guardResult.message);
    }

    // Validate description
    if (props.description.trim().length < 5) {
      return Result.fail<Debt>('Debt description must be at least 5 characters');
    }

    // Validate principal amount
    if (props.principalAmount.amount <= 0) {
      return Result.fail<Debt>('Principal amount must be positive');
    }

    // Validate incurred date is not in the future
    if (props.incurredDate > new Date()) {
      return Result.fail<Debt>('Incurred date cannot be in the future');
    }

    // Determine liability tier if not provided
    let liabilityTier = props.liabilityTier;
    if (!liabilityTier) {
      liabilityTier = props.terms.getSection45Priority();
    }

    // Determine priority based on tier
    const priority = Debt.determinePriorityFromTier(liabilityTier);

    // Check if tax debt has KRA PIN
    if (props.taxType && !props.kraPin) {
      return Result.fail<Debt>('Tax debts require KRA PIN');
    }

    const debtId = id ? new UniqueEntityID(id) : new UniqueEntityID();
    const estateId = new UniqueEntityID(props.estateId);
    const securedAssetId = props.securedAssetId ? new UniqueEntityID(props.securedAssetId) : null;

    const defaultProps: DebtProps = {
      estateId,
      type: props.type,
      description: props.description.trim(),
      principalAmount: props.principalAmount,
      outstandingBalance: props.principalAmount, // Initially equals principal
      currency: props.principalAmount.currency,
      terms: props.terms,
      liabilityTier,
      priority,
      status: DebtStatus.OUTSTANDING,
      taxType: props.taxType || null,
      kraPin: props.kraPin || null,
      taxPeriod: props.taxPeriod || null,
      creditorName: props.creditorName.trim(),
      creditorContact: props.creditorContact?.trim() || null,
      creditorAccountNumber: props.creditorAccountNumber?.trim() || null,
      creditorKraPin: props.creditorKraPin?.trim() || null,
      creditorAddress: props.creditorAddress?.trim() || null,
      securedAssetId,
      lastPaymentDate: null,
      lastPaymentAmount: null,
      totalPaid: Money.zero(props.principalAmount.currency),
      isStatuteBarred: false,
      statuteBarredDate: null,
      requiresCourtApproval: props.type === DebtType.COURT_FINES || false,
      courtApprovalObtained: false,
      courtApprovalDate: null,
      courtOrderReference: null,
      isDisputed: false,
      disputeReason: null,
      disputeResolvedAt: null,
      incurredDate: props.incurredDate,
      dueDate: props.dueDate || null,
      isActive: true,
      deletedAt: null,
    };

    const debt = new Debt(defaultProps, debtId);

    // Add domain event for debt creation
    debt.addDomainEvent(
      new DebtRecordedEvent({
        debtId: debt.id.toString(),
        estateId: debt.props.estateId.toString(),
        debtType: debt.props.type,
        creditorName: debt.props.creditorName,
        amount: debt.props.principalAmount.amount,
        currency: debt.props.currency,
        liabilityTier: debt.props.liabilityTier,
        priority: debt.props.priority,
        incurredDate: debt.props.incurredDate,
      }),
    );

    return Result.ok<Debt>(debt);
  }

  // ==================== BUSINESS METHODS ====================

  // Payment Processing
  public recordPayment(
    amount: Money,
    paymentDate: Date = new Date(),
    method: string,
    transactionReference?: string,
  ): Result<void> {
    // Validate payment
    if (amount.amount <= 0) {
      return Result.fail('Payment amount must be positive');
    }

    if (paymentDate > new Date()) {
      return Result.fail('Payment date cannot be in the future');
    }

    if (this.props.status === DebtStatus.SETTLED) {
      return Result.fail('Debt is already settled');
    }

    if (this.props.status === DebtStatus.STATUTE_BARRED) {
      return Result.fail('Cannot make payments on statute-barred debt');
    }

    // Check if payment exceeds outstanding balance
    if (amount.amount > this.props.outstandingBalance.amount) {
      return Result.fail('Payment amount exceeds outstanding balance');
    }

    // Process payment
    this.props.outstandingBalance = this.props.outstandingBalance.subtract(amount);
    this.props.totalPaid = this.props.totalPaid.add(amount);
    this.props.lastPaymentDate = paymentDate;
    this.props.lastPaymentAmount = amount;

    // Update status
    if (this.props.outstandingBalance.amount === 0) {
      this.props.status = DebtStatus.SETTLED;

      this.addDomainEvent(
        new DebtSettledEvent({
          debtId: this.id.toString(),
          estateId: this.props.estateId.toString(),
          creditorName: this.props.creditorName,
          settlementDate: paymentDate,
          totalPaid: this.props.totalPaid.amount,
          currency: this.props.totalPaid.currency,
          paymentMethod: method,
        }),
      );
    } else {
      this.props.status = DebtStatus.PARTIALLY_PAID;
    }

    this.addDomainEvent(
      new DebtStatusUpdatedEvent({
        debtId: this.id.toString(),
        newStatus: this.props.status,
        outstandingBalance: this.props.outstandingBalance.amount,
        lastPaymentAmount: amount.amount,
        lastPaymentDate: paymentDate,
      }),
    );

    return Result.ok();
  }

  // S.45 Priority Management
  public updatePriorityBasedOnTier(): Result<void> {
    const newPriority = Debt.determinePriorityFromTier(this.props.liabilityTier);

    if (newPriority !== this.props.priority) {
      const oldPriority = this.props.priority;
      this.props.priority = newPriority;

      this.addDomainEvent(
        new DebtPriorityAssignedEvent({
          debtId: this.id.toString(),
          oldPriority,
          newPriority,
          liabilityTier: this.props.liabilityTier,
          updatedAt: new Date(),
        }),
      );
    }

    return Result.ok();
  }

  // Statute of Limitations (Limitation Act)
  public checkStatuteBarred(): Result<void> {
    if (this.props.status === DebtStatus.SETTLED) {
      return Result.fail('Cannot check statute on settled debt');
    }

    if (this.props.isStatuteBarred) {
      return Result.ok();
    }

    // Determine limitation period based on debt type
    const limitationYears = this.props.terms.isSecured ? 12 : 6;
    const limitationDate = new Date(this.props.incurredDate);
    limitationDate.setFullYear(limitationDate.getFullYear() + limitationYears);

    if (new Date() > limitationDate) {
      this.props.isStatuteBarred = true;
      this.props.statuteBarredDate = new Date();
      this.props.status = DebtStatus.STATUTE_BARRED;

      this.addDomainEvent(
        new DebtStatusUpdatedEvent({
          debtId: this.id.toString(),
          newStatus: this.props.status,
          reason: 'Debt is now statute-barred under Limitation Act',
          updatedAt: new Date(),
        }),
      );
    }

    return Result.ok();
  }

  // Court Approval Management (for certain debts)
  public obtainCourtApproval(
    courtOrderReference: string,
    approvalDate: Date = new Date(),
    judgeName?: string,
    courtStation?: string,
  ): Result<void> {
    if (!this.props.requiresCourtApproval) {
      return Result.fail('This debt does not require court approval');
    }

    if (this.props.courtApprovalObtained) {
      return Result.fail('Court approval already obtained');
    }

    this.props.courtApprovalObtained = true;
    this.props.courtApprovalDate = approvalDate;
    this.props.courtOrderReference = courtOrderReference;

    return Result.ok();
  }

  // Dispute Management
  public dispute(reason: string): Result<void> {
    if (this.props.isDisputed) {
      return Result.fail('Debt is already disputed');
    }

    if (!reason || reason.trim().length < 10) {
      return Result.fail('Dispute reason must be at least 10 characters');
    }

    this.props.isDisputed = true;
    this.props.disputeReason = reason.trim();
    this.props.status = DebtStatus.DISPUTED;

    return Result.ok();
  }

  public resolveDispute(resolution: string): Result<void> {
    if (!this.props.isDisputed) {
      return Result.fail('Debt is not disputed');
    }

    this.props.isDisputed = false;
    this.props.disputeResolvedAt = new Date();

    // Restore previous status or set to outstanding
    if (this.props.outstandingBalance.amount > 0) {
      this.props.status = DebtStatus.OUTSTANDING;
    }

    return Result.ok();
  }

  // Debt Write-off (for irrecoverable debts)
  public writeOff(reason: string, writtenOffBy: string): Result<void> {
    if (this.props.status === DebtStatus.SETTLED) {
      return Result.fail('Cannot write off settled debt');
    }

    if (this.props.status === DebtStatus.WRITTEN_OFF) {
      return Result.fail('Debt is already written off');
    }

    if (!reason || reason.trim().length < 10) {
      return Result.fail('Write-off reason must be at least 10 characters');
    }

    // Kenyan law: Some debts cannot be written off without court approval
    if (this.props.taxType === KenyanTaxType.INCOME_TAX) {
      return Result.fail('Tax debts cannot be written off without KRA approval');
    }

    if (this.props.liabilityTier === LiabilityTier.FUNERAL_EXPENSES) {
      return Result.fail('Funeral expenses cannot be written off under S.45(a)');
    }

    const previousStatus = this.props.status;
    this.props.status = DebtStatus.WRITTEN_OFF;
    this.props.outstandingBalance = Money.zero(this.props.currency);

    this.addDomainEvent(
      new DebtStatusUpdatedEvent({
        debtId: this.id.toString(),
        newStatus: this.props.status,
        previousStatus,
        reason: `Written off: ${reason}`,
        writtenOffBy,
        updatedAt: new Date(),
      }),
    );

    return Result.ok();
  }

  // Interest Calculation
  public calculateAccruedInterest(asOfDate: Date = new Date()): Money {
    return this.props.terms.calculateOutstanding(asOfDate);
  }

  // Kenyan Legal Compliance Methods
  public getSection45Compliance(): {
    tier: LiabilityTier;
    priority: number;
    requirements: string[];
    isCompliant: boolean;
  } {
    const requirements: string[] = [];
    let isCompliant = true;

    // S.45(a) requirements
    if (this.props.liabilityTier === LiabilityTier.FUNERAL_EXPENSES) {
      requirements.push('Must be reasonable and customary');
      requirements.push('Requires receipts for verification');
      requirements.push('Priority over all other debts');

      if (!this.props.description.toLowerCase().includes('funeral')) {
        isCompliant = false;
        requirements.push('Must be clearly identified as funeral expense');
      }
    }

    // S.45(b) requirements
    if (this.props.liabilityTier === LiabilityTier.SECURED_DEBTS) {
      requirements.push('Must have valid security documentation');
      requirements.push('Asset-backed verification required');

      if (!this.props.securedAssetId) {
        isCompliant = false;
        requirements.push('Secured debts must be linked to an asset');
      }
    }

    // S.45(c) requirements
    if (this.props.liabilityTier === LiabilityTier.TAXES_RATES_WAGES) {
      requirements.push('KRA tax clearance required for tax debts');
      requirements.push('County government rates receipts');
      requirements.push('Employee wage documentation for wage debts');

      if (this.props.taxType && !this.props.kraPin) {
        isCompliant = false;
        requirements.push('Tax debts require KRA PIN');
      }
    }

    // Determine priority order
    const priorityOrder = {
      [LiabilityTier.FUNERAL_EXPENSES]: 1,
      [LiabilityTier.SECURED_DEBTS]: 2,
      [LiabilityTier.TAXES_RATES_WAGES]: 3,
      [LiabilityTier.UNSECURED_GENERAL]: 4,
    };

    return {
      tier: this.props.liabilityTier,
      priority: priorityOrder[this.props.liabilityTier],
      requirements,
      isCompliant,
    };
  }

  public getKenyanLegalRequirements(): string[] {
    const requirements: string[] = [];

    // General requirements
    if (this.props.terms.isSecured) {
      requirements.push('Security must be registered with relevant registry');
    }

    if (this.props.taxType) {
      requirements.push('Must be verified with Kenya Revenue Authority');
      requirements.push('Tax clearance certificate required');
    }

    if (this.props.type === DebtType.LAND_RATES) {
      requirements.push('County government rates clearance certificate');
    }

    if (this.props.type === DebtType.EMPLOYEE_WAGES) {
      requirements.push('Employment records and wage statements');
      requirements.push('NSSF compliance certificate');
    }

    // Court-related requirements
    if (this.props.requiresCourtApproval && !this.props.courtApprovalObtained) {
      requirements.push('Requires court approval before settlement');
    }

    return requirements;
  }

  // Validation for estate distribution
  public canBePaidFromEstate(): { canPay: boolean; reason?: string } {
    if (this.props.status === DebtStatus.SETTLED) {
      return { canPay: false, reason: 'Debt is already settled' };
    }

    if (this.props.status === DebtStatus.STATUTE_BARRED) {
      return { canPay: false, reason: 'Debt is statute-barred' };
    }

    if (this.props.status === DebtStatus.WRITTEN_OFF) {
      return { canPay: false, reason: 'Debt has been written off' };
    }

    if (this.props.isDisputed) {
      return { canPay: false, reason: 'Debt is under dispute' };
    }

    if (this.props.requiresCourtApproval && !this.props.courtApprovalObtained) {
      return { canPay: false, reason: 'Requires court approval' };
    }

    return { canPay: true };
  }

  // Soft Delete
  public delete(deletedBy: string, reason: string): Result<void> {
    if (this.props.deletedAt) {
      return Result.fail('Debt is already deleted');
    }

    // Cannot delete certain types of debts
    if (this.props.taxType) {
      return Result.fail('Tax debts cannot be deleted for audit trail');
    }

    if (this.props.status === DebtStatus.SETTLED) {
      return Result.fail('Settled debts cannot be deleted for legal compliance');
    }

    // Check if debt is part of probate proceedings
    if (this.props.liabilityTier === LiabilityTier.FUNERAL_EXPENSES) {
      return Result.warn('Funeral expenses deletion requires special authorization');
    }

    this.props.deletedAt = new Date();
    this.props.isActive = false;

    return Result.ok();
  }

  public restore(): Result<void> {
    if (!this.props.deletedAt) {
      return Result.fail('Debt is not deleted');
    }

    this.props.deletedAt = null;
    this.props.isActive = true;

    return Result.ok();
  }

  // ==================== HELPER METHODS ====================

  private static determinePriorityFromTier(tier: LiabilityTier): DebtPriority {
    switch (tier) {
      case LiabilityTier.FUNERAL_EXPENSES:
        return DebtPriority.HIGHEST;
      case LiabilityTier.SECURED_DEBTS:
        return DebtPriority.HIGH;
      case LiabilityTier.TAXES_RATES_WAGES:
        return DebtPriority.MEDIUM;
      case LiabilityTier.UNSECURED_GENERAL:
        return DebtPriority.LOW;
      default:
        return DebtPriority.LOW;
    }
  }

  // Factory methods for common debt types
  public static createFuneralExpense(props: {
    estateId: string;
    description: string;
    amount: Money;
    creditorName: string;
    incurredDate: Date;
  }): Result<Debt> {
    const terms = DebtTerms.create({
      principalAmount: props.amount,
      isSecured: false,
      requiresCourtApproval: false,
    }).getValue();

    return Debt.create({
      ...props,
      type: DebtType.FUNERAL_EXPENSE,
      terms,
      liabilityTier: LiabilityTier.FUNERAL_EXPENSES,
    });
  }

  public static createTaxDebt(props: {
    estateId: string;
    taxType: KenyanTaxType;
    description: string;
    amount: Money;
    kraPin: string;
    taxPeriod: string;
    incurredDate: Date;
    dueDate?: Date;
  }): Result<Debt> {
    const terms = DebtTerms.create({
      principalAmount: props.amount,
      isSecured: false,
      requiresCourtApproval: false,
    }).getValue();

    return Debt.create({
      ...props,
      type: DebtType.TAX_OBLIGATION,
      creditorName: 'Kenya Revenue Authority',
      creditorKraPin: props.kraPin,
      terms,
      liabilityTier: LiabilityTier.TAXES_RATES_WAGES,
    });
  }

  public static createMortgage(props: {
    estateId: string;
    description: string;
    amount: Money;
    creditorName: string;
    securedAssetId: string;
    terms: DebtTerms;
    incurredDate: Date;
    dueDate?: Date;
  }): Result<Debt> {
    return Debt.create({
      ...props,
      type: DebtType.MORTGAGE,
      liabilityTier: LiabilityTier.SECURED_DEBTS,
    });
  }

  // ==================== GETTERS ====================

  get id(): UniqueEntityID {
    return this._id;
  }

  get estateId(): UniqueEntityID {
    return this.props.estateId;
  }

  get type(): DebtType {
    return this.props.type;
  }

  get description(): string {
    return this.props.description;
  }

  get principalAmount(): Money {
    return this.props.principalAmount;
  }

  get outstandingBalance(): Money {
    return this.props.outstandingBalance;
  }

  get liabilityTier(): LiabilityTier {
    return this.props.liabilityTier;
  }

  get priority(): DebtPriority {
    return this.props.priority;
  }

  get status(): DebtStatus {
    return this.props.status;
  }

  get creditorName(): string {
    return this.props.creditorName;
  }

  get isSecured(): boolean {
    return this.props.terms.isSecured;
  }

  get securedAssetId(): UniqueEntityID | null {
    return this.props.securedAssetId;
  }

  get isStatuteBarred(): boolean {
    return this.props.isStatuteBarred;
  }

  get isDisputed(): boolean {
    return this.props.isDisputed;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  // Computed properties
  get canBeSettled(): boolean {
    const paymentCheck = this.canBePaidFromEstate();
    return paymentCheck.canPay;
  }

  get requiresProbateApproval(): boolean {
    return (
      this.props.requiresCourtApproval ||
      this.props.type === DebtType.COURT_FINES ||
      this.props.type === DebtType.TAX_OBLIGATION
    );
  }

  get isHighPriority(): boolean {
    return [DebtPriority.HIGHEST, DebtPriority.HIGH].includes(this.props.priority);
  }

  get interestAccrued(): Money {
    return this.calculateAccruedInterest();
  }

  get totalDebtWithInterest(): Money {
    return this.calculateAccruedInterest();
  }

  get isFullyPaid(): boolean {
    return this.props.status === DebtStatus.SETTLED;
  }
}
