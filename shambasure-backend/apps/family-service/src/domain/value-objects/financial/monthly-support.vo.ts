// domain/value-objects/financial/monthly-support.vo.ts
import { ValueObject } from '../../base/value-object';

export type SupportCategory =
  | 'FOOD'
  | 'HOUSING'
  | 'EDUCATION'
  | 'HEALTHCARE'
  | 'TRANSPORT'
  | 'CLOTHING'
  | 'UTILITIES'
  | 'PERSONAL_CARE'
  | 'ENTERTAINMENT'
  | 'OTHER';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'MPESA'
  | 'CHEQUE'
  | 'DIRECT_DEPOSIT'
  | 'OTHER';

export interface MonthlySupportProps {
  amount: number;
  currency: string;
  category: SupportCategory;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  startDate: Date;
  endDate?: Date;
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  isRecurring: boolean;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  receiptDocumentIds: string[];
  notes?: string;
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export class MonthlySupport extends ValueObject<MonthlySupportProps> {
  private constructor(props: MonthlySupportProps) {
    super(props);
    this.validate();
  }

  static create(
    amount: number,
    currency: string = 'KES',
    category: SupportCategory,
    paymentMethod: PaymentMethod,
    frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' = 'MONTHLY',
  ): MonthlySupport {
    return new MonthlySupport({
      amount,
      currency,
      category,
      paymentMethod,
      startDate: new Date(),
      frequency,
      isRecurring: true,
      receiptDocumentIds: [],
      isVerified: false,
    });
  }

  static createFromProps(props: MonthlySupportProps): MonthlySupport {
    return new MonthlySupport(props);
  }

  validate(): void {
    // Amount validation
    if (this._value.amount <= 0) {
      throw new Error('Support amount must be greater than zero');
    }

    // Currency validation
    if (!this._value.currency || this._value.currency.length !== 3) {
      throw new Error('Currency must be a 3-letter code');
    }

    // Date validation
    if (this._value.startDate > new Date()) {
      throw new Error('Start date cannot be in the future');
    }

    if (this._value.endDate && this._value.endDate < this._value.startDate) {
      throw new Error('End date cannot be before start date');
    }

    if (this._value.lastPaymentDate && this._value.lastPaymentDate > new Date()) {
      throw new Error('Last payment date cannot be in the future');
    }

    if (this._value.nextPaymentDate && this._value.nextPaymentDate < new Date()) {
      throw new Error('Next payment date cannot be in the past');
    }

    // Verified status validation
    if (this._value.isVerified && !this._value.verifiedAt) {
      throw new Error('Verification date is required when support is verified');
    }

    // Payment method validation for large amounts
    if (this._value.amount > 1000000 && this._value.paymentMethod === 'CASH') {
      console.warn('Large cash payments may require additional documentation');
    }

    // Kenyan MPESA validation
    if (this._value.paymentMethod === 'MPESA' && !this._value.paymentReference) {
      throw new Error('MPESA payment requires a transaction reference');
    }
  }

  updateAmount(amount: number): MonthlySupport {
    return new MonthlySupport({
      ...this._value,
      amount,
    });
  }

  updateCategory(category: SupportCategory): MonthlySupport {
    return new MonthlySupport({
      ...this._value,
      category,
    });
  }

  updatePaymentMethod(method: PaymentMethod, reference?: string): MonthlySupport {
    return new MonthlySupport({
      ...this._value,
      paymentMethod: method,
      paymentReference: reference || this._value.paymentReference,
    });
  }

  updateDates(startDate: Date, endDate?: Date): MonthlySupport {
    return new MonthlySupport({
      ...this._value,
      startDate,
      endDate,
    });
  }

  updateFrequency(
    frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
  ): MonthlySupport {
    return new MonthlySupport({
      ...this._value,
      frequency,
    });
  }

  markAsOneTime(): MonthlySupport {
    return new MonthlySupport({
      ...this._value,
      isRecurring: false,
      endDate: new Date(),
    });
  }

  markAsRecurring(): MonthlySupport {
    return new MonthlySupport({
      ...this._value,
      isRecurring: true,
      endDate: undefined,
    });
  }

  recordPayment(paymentDate: Date, receiptId?: string): MonthlySupport {
    const receiptDocumentIds = receiptId
      ? [...this._value.receiptDocumentIds, receiptId]
      : this._value.receiptDocumentIds;

    // Calculate next payment date
    const nextPaymentDate = this.calculateNextPaymentDate(paymentDate);

    return new MonthlySupport({
      ...this._value,
      lastPaymentDate: paymentDate,
      nextPaymentDate,
      receiptDocumentIds,
    });
  }

  addReceipt(receiptId: string): MonthlySupport {
    const receiptDocumentIds = [...this._value.receiptDocumentIds, receiptId];
    return new MonthlySupport({
      ...this._value,
      receiptDocumentIds,
    });
  }

  verify(verifiedBy: string): MonthlySupport {
    return new MonthlySupport({
      ...this._value,
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy,
    });
  }

  addNotes(notes: string): MonthlySupport {
    return new MonthlySupport({
      ...this._value,
      notes,
    });
  }

  private calculateNextPaymentDate(lastPaymentDate: Date): Date | undefined {
    if (!this._value.isRecurring) return undefined;

    const nextDate = new Date(lastPaymentDate);

    switch (this._value.frequency) {
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'BIWEEKLY':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'YEARLY':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate;
  }

  get amount(): number {
    return this._value.amount;
  }

  get currency(): string {
    return this._value.currency;
  }

  get category(): SupportCategory {
    return this._value.category;
  }

  get paymentMethod(): PaymentMethod {
    return this._value.paymentMethod;
  }

  get paymentReference(): string | undefined {
    return this._value.paymentReference;
  }

  get startDate(): Date {
    return this._value.startDate;
  }

  get endDate(): Date | undefined {
    return this._value.endDate;
  }

  get frequency(): string {
    return this._value.frequency;
  }

  get isRecurring(): boolean {
    return this._value.isRecurring;
  }

  get lastPaymentDate(): Date | undefined {
    return this._value.lastPaymentDate;
  }

  get nextPaymentDate(): Date | undefined {
    return this._value.nextPaymentDate;
  }

  get receiptDocumentIds(): string[] {
    return [...this._value.receiptDocumentIds];
  }

  get notes(): string | undefined {
    return this._value.notes;
  }

  get isVerified(): boolean {
    return this._value.isVerified;
  }

  get verifiedAt(): Date | undefined {
    return this._value.verifiedAt;
  }

  get verifiedBy(): string | undefined {
    return this._value.verifiedBy;
  }

  // Calculated properties

  get monthlyEquivalent(): number {
    switch (this._value.frequency) {
      case 'WEEKLY':
        return this._value.amount * 4.33;
      case 'BIWEEKLY':
        return this._value.amount * 2.165;
      case 'MONTHLY':
        return this._value.amount;
      case 'QUARTERLY':
        return this._value.amount / 3;
      case 'YEARLY':
        return this._value.amount / 12;
      default:
        return this._value.amount;
    }
  }

  get annualEquivalent(): number {
    return this.monthlyEquivalent * 12;
  }

  get isActive(): boolean {
    if (!this._value.isRecurring) return false;
    if (this._value.endDate && this._value.endDate < new Date()) return false;
    return true;
  }

  get isOverdue(): boolean {
    if (!this._value.isRecurring || !this._value.nextPaymentDate) return false;
    return this._value.nextPaymentDate < new Date();
  }

  get daysUntilNextPayment(): number | null {
    if (!this._value.nextPaymentDate) return null;

    const now = new Date();
    const diffTime = this._value.nextPaymentDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get supportDurationDays(): number {
    const endDate = this._value.endDate || new Date();
    const diffTime = endDate.getTime() - this._value.startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get supportDurationMonths(): number {
    return this.supportDurationDays / 30.44;
  }

  get totalPaid(): number {
    if (!this._value.isRecurring) return this._value.amount;

    const paymentsCount = Math.floor(this.supportDurationDays / this.paymentIntervalDays);
    return paymentsCount * this._value.amount;
  }

  private get paymentIntervalDays(): number {
    switch (this._value.frequency) {
      case 'WEEKLY':
        return 7;
      case 'BIWEEKLY':
        return 14;
      case 'MONTHLY':
        return 30;
      case 'QUARTERLY':
        return 90;
      case 'YEARLY':
        return 365;
      default:
        return 30;
    }
  }

  // Kenyan specific validations

  get requiresKraReceipt(): boolean {
    // KRA requires receipts for payments over KES 24,000 annually
    return this.annualEquivalent > 24000;
  }

  get isSubstantialSupport(): boolean {
    // Consider substantial if monthly equivalent > KES 10,000
    return this.monthlyEquivalent > 10000;
  }

  get formattedAmount(): string {
    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: this._value.currency,
      minimumFractionDigits: 0,
    });
    return formatter.format(this._value.amount);
  }

  get formattedMonthlyEquivalent(): string {
    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: this._value.currency,
      minimumFractionDigits: 0,
    });
    return formatter.format(this.monthlyEquivalent);
  }

