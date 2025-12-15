// domain/value-objects/temporal/guardianship-term.vo.ts
import { ValueObject } from '../base/value-object';
import { GuardianshipType } from '../legal/guardianship-type.vo';

export type BondTermStatus = 'REQUIRED' | 'POSTED' | 'WAIVED' | 'NOT_REQUIRED';

export interface GuardianshipTermProps {
  appointmentDate: Date;
  guardianshipType: GuardianshipType;
  expectedEndDate?: Date;
  actualEndDate?: Date;
  terminationReason?: string;
  courtOrderNumber?: string;
  bondStatus: BondTermStatus;
  bondAmount?: number;
  bondPostingDate?: Date;
  bondExpiryDate?: Date;
  annualReportingRequired: boolean;
  lastReportDate?: Date;
  nextReportDueDate?: Date;
  reportFrequency: 'ANNUAL' | 'BIANNUAL' | 'QUARTERLY' | 'MONTHLY';
  extensionRequests: number;
  lastExtensionDate?: Date;
  hasPropertyManagementPowers: boolean;
  canConsentToMedical: boolean;
  canConsentToMarriage: boolean;
  restrictions?: string[];
  specialInstructions?: string;
  isInterim: boolean;
  interimOrderExpiry?: Date;
}

export class GuardianshipTerm extends ValueObject<GuardianshipTermProps> {
  private constructor(props: GuardianshipTermProps) {
    super(props);
    this.validate();
  }

  static create(appointmentDate: Date, guardianshipType: GuardianshipType): GuardianshipTerm {
    return new GuardianshipTerm({
      appointmentDate,
      guardianshipType,
      bondStatus: 'NOT_REQUIRED',
      annualReportingRequired: false,
      reportFrequency: 'ANNUAL',
      extensionRequests: 0,
      hasPropertyManagementPowers: false,
      canConsentToMedical: true,
      canConsentToMarriage: false,
      isInterim: false,
    });
  }

  static createFromProps(props: GuardianshipTermProps): GuardianshipTerm {
    return new GuardianshipTerm(props);
  }

  validate(): void {
    // Appointment date validation
    if (!this._value.appointmentDate) {
      throw new Error('Appointment date is required');
    }

    if (this._value.appointmentDate > new Date()) {
      throw new Error('Appointment date cannot be in the future');
    }

    // Expected end date validation
    if (this._value.expectedEndDate) {
      if (this._value.expectedEndDate < this._value.appointmentDate) {
        throw new Error('Expected end date cannot be before appointment date');
      }
    }

    // Actual end date validation
    if (this._value.actualEndDate) {
      if (this._value.actualEndDate < this._value.appointmentDate) {
        throw new Error('Actual end date cannot be before appointment date');
      }
    }

    // Bond dates validation
    if (this._value.bondPostingDate) {
      if (this._value.bondPostingDate < this._value.appointmentDate) {
        throw new Error('Bond posting date cannot be before appointment date');
      }
    }

    if (this._value.bondExpiryDate) {
      if (this._value.bondExpiryDate < this._value.appointmentDate) {
        throw new Error('Bond expiry date cannot be before appointment date');
      }
    }

    // Report dates validation
    if (this._value.lastReportDate) {
      if (this._value.lastReportDate < this._value.appointmentDate) {
        throw new Error('Last report date cannot be before appointment date');
      }
    }

    if (this._value.nextReportDueDate) {
      if (this._value.nextReportDueDate < this._value.appointmentDate) {
        throw new Error('Next report due date cannot be before appointment date');
      }
    }

    // Extension validation
    if (this._value.lastExtensionDate) {
      if (this._value.lastExtensionDate < this._value.appointmentDate) {
        throw new Error('Last extension date cannot be before appointment date');
      }
    }

    // Bond amount validation
    if (this._value.bondAmount !== undefined) {
      if (this._value.bondAmount < 0) {
        throw new Error('Bond amount cannot be negative');
      }
    }

    // Interim order validation
    if (this._value.isInterim && !this._value.interimOrderExpiry) {
      throw new Error('Interim order expiry date is required for interim guardianship');
    }

    if (
      this._value.interimOrderExpiry &&
      this._value.interimOrderExpiry < this._value.appointmentDate
    ) {
      throw new Error('Interim order expiry cannot be before appointment date');
    }
  }

  setExpectedEndDate(endDate: Date): GuardianshipTerm {
    return new GuardianshipTerm({
      ...this._value,
      expectedEndDate: endDate,
    });
  }

  terminate(endDate: Date, reason: string): GuardianshipTerm {
    return new GuardianshipTerm({
      ...this._value,
      actualEndDate: endDate,
      terminationReason: reason,
    });
  }

  setCourtOrder(orderNumber: string): GuardianshipTerm {
    return new GuardianshipTerm({
      ...this._value,
      courtOrderNumber: orderNumber,
    });
  }

