import { AggregateRoot } from '@nestjs/cqrs';
import { DebtType } from '@prisma/client';
import { AssetValue } from '../value-objects/asset-value.vo';
import { DebtAddedEvent } from '../events/debt-added.event';
import { DebtPaymentMadeEvent } from '../events/debt-payment-made.event';
import { DebtClearedEvent } from '../events/debt-cleared.event';

// Interface for AssetValue data structure
export interface AssetValueData {
  amount: number;
  currency: string;
  valuationDate: Date | string;
}

// Interface for reconstitute method
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

export class Debt extends AggregateRoot {
  private id: string;
  private ownerId: string;
  private assetId: string | null; // Linked asset (e.g. Mortgage)
  private type: DebtType;
  private description: string;

  // Financials
  private principalAmount: AssetValue;
  private outstandingBalance: AssetValue;

  // Creditor Info
  private creditorName: string;
  private creditorContact: string | null;
  private accountNumber: string | null;

  // Terms
  private dueDate: Date | null;
  private interestRate: number | null; // Annual %

  // State
  private isPaid: boolean;
  private paidAt: Date | null;

  private createdAt: Date;
  private updatedAt: Date;

  // Private constructor
  private constructor(
    id: string,
    ownerId: string,
    type: DebtType,
    description: string,
    principalAmount: AssetValue,
    creditorName: string,
  ) {
    super();

    if (!creditorName.trim()) {
      throw new Error('Creditor name is required');
    }

    this.id = id;
    this.ownerId = ownerId;
    this.type = type;
    this.description = description;
    this.principalAmount = principalAmount;
    this.outstandingBalance = principalAmount; // Start with full balance
    this.creditorName = creditorName;

    // Defaults
    this.assetId = null;
    this.creditorContact = null;
    this.accountNumber = null;
    this.dueDate = null;
    this.interestRate = null;
    this.isPaid = false;
    this.paidAt = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // 1. FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    id: string,
    ownerId: string,
    type: DebtType,
    description: string,
    principalAmount: AssetValue,
    creditorName: string,
    assetId?: string,
  ): Debt {
    if (!creditorName.trim()) throw new Error('Creditor name is required');
    if (principalAmount.getAmount() <= 0) throw new Error('Principal amount must be positive');

    const debt = new Debt(id, ownerId, type, description, principalAmount, creditorName);

    if (assetId) {
      debt.assetId = assetId;
    }

    debt.apply(new DebtAddedEvent(id, ownerId, type, principalAmount, creditorName, assetId));

    return debt;
  }

  static reconstitute(props: DebtReconstituteProps): Debt {
    // Reconstruct AssetValue objects first
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

    // Hydrate properties safely with proper typing
    debt.assetId = props.assetId;
    debt.creditorContact = props.creditorContact;
    debt.accountNumber = props.accountNumber;
    debt.interestRate = props.interestRate;
    debt.isPaid = props.isPaid;
    debt.outstandingBalance = outstandingBalance;

    // Handle date conversions safely
    debt.dueDate = props.dueDate ? new Date(props.dueDate) : null;
    debt.paidAt = props.paidAt ? new Date(props.paidAt) : null;
    debt.createdAt = new Date(props.createdAt);
    debt.updatedAt = new Date(props.updatedAt);

    return debt;
  }

  /**
   * Helper method to reconstruct AssetValue from raw data or existing instance
   */
  private static reconstructAssetValue(valueData: AssetValueData | AssetValue): AssetValue {
    if (valueData instanceof AssetValue) {
      return valueData;
    }

    // Handle raw data object with proper typing
    const valuationDate =
      typeof valueData.valuationDate === 'string'
        ? new Date(valueData.valuationDate)
        : valueData.valuationDate;

    return new AssetValue(valueData.amount, valueData.currency, valuationDate);
  }

  // --------------------------------------------------------------------------
  // 2. BUSINESS LOGIC
  // --------------------------------------------------------------------------

  updateDetails(
    description: string,
    creditorContact?: string,
    accountNumber?: string,
    dueDate?: Date,
    interestRate?: number,
  ): void {
    this.description = description;
    if (creditorContact) this.creditorContact = creditorContact;
    if (accountNumber) this.accountNumber = accountNumber;
    if (dueDate) this.dueDate = dueDate;
    if (interestRate !== undefined) {
      if (interestRate < 0) throw new Error('Interest rate cannot be negative');
      this.interestRate = interestRate;
    }
    this.updatedAt = new Date();
  }

  updateCreditorInfo(name: string, contact?: string, accountNumber?: string): void {
    if (!name.trim()) throw new Error('Creditor name cannot be empty');

    this.creditorName = name.trim();
    this.creditorContact = contact || null;
    this.accountNumber = accountNumber || null;
    this.updatedAt = new Date();
  }

  updateTerms(dueDate?: Date, interestRate?: number): void {
    if (dueDate) this.dueDate = new Date(dueDate);

    if (interestRate !== undefined) {
      if (interestRate < 0) throw new Error('Interest rate cannot be negative');
      this.interestRate = interestRate;
    }
    this.updatedAt = new Date();
  }

  linkToAsset(assetId: string): void {
    this.assetId = assetId;
    this.updatedAt = new Date();
    // Logic note: This should ideally update the Asset entity too (AssetEncumberedEvent)
    // but that orchestration happens in the Service/Saga layer.
  }

