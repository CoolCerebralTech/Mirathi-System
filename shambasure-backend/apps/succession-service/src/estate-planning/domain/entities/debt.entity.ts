import { AggregateRoot } from '@nestjs/cqrs';
import { DebtPriority, DebtStatus, DebtType, KenyanTaxType } from '@prisma/client';

import { DebtAddedEvent } from '../events/debt-added.event';
import { DebtClearedEvent } from '../events/debt-cleared.event';
import { DebtPaymentMadeEvent } from '../events/debt-payment-made.event';
import { DebtStatusUpdatedEvent } from '../events/debt-status-updated.event';

/**
 * Properties required for entity reconstitution from persistence
 * Strictly aligned with Prisma Schema.
 */
export interface DebtReconstituteProps {
  id: string;
  ownerId: string;

  // Core Debt Information
  type: DebtType;
  description: string;

  // Asset Linkage
  assetId: string | null;

  // Financial Details
  principalAmount: number;
  outstandingBalance: number;
  currency: string;

  // Kenyan Tax-Specific Fields
  taxType: KenyanTaxType | null;
  kraPin: string | null;
  taxPeriod: string | null;

  // Creditor Information
  creditorName: string;
  creditorContact: string | null;
  creditorAddress: Record<string, any> | null; // Parsed from Json
  creditorAccountNumber: string | null;
  creditorKraPin: string | null;

  // Loan Terms & Conditions
  dueDate: Date | string | null;
  interestRate: number | null;
  interestType: string | null;
  compoundingFrequency: string | null;

  // Kenyan Succession Priority
  priority: DebtPriority;
  status: DebtStatus;

  // Legal & Compliance
  isStatuteBarred: boolean;
  statuteBarredDate: Date | string | null;
  requiresCourtApproval: boolean;
  courtApprovalObtained: boolean;

  // Security & Collateral
  isSecured: boolean;
  securityDetails: string | null;
  collateralDescription: string | null;

  // Payment Tracking
  lastPaymentDate: Date | string | null;
  lastPaymentAmount: number | null;
  totalPaid: number;

  // Settlement Information
  isPaid: boolean;
  paidAt: Date | string | null;
  settlementMethod: string | null;

  // Dispute Information
  isDisputed: boolean;
  disputeReason: string | null;
  disputeResolvedAt: Date | string | null;

  // Audit Trail
  incurredDate: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Debt Entity
 *
 * Represents a liability owed by the Testator or Estate.
 *
 * Legal Context:
 * - Governed by Law of Succession Act (Cap 160), Section 83 (Duties of PRs).
 * - Priority of debts defined in Sixth Schedule (para 2).
 * - Limitation of Actions Act (Cap 22) regarding statute-barred debts.
 * - Tax Procedures Act regarding KRA obligations.
 */
export class Debt extends AggregateRoot {
  // Core Identity
  private readonly _id: string;
  private readonly _ownerId: string;

  // Description
  private _type: DebtType;
  private _description: string;

  // Asset Linkage
  private _assetId: string | null;

  // Financials
  private _principalAmount: number;
  private _outstandingBalance: number;
  private _currency: string;

  // Tax Info
  private _taxType: KenyanTaxType | null;
  private _kraPin: string | null;
  private _taxPeriod: string | null;

  // Creditor Info
  private _creditorName: string;
  private _creditorContact: string | null;
  private _creditorAddress: Record<string, any> | null;
  private _creditorAccountNumber: string | null;
  private _creditorKraPin: string | null;

  // Terms
  private _dueDate: Date | null;
  private _interestRate: number | null;
  private _interestType: string | null;
  private _compoundingFrequency: string | null;

  // Priority & Status
  private _priority: DebtPriority;
  private _status: DebtStatus;

  // Legal Status
  private _isStatuteBarred: boolean;
  private _statuteBarredDate: Date | null;
  private _requiresCourtApproval: boolean;
  private _courtApprovalObtained: boolean;

