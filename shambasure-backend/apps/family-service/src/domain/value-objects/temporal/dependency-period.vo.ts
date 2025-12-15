// domain/value-objects/temporal/dependency-period.vo.ts
import { ValueObject } from '../base/value-object';

export type DependencyReason =
  | 'AGE'
  | 'EDUCATION'
  | 'PHYSICAL_DISABILITY'
  | 'MENTAL_DISABILITY'
  | 'FINANCIAL';
export type DependencyStatus = 'ACTIVE' | 'PENDING' | 'TERMINATED' | 'SUSPENDED';

export interface DependencyPeriodProps {
  startDate: Date;
  endDate?: Date;
  dependencyBasis: DependencyReason;
  status: DependencyStatus;
  dependencyLevel: 'FULL' | 'PARTIAL' | 'MINIMAL';
  monthlySupportAmount?: number;
  currency: string;
  reviewDate?: Date;
  courtOrderReference?: string;
  terminationReason?: string;
  evidenceSubmitted: boolean;
  evidenceDocuments?: string[];
  isCourtOrdered: boolean;
  ageLimit?: number; // For age-based dependency
  educationEndDate?: Date; // For education-based dependency
  disabilityStatus?: string; // For disability-based dependency
  medicalReports?: string[];
  dependencyPercentage: number; // 0-100%
}

export class DependencyPeriod extends ValueObject<DependencyPeriodProps> {
  private constructor(props: DependencyPeriodProps) {
    super(props);
    this.validate();
  }

  static create(
    startDate: Date,
    dependencyBasis: DependencyReason,
    dependencyLevel: 'FULL' | 'PARTIAL' | 'MINIMAL',
    dependencyPercentage: number = 100,
  ): DependencyPeriod {
    return new DependencyPeriod({
      startDate,
      dependencyBasis,
      dependencyLevel,
      dependencyPercentage,
      status: 'ACTIVE',
      currency: 'KES',
      evidenceSubmitted: false,
      isCourtOrdered: false,
    });
  }

  static createFromProps(props: DependencyPeriodProps): DependencyPeriod {
    return new DependencyPeriod(props);
  }

  validate(): void {
    // Start date validation
    if (!this._value.startDate) {
      throw new Error('Start date is required');
    }

    if (this._value.startDate > new Date()) {
      throw new Error('Start date cannot be in the future');
    }

    // End date validation
    if (this._value.endDate) {
      if (this._value.endDate < this._value.startDate) {
        throw new Error('End date cannot be before start date');
      }
      if (this._value.endDate > new Date()) {
        console.warn('End date is in the future - dependency may still be active');
      }
    }

    // Dependency percentage validation
    if (this._value.dependencyPercentage < 0 || this._value.dependencyPercentage > 100) {
      throw new Error('Dependency percentage must be between 0 and 100');
    }

    // Monthly support validation
    if (this._value.monthlySupportAmount !== undefined) {
      if (this._value.monthlySupportAmount < 0) {
        throw new Error('Monthly support amount cannot be negative');
      }
      if (!this._value.currency || this._value.currency.trim().length !== 3) {
        throw new Error('Valid 3-letter currency code is required');
      }
    }

    // Age limit validation
    if (this._value.ageLimit !== undefined) {
      if (this._value.ageLimit < 0 || this._value.ageLimit > 120) {
        throw new Error('Age limit must be between 0 and 120');
      }
    }

    // Education end date validation
    if (this._value.educationEndDate) {
      if (this._value.educationEndDate < this._value.startDate) {
        throw new Error('Education end date cannot be before start date');
      }
    }

    // Review date validation
    if (this._value.reviewDate) {
      if (this._value.reviewDate < this._value.startDate) {
        throw new Error('Review date cannot be before start date');
      }
    }

    // Status transition validation
    if (this._value.status === 'TERMINATED' && !this._value.terminationReason) {
      throw new Error('Termination reason is required for terminated status');
    }
  }

  updateEndDate(endDate?: Date): DependencyPeriod {
    return new DependencyPeriod({
      ...this._value,
      endDate,
    });
  }

  updateStatus(status: DependencyStatus, terminationReason?: string): DependencyPeriod {
    return new DependencyPeriod({
      ...this._value,
      status,
      terminationReason: terminationReason || this._value.terminationReason,
    });
  }

