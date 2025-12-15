// domain/value-objects/financial/allowance-amount.vo.ts
import { ValueObject } from '../../base/value-object';

export type AllowanceType =
  | 'GUARDIAN_ALLOWANCE'
  | 'DEPENDANT_ALLOWANCE'
  | 'EDUCATION_ALLOWANCE'
  | 'MEDICAL_ALLOWANCE'
  | 'MAINTENANCE_ALLOWANCE'
  | 'SPECIAL_ALLOWANCE'
  | 'OTHER';

export type AllowanceStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'TERMINATED'
  | 'EXPIRED';

export interface AllowancePayment {
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  transactionReference?: string;
  receiptDocumentId?: string;
  notes?: string;
}

export interface AllowanceAmountProps {
  allowanceType: AllowanceType;
  amount: number;
  currency: string;
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LUMP_SUM';
  status: AllowanceStatus;
  startDate: Date;
  endDate?: Date;
  recipientId: string;
  recipientName: string;
  recipientRelationship: string;
  approvedBy?: string;
  approvedDate?: Date;
  courtOrderReference?: string;
  courtOrderDate?: Date;
  paymentHistory: AllowancePayment[];
  conditions: string[];
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  notes?: string;
  reviewDate?: Date;
  requiresReview: boolean;
}

export class AllowanceAmount extends ValueObject<AllowanceAmountProps> {
  private constructor(props: AllowanceAmountProps) {
    super(props);
    this.validate();
  }

  static create(
    allowanceType: AllowanceType,
    amount: number,
    frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LUMP_SUM',
    recipientId: string,
    recipientName: string,
    recipientRelationship: string,
    currency: string = 'KES',
  ): AllowanceAmount {
    return new AllowanceAmount({
      allowanceType,
      amount,
      currency,
      frequency,
      status: 'PENDING_APPROVAL',
      startDate: new Date(),
      recipientId,
      recipientName,
      recipientRelationship,
      paymentHistory: [],
      conditions: [],
      requiresReview: true,
    });
  }

  static createFromProps(props: AllowanceAmountProps): AllowanceAmount {
    return new AllowanceAmount(props);
  }

  validate(): void {
    // Amount validation
    if (this._value.amount <= 0) {
      throw new Error('Allowance amount must be greater than zero');
    }

    // Currency validation
    if (!this._value.currency || this._value.currency.length !== 3) {
      throw new Error('Currency must be a 3-letter code');
    }

    // Recipient validation
    if (!this._value.recipientId || this._value.recipientId.trim().length === 0) {
      throw new Error('Recipient ID is required');
    }

    if (!this._value.recipientName || this._value.recipientName.trim().length < 2) {
      throw new Error('Valid recipient name is required');
    }

    if (
      !this._value.recipientRelationship ||
      this._value.recipientRelationship.trim().length === 0
    ) {
      throw new Error('Recipient relationship is required');
    }

    // Date validation
    if (this._value.startDate > new Date()) {
      throw new Error('Start date cannot be in the future');
    }

    if (this._value.endDate && this._value.endDate < this._value.startDate) {
      throw new Error('End date cannot be before start date');
    }

    if (this._value.approvedDate && this._value.approvedDate > new Date()) {
      throw new Error('Approval date cannot be in the future');
    }

    if (this._value.courtOrderDate && this._value.courtOrderDate > new Date()) {
      throw new Error('Court order date cannot be in the future');
    }

    if (this._value.reviewDate && this._value.reviewDate < new Date()) {
      throw new Error('Review date cannot be in the past');
    }

    // Approval validation
    if (this._value.status === 'APPROVED' && !this._value.approvedDate) {
      throw new Error('Approval date is required for approved allowances');
    }

    if (this._value.approvedBy && !this._value.approvedDate) {
      throw new Error('Approval date is required when approver is specified');
    }

    // Court order validation
    if (this._value.courtOrderReference && !this._value.courtOrderDate) {
      throw new Error('Court order date is required when court order reference is provided');
    }

    // Payment validation
    for (const payment of this._value.paymentHistory) {
      this.validatePayment(payment);
    }

    // Guardian allowance specific validation (S.73 LSA)
    if (this._value.allowanceType === 'GUARDIAN_ALLOWANCE' && !this._value.courtOrderReference) {
      console.warn('Guardian allowances typically require court approval');
    }

    // Dependant allowance validation (S.29 LSA)
    if (this._value.allowanceType === 'DEPENDANT_ALLOWANCE' && !this._value.courtOrderReference) {
      console.warn('Dependant allowances may require court approval for S.29 compliance');
    }
  }