  unlinkFromAsset(): void {
    this.assetId = null;
    this.updatedAt = new Date();
  }

  makePayment(amount: AssetValue, paymentDate: Date = new Date()): void {
    if (this.isPaid) {
      throw new Error('Debt is already fully paid.');
    }

    if (amount.getCurrency() !== this.outstandingBalance.getCurrency()) {
      throw new Error(
        `Payment currency (${amount.getCurrency()}) does not match debt currency (${this.outstandingBalance.getCurrency()})`,
      );
    }

    const currentBalance = this.outstandingBalance.getAmount();
    const paymentAmount = amount.getAmount();

    if (paymentAmount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    if (paymentAmount > currentBalance) {
      throw new Error(`Payment amount exceeds outstanding balance (${currentBalance})`);
    }

    // Perform subtraction safely via VO
    this.outstandingBalance = this.outstandingBalance.subtract(amount);
    this.updatedAt = new Date();

    this.apply(new DebtPaymentMadeEvent(this.id, this.ownerId, amount, this.outstandingBalance));

    // Auto-clear if balance is zero
    if (this.outstandingBalance.getAmount() === 0) {
      this.markAsPaid(paymentDate);
    }
  }

  markAsPaid(paymentDate: Date = new Date()): void {
    if (this.isPaid) return;

    this.isPaid = true;
    this.paidAt = paymentDate;
    this.outstandingBalance = new AssetValue(0, this.principalAmount.getCurrency()); // Ensure strictly 0
    this.updatedAt = new Date();

    this.apply(new DebtClearedEvent(this.id, this.ownerId, paymentDate));
  }

  markAsCleared(): void {
    this.markAsPaid();
  }

  /**
   * Estimates accrued interest based on simple interest formula.
   * Returns a raw number for display/calculation purposes.
   */
  calculateAccruedInterest(): number {
    if (!this.interestRate || this.isPaid) {
      return 0;
    }

    const now = new Date();
    const start = this.createdAt;

    // Calculate time in years (approximate)
    const timeInYears = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    // Principal * Rate * Time
    const interest = this.principalAmount.getAmount() * (this.interestRate / 100) * timeInYears;

    return Math.round(interest * 100) / 100;
  }

  // --------------------------------------------------------------------------
  // 3. GETTERS & HELPER METHODS
  // --------------------------------------------------------------------------

  // Core Properties
  getId(): string {
    return this.id;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getAssetId(): string | null {
    return this.assetId;
  }

  getType(): DebtType {
    return this.type;
  }

  getDescription(): string {
    return this.description;
  }

  // Financial Getters
  getPrincipalAmount(): AssetValue {
    return this.principalAmount;
  }

  getOutstandingBalance(): AssetValue {
    return this.outstandingBalance;
  }

  // Creditor Getters
  getCreditorName(): string {
    return this.creditorName;
  }

  getCreditorContact(): string | null {
    return this.creditorContact;
  }

  getAccountNumber(): string | null {
    return this.accountNumber;
  }

  // Terms Getters
  getDueDate(): Date | null {
    return this.dueDate ? new Date(this.dueDate) : null;
  }

  getInterestRate(): number | null {
    return this.interestRate;
  }

  // Status Getters
  getIsPaid(): boolean {
    return this.isPaid;
  }

  getPaidAt(): Date | null {
    return this.paidAt ? new Date(this.paidAt) : null;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  // Business Logic Helpers
  isOverdue(): boolean {
    if (this.isPaid || !this.dueDate) return false;
    return new Date() > this.dueDate;
  }

  getRemainingBalancePercentage(): number {
    const principal = this.principalAmount.getAmount();
    const outstanding = this.outstandingBalance.getAmount();

    if (principal === 0) return 0;

    return (outstanding / principal) * 100;
  }

  isSecured(): boolean {
    return this.assetId !== null;
  }

  hasInterest(): boolean {
    return this.interestRate !== null && this.interestRate > 0;
  }

  getTotalOwed(): AssetValue {
    if (this.isPaid) {
      return new AssetValue(0, this.principalAmount.getCurrency());
    }

    const accruedInterest = this.calculateAccruedInterest();
    const totalAmount = this.outstandingBalance.getAmount() + accruedInterest;

    return new AssetValue(totalAmount, this.principalAmount.getCurrency(), new Date());
  }

  canMakePayment(amount: AssetValue): boolean {
    if (this.isPaid) return false;

    if (amount.getCurrency() !== this.outstandingBalance.getCurrency()) {
      return false;
    }

    const paymentAmount = amount.getAmount();
    const currentBalance = this.outstandingBalance.getAmount();

    return paymentAmount > 0 && paymentAmount <= currentBalance;
  }

  // Validation methods
  isValidForEstate(): boolean {
    // Check if debt has all required information
    return (
      Boolean(this.creditorName) &&
      this.principalAmount.getAmount() > 0 &&
      (this.isPaid || this.outstandingBalance.getAmount() > 0)
    );
  }

  requiresCourtProbate(): boolean {
    // Large secured debts might require court probate
    const isLargeDebt = this.principalAmount.getAmount() > 1000000; // 1 million KES
    return this.isSecured() && isLargeDebt && !this.isPaid;
  }
}
