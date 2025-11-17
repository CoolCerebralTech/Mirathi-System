import { DebtType } from '@prisma/client';

export class Debt {
  private id: string;
  private assetId: string | null;
  private ownerId: string;
  private type: DebtType;
  private description: string;
  private principalAmount: number;
  private outstandingBalance: number;
  private currency: string;
  private creditorName: string;
  private creditorContact: string | null;
  private accountNumber: string | null;
  private dueDate: Date | null;
  private interestRate: number | null;
  private isPaid: boolean;
  private paidAt: Date | null;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: string,
    ownerId: string,
    type: DebtType,
    description: string,
    principalAmount: number,
    creditorName: string,
    currency: string = 'KES',
  ) {
    if (principalAmount <= 0) {
      throw new Error('Principal amount must be positive');
    }

    if (!creditorName?.trim()) {
      throw new Error('Creditor name is required');
    }

    this.id = id;
    this.ownerId = ownerId;
    this.type = type;
    this.description = description;
    this.principalAmount = principalAmount;
    this.outstandingBalance = principalAmount;
    this.currency = currency;
    this.creditorName = creditorName;

    // Default values
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

  // Getters
  getId(): string {
    return this.id;
  }
  getAssetId(): string | null {
    return this.assetId;
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
  getPrincipalAmount(): number {
    return this.principalAmount;
  }
  getOutstandingBalance(): number {
    return this.outstandingBalance;
  }
  getCurrency(): string {
    return this.currency;
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

  // Business methods
  linkToAsset(assetId: string): void {
    this.assetId = assetId;
    this.updatedAt = new Date();
  }

  unlinkFromAsset(): void {
    this.assetId = null;
    this.updatedAt = new Date();
  }

  updateCreditorInfo(name: string, contact?: string, accountNumber?: string): void {
    if (!name?.trim()) {
      throw new Error('Creditor name cannot be empty');
    }

    this.creditorName = name.trim();
    this.creditorContact = contact || null;
    this.accountNumber = accountNumber || null;
    this.updatedAt = new Date();
  }

  updateTerms(dueDate?: Date, interestRate?: number): void {
    this.dueDate = dueDate ? new Date(dueDate) : null;

    if (interestRate !== undefined) {
      if (interestRate < 0) {
        throw new Error('Interest rate cannot be negative');
      }
      this.interestRate = interestRate;
    }

    this.updatedAt = new Date();
  }

  makePayment(amount: number, paymentDate: Date = new Date()): void {
    if (amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    if (this.isPaid) {
      throw new Error('Debt is already paid in full');
    }

    if (amount > this.outstandingBalance) {
      throw new Error('Payment amount exceeds outstanding balance');
    }

    this.outstandingBalance -= amount;

    if (this.outstandingBalance === 0) {
      this.isPaid = true;
      this.paidAt = paymentDate;
    }

    this.updatedAt = new Date();
  }

  markAsPaid(paymentDate: Date = new Date()): void {
    this.outstandingBalance = 0;
    this.isPaid = true;
    this.paidAt = paymentDate;
    this.updatedAt = new Date();
  }

  calculateAccruedInterest(): number {
    if (!this.interestRate || this.isPaid) {
      return 0;
    }

    // Simplified interest calculation
    const now = new Date();
    const created = this.getCreatedAt();
    const monthsDiff =
      (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());

    return this.principalAmount * (this.interestRate / 100) * (monthsDiff / 12);
  }

  getTotalOwed(): number {
    return this.outstandingBalance + this.calculateAccruedInterest();
  }

  isOverdue(): boolean {
    if (this.isPaid || !this.dueDate) {
      return false;
    }

    return new Date() > this.dueDate;
  }

  getDaysOverdue(): number {
    if (!this.isOverdue() || !this.dueDate) {
      return 0;
    }

    const now = new Date();
    const due = new Date(this.dueDate);
    const diffTime = Math.abs(now.getTime() - due.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Static factory method
  static create(
    id: string,
    ownerId: string,
    type: DebtType,
    description: string,
    principalAmount: number,
    creditorName: string,
    currency: string = 'KES',
  ): Debt {
    return new Debt(id, ownerId, type, description, principalAmount, creditorName, currency);
  }
}