  updateFinancialSupport(amount?: number, currency: string = 'KES'): DependencyPeriod {
    return new DependencyPeriod({
      ...this._value,
      monthlySupportAmount: amount,
      currency,
    });
  }

  setCourtOrder(reference: string): DependencyPeriod {
    return new DependencyPeriod({
      ...this._value,
      courtOrderReference: reference,
      isCourtOrdered: true,
    });
  }

  setReviewDate(reviewDate: Date): DependencyPeriod {
    return new DependencyPeriod({
      ...this._value,
      reviewDate,
    });
  }

  submitEvidence(documents: string[]): DependencyPeriod {
    return new DependencyPeriod({
      ...this._value,
      evidenceSubmitted: true,
      evidenceDocuments: documents,
    });
  }

  updateDependencyPercentage(percentage: number): DependencyPeriod {
    return new DependencyPeriod({
      ...this._value,
      dependencyPercentage: percentage,
    });
  }

  setAgeLimit(ageLimit: number): DependencyPeriod {
    return new DependencyPeriod({
      ...this._value,
      ageLimit,
    });
  }

  setEducationEndDate(endDate: Date): DependencyPeriod {
    return new DependencyPeriod({
      ...this._value,
      educationEndDate: endDate,
    });
  }

  updateDisabilityInfo(status: string, medicalReports?: string[]): DependencyPeriod {
    return new DependencyPeriod({
      ...this._value,
      disabilityStatus: status,
      medicalReports: medicalReports || this._value.medicalReports,
    });
  }

  get startDate(): Date {
    return this._value.startDate;
  }

  get endDate(): Date | undefined {
    return this._value.endDate;
  }

  get dependencyBasis(): DependencyReason {
    return this._value.dependencyBasis;
  }

  get status(): DependencyStatus {
    return this._value.status;
  }

  get dependencyLevel(): string {
    return this._value.dependencyLevel;
  }

  get monthlySupportAmount(): number | undefined {
    return this._value.monthlySupportAmount;
  }

  get currency(): string {
    return this._value.currency;
  }

  get reviewDate(): Date | undefined {
    return this._value.reviewDate;
  }

  get courtOrderReference(): string | undefined {
    return this._value.courtOrderReference;
  }

  get terminationReason(): string | undefined {
    return this._value.terminationReason;
  }

  get evidenceSubmitted(): boolean {
    return this._value.evidenceSubmitted;
  }

  get evidenceDocuments(): string[] | undefined {
    return this._value.evidenceDocuments ? [...this._value.evidenceDocuments] : undefined;
  }

  get isCourtOrdered(): boolean {
    return this._value.isCourtOrdered;
  }

  get ageLimit(): number | undefined {
    return this._value.ageLimit;
  }

  get educationEndDate(): Date | undefined {
    return this._value.educationEndDate;
  }

  get disabilityStatus(): string | undefined {
    return this._value.disabilityStatus;
  }

  get medicalReports(): string[] | undefined {
    return this._value.medicalReports ? [...this._value.medicalReports] : undefined;
  }

  get dependencyPercentage(): number {
    return this._value.dependencyPercentage;
  }

  // Check if dependency is active
  get isActive(): boolean {
    if (this._value.status === 'TERMINATED') return false;

    const endDate = this._value.endDate || new Date();
    return endDate >= new Date() && this._value.status === 'ACTIVE';
  }

