// domain/value-objects/financial/bride-price.vo.ts
import { ValueObject } from '../../base/value-object';

export type BridePriceStatus =
  | 'PENDING'
  | 'PARTIALLY_PAID'
  | 'FULLY_PAID'
  | 'WAIVED'
  | 'DEFERRED'
  | 'DISPUTED';

export type PaymentType = 'LIVESTOCK' | 'CASH' | 'GOODS' | 'SERVICE' | 'LAND' | 'OTHER';

export interface BridePricePayment {
  type: PaymentType;
  description: string;
  quantity?: number;
  valuePerUnit?: number;
  totalValue: number;
  date: Date;
  receivedBy?: string;
  witnesses: string[];
  receiptDocumentId?: string;
}

export interface BridePriceProps {
  totalAmountAgreed: number;
  currency: string;
  status: BridePriceStatus;
  payments: BridePricePayment[];
  agreedDate: Date;
  deadlineDate?: Date;
  customaryRequirements: string[];
  elderWitnesses: string[];
  isRegistered: boolean;
  registrationNumber?: string;
  registrationDate?: Date;
  notes?: string;
  disputeReason?: string;
  disputeResolvedDate?: Date;
}

export class BridePrice extends ValueObject<BridePriceProps> {
  private constructor(props: BridePriceProps) {
    super(props);
    this.validate();
  }

  static create(totalAmountAgreed: number, currency: string = 'KES'): BridePrice {
    return new BridePrice({
      totalAmountAgreed,
      currency,
      status: 'PENDING',
      payments: [],
      agreedDate: new Date(),
      customaryRequirements: [],
      elderWitnesses: [],
      isRegistered: false,
    });
  }

  static createFromProps(props: BridePriceProps): BridePrice {
    return new BridePrice(props);
  }

  validate(): void {
    // Amount validation
    if (this._value.totalAmountAgreed < 0) {
      throw new Error('Total bride price amount cannot be negative');
    }

    // Currency validation
    if (!this._value.currency || this._value.currency.length !== 3) {
      throw new Error('Currency must be a 3-letter code');
    }

    // Date validation
    if (this._value.agreedDate > new Date()) {
      throw new Error('Agreement date cannot be in the future');
    }

    if (this._value.deadlineDate && this._value.deadlineDate < this._value.agreedDate) {
      throw new Error('Deadline date cannot be before agreement date');
    }

    if (this._value.registrationDate && this._value.registrationDate > new Date()) {
      throw new Error('Registration date cannot be in the future');
    }

    // Payment validation
    let totalPaid = 0;
    for (const payment of this._value.payments) {
      this.validatePayment(payment);
      totalPaid += payment.totalValue;
    }

    // Status validation
    if (totalPaid > this._value.totalAmountAgreed * 1.1) {
      throw new Error('Total payments exceed agreed amount by more than 10%');
    }

    // Registration validation
    if (this._value.isRegistered && !this._value.registrationNumber) {
      throw new Error('Registration number is required for registered bride price');
    }

    // Dispute validation
    if (this._value.disputeReason && !this._value.disputeResolvedDate) {
      console.warn('Bride price dispute recorded but not resolved');
    }
  }

  private validatePayment(payment: BridePricePayment): void {
    if (payment.totalValue <= 0) {
      throw new Error('Payment value must be greater than zero');
    }

    if (payment.date > new Date()) {
      throw new Error('Payment date cannot be in the future');
    }

    // Validate calculation if quantity and value per unit are provided
    if (payment.quantity !== undefined && payment.valuePerUnit !== undefined) {
      const calculatedValue = payment.quantity * payment.valuePerUnit;
      if (Math.abs(calculatedValue - payment.totalValue) > 0.01) {
        throw new Error('Payment total value does not match quantity * value per unit');
      }
    }

    // Validate witnesses
    if (payment.witnesses.length === 0) {
      console.warn('Payment recorded without witnesses');
    }
  }

  addPayment(payment: BridePricePayment): BridePrice {
    this.validatePayment(payment);

    const payments = [...this._value.payments, payment];
    const totalPaid = this.calculateTotalPaid(payments);

    let status = this._value.status;
    if (totalPaid >= this._value.totalAmountAgreed) {
      status = 'FULLY_PAID';
    } else if (totalPaid > 0) {
      status = 'PARTIALLY_PAID';
    }

    return new BridePrice({
      ...this._value,
      payments,
      status,
    });
  }

