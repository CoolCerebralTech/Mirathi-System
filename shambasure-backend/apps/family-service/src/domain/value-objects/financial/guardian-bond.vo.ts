// domain/value-objects/financial/guardian-bond.vo.ts
import { ValueObject } from '../../base/value-object';

export type BondType =
  | 'INSURANCE_BOND'
  | 'BANK_GUARANTEE'
  | 'CASH_SECURITY'
  | 'SURETY_BOND'
  | 'COURT_BOND'
  | 'OTHER';

export type BondStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'FORFEITED'
  | 'RELEASED'
  | 'CLAIMED'
  | 'LAPSED';

export interface GuardianBondProps {
  bondType: BondType;
  bondAmount: number;
  currency: string;
  status: BondStatus;
  bondNumber: string;
  issuerName: string;
  issuerContact?: string;
  issueDate: Date;
  expiryDate: Date;
  premiumAmount?: number;
  premiumFrequency?: 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'MONTHLY';
  lastPremiumDate?: Date;
  nextPremiumDue?: Date;
  suretyDetails?: {
    name: string;
    idNumber: string;
    relationship: string;
    contact: string;
  };
  courtOrderReference?: string;
  courtOrderDate?: Date;
  conditions: string[];
  forfeitureReason?: string;
  forfeitureDate?: Date;
  releaseDate?: Date;
  releaseReason?: string;
  releaseAuthorizedBy?: string;
  notes?: string;
}

export class GuardianBond extends ValueObject<GuardianBondProps> {
  private constructor(props: GuardianBondProps) {
    super(props);
    this.validate();
  }

  static create(
    bondType: BondType,
    bondAmount: number,
    bondNumber: string,
    issuerName: string,
    issueDate: Date,
    expiryDate: Date,
    currency: string = 'KES',
  ): GuardianBond {
    return new GuardianBond({
      bondType,
      bondAmount,
      currency,
      status: 'PENDING',
      bondNumber,
      issuerName,
      issueDate,
      expiryDate,
      conditions: [],
    });
  }

  static createFromProps(props: GuardianBondProps): GuardianBond {
    return new GuardianBond(props);
  }

  validate(): void {
    // Amount validation
    if (this._value.bondAmount <= 0) {
      throw new Error('Bond amount must be greater than zero');
    }

    // Currency validation
    if (!this._value.currency || this._value.currency.length !== 3) {
      throw new Error('Currency must be a 3-letter code');
    }

    // Bond number validation
    if (!this._value.bondNumber || this._value.bondNumber.trim().length === 0) {
      throw new Error('Bond number is required');
    }

    // Issuer validation
    if (!this._value.issuerName || this._value.issuerName.trim().length < 2) {
      throw new Error('Valid issuer name is required');
    }

    // Date validation
    if (this._value.issueDate > new Date()) {
      throw new Error('Issue date cannot be in the future');
    }

    if (this._value.expiryDate <= this._value.issueDate) {
      throw new Error('Expiry date must be after issue date');
    }

    // Premium validation
    if (this._value.premiumAmount !== undefined && this._value.premiumAmount < 0) {
      throw new Error('Premium amount cannot be negative');
    }

    if (this._value.premiumFrequency && !this._value.premiumAmount) {
      throw new Error('Premium amount is required when premium frequency is specified');
    }

    // Court order validation
    if (this._value.courtOrderReference && !this._value.courtOrderDate) {
      throw new Error('Court order date is required when court order reference is provided');
    }

    if (this._value.courtOrderDate && this._value.courtOrderDate > new Date()) {
      throw new Error('Court order date cannot be in the future');
    }

    // Status transition validation
    if (this._value.status === 'RELEASED' && !this._value.releaseDate) {
      throw new Error('Release date is required for released bonds');
    }

    if (this._value.status === 'FORFEITED' && !this._value.forfeitureDate) {
      throw new Error('Forfeiture date is required for forfeited bonds');
    }

    // For S.72 LSA compliance - Kenyan law
    if (this._value.bondType === 'COURT_BOND' && !this._value.courtOrderReference) {
      throw new Error('Court bonds require court order reference');
    }
  }

  activate(): GuardianBond {
    if (this._value.status !== 'PENDING') {
      throw new Error('Can only activate bonds from PENDING status');
    }

    return new GuardianBond({
      ...this._value,
      status: 'ACTIVE',
    });
  }

