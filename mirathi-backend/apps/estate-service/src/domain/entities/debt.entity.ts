// src/domain/entities/debt.entity.ts
import { DebtCategory, DebtPriority, DebtStatus } from '@prisma/client';

export interface DebtProps {
  id: string;
  estateId: string;
  creditorName: string;
  creditorContact?: string;
  description: string;
  category: DebtCategory;
  priority: DebtPriority;
  status: DebtStatus;

  // Money handling (stored as numbers in domain, decimals in DB)
  originalAmount: number;
  outstandingBalance: number;
  currency: string;

  // Dates
  dueDate?: Date;

  // Security
  isSecured: boolean;
  securityDetails?: string; // e.g., "Secured against Title No. 123"

  createdAt: Date;
  updatedAt: Date;
}

export class Debt {
  private constructor(private props: DebtProps) {}

  /**
   * Factory method that strictly enforces Kenyan Law of Succession (S.45)
   * regarding debt priority.
   */
  static create(
    estateId: string,
    creditorName: string,
    category: DebtCategory,
    amount: number,
    isSecured: boolean,
    description?: string,
  ): Debt {
    if (amount < 0) throw new Error('Debt amount cannot be negative');

    // INNOVATION: Auto-calculate Priority based on Law
    const priority = Debt.determineLegalPriority(category, isSecured);

    return new Debt({
      id: crypto.randomUUID(),
      estateId,
      creditorName,
      description: description || category.replace(/_/g, ' '), // Default desc
      category,
      priority, // <--- Auto-assigned
      status: DebtStatus.OUTSTANDING,
      originalAmount: amount,
      outstandingBalance: amount, // Starts equal to original
      currency: 'KES',
      isSecured,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: DebtProps): Debt {
    return new Debt(props);
  }

  // --- BUSINESS LOGIC ---

  /**
   * Internal Logic for S.45 Law of Succession Act
   */
  private static determineLegalPriority(category: DebtCategory, isSecured: boolean): DebtPriority {
    // S.45(a): Funeral expenses and death-bed expenses are first
    if (category === DebtCategory.FUNERAL_EXPENSES) return DebtPriority.CRITICAL;

    // S.45(a): Reasonable expenses of administration (Taxes, Legal fees)
    if (category === DebtCategory.TAXES_OWED) return DebtPriority.CRITICAL;

    // S.45(b): Creditors holding security (Mortgages, secured loans)
    if (isSecured || category === DebtCategory.MORTGAGE) return DebtPriority.HIGH;

    // S.45(c): Deferred debts (Medical usually falls here or Critical depending on timing)
    if (category === DebtCategory.MEDICAL_BILLS) return DebtPriority.MEDIUM;

    // S.45(d): General unsecured creditors
    return DebtPriority.LOW;
  }

  makePayment(amount: number): void {
    if (amount <= 0) throw new Error('Payment amount must be positive');
    if (amount > this.props.outstandingBalance)
      throw new Error('Payment exceeds outstanding balance');

    this.props.outstandingBalance -= amount;

    if (this.props.outstandingBalance === 0) {
      this.props.status = DebtStatus.PAID_IN_FULL;
    } else {
      this.props.status = DebtStatus.PARTIALLY_PAID;
    }
    this.props.updatedAt = new Date();
  }

  secure(details: string): void {
    this.props.isSecured = true;
    this.props.securityDetails = details;
    // Securing a debt upgrades its priority (S.45b)
    if (this.props.priority !== DebtPriority.CRITICAL) {
      this.props.priority = DebtPriority.HIGH;
    }
    this.props.updatedAt = new Date();
  }

  writeOff(reason?: string): void {
    this.props.outstandingBalance = 0;
    this.props.status = DebtStatus.WRITTEN_OFF;
    if (reason) this.props.description += ` [WRITTEN OFF: ${reason}]`;
    this.props.updatedAt = new Date();
  }

  // --- GETTERS ---
  get id() {
    return this.props.id;
  }
  get estateId() {
    return this.props.estateId;
  }
  get category() {
    return this.props.category;
  }
  get priority() {
    return this.props.priority;
  }
  get status() {
    return this.props.status;
  }
  get outstandingBalance() {
    return this.props.outstandingBalance;
  }
  get isSecured() {
    return this.props.isSecured;
  }

  toJSON(): DebtProps {
    return { ...this.props };
  }
}