  // Security
  private _isSecured: boolean;
  private _securityDetails: string | null;
  private _collateralDescription: string | null;

  // Payment History
  private _lastPaymentDate: Date | null;
  private _lastPaymentAmount: number | null;
  private _totalPaid: number;

  // Settlement
  private _isPaid: boolean;
  private _paidAt: Date | null;
  private _settlementMethod: string | null;

  // Disputes
  private _isDisputed: boolean;
  private _disputeReason: string | null;
  private _disputeResolvedAt: Date | null;

  // Timestamps
  private _incurredDate: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // --------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------
  private constructor(
    id: string,
    ownerId: string,
    type: DebtType,
    description: string,
    principalAmount: number,
    creditorName: string,
    currency: string = 'KES',
  ) {
    super();

    if (!id?.trim()) throw new Error('Debt ID is required');
    if (!ownerId?.trim()) throw new Error('Owner ID is required');
    if (!creditorName?.trim()) throw new Error('Creditor name is required');
    if (principalAmount < 0) throw new Error('Principal amount cannot be negative');

    this._id = id;
    this._ownerId = ownerId;
    this._type = type;
    this._description = description.trim();
    this._principalAmount = principalAmount;
    this._outstandingBalance = principalAmount;
    this._creditorName = creditorName.trim();
    this._currency = currency;

    // Defaults
    this._assetId = null;
    this._taxType = null;
    this._kraPin = null;
    this._taxPeriod = null;
    this._creditorContact = null;
    this._creditorAddress = null;
    this._creditorAccountNumber = null;
    this._creditorKraPin = null;
    this._dueDate = null;
    this._interestRate = null;
    this._interestType = null;
    this._compoundingFrequency = null;
    this._priority = DebtPriority.MEDIUM;
    this._status = DebtStatus.OUTSTANDING;
    this._isStatuteBarred = false;
    this._statuteBarredDate = null;
    this._requiresCourtApproval = false;
    this._courtApprovalObtained = false;
    this._isSecured = false;
    this._securityDetails = null;
    this._collateralDescription = null;
    this._lastPaymentDate = null;
    this._lastPaymentAmount = null;
    this._totalPaid = 0;
    this._isPaid = false;
    this._paidAt = null;
    this._settlementMethod = null;
    this._isDisputed = false;
    this._disputeReason = null;
    this._disputeResolvedAt = null;
    this._incurredDate = null;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    id: string,
    ownerId: string,
    type: DebtType,
    description: string,
    principalAmount: number,
    creditorName: string,
    currency: string = 'KES',
  ): Debt {
    const debt = new Debt(id, ownerId, type, description, principalAmount, creditorName, currency);
    debt._priority = Debt.determinePriority(type);

    debt.apply(
      new DebtAddedEvent(
        debt._id,
        debt._ownerId,
        debt._type,
        debt._principalAmount,
        debt._currency,
        debt._creditorName,
        debt._priority,
      ),
    );
    return debt;
  }

  static createTaxDebt(
    id: string,
    ownerId: string,
    taxType: KenyanTaxType,
    description: string,
    amount: number,
    kraPin: string,
    taxPeriod: string,
  ): Debt {
    if (!kraPin?.trim()) throw new Error('KRA PIN is required for tax debts');
    if (!taxPeriod?.trim()) throw new Error('Tax period is required for tax debts');

    const debt = new Debt(
      id,
      ownerId,
      DebtType.TAX_OBLIGATION,
      description,
      amount,
      'Kenya Revenue Authority',
    );
    debt._taxType = taxType;
    debt._kraPin = kraPin;
    debt._taxPeriod = taxPeriod;
    debt._priority = DebtPriority.HIGHEST; // Section 83 & Sixth Schedule
    debt._requiresCourtApproval = false; // Paying taxes is a statutory duty, usually doesn't need court *permission* to pay, but settling for less might.

    debt.apply(
      new DebtAddedEvent(
        debt._id,
        debt._ownerId,
        debt._type,
        debt._principalAmount,
        debt._currency,
        debt._creditorName,
        debt._priority,
      ),
    );
    return debt;
  }