  removePayment(index: number): BridePrice {
    const payments = this._value.payments.filter((_, i) => i !== index);
    const totalPaid = this.calculateTotalPaid(payments);

    let status = this._value.status;
    if (totalPaid === 0) {
      status = 'PENDING';
    } else if (totalPaid < this._value.totalAmountAgreed) {
      status = 'PARTIALLY_PAID';
    }

    return new BridePrice({
      ...this._value,
      payments,
      status,
    });
  }

  updateTotalAmount(newAmount: number): BridePrice {
    if (newAmount < this.totalPaid) {
      throw new Error('New amount cannot be less than already paid amount');
    }

    let status = this._value.status;
    if (this.totalPaid >= newAmount) {
      status = 'FULLY_PAID';
    } else if (this.totalPaid > 0) {
      status = 'PARTIALLY_PAID';
    }

    return new BridePrice({
      ...this._value,
      totalAmountAgreed: newAmount,
      status,
    });
  }

  markAsWaived(): BridePrice {
    return new BridePrice({
      ...this._value,
      status: 'WAIVED',
    });
  }

  markAsDisputed(reason: string): BridePrice {
    return new BridePrice({
      ...this._value,
      status: 'DISPUTED',
      disputeReason: reason,
    });
  }

  resolveDispute(resolutionDate: Date): BridePrice {
    return new BridePrice({
      ...this._value,
      status: this.totalPaid >= this._value.totalAmountAgreed ? 'FULLY_PAID' : 'PARTIALLY_PAID',
      disputeResolvedDate: resolutionDate,
    });
  }

  register(registrationNumber: string, registrationDate: Date): BridePrice {
    return new BridePrice({
      ...this._value,
      isRegistered: true,
      registrationNumber,
      registrationDate,
    });
  }

  addCustomaryRequirement(requirement: string): BridePrice {
    const customaryRequirements = [...this._value.customaryRequirements, requirement];
    return new BridePrice({
      ...this._value,
      customaryRequirements,
    });
  }

  addElderWitness(witness: string): BridePrice {
    const elderWitnesses = [...this._value.elderWitnesses, witness];
    return new BridePrice({
      ...this._value,
      elderWitnesses,
    });
  }

  setDeadline(deadlineDate: Date): BridePrice {
    return new BridePrice({
      ...this._value,
      deadlineDate,
    });
  }

  addNotes(notes: string): BridePrice {
    return new BridePrice({
      ...this._value,
      notes,
    });
  }

  private calculateTotalPaid(payments: BridePricePayment[]): number {
    return payments.reduce((total, payment) => total + payment.totalValue, 0);
  }

  get totalAmountAgreed(): number {
    return this._value.totalAmountAgreed;
  }

  get currency(): string {
    return this._value.currency;
  }

  get status(): BridePriceStatus {
    return this._value.status;
  }

  get payments(): BridePricePayment[] {
    return [...this._value.payments];
  }

  get agreedDate(): Date {
    return this._value.agreedDate;
  }

  get deadlineDate(): Date | undefined {
    return this._value.deadlineDate;
  }

  get customaryRequirements(): string[] {
    return [...this._value.customaryRequirements];
  }

  get elderWitnesses(): string[] {
    return [...this._value.elderWitnesses];
  }

  get isRegistered(): boolean {
    return this._value.isRegistered;
  }

  get registrationNumber(): string | undefined {
    return this._value.registrationNumber;
  }

  get registrationDate(): Date | undefined {
    return this._value.registrationDate;
  }

  get notes(): string | undefined {
    return this._value.notes;
  }

  get disputeReason(): string | undefined {
    return this._value.disputeReason;
  }

  get disputeResolvedDate(): Date | undefined {
    return this._value.disputeResolvedDate;
  }

  // Calculated properties

  get totalPaid(): number {
    return this.calculateTotalPaid(this._value.payments);
  }

  get balance(): number {
    return Math.max(0, this._value.totalAmountAgreed - this.totalPaid);
  }