  recordPremiumPayment(amount: number, paymentDate: Date): GuardianBond {
    const nextPremiumDue = this.calculateNextPremiumDue(paymentDate);

    return new GuardianBond({
      ...this._value,
      premiumAmount: amount,
      lastPremiumDate: paymentDate,
      nextPremiumDue,
    });
  }

  updateExpiryDate(newExpiryDate: Date): GuardianBond {
    if (newExpiryDate <= this._value.issueDate) {
      throw new Error('New expiry date must be after issue date');
    }

    return new GuardianBond({
      ...this._value,
      expiryDate: newExpiryDate,
    });
  }

  addCondition(condition: string): GuardianBond {
    const conditions = [...this._value.conditions, condition];
    return new GuardianBond({
      ...this._value,
      conditions,
    });
  }

  removeCondition(index: number): GuardianBond {
    const conditions = this._value.conditions.filter((_, i) => i !== index);
    return new GuardianBond({
      ...this._value,
      conditions,
    });
  }

  markAsForfeited(reason: string, forfeitureDate: Date): GuardianBond {
    return new GuardianBond({
      ...this._value,
      status: 'FORFEITED',
      forfeitureReason: reason,
      forfeitureDate,
    });
  }

  markAsReleased(reason: string, authorizedBy: string, releaseDate: Date): GuardianBond {
    return new GuardianBond({
      ...this._value,
      status: 'RELEASED',
      releaseReason: reason,
      releaseAuthorizedBy: authorizedBy,
      releaseDate,
    });
  }

  markAsExpired(): GuardianBond {
    return new GuardianBond({
      ...this._value,
      status: 'EXPIRED',
    });
  }

  markAsLapsed(): GuardianBond {
    return new GuardianBond({
      ...this._value,
      status: 'LAPSED',
    });
  }

  updateSuretyDetails(
    name: string,
    idNumber: string,
    relationship: string,
    contact: string,
  ): GuardianBond {
    return new GuardianBond({
      ...this._value,
      suretyDetails: { name, idNumber, relationship, contact },
    });
  }

  addCourtOrder(reference: string, orderDate: Date): GuardianBond {
    return new GuardianBond({
      ...this._value,
      courtOrderReference: reference,
      courtOrderDate: orderDate,
    });
  }

  addNotes(notes: string): GuardianBond {
    return new GuardianBond({
      ...this._value,
      notes,
    });
  }

