import { AggregateRoot } from '@nestjs/cqrs';
import { DebtType } from '@prisma/client';
import { AssetValue } from '../value-objects/asset-value.vo';
import { DebtAddedEvent } from '../events/debt-added.event';
import { DebtPaymentMadeEvent } from '../events/debt-payment-made.event';
import { DebtClearedEvent } from '../events/debt-cleared.event';

/**
 * Data structure for asset valuation information
 * @interface AssetValueData
 */
export interface AssetValueData {
  amount: number;
  currency: string;
  valuationDate: Date | string;
}

/**
 * Properties required for entity reconstitution from persistence
 * @interface DebtReconstituteProps
 */
export interface DebtReconstituteProps {
  id: string;
  ownerId: string;
  assetId: string | null;
  type: DebtType;
  description: string;
  principalAmount: AssetValueData | AssetValue;
  outstandingBalance: AssetValueData | AssetValue;
  creditorName: string;
  creditorContact: string | null;
  accountNumber: string | null;
  dueDate: Date | string | null;
  interestRate: number | null;
  isPaid: boolean;
  paidAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Debt Entity representing financial obligations under Kenyan succession law
 *
 * Core Domain Entity for managing:
 * - Mortgages and secured loans (linked to assets)
 * - Personal loans and unsecured debts
 * - Tax obligations and funeral expenses
 * - Business debts and credit card balances
 *
 * @class Debt
 * @extends {AggregateRoot}
 */
export class Debt extends AggregateRoot {
  // Core Debt Properties
  private readonly _id: string;
  private readonly _ownerId: string;
  private _assetId: string | null;
  private readonly _type: DebtType;
  private _description: string;

  // Financial Information
  private readonly _principalAmount: AssetValue;
  private _outstandingBalance: AssetValue;

  // Creditor Information
  private _creditorName: string;
  private _creditorContact: string | null;
  private _accountNumber: string | null;

  // Loan Terms
  private _dueDate: Date | null;
  private _interestRate: number | null;

  // Payment Status
  private _isPaid: boolean;
  private _paidAt: Date | null;

  // Audit Trail
  private _createdAt: Date;
  private _updatedAt: Date;