  static createFuneralExpense(
    id: string,
    ownerId: string,
    description: string,
    amount: number,
    creditorName: string,
  ): Debt {
    const debt = new Debt(id, ownerId, DebtType.FUNERAL_EXPENSE, description, amount, creditorName);
    debt._priority = DebtPriority.HIGHEST; // First priority

    debt.apply(
      new DebtAddedEvent(
        debt._id,
        debt._ownerId,
        debt._type,
        debt._principalAmount,
        debt._currency,
        debt._creditorName,
        debt._priority,
      ),
    );
    return debt;
  }

  static reconstitute(props: DebtReconstituteProps): Debt {
    const debt = new Debt(
      props.id,
      props.ownerId,
      props.type,
      props.description,
      props.principalAmount,
      props.creditorName,
      props.currency,
    );

    debt._assetId = props.assetId;
    debt._outstandingBalance = props.outstandingBalance;
    debt._taxType = props.taxType;
    debt._kraPin = props.kraPin;
    debt._taxPeriod = props.taxPeriod;
    debt._creditorContact = props.creditorContact;
    debt._creditorAddress = props.creditorAddress;
    debt._creditorAccountNumber = props.creditorAccountNumber;
    debt._creditorKraPin = props.creditorKraPin;
    debt._interestRate = props.interestRate;
    debt._interestType = props.interestType;
    debt._compoundingFrequency = props.compoundingFrequency;
    debt._priority = props.priority;
    debt._status = props.status;
    debt._isStatuteBarred = props.isStatuteBarred;
    debt._requiresCourtApproval = props.requiresCourtApproval;
    debt._courtApprovalObtained = props.courtApprovalObtained;
    debt._isSecured = props.isSecured;
    debt._securityDetails = props.securityDetails;
    debt._collateralDescription = props.collateralDescription;
    debt._lastPaymentAmount = props.lastPaymentAmount;
    debt._totalPaid = props.totalPaid;
    debt._isPaid = props.isPaid;
    debt._settlementMethod = props.settlementMethod;
    debt._isDisputed = props.isDisputed;
    debt._disputeReason = props.disputeReason;

    debt._dueDate = props.dueDate ? new Date(props.dueDate) : null;
    debt._statuteBarredDate = props.statuteBarredDate ? new Date(props.statuteBarredDate) : null;
    debt._lastPaymentDate = props.lastPaymentDate ? new Date(props.lastPaymentDate) : null;
    debt._paidAt = props.paidAt ? new Date(props.paidAt) : null;
    debt._disputeResolvedAt = props.disputeResolvedAt ? new Date(props.disputeResolvedAt) : null;
    debt._incurredDate = props.incurredDate ? new Date(props.incurredDate) : null;
    debt._createdAt = new Date(props.createdAt);
    debt._updatedAt = new Date(props.updatedAt);

    return debt;
  }

  private static determinePriority(type: DebtType): DebtPriority {
    // Reference: Law of Succession Act, Sixth Schedule, Para 2
    switch (type) {
      case DebtType.FUNERAL_EXPENSE:
      case DebtType.TAX_OBLIGATION: // "Reasonable funeral expenses" & "Taxes" are top
        return DebtPriority.HIGHEST;
      case DebtType.MORTGAGE: // Secured debts
        return DebtPriority.HIGH;
      default:
        return DebtPriority.MEDIUM; // Unsecured debts
    }
  }

  // --------------------------------------------------------------------------
  // DOMAIN OPERATIONS
  // --------------------------------------------------------------------------