  updateBondStatus(
    status: BondTermStatus,
    amount?: number,
    postingDate?: Date,
    expiryDate?: Date,
  ): GuardianshipTerm {
    return new GuardianshipTerm({
      ...this._value,
      bondStatus: status,
      bondAmount: amount,
      bondPostingDate: postingDate,
      bondExpiryDate: expiryDate,
    });
  }

  setReportingRequirements(
    required: boolean,
    frequency: 'ANNUAL' | 'BIANNUAL' | 'QUARTERLY' | 'MONTHLY',
    nextDueDate?: Date,
  ): GuardianshipTerm {
    return new GuardianshipTerm({
      ...this._value,
      annualReportingRequired: required,
      reportFrequency: frequency,
      nextReportDueDate: nextDueDate,
    });
  }

  submitReport(reportDate: Date): GuardianshipTerm {
    const nextDueDate = this.calculateNextReportDue(reportDate);

    return new GuardianshipTerm({
      ...this._value,
      lastReportDate: reportDate,
      nextReportDueDate: nextDueDate,
    });
  }

  requestExtension(extensionDate: Date): GuardianshipTerm {
    return new GuardianshipTerm({
      ...this._value,
      extensionRequests: this._value.extensionRequests + 1,
      lastExtensionDate: extensionDate,
    });
  }

  updatePowers(
    hasPropertyManagementPowers: boolean,
    canConsentToMedical: boolean,
    canConsentToMarriage: boolean,
    restrictions?: string[],
    specialInstructions?: string,
  ): GuardianshipTerm {
    return new GuardianshipTerm({
      ...this._value,
      hasPropertyManagementPowers,
      canConsentToMedical,
      canConsentToMarriage,
      restrictions,
      specialInstructions,
    });
  }

  markAsInterim(expiryDate: Date): GuardianshipTerm {
    return new GuardianshipTerm({
      ...this._value,
      isInterim: true,
      interimOrderExpiry: expiryDate,
    });
  }

  convertToPermanent(): GuardianshipTerm {
    return new GuardianshipTerm({
      ...this._value,
      isInterim: false,
      interimOrderExpiry: undefined,
    });
  }

  private calculateNextReportDue(lastReportDate: Date): Date {
    const nextDue = new Date(lastReportDate);

    switch (this._value.reportFrequency) {
      case 'MONTHLY':
        nextDue.setMonth(nextDue.getMonth() + 1);
        break;
      case 'QUARTERLY':
        nextDue.setMonth(nextDue.getMonth() + 3);
        break;
      case 'BIANNUAL':
        nextDue.setMonth(nextDue.getMonth() + 6);
        break;
      case 'ANNUAL':
        nextDue.setFullYear(nextDue.getFullYear() + 1);
        break;
    }

    return nextDue;
  }

  get appointmentDate(): Date {
    return this._value.appointmentDate;
  }

  get guardianshipType(): GuardianshipType {
    return this._value.guardianshipType;
  }

  get expectedEndDate(): Date | undefined {
    return this._value.expectedEndDate;
  }

  get actualEndDate(): Date | undefined {
    return this._value.actualEndDate;
  }

  get terminationReason(): string | undefined {
    return this._value.terminationReason;
  }

  get courtOrderNumber(): string | undefined {
    return this._value.courtOrderNumber;
  }

  get bondStatus(): BondTermStatus {
    return this._value.bondStatus;
  }

  get bondAmount(): number | undefined {
    return this._value.bondAmount;
  }

  get bondPostingDate(): Date | undefined {
    return this._value.bondPostingDate;
  }

  get bondExpiryDate(): Date | undefined {
    return this._value.bondExpiryDate;
  }

  get annualReportingRequired(): boolean {
    return this._value.annualReportingRequired;
  }

  get lastReportDate(): Date | undefined {
    return this._value.lastReportDate;
  }

  get nextReportDueDate(): Date | undefined {
    return this._value.nextReportDueDate;
  }

  get reportFrequency(): string {
    return this._value.reportFrequency;
  }

  get extensionRequests(): number {
    return this._value.extensionRequests;
  }

  get lastExtensionDate(): Date | undefined {
    return this._value.lastExtensionDate;
  }

  get hasPropertyManagementPowers(): boolean {
    return this._value.hasPropertyManagementPowers;
  }

  get canConsentToMedical(): boolean {
    return this._value.canConsentToMedical;
  }

  get canConsentToMarriage(): boolean {
    return this._value.canConsentToMarriage;
  }

  get restrictions(): string[] | undefined {
    return this._value.restrictions ? [...this._value.restrictions] : undefined;
  }

  get specialInstructions(): string | undefined {
    return this._value.specialInstructions;
  }

  get isInterim(): boolean {
    return this._value.isInterim;
  }

  get interimOrderExpiry(): Date | undefined {
    return this._value.interimOrderExpiry;
  }

  // Check if guardianship is active
  get isActive(): boolean {
    if (this._value.actualEndDate) return false;

    // Check interim order expiry
    if (this._value.isInterim && this._value.interimOrderExpiry) {
      return new Date() <= this._value.interimOrderExpiry;
    }

    return true;
  }