  // Get dependency duration in years
  get dependencyDurationYears(): number {
    const endDate = this._value.endDate || new Date();
    const years = endDate.getFullYear() - this._value.startDate.getFullYear();
    const monthDiff = endDate.getMonth() - this._value.startDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < this._value.startDate.getDate())) {
      return years - 1;
    }
    return years;
  }

  // Get dependency duration in months
  get dependencyDurationMonths(): number {
    const endDate = this._value.endDate || new Date();
    let months = (endDate.getFullYear() - this._value.startDate.getFullYear()) * 12;
    months += endDate.getMonth() - this._value.startDate.getMonth();

    if (endDate.getDate() < this._value.startDate.getDate()) {
      months--;
    }

    return months;
  }

  // Check if dependency qualifies for S.29
  get qualifiesForSection29(): boolean {
    if (!this.isActive) return false;

    // S.29 requires at least 5 years of dependency
    if (this.dependencyDurationYears < 5) return false;

    // Must be based on age, disability, or financial need
    const validBases: DependencyReason[] = [
      'AGE',
      'PHYSICAL_DISABILITY',
      'MENTAL_DISABILITY',
      'FINANCIAL',
    ];

    if (!validBases.includes(this._value.dependencyBasis)) return false;
    // Must have sufficient dependency percentage
    if (this._value.dependencyPercentage < 50) return false;

    return true;
  }

  // Check if dependency is based on age (minor)
  get isMinorDependency(): boolean {
    return (
      this._value.dependencyBasis === 'AGE' &&
      this._value.ageLimit !== undefined &&
      this._value.ageLimit < 18
    );
  }

  // Check if dependency is based on disability
  get isDisabilityDependency(): boolean {
    return (
      this._value.dependencyBasis === 'PHYSICAL_DISABILITY' ||
      this._value.dependencyBasis === 'MENTAL_DISABILITY'
    );
  }

  // Check if dependency is education-based
  get isEducationDependency(): boolean {
    return this._value.dependencyBasis === 'EDUCATION';
  }

  // Get total support provided
  get totalSupportProvided(): number | null {
    if (!this._value.monthlySupportAmount) return null;

    const months = this.dependencyDurationMonths;
    return this._value.monthlySupportAmount * months;
  }

  // Check if review is overdue
  get isReviewOverdue(): boolean {
    if (!this._value.reviewDate) return false;
    return this._value.reviewDate < new Date();
  }

  // Get days until review
  get daysUntilReview(): number | null {
    if (!this._value.reviewDate) return null;

    const now = new Date();
    const diffTime = this._value.reviewDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Check if dependency should automatically end (age limit reached)
  get shouldAutoTerminate(): boolean {
    if (this._value.dependencyBasis !== 'AGE' || !this._value.ageLimit) return false;

    const startAge = this._value.startDate.getFullYear();
    const currentAge = new Date().getFullYear() - startAge;
    return currentAge >= this._value.ageLimit;
  }

  // Check if dependency should end based on education completion
  get shouldEndForEducation(): boolean {
    if (this._value.dependencyBasis !== 'EDUCATION' || !this._value.educationEndDate) return false;

    return new Date() >= this._value.educationEndDate;
  }

  // Get formatted support amount
  get formattedSupport(): string | null {
    if (!this._value.monthlySupportAmount) return null;

    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: this._value.currency,
    });

    return formatter.format(this._value.monthlySupportAmount);
  }

  toJSON() {
    return {
      startDate: this._value.startDate.toISOString(),
      endDate: this._value.endDate?.toISOString(),
      dependencyBasis: this._value.dependencyBasis,
      status: this._value.status,
      dependencyLevel: this._value.dependencyLevel,
      monthlySupportAmount: this._value.monthlySupportAmount,
      currency: this._value.currency,
      reviewDate: this._value.reviewDate?.toISOString(),
      courtOrderReference: this._value.courtOrderReference,
      terminationReason: this._value.terminationReason,
      evidenceSubmitted: this._value.evidenceSubmitted,
      evidenceDocuments: this._value.evidenceDocuments,
      isCourtOrdered: this._value.isCourtOrdered,
      ageLimit: this._value.ageLimit,
      educationEndDate: this._value.educationEndDate?.toISOString(),
      disabilityStatus: this._value.disabilityStatus,
      medicalReports: this._value.medicalReports,
      dependencyPercentage: this._value.dependencyPercentage,
      isActive: this.isActive,
      dependencyDurationYears: this.dependencyDurationYears,
      dependencyDurationMonths: this.dependencyDurationMonths,
      qualifiesForSection29: this.qualifiesForSection29,
      isMinorDependency: this.isMinorDependency,
      isDisabilityDependency: this.isDisabilityDependency,
      isEducationDependency: this.isEducationDependency,
      totalSupportProvided: this.totalSupportProvided,
      isReviewOverdue: this.isReviewOverdue,
      daysUntilReview: this.daysUntilReview,
      shouldAutoTerminate: this.shouldAutoTerminate,
      shouldEndForEducation: this.shouldEndForEducation,
      formattedSupport: this.formattedSupport,
    };
  }
}