  public makePayment(amount: number, paymentDate: Date = new Date(), method?: string): void {
    if (this._isPaid) throw new Error('Debt is already fully paid');
    if (this._isStatuteBarred)
      throw new Error('Debt is statute-barred (Limitation of Actions Act)');
    if (amount <= 0) throw new Error('Payment amount must be positive');
    if (amount > this._outstandingBalance)
      throw new Error(`Payment exceeds balance (${this._outstandingBalance})`);

    // Only block if strictly required. Regular payments usually don't need explicit court approval unless disputable.
    // However, if the debt is flagged 'requiresCourtApproval' (e.g. disputed claim), we enforce it.
    if (this._requiresCourtApproval && !this._courtApprovalObtained) {
      throw new Error('Court approval required before payment');
    }

    this._outstandingBalance -= amount;
    this._totalPaid += amount;
    this._lastPaymentDate = paymentDate;
    this._lastPaymentAmount = amount;
    this._updatedAt = new Date();

    if (this._outstandingBalance <= 0) {
      // Safety check for floating point precision
      this._outstandingBalance = 0;
      this.markAsSettled(paymentDate, method);
    } else if (this._outstandingBalance < this._principalAmount) {
      this._status = DebtStatus.PARTIALLY_PAID;
    }

    this.apply(
      new DebtPaymentMadeEvent(
        this._id,
        this._ownerId,
        amount,
        this._currency,
        this._outstandingBalance,
        paymentDate,
      ),
    );

    if (this._status !== DebtStatus.OUTSTANDING && this._status !== DebtStatus.SETTLED) {
      this.apply(
        new DebtStatusUpdatedEvent(this._id, this._ownerId, this._status, this._outstandingBalance),
      );
    }
  }

  public markAsSettled(settlementDate: Date = new Date(), method?: string): void {
    if (this._isPaid) return;

    if (this._requiresCourtApproval && !this._courtApprovalObtained) {
      throw new Error('Court approval required before settlement');
    }

    this._isPaid = true;
    this._paidAt = settlementDate;
    this._outstandingBalance = 0;
    this._status = DebtStatus.SETTLED;
    this._settlementMethod = method || null;
    this._updatedAt = new Date();

    this.apply(new DebtClearedEvent(this._id, this._ownerId, this._paidAt, this._settlementMethod));
  }

  /**
   * Statute Barred check based on Limitation of Actions Act (Cap 22).
   * Generally 6 years for contracts, 12 years for land.
   */
  public markAsStatuteBarred(barredDate: Date = new Date()): void {
    this._isStatuteBarred = true;
    this._statuteBarredDate = barredDate;
    this._status = DebtStatus.STATUTE_BARRED;
    this._updatedAt = new Date();
  }

  public obtainCourtApproval(approvalDetails?: string): void {
    this._courtApprovalObtained = true;
    this._updatedAt = new Date();
    // Logic: In DDD, we don't usually append strings to description fields as it makes them messy.
    // We'll trust the Event or a separate audit log to track the details.
    // However, keeping the securityDetails update for now as per previous logic.
    if (approvalDetails && this._isSecured) {
      this._securityDetails = (this._securityDetails || '') + ` | Court Order: ${approvalDetails}`;
    }
  }

  public recordDispute(reason: string): void {
    if (!reason?.trim()) throw new Error('Dispute reason required');
    this._isDisputed = true;
    this._disputeReason = reason;
    this._status = DebtStatus.DISPUTED;
    this._updatedAt = new Date();
  }

  public resolveDispute(resolutionDate: Date = new Date()): void {
    if (!this._isDisputed) throw new Error('Debt is not disputed');
    this._isDisputed = false;
    this._disputeResolvedAt = resolutionDate;
    // Restore status based on balance
    this._status =
      this._outstandingBalance > 0
        ? this._totalPaid > 0
          ? DebtStatus.PARTIALLY_PAID
          : DebtStatus.OUTSTANDING
        : DebtStatus.SETTLED;
    this._updatedAt = new Date();
  }