  // --------------------------------------------------------------------------
  // PRIVATE CONSTRUCTOR - Enforces use of factory methods
  // --------------------------------------------------------------------------
  private constructor(
    id: string,
    ownerId: string,
    type: DebtType,
    description: string,
    principalAmount: AssetValue,
    creditorName: string,
  ) {
    super();

    // Validate required parameters
    if (!id?.trim()) throw new Error('Debt ID is required');
    if (!ownerId?.trim()) throw new Error('Owner ID is required');
    if (!creditorName?.trim()) throw new Error('Creditor name is required');
    if (principalAmount.getAmount() <= 0) throw new Error('Principal amount must be positive');

    this._id = id;
    this._ownerId = ownerId;
    this._type = type;
    this._description = description.trim();
    this._principalAmount = principalAmount;
    this._outstandingBalance = principalAmount; // Start with full balance
    this._creditorName = creditorName.trim();

    // Initialize default values
    this._assetId = null;
    this._creditorContact = null;
    this._accountNumber = null;
    this._dueDate = null;
    this._interestRate = null;
    this._isPaid = false;
    this._paidAt = null;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS - Domain Lifecycle Management
  // --------------------------------------------------------------------------

  /**
   * Creates a new Debt entity with proper domain event emission
   *
   * @static
   * @param {string} id - Unique debt identifier
   * @param {string} ownerId - ID of the debt owner (testator)
   * @param {DebtType} type - Classification of debt per Kenyan categories
   * @param {string} description - Description of the debt obligation
   * @param {AssetValue} principalAmount - Original loan amount
   * @param {string} creditorName - Name of the creditor
   * @param {string} [assetId] - Optional linked asset ID for secured debts
   * @returns {Debt} Newly created debt entity
   * @throws {Error} When validation fails
   */
  static create(
    id: string,
    ownerId: string,
    type: DebtType,
    description: string,
    principalAmount: AssetValue,
    creditorName: string,
    assetId?: string,
  ): Debt {
    const debt = new Debt(id, ownerId, type, description, principalAmount, creditorName);

    if (assetId?.trim()) {
      debt._assetId = assetId.trim();
    }

    debt.apply(
      new DebtAddedEvent(
        debt._id,
        debt._ownerId,
        debt._type,
        debt._principalAmount,
        debt._creditorName,
        debt._assetId || undefined,
      ),
    );

    return debt;
  }

  /**
   * Reconstructs Debt entity from persistence layer data
   *
   * @static
   * @param {DebtReconstituteProps} props - Data from database
   * @returns {Debt} Rehydrated debt entity
   * @throws {Error} When data validation fails during reconstruction
   */
  static reconstitute(props: DebtReconstituteProps): Debt {
    // Validate required reconstruction data
    if (!props.id || !props.ownerId || !props.creditorName) {
      throw new Error('Invalid reconstruction data: missing required fields');
    }

    const principalAmount = Debt.reconstructAssetValue(props.principalAmount);
    const outstandingBalance = Debt.reconstructAssetValue(props.outstandingBalance);

    const debt = new Debt(
      props.id,
      props.ownerId,
      props.type,
      props.description,
      principalAmount,
      props.creditorName,
    );

    // Hydrate additional properties with type safety
    debt._assetId = props.assetId || null;
    debt._creditorContact = props.creditorContact || null;
    debt._accountNumber = props.accountNumber || null;
    debt._interestRate = props.interestRate || null;
    debt._isPaid = Boolean(props.isPaid);
    debt._outstandingBalance = outstandingBalance;

    // Handle date conversions safely
    debt._dueDate = props.dueDate ? Debt.safeDateConversion(props.dueDate, 'dueDate') : null;
    debt._paidAt = props.paidAt ? Debt.safeDateConversion(props.paidAt, 'paidAt') : null;
    debt._createdAt = Debt.safeDateConversion(props.createdAt, 'createdAt');
    debt._updatedAt = Debt.safeDateConversion(props.updatedAt, 'updatedAt');

    return debt;
  }

  /**
   * Safely converts date strings to Date objects with validation
   *
   * @private
   * @static
   * @param {Date | string} dateInput - Date to convert
   * @param {string} fieldName - Field name for error reporting
   * @returns {Date} Valid Date object
   * @throws {Error} When date conversion fails
   */
  private static safeDateConversion(dateInput: Date | string, fieldName: string): Date {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date value for ${fieldName}`);
      }
      return date;
    } catch (error) {
      throw new Error(
        `Failed to convert ${fieldName} to valid Date: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Reconstructs AssetValue from raw data or existing instance
   *
   * @private
   * @static
   * @param {AssetValueData | AssetValue} valueData - Value data to reconstruct
   * @returns {AssetValue} Reconstructed AssetValue instance
   * @throws {Error} When value data is invalid
   */
  private static reconstructAssetValue(valueData: AssetValueData | AssetValue): AssetValue {
    if (valueData instanceof AssetValue) {
      return valueData;
    }

    if (typeof valueData !== 'object' || valueData === null) {
      throw new Error('Invalid asset value data: must be object or AssetValue instance');
    }

    if (typeof valueData.amount !== 'number' || valueData.amount < 0) {
      throw new Error('Invalid asset value: amount must be non-negative number');
    }

    if (typeof valueData.currency !== 'string' || !valueData.currency.trim()) {
      throw new Error('Invalid asset value: currency is required');
    }

    const valuationDate = Debt.safeDateConversion(valueData.valuationDate, 'valuationDate');

    return new AssetValue(valueData.amount, valueData.currency.trim(), valuationDate);
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC & DOMAIN OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Updates debt descriptive information and terms
   *
   * @param {string} description - Updated debt description
   * @param {string} [creditorContact] - Updated creditor contact information
   * @param {string} [accountNumber] - Updated account/reference number
   * @param {Date} [dueDate] - Updated due date
   * @param {number} [interestRate] - Updated annual interest rate percentage
   * @throws {Error} When debt is already paid or parameters are invalid
   */
  updateDetails(
    description: string,
    creditorContact?: string,
    accountNumber?: string,
    dueDate?: Date,
    interestRate?: number,
  ): void {
    this.validateDebtIsActive();

    if (!description?.trim()) {
      throw new Error('Debt description cannot be empty');
    }

    this._description = description.trim();

    if (creditorContact !== undefined) {
      this._creditorContact = creditorContact?.trim() || null;
    }

    if (accountNumber !== undefined) {
      this._accountNumber = accountNumber?.trim() || null;
    }

    if (dueDate !== undefined) {
      this._dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (interestRate !== undefined) {
      if (interestRate < 0) {
        throw new Error('Interest rate cannot be negative');
      }
      this._interestRate = interestRate;
    }

    this._updatedAt = new Date();
  }

  /**
   * Updates creditor information
   *
   * @param {string} name - Updated creditor name
   * @param {string} [contact] - Updated creditor contact information
   * @param {string} [accountNumber] - Updated account number
   * @throws {Error} When creditor name is empty or debt is paid
   */
  updateCreditorInfo(name: string, contact?: string, accountNumber?: string): void {
    this.validateDebtIsActive();

    if (!name?.trim()) {
      throw new Error('Creditor name cannot be empty');
    }

    this._creditorName = name.trim();
    this._creditorContact = contact?.trim() || null;
    this._accountNumber = accountNumber?.trim() || null;
    this._updatedAt = new Date();
  }

  /**
   * Updates debt terms and conditions
   *
   * @param {Date} [dueDate] - New due date for the debt
   * @param {number} [interestRate] - New annual interest rate percentage
   * @throws {Error} When debt is paid or interest rate is negative
   */
  updateTerms(dueDate?: Date, interestRate?: number): void {
    this.validateDebtIsActive();

    if (dueDate !== undefined) {
      this._dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (interestRate !== undefined) {
      if (interestRate < 0) {
        throw new Error('Interest rate cannot be negative');
      }
      this._interestRate = interestRate;
    }

    this._updatedAt = new Date();
  }

  /**
   * Links debt to a specific asset (secured debt)
   *
   * @param {string} assetId - ID of the asset securing the debt
   * @throws {Error} When debt is already paid or asset ID is invalid
   */
  linkToAsset(assetId: string): void {
    this.validateDebtIsActive();

    if (!assetId?.trim()) {
      throw new Error('Asset ID is required for linking');
    }

    this._assetId = assetId.trim();
    this._updatedAt = new Date();
  }

  /**
   * Removes asset linkage from debt (converts to unsecured)
   *
   * @throws {Error} When debt is already paid
   */
  unlinkFromAsset(): void {
    this.validateDebtIsActive();
    this._assetId = null;
    this._updatedAt = new Date();
  }

  /**
   * Processes a payment against the debt balance
   *
   * @param {AssetValue} amount - Payment amount
   * @param {Date} [paymentDate=new Date()] - Date of payment
   * @throws {Error} When debt is paid, currency mismatch, or payment invalid
   */
  makePayment(amount: AssetValue, paymentDate: Date = new Date()): void {
    if (this._isPaid) {
      throw new Error('Cannot make payment: debt is already fully paid');
    }

    if (amount.getCurrency() !== this._outstandingBalance.getCurrency()) {
      throw new Error(
        `Payment currency (${amount.getCurrency()}) does not match debt currency (${this._outstandingBalance.getCurrency()})`,
      );
    }

    const currentBalance = this._outstandingBalance.getAmount();
    const paymentAmount = amount.getAmount();

    if (paymentAmount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    if (paymentAmount > currentBalance) {
      throw new Error(
        `Payment amount (${paymentAmount}) exceeds outstanding balance (${currentBalance})`,
      );
    }

    // Update outstanding balance
    this._outstandingBalance = this._outstandingBalance.subtract(amount);
    this._updatedAt = new Date();

    this.apply(new DebtPaymentMadeEvent(this._id, this._ownerId, amount, this._outstandingBalance));

    // Auto-clear if balance reaches zero
    if (this._outstandingBalance.getAmount() === 0) {
      this.markAsPaid(paymentDate);
    }
  }

  /**
   * Marks debt as fully paid and clears outstanding balance
   *
   * @param {Date} [paymentDate=new Date()] - Date when debt was paid
   */
  markAsPaid(paymentDate: Date = new Date()): void {
    if (this._isPaid) return;

    this._isPaid = true;
    this._paidAt = new Date(paymentDate);
    this._outstandingBalance = new AssetValue(0, this._principalAmount.getCurrency(), new Date());
    this._updatedAt = new Date();

    this.apply(new DebtClearedEvent(this._id, this._ownerId, this._paidAt));
  }

  /**
   * Alternative method for marking debt as cleared (synonym for markAsPaid)
   */
  markAsCleared(): void {
    this.markAsPaid();
  }

  // --------------------------------------------------------------------------
  // VALIDATION METHODS
  // --------------------------------------------------------------------------

  /**
   * Validates that debt is active (not paid) for operations
   *
   * @private
   * @throws {Error} When debt is already paid
   */
  private validateDebtIsActive(): void {
    if (this._isPaid) {
      throw new Error('Cannot perform operation on paid debt');
    }
  }

  // --------------------------------------------------------------------------
  // DOMAIN CALCULATIONS & BUSINESS RULES
  // --------------------------------------------------------------------------

  /**
   * Calculates accrued interest using simple interest formula
   *
   * @returns {number} Accrued interest amount in debt currency
   */
  calculateAccruedInterest(): number {
    if (!this._interestRate || this._isPaid) {
      return 0;
    }

    const now = new Date();
    const startDate = this._createdAt;

    // Calculate time in years (approximate)
    const timeInMilliseconds = now.getTime() - startDate.getTime();
    const timeInYears = timeInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);

    // Simple interest formula: Principal * Rate * Time
    const interest = this._principalAmount.getAmount() * (this._interestRate / 100) * timeInYears;

    // Round to 2 decimal places for currency
    return Math.round(interest * 100) / 100;
  }

  /**
   * Determines if debt is overdue based on due date
   *
   * @returns {boolean} True if debt is overdue
   */
  isOverdue(): boolean {
    if (this._isPaid || !this._dueDate) return false;
    return new Date() > this._dueDate;
  }

  /**
   * Calculates remaining balance as percentage of original principal
   *
   * @returns {number} Percentage of original principal still owed (0-100)
   */
  getRemainingBalancePercentage(): number {
    const principal = this._principalAmount.getAmount();
    const outstanding = this._outstandingBalance.getAmount();

    if (principal === 0) return 0;

    return (outstanding / principal) * 100;
  }

  /**
   * Determines if debt is secured by an asset
   *
   * @returns {boolean} True if debt is secured
   */
  isSecured(): boolean {
    return this._assetId !== null;
  }

  /**
   * Determines if debt accrues interest
   *
   * @returns {boolean} True if debt has interest rate
   */
  hasInterest(): boolean {
    return this._interestRate !== null && this._interestRate > 0;
  }

  /**
   * Calculates total amount owed including accrued interest
   *
   * @returns {AssetValue} Total amount owed including principal and interest
   */
  getTotalOwed(): AssetValue {
    if (this._isPaid) {
      return new AssetValue(0, this._principalAmount.getCurrency(), new Date());
    }

    const accruedInterest = this.calculateAccruedInterest();
    const totalAmount = this._outstandingBalance.getAmount() + accruedInterest;

    return new AssetValue(totalAmount, this._principalAmount.getCurrency(), new Date());
  }

  /**
   * Validates if a payment can be made with given amount
   *
   * @param {AssetValue} amount - Proposed payment amount
   * @returns {boolean} True if payment is valid
   */
  canMakePayment(amount: AssetValue): boolean {
    if (this._isPaid) return false;

    if (amount.getCurrency() !== this._outstandingBalance.getCurrency()) {
      return false;
    }

    const paymentAmount = amount.getAmount();
    const currentBalance = this._outstandingBalance.getAmount();

    return paymentAmount > 0 && paymentAmount <= currentBalance;
  }

  /**
   * Validates if debt has all required information for estate inclusion
   *
   * @returns {boolean} True if debt is valid for estate purposes
   */
  isValidForEstate(): boolean {
    return (
      Boolean(this._creditorName?.trim()) &&
      this._principalAmount.getAmount() > 0 &&
      (this._isPaid || this._outstandingBalance.getAmount() > 0)
    );
  }

  /**
   * Determines if debt requires court probate under Kenyan law
   * Large secured debts typically require court probate
   *
   * @returns {boolean} True if court probate is required
   */
  requiresCourtProbate(): boolean {
    const isLargeDebt = this._principalAmount.getAmount() > 1000000; // 1 million KES threshold
    return this.isSecured() && isLargeDebt && !this._isPaid;
  }

  // --------------------------------------------------------------------------
  // IMMUTABLE GETTERS - Provide read-only access to entity state
  // --------------------------------------------------------------------------

  get id(): string {
    return this._id;
  }
  get ownerId(): string {
    return this._ownerId;
  }
  get assetId(): string | null {
    return this._assetId;
  }
  get type(): DebtType {
    return this._type;
  }
  get description(): string {
    return this._description;
  }
  get principalAmount(): AssetValue {
    return this._principalAmount;
  }
  get outstandingBalance(): AssetValue {
    return this._outstandingBalance;
  }
  get creditorName(): string {
    return this._creditorName;
  }
  get creditorContact(): string | null {
    return this._creditorContact;
  }
  get accountNumber(): string | null {
    return this._accountNumber;
  }
  get dueDate(): Date | null {
    return this._dueDate ? new Date(this._dueDate) : null;
  }
  get interestRate(): number | null {
    return this._interestRate;
  }
  get isPaid(): boolean {
    return this._isPaid;
  }
  get paidAt(): Date | null {
    return this._paidAt ? new Date(this._paidAt) : null;
  }
  get createdAt(): Date {
    return new Date(this._createdAt);
  }
  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }
}