  private validatePayment(payment: AllowancePayment): void {
    if (payment.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    if (payment.paymentDate > new Date()) {
      throw new Error('Payment date cannot be in the future');
    }

    if (!payment.paymentMethod || payment.paymentMethod.trim().length === 0) {
      throw new Error('Payment method is required');
    }
  }

  approve(
    approvedBy: string,
    courtOrderReference?: string,
    courtOrderDate?: Date,
  ): AllowanceAmount {
    return new AllowanceAmount({
      ...this._value,
      status: 'APPROVED',
      approvedBy,
      approvedDate: new Date(),
      courtOrderReference: courtOrderReference || this._value.courtOrderReference,
      courtOrderDate: courtOrderDate || this._value.courtOrderDate,
    });
  }

  activate(): AllowanceAmount {
    if (this._value.status !== 'APPROVED') {
      throw new Error('Can only activate allowances from APPROVED status');
    }

    return new AllowanceAmount({
      ...this._value,
      status: 'ACTIVE',
    });
  }

  suspend(): AllowanceAmount {
    return new AllowanceAmount({
      ...this._value,
      status: 'SUSPENDED',
    });
  }

  terminate(): AllowanceAmount {
    return new AllowanceAmount({
      ...this._value,
      status: 'TERMINATED',
      endDate: new Date(),
    });
  }

  updateAmount(newAmount: number): AllowanceAmount {
    return new AllowanceAmount({
      ...this._value,
      amount: newAmount,
    });
  }

  updateFrequency(
    newFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LUMP_SUM',
  ): AllowanceAmount {
    return new AllowanceAmount({
      ...this._value,
      frequency: newFrequency,
    });
  }

  recordPayment(payment: AllowancePayment): AllowanceAmount {
    this.validatePayment(payment);

    const paymentHistory = [...this._value.paymentHistory, payment];
    const nextPaymentDate = this.calculateNextPaymentDate(payment.paymentDate);

    return new AllowanceAmount({
      ...this._value,
      paymentHistory,
      lastPaymentDate: payment.paymentDate,
      nextPaymentDate,
    });
  }

  addCondition(condition: string): AllowanceAmount {
    const conditions = [...this._value.conditions, condition];
    return new AllowanceAmount({
      ...this._value,
      conditions,
    });
  }

  removeCondition(index: number): AllowanceAmount {
    const conditions = this._value.conditions.filter((_, i) => i !== index);
    return new AllowanceAmount({
      ...this._value,
      conditions,
    });
  }

  scheduleReview(reviewDate: Date): AllowanceAmount {
    if (reviewDate <= new Date()) {
      throw new Error('Review date must be in the future');
    }

    return new AllowanceAmount({
      ...this._value,
      reviewDate,
      requiresReview: true,
    });
  }

  markAsReviewed(): AllowanceAmount {
    return new AllowanceAmount({
      ...this._value,
      reviewDate: new Date(),
      requiresReview: false,
    });
  }

  updateRecipientDetails(name: string, relationship: string): AllowanceAmount {
    return new AllowanceAmount({
      ...this._value,
      recipientName: name,
      recipientRelationship: relationship,
    });
  }

  addNotes(notes: string): AllowanceAmount {
    return new AllowanceAmount({
      ...this._value,
      notes,
    });
  }

  private calculateNextPaymentDate(lastPaymentDate: Date): Date | undefined {
    if (this._value.frequency === 'LUMP_SUM') return undefined;
    if (this._value.status !== 'ACTIVE') return undefined;

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

  get allowanceType(): AllowanceType {
    return this._value.allowanceType;
  }

  get amount(): number {
    return this._value.amount;
  }

  get currency(): string {
    return this._value.currency;
  }

  get frequency(): string {
    return this._value.frequency;
  }

  get status(): AllowanceStatus {
    return this._value.status;
  }

  get startDate(): Date {
    return this._value.startDate;
  }

  get endDate(): Date | undefined {
    return this._value.endDate;
  }

  get recipientId(): string {
    return this._value.recipientId;
  }

  get recipientName(): string {
    return this._value.recipientName;
  }

  get recipientRelationship(): string {
    return this._value.recipientRelationship;
  }

  get approvedBy(): string | undefined {
    return this._value.approvedBy;
  }

  get approvedDate(): Date | undefined {
    return this._value.approvedDate;
  }

  get courtOrderReference(): string | undefined {
    return this._value.courtOrderReference;
  }

  get courtOrderDate(): Date | undefined {
    return this._value.courtOrderDate;
  }

  get paymentHistory(): AllowancePayment[] {
    return [...this._value.paymentHistory];
  }

  get conditions(): string[] {
    return [...this._value.conditions];
  }

  get lastPaymentDate(): Date | undefined {
    return this._value.lastPaymentDate;
  }

  get nextPaymentDate(): Date | undefined {
    return this._value.nextPaymentDate;
  }

  get notes(): string | undefined {
    return this._value.notes;
  }

  get reviewDate(): Date | undefined {
    return this._value.reviewDate;
  }

  get requiresReview(): boolean {
    return this._value.requiresReview;
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
      case 'LUMP_SUM':
        return this._value.amount; // Treat lump sum as one-time
      default:
        return this._value.amount;
    }
  }

  get annualEquivalent(): number {
    if (this._value.frequency === 'LUMP_SUM') return this._value.amount;
    return this.monthlyEquivalent * 12;
  }

  get isActive(): boolean {
    return this._value.status === 'ACTIVE';
  }

  get isApproved(): boolean {
    return this._value.status === 'APPROVED' || this._value.status === 'ACTIVE';
  }

  get isPending(): boolean {
    return this._value.status === 'PENDING_APPROVAL';
  }

  get isTerminated(): boolean {
    return this._value.status === 'TERMINATED' || this._value.status === 'EXPIRED';
  }

  get isSuspended(): boolean {
    return this._value.status === 'SUSPENDED';
  }

  get totalPaid(): number {
    return this._value.paymentHistory.reduce((total, payment) => total + payment.amount, 0);
  }

  get totalPaymentsCount(): number {
    return this._value.paymentHistory.length;
  }

  get averagePaymentAmount(): number {
    if (this.totalPaymentsCount === 0) return 0;
    return this.totalPaid / this.totalPaymentsCount;
  }

  get isOverdue(): boolean {
    if (!this._value.nextPaymentDate || !this.isActive) return false;
    return this._value.nextPaymentDate < new Date();
  }

  get daysUntilNextPayment(): number | null {
    if (!this._value.nextPaymentDate || !this.isActive) return null;

    const now = new Date();
    const diffTime = this._value.nextPaymentDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get allowanceDurationDays(): number {
    const endDate = this._value.endDate || new Date();
    const diffTime = endDate.getTime() - this._value.startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get allowanceDurationMonths(): number {
    return this.allowanceDurationDays / 30.44;
  }

  get isCourtOrdered(): boolean {
    return !!this._value.courtOrderReference;
  }

  get hasConditions(): boolean {
    return this._value.conditions.length > 0;
  }

  // Kenyan legal compliance

  get requiresCourtApproval(): boolean {
    // Certain allowances require court approval in Kenya
    return (
      this._value.allowanceType === 'GUARDIAN_ALLOWANCE' ||
      this._value.allowanceType === 'DEPENDANT_ALLOWANCE' ||
      this.monthlyEquivalent > 50000
    ); // Large allowances may need approval
  }

  get meetsLegalRequirements(): boolean {
    if (this.requiresCourtApproval && !this.isCourtOrdered) {
      return false;
    }

    // Guardian allowances must be reasonable (S.73 LSA)
    if (this._value.allowanceType === 'GUARDIAN_ALLOWANCE' && this.monthlyEquivalent > 100000) {
      console.warn('Guardian allowance appears high - may need court justification');
    }

    return true;
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

  get formattedTotalPaid(): string {
    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: this._value.currency,
      minimumFractionDigits: 0,
    });
    return formatter.format(this.totalPaid);
  }

  toJSON() {
    return {
      allowanceType: this._value.allowanceType,
      amount: this._value.amount,
      currency: this._value.currency,
      frequency: this._value.frequency,
      status: this._value.status,
      startDate: this._value.startDate.toISOString(),
      endDate: this._value.endDate?.toISOString(),
      recipientId: this._value.recipientId,
      recipientName: this._value.recipientName,
      recipientRelationship: this._value.recipientRelationship,
      approvedBy: this._value.approvedBy,
      approvedDate: this._value.approvedDate?.toISOString(),
      courtOrderReference: this._value.courtOrderReference,
      courtOrderDate: this._value.courtOrderDate?.toISOString(),
      paymentHistory: this._value.paymentHistory.map((payment) => ({
        ...payment,
        paymentDate: payment.paymentDate.toISOString(),
      })),
      conditions: this._value.conditions,
      lastPaymentDate: this._value.lastPaymentDate?.toISOString(),
      nextPaymentDate: this._value.nextPaymentDate?.toISOString(),
      notes: this._value.notes,
      reviewDate: this._value.reviewDate?.toISOString(),
      requiresReview: this._value.requiresReview,
      monthlyEquivalent: this.monthlyEquivalent,
      annualEquivalent: this.annualEquivalent,
      isActive: this.isActive,
      isApproved: this.isApproved,
      isPending: this.isPending,
      isTerminated: this.isTerminated,
      isSuspended: this.isSuspended,
      totalPaid: this.totalPaid,
      totalPaymentsCount: this.totalPaymentsCount,
      averagePaymentAmount: this.averagePaymentAmount,
      isOverdue: this.isOverdue,
      daysUntilNextPayment: this.daysUntilNextPayment,
      allowanceDurationDays: this.allowanceDurationDays,
      allowanceDurationMonths: this.allowanceDurationMonths,
      isCourtOrdered: this.isCourtOrdered,
      hasConditions: this.hasConditions,
      requiresCourtApproval: this.requiresCourtApproval,
      meetsLegalRequirements: this.meetsLegalRequirements,
      formattedAmount: this.formattedAmount,
      formattedMonthlyEquivalent: this.formattedMonthlyEquivalent,
      formattedTotalPaid: this.formattedTotalPaid,
    };
  }
}