  get paymentPercentage(): number {
    if (this._value.totalAmountAgreed === 0) return 0;
    return (this.totalPaid / this._value.totalAmountAgreed) * 100;
  }

  get isFullyPaid(): boolean {
    return this.status === 'FULLY_PAID' || this.totalPaid >= this._value.totalAmountAgreed;
  }

  get isPartiallyPaid(): boolean {
    return (
      this.status === 'PARTIALLY_PAID' ||
      (this.totalPaid > 0 && this.totalPaid < this._value.totalAmountAgreed)
    );
  }

  get isPending(): boolean {
    return this.status === 'PENDING' || this.totalPaid === 0;
  }

  get isOverdue(): boolean {
    if (!this._value.deadlineDate || this.isFullyPaid) return false;
    return this._value.deadlineDate < new Date();
  }

  get daysUntilDeadline(): number | null {
    if (!this._value.deadlineDate || this.isFullyPaid) return null;

    const now = new Date();
    const diffTime = this._value.deadlineDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get paymentBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};

    for (const payment of this._value.payments) {
      const type = payment.type;
      breakdown[type] = (breakdown[type] || 0) + payment.totalValue;
    }

    return breakdown;
  }

  get lastPaymentDate(): Date | null {
    if (this._value.payments.length === 0) return null;

    const dates = this._value.payments.map((p) => p.date.getTime());
    const lastDate = new Date(Math.max(...dates));
    return lastDate;
  }

  get hasDispute(): boolean {
    return this._value.status === 'DISPUTED' || !!this._value.disputeReason;
  }

  get isDisputeResolved(): boolean {
    return this.hasDispute && !!this._value.disputeResolvedDate;
  }

  // Kenyan customary validation

  get meetsCustomaryRequirements(): boolean {
    return this._value.customaryRequirements.length > 0 && this._value.elderWitnesses.length >= 2;
  }

  get isLegallyValid(): boolean {
    // Bride price is legally valid if registered or meets customary requirements
    return this._value.isRegistered || this.meetsCustomaryRequirements;
  }

  get formattedTotalAmount(): string {
    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: this._value.currency,
      minimumFractionDigits: 0,
    });
    return formatter.format(this._value.totalAmountAgreed);
  }

  get formattedTotalPaid(): string {
    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: this._value.currency,
      minimumFractionDigits: 0,
    });
    return formatter.format(this.totalPaid);
  }

  get formattedBalance(): string {
    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: this._value.currency,
      minimumFractionDigits: 0,
    });
    return formatter.format(this.balance);
  }

  toJSON() {
    return {
      totalAmountAgreed: this._value.totalAmountAgreed,
      currency: this._value.currency,
      status: this._value.status,
      payments: this._value.payments.map((payment) => ({
        ...payment,
        date: payment.date.toISOString(),
      })),
      agreedDate: this._value.agreedDate.toISOString(),
      deadlineDate: this._value.deadlineDate?.toISOString(),
      customaryRequirements: this._value.customaryRequirements,
      elderWitnesses: this._value.elderWitnesses,
      isRegistered: this._value.isRegistered,
      registrationNumber: this._value.registrationNumber,
      registrationDate: this._value.registrationDate?.toISOString(),
      notes: this._value.notes,
      disputeReason: this._value.disputeReason,
      disputeResolvedDate: this._value.disputeResolvedDate?.toISOString(),
      totalPaid: this.totalPaid,
      balance: this.balance,
      paymentPercentage: this.paymentPercentage,
      isFullyPaid: this.isFullyPaid,
      isPartiallyPaid: this.isPartiallyPaid,
      isPending: this.isPending,
      isOverdue: this.isOverdue,
      daysUntilDeadline: this.daysUntilDeadline,
      paymentBreakdown: this.paymentBreakdown,
      lastPaymentDate: this.lastPaymentDate?.toISOString(),
      hasDispute: this.hasDispute,
      isDisputeResolved: this.isDisputeResolved,
      meetsCustomaryRequirements: this.meetsCustomaryRequirements,
      isLegallyValid: this.isLegallyValid,
      formattedTotalAmount: this.formattedTotalAmount,
      formattedTotalPaid: this.formattedTotalPaid,
      formattedBalance: this.formattedBalance,
    };
  }
}