  // Get guardianship duration in years
  get guardianshipDurationYears(): number {
    const endDate = this._value.actualEndDate || new Date();
    const years = endDate.getFullYear() - this._value.appointmentDate.getFullYear();
    const monthDiff = endDate.getMonth() - this._value.appointmentDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && endDate.getDate() < this._value.appointmentDate.getDate())
    ) {
      return years - 1;
    }
    return years;
  }

  // Check if bond is required (S.72 LSA)
  get bondRequiredByLaw(): boolean {
    return (
      this._value.guardianshipType === 'COURT_APPOINTED' && this._value.hasPropertyManagementPowers
    );
  }

  // Check if bond is valid
  get isBondValid(): boolean {
    if (this._value.bondStatus !== 'POSTED') return false;
    if (!this._value.bondExpiryDate) return true;

    return new Date() <= this._value.bondExpiryDate;
  }

  // Check if reporting is overdue
  get isReportingOverdue(): boolean {
    if (!this._value.annualReportingRequired || !this._value.nextReportDueDate) return false;

    return new Date() > this._value.nextReportDueDate;
  }

  // Get days until next report
  get daysUntilNextReport(): number | null {
    if (!this._value.nextReportDueDate) return null;

    const now = new Date();
    const diffTime = this._value.nextReportDueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Check if guardianship needs extension
  get needsExtension(): boolean {
    if (!this._value.expectedEndDate) return false;

    const daysUntilEnd = Math.ceil(
      (this._value.expectedEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysUntilEnd < 30; // Needs extension if less than 30 days remaining
  }

  // Check if interim order is expiring soon
  get interimExpiringSoon(): boolean {
    if (!this._value.isInterim || !this._value.interimOrderExpiry) return false;

    const daysUntilExpiry = Math.ceil(
      (this._value.interimOrderExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysUntilExpiry < 14; // Expiring in less than 2 weeks
  }

  // Get years until expected end
  get yearsUntilExpectedEnd(): number | null {
    if (!this._value.expectedEndDate) return null;

    const now = new Date();
    const years = this._value.expectedEndDate.getFullYear() - now.getFullYear();
    const monthDiff = this._value.expectedEndDate.getMonth() - now.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && this._value.expectedEndDate.getDate() < now.getDate())
    ) {
      return years - 1;
    }
    return years;
  }

  // Check if guardianship is testamentary
  get isTestamentary(): boolean {
    return this._value.guardianshipType === 'TESTAMENTARY';
  }

  // Check if guardianship is court-appointed
  get isCourtAppointed(): boolean {
    return this._value.guardianshipType === 'COURT_APPOINTED';
  }

  // Get formatted bond amount
  get formattedBondAmount(): string | null {
    if (!this._value.bondAmount) return null;

    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    });

    return formatter.format(this._value.bondAmount);
  }

  toJSON() {
    return {
      appointmentDate: this._value.appointmentDate.toISOString(),
      guardianshipType: this._value.guardianshipType,
      expectedEndDate: this._value.expectedEndDate?.toISOString(),
      actualEndDate: this._value.actualEndDate?.toISOString(),
      terminationReason: this._value.terminationReason,
      courtOrderNumber: this._value.courtOrderNumber,
      bondStatus: this._value.bondStatus,
      bondAmount: this._value.bondAmount,
      bondPostingDate: this._value.bondPostingDate?.toISOString(),
      bondExpiryDate: this._value.bondExpiryDate?.toISOString(),
      annualReportingRequired: this._value.annualReportingRequired,
      lastReportDate: this._value.lastReportDate?.toISOString(),
      nextReportDueDate: this._value.nextReportDueDate?.toISOString(),
      reportFrequency: this._value.reportFrequency,
      extensionRequests: this._value.extensionRequests,
      lastExtensionDate: this._value.lastExtensionDate?.toISOString(),
      hasPropertyManagementPowers: this._value.hasPropertyManagementPowers,
      canConsentToMedical: this._value.canConsentToMedical,
      canConsentToMarriage: this._value.canConsentToMarriage,
      restrictions: this._value.restrictions,
      specialInstructions: this._value.specialInstructions,
      isInterim: this._value.isInterim,
      interimOrderExpiry: this._value.interimOrderExpiry?.toISOString(),
      isActive: this.isActive,
      guardianshipDurationYears: this.guardianshipDurationYears,
      bondRequiredByLaw: this.bondRequiredByLaw,
      isBondValid: this.isBondValid,
      isReportingOverdue: this.isReportingOverdue,
      daysUntilNextReport: this.daysUntilNextReport,
      needsExtension: this.needsExtension,
      interimExpiringSoon: this.interimExpiringSoon,
      yearsUntilExpectedEnd: this.yearsUntilExpectedEnd,
      isTestamentary: this.isTestamentary,
      isCourtAppointed: this.isCourtAppointed,
      formattedBondAmount: this.formattedBondAmount,
    };
  }
}