  public updatePriority(priority: DebtPriority): void {
    // Invariant protection for Statutory Debts
    if (this._type === DebtType.FUNERAL_EXPENSE && priority !== DebtPriority.HIGHEST) {
      throw new Error('Funeral expenses must be HIGHEST priority');
    }
    if (this._type === DebtType.TAX_OBLIGATION && priority !== DebtPriority.HIGHEST) {
      throw new Error('Tax obligations must be HIGHEST priority');
    }
    this._priority = priority;
    this._updatedAt = new Date();
  }

  public secureWithAsset(
    assetId: string,
    securityDetails: string,
    collateralDescription?: string,
  ): void {
    if (!assetId?.trim()) throw new Error('Asset ID required');
    if (!securityDetails?.trim()) throw new Error('Security details required');

    this._assetId = assetId;
    this._isSecured = true;
    this._securityDetails = securityDetails;
    this._collateralDescription = collateralDescription || null;
    this._priority = DebtPriority.HIGH; // Secured debts bump up to High
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  get id(): string {
    return this._id;
  }
  get ownerId(): string {
    return this._ownerId;
  }
  get type(): DebtType {
    return this._type;
  }
  get description(): string {
    return this._description;
  }
  get assetId(): string | null {
    return this._assetId;
  }
  get principalAmount(): number {
    return this._principalAmount;
  }
  get outstandingBalance(): number {
    return this._outstandingBalance;
  }
  get currency(): string {
    return this._currency;
  }
  get taxType(): KenyanTaxType | null {
    return this._taxType;
  }
  get kraPin(): string | null {
    return this._kraPin;
  }
  get taxPeriod(): string | null {
    return this._taxPeriod;
  }

  get creditorName(): string {
    return this._creditorName;
  }
  get creditorContact(): string | null {
    return this._creditorContact;
  }
  get creditorAddress(): Record<string, any> | null {
    return this._creditorAddress ? { ...this._creditorAddress } : null;
  }
  get creditorAccountNumber(): string | null {
    return this._creditorAccountNumber;
  }
  get creditorKraPin(): string | null {
    return this._creditorKraPin;
  }

  get dueDate(): Date | null {
    return this._dueDate;
  }
  get interestRate(): number | null {
    return this._interestRate;
  }
  get interestType(): string | null {
    return this._interestType;
  }
  get compoundingFrequency(): string | null {
    return this._compoundingFrequency;
  }

  get priority(): DebtPriority {
    return this._priority;
  }
  get status(): DebtStatus {
    return this._status;
  }
  get isStatuteBarred(): boolean {
    return this._isStatuteBarred;
  }
  get statuteBarredDate(): Date | null {
    return this._statuteBarredDate;
  }
  get requiresCourtApproval(): boolean {
    return this._requiresCourtApproval;
  }
  get courtApprovalObtained(): boolean {
    return this._courtApprovalObtained;
  }

  get isSecured(): boolean {
    return this._isSecured;
  }
  get securityDetails(): string | null {
    return this._securityDetails;
  }
  get collateralDescription(): string | null {
    return this._collateralDescription;
  }

  get lastPaymentDate(): Date | null {
    return this._lastPaymentDate;
  }
  get lastPaymentAmount(): number | null {
    return this._lastPaymentAmount;
  }
  get totalPaid(): number {
    return this._totalPaid;
  }

  get isPaid(): boolean {
    return this._isPaid;
  }
  get paidAt(): Date | null {
    return this._paidAt;
  }
  get settlementMethod(): string | null {
    return this._settlementMethod;
  }

  get isDisputed(): boolean {
    return this._isDisputed;
  }
  get disputeReason(): string | null {
    return this._disputeReason;
  }
  get disputeResolvedAt(): Date | null {
    return this._disputeResolvedAt;
  }

  get incurredDate(): Date | null {
    return this._incurredDate;
  }
  get createdAt(): Date {
    return new Date(this._createdAt);
  }
  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }
}