  toJSON() {
    return {
      amount: this._value.amount,
      currency: this._value.currency,
      category: this._value.category,
      paymentMethod: this._value.paymentMethod,
      paymentReference: this._value.paymentReference,
      startDate: this._value.startDate.toISOString(),
      endDate: this._value.endDate?.toISOString(),
      frequency: this._value.frequency,
      isRecurring: this._value.isRecurring,
      lastPaymentDate: this._value.lastPaymentDate?.toISOString(),
      nextPaymentDate: this._value.nextPaymentDate?.toISOString(),
      receiptDocumentIds: this._value.receiptDocumentIds,
      notes: this._value.notes,
      isVerified: this._value.isVerified,
      verifiedAt: this._value.verifiedAt?.toISOString(),
      verifiedBy: this._value.verifiedBy,
      monthlyEquivalent: this.monthlyEquivalent,
      annualEquivalent: this.annualEquivalent,
      isActive: this.isActive,
      isOverdue: this.isOverdue,
      daysUntilNextPayment: this.daysUntilNextPayment,
      supportDurationDays: this.supportDurationDays,
      supportDurationMonths: this.supportDurationMonths,
      totalPaid: this.totalPaid,
      requiresKraReceipt: this.requiresKraReceipt,
      isSubstantialSupport: this.isSubstantialSupport,
      formattedAmount: this.formattedAmount,
      formattedMonthlyEquivalent: this.formattedMonthlyEquivalent,
    };
  }
}