  private calculateNextPremiumDue(lastPaymentDate: Date): Date | undefined {
    if (!this._value.premiumFrequency) return undefined;

    const nextDate = new Date(lastPaymentDate);

    switch (this._value.premiumFrequency) {
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'SEMI_ANNUAL':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 'ANNUAL':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate;
  }

  get bondType(): BondType {
    return this._value.bondType;
  }

  get bondAmount(): number {
    return this._value.bondAmount;
  }

  get currency(): string {
    return this._value.currency;
  }

  get status(): BondStatus {
    return this._value.status;
  }

  get bondNumber(): string {
    return this._value.bondNumber;
  }

  get issuerName(): string {
    return this._value.issuerName;
  }

  get issuerContact(): string | undefined {
    return this._value.issuerContact;
  }

  get issueDate(): Date {
    return this._value.issueDate;
  }

  get expiryDate(): Date {
    return this._value.expiryDate;
  }

  get premiumAmount(): number | undefined {
    return this._value.premiumAmount;
  }

  get premiumFrequency(): string | undefined {
    return this._value.premiumFrequency;
  }

  get lastPremiumDate(): Date | undefined {
    return this._value.lastPremiumDate;
  }

  get nextPremiumDue(): Date | undefined {
    return this._value.nextPremiumDue;
  }

  get suretyDetails() {
    return this._value.suretyDetails;
  }

  get courtOrderReference(): string | undefined {
    return this._value.courtOrderReference;
  }

  get courtOrderDate(): Date | undefined {
    return this._value.courtOrderDate;
  }

  get conditions(): string[] {
    return [...this._value.conditions];
  }

  get forfeitureReason(): string | undefined {
    return this._value.forfeitureReason;
  }

  get forfeitureDate(): Date | undefined {
    return this._value.forfeitureDate;
  }

  get releaseDate(): Date | undefined {
    return this._value.releaseDate;
  }

  get releaseReason(): string | undefined {
    return this._value.releaseReason;
  }

  get releaseAuthorizedBy(): string | undefined {
    return this._value.releaseAuthorizedBy;
  }

  get notes(): string | undefined {
    return this._value.notes;
  }

  // Calculated properties

  get isActive(): boolean {
    return this._value.status === 'ACTIVE';
  }

  get isExpired(): boolean {
    return (
      this._value.status === 'EXPIRED' ||
      (this._value.expiryDate < new Date() && this._value.status !== 'RELEASED')
    );
  }

  get daysUntilExpiry(): number {
    const now = new Date();
    const diffTime = this._value.expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get bondDurationDays(): number {
    const diffTime = this._value.expiryDate.getTime() - this._value.issueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get bondDurationYears(): number {
    return this.bondDurationDays / 365;
  }

  get isPremiumOverdue(): boolean {
    if (!this._value.nextPremiumDue) return false;
    return this._value.nextPremiumDue < new Date();
  }

  get daysUntilNextPremium(): number | null {
    if (!this._value.nextPremiumDue) return null;

    const now = new Date();
    const diffTime = this._value.nextPremiumDue.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get totalPremiumPaid(): number {
    if (!this._value.premiumAmount || !this._value.lastPremiumDate) return 0;

    const paymentsCount = Math.floor(this.bondDurationDays / this.premiumIntervalDays);
    return paymentsCount * this._value.premiumAmount;
  }

  private get premiumIntervalDays(): number {
    switch (this._value.premiumFrequency) {
      case 'MONTHLY':
        return 30;
      case 'QUARTERLY':
        return 90;
      case 'SEMI_ANNUAL':
        return 180;
      case 'ANNUAL':
        return 365;
      default:
        return 365;
    }
  }

  // S.72 LSA compliance checks

  get meetsS72Requirements(): boolean {
    // S.72 requires court-approved bonds for guardians
    return (
      this._value.bondType === 'COURT_BOND' ||
      this._value.bondType === 'INSURANCE_BOND' ||
      this._value.bondType === 'BANK_GUARANTEE'
    );
  }

  get requiresAnnualRenewal(): boolean {
    // Kenyan law requires annual renewal of guardian bonds
    return this.bondDurationYears >= 1;
  }

  get isCourtApproved(): boolean {
    return !!this._value.courtOrderReference;
  }

  get hasSurety(): boolean {
    return !!this._value.suretyDetails;
  }

  get formattedBondAmount(): string {
    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: this._value.currency,
      minimumFractionDigits: 0,
    });
    return formatter.format(this._value.bondAmount);
  }

  get formattedPremiumAmount(): string {
    if (!this._value.premiumAmount) return 'N/A';

    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: this._value.currency,
      minimumFractionDigits: 0,
    });
    return formatter.format(this._value.premiumAmount);
  }

  toJSON() {
    return {
      bondType: this._value.bondType,
      bondAmount: this._value.bondAmount,
      currency: this._value.currency,
      status: this._value.status,
      bondNumber: this._value.bondNumber,
      issuerName: this._value.issuerName,
      issuerContact: this._value.issuerContact,
      issueDate: this._value.issueDate.toISOString(),
      expiryDate: this._value.expiryDate.toISOString(),
      premiumAmount: this._value.premiumAmount,
      premiumFrequency: this._value.premiumFrequency,
      lastPremiumDate: this._value.lastPremiumDate?.toISOString(),
      nextPremiumDue: this._value.nextPremiumDue?.toISOString(),
      suretyDetails: this._value.suretyDetails,
      courtOrderReference: this._value.courtOrderReference,
      courtOrderDate: this._value.courtOrderDate?.toISOString(),
      conditions: this._value.conditions,
      forfeitureReason: this._value.forfeitureReason,
      forfeitureDate: this._value.forfeitureDate?.toISOString(),
      releaseDate: this._value.releaseDate?.toISOString(),
      releaseReason: this._value.releaseReason,
      releaseAuthorizedBy: this._value.releaseAuthorizedBy,
      notes: this._value.notes,
      isActive: this.isActive,
      isExpired: this.isExpired,
      daysUntilExpiry: this.daysUntilExpiry,
      bondDurationDays: this.bondDurationDays,
      bondDurationYears: this.bondDurationYears,
      isPremiumOverdue: this.isPremiumOverdue,
      daysUntilNextPremium: this.daysUntilNextPremium,
      totalPremiumPaid: this.totalPremiumPaid,
      meetsS72Requirements: this.meetsS72Requirements,
      requiresAnnualRenewal: this.requiresAnnualRenewal,
      isCourtApproved: this.isCourtApproved,
      hasSurety: this.hasSurety,
      formattedBondAmount: this.formattedBondAmount,
      formattedPremiumAmount: this.formattedPremiumAmount,
    };
  }
}
