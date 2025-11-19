import { AggregateRoot } from '@nestjs/cqrs';
import { DebtType } from '@prisma/client';
import { AssetValue } from '../value-objects/asset-value.vo';
import { DebtAddedEvent } from '../events/debt-added.event';
import { DebtPaymentMadeEvent } from '../events/debt-payment-made.event';
import { DebtClearedEvent } from '../events/debt-cleared.event';

export class Debt extends AggregateRoot {
  private id: string;
  private ownerId: string;
  private type: DebtType;
  private description: string;

  // Financials using Value Objects
  private principalAmount: AssetValue;
  private outstandingBalance: AssetValue;

  // Creditor Details
  private creditorName: string;
  private creditorContact: string | null;
  private accountNumber: string | null;

  // Linkage
  private assetId: string | null;

  // Terms & Status
  private dueDate: Date | null;
  private interestRate: number | null; // Annual percentage
  private isPaid: boolean;
  private paidAt: Date | null;

  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    ownerId: string,
    type: DebtType,
    description: string,
    principalAmount: AssetValue,
    creditorName: string,
  ) {
    super();

    if (!creditorName?.trim()) {
      throw new Error('Creditor name is required');
    }

    this.id = id;
    this.ownerId = ownerId;
    this.type = type;
    this.description = description;
    this.principalAmount = principalAmount;
    // Initially, outstanding balance equals principal
    this.outstandingBalance = principalAmount;
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
  // FACTORY METHOD
  // --------------------------------------------------------------------------

  static create(
    id: string,
    ownerId: string,
    type: DebtType,
    description: string,
    principalAmount: AssetValue,
    creditorName: string,
  ): Debt {
    const debt = new Debt(id, ownerId, type, description, principalAmount, creditorName);

    debt.apply(new DebtAddedEvent(id, ownerId, type, principalAmount, creditorName));

    return debt;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  linkToAsset(assetId: string): void {
    this.assetId = assetId;
    this.updatedAt = new Date();
  }

  unlinkFromAsset(): void {
    this.assetId = null;
    this.updatedAt = new Date();
  }

  updateCreditorInfo(name: string, contact?: string, accountNumber?: string): void {
    if (!name?.trim()) throw new Error('Creditor name cannot be empty');

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

  makePayment(amount: AssetValue, paymentDate: Date = new Date()): void {
    if (this.isPaid) {
      throw new Error('Debt is already paid in full.');
    }

    // Ensure currencies match
    if (amount.getCurrency() !== this.outstandingBalance.getCurrency()) {
      throw new Error(
        `Payment currency (${amount.getCurrency()}) does not match debt currency (${this.outstandingBalance.getCurrency()}).`,
      );
    }

    // Calculate new balance
    // Using the Value Object's subtract method handles negative results logic
    try {
      this.outstandingBalance = this.outstandingBalance.subtract(amount);
    } catch {
      throw new Error('Payment amount exceeds outstanding balance.');
    }

    this.updatedAt = new Date();
    this.apply(new DebtPaymentMadeEvent(this.id, this.ownerId, amount, this.outstandingBalance));

    // Check if cleared
    if (this.outstandingBalance.getAmount() === 0) {
      this.markAsPaid(paymentDate);
    }
  }

  markAsPaid(paymentDate: Date = new Date()): void {
    if (this.isPaid) return;

    // Force balance to 0 using the principal's currency
    this.outstandingBalance = new AssetValue(0, this.principalAmount.getCurrency());
    this.isPaid = true;
    this.paidAt = paymentDate;
    this.updatedAt = new Date();

    this.apply(new DebtClearedEvent(this.id, this.ownerId, paymentDate));
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
  // GETTERS
  // --------------------------------------------------------------------------

  getId(): string {
    return this.id;
  }
  getOwnerId(): string {
    return this.ownerId;
  }
  getType(): DebtType {
    return this.type;
  }
  getDescription(): string {
    return this.description;
  }

  getPrincipalAmount(): AssetValue {
    return this.principalAmount;
  }
  getOutstandingBalance(): AssetValue {
    return this.outstandingBalance;
  }

  getCreditorName(): string {
    return this.creditorName;
  }
  getCreditorContact(): string | null {
    return this.creditorContact;
  }
  getAccountNumber(): string | null {
    return this.accountNumber;
  }

  getAssetId(): string | null {
    return this.assetId;
  }
  getDueDate(): Date | null {
    return this.dueDate ? new Date(this.dueDate) : null;
  }
  getInterestRate(): number | null {
    return this.interestRate;
  }

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

  // Helper
  isOverdue(): boolean {
    if (this.isPaid || !this.dueDate) return false;
    return new Date() > this.dueDate;
  }
}
