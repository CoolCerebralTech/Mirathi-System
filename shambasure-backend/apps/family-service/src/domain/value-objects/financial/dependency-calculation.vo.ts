// domain/value-objects/financial/dependency-calculation.vo.ts
import { ValueObject } from '../../base/value-object';
import { DependencyLevel } from '../legal/dependency-level.vo';

export type DependencyBasis =
  | 'MINOR_CHILD'
  | 'ADULT_CHILD_STUDENT'
  | 'SPOUSE'
  | 'PARENT'
  | 'SIBLING'
  | 'EXTENDED_FAMILY'
  | 'CUSTOMARY_WIFE'
  | 'DISABLED_DEPENDANT'
  | 'OTHER';

export interface DependencyCalculationProps {
  deceasedMonthlyIncome: number;
  dependantMonthlyNeeds: number;
  supportProvided: number;
  supportFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  supportStartDate: Date;
  supportEndDate?: Date; // Date of death or when support stopped
  dependencyBasis: DependencyBasis;
  dependencyLevel: DependencyLevel;
  dependencyPercentage: number; // 0-100%
  evidenceDocuments: string[]; // Document IDs
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  assessmentDate: Date;
  assessmentMethod: 'INCOME_PERCENTAGE' | 'EXPENDITURE_AUDIT' | 'COURT_DETERMINATION';
  courtOrderReference?: string;
  courtOrderDate?: Date;
  specialCircumstances?: string[];
}

export class DependencyCalculation extends ValueObject<DependencyCalculationProps> {
  private constructor(props: DependencyCalculationProps) {
    super(props);
    this.validate();
  }

  static create(
    deceasedMonthlyIncome: number,
    dependantMonthlyNeeds: number,
    supportProvided: number,
    dependencyBasis: DependencyBasis,
    assessmentMethod: 'INCOME_PERCENTAGE' | 'EXPENDITURE_AUDIT' | 'COURT_DETERMINATION',
  ): DependencyCalculation {
    const assessmentDate = new Date();

    return new DependencyCalculation({
      deceasedMonthlyIncome,
      dependantMonthlyNeeds,
      supportProvided,
      supportFrequency: 'MONTHLY',
      supportStartDate: assessmentDate,
      dependencyBasis,

      dependencyLevel: DependencyLevel.create(
        'PARTIAL',
        0,
        assessmentDate,
        'SYSTEM_INITIAL_ASSESSMENT',
      ),

      dependencyPercentage: 0,
      evidenceDocuments: [],
      isVerified: false,
      assessmentDate,
      assessmentMethod,
    });
  }

  static createFromProps(props: DependencyCalculationProps): DependencyCalculation {
    return new DependencyCalculation(props);
  }

  validate(): void {
    // Financial validation
    if (this._value.deceasedMonthlyIncome < 0) {
      throw new Error('Deceased monthly income cannot be negative');
    }

    if (this._value.dependantMonthlyNeeds < 0) {
      throw new Error('Dependant monthly needs cannot be negative');
    }

    if (this._value.supportProvided < 0) {
      throw new Error('Support provided cannot be negative');
    }

    // Support cannot exceed deceased income (unless there's debt/borrowing)
    if (this._value.supportProvided > this._value.deceasedMonthlyIncome * 1.5) {
      throw new Error('Support provided exceeds reasonable proportion of deceased income');
    }

    // Dependency percentage validation
    if (this._value.dependencyPercentage < 0 || this._value.dependencyPercentage > 100) {
      throw new Error('Dependency percentage must be between 0 and 100');
    }

    // Date validation
    if (this._value.supportStartDate > new Date()) {
      throw new Error('Support start date cannot be in the future');
    }

    if (this._value.supportEndDate && this._value.supportEndDate < this._value.supportStartDate) {
      throw new Error('Support end date cannot be before start date');
    }

    if (this._value.assessmentDate > new Date()) {
      throw new Error('Assessment date cannot be in the future');
    }

    // Court order validation
    if (this._value.courtOrderReference && !this._value.courtOrderDate) {
      throw new Error('Court order date is required when court order reference is provided');
    }

    if (this._value.courtOrderDate && this._value.courtOrderDate > new Date()) {
      throw new Error('Court order date cannot be in the future');
    }

    // Verified status validation
    if (this._value.isVerified && !this._value.verifiedAt) {
      throw new Error('Verification date is required when dependency is verified');
    }

    // Calculate and validate dependency level
    const calculatedPercentage = this.calculateDependencyPercentage();
    if (Math.abs(calculatedPercentage - this._value.dependencyPercentage) > 5) {
      console.warn('Calculated dependency percentage differs from stored value');
    }
  }

  private calculateDependencyPercentage(): number {
    if (this._value.deceasedMonthlyIncome === 0) return 0;

    const monthlySupport = this.monthlySupportAmount;
    return (monthlySupport / this._value.dependantMonthlyNeeds) * 100;
  }

  // Convert support to monthly amount
  private getMonthlySupportAmount(support: number, frequency: string): number {
    switch (frequency) {
      case 'WEEKLY':
        return support * 4.33; // Average weeks per month
      case 'BIWEEKLY':
        return support * 2.165;
      case 'MONTHLY':
        return support;
      case 'QUARTERLY':
        return support / 3;
      case 'YEARLY':
        return support / 12;
      default:
        return support;
    }
  }

  updateSupportDetails(
    supportProvided: number,
    frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
    startDate: Date,
    endDate?: Date,
  ): DependencyCalculation {
    return new DependencyCalculation({
      ...this._value,
      supportProvided,
      supportFrequency: frequency,
      supportStartDate: startDate,
      supportEndDate: endDate,
    });
  }

  updateAssessment(
    dependencyLevel: DependencyLevel,
    dependencyPercentage: number,
    assessmentMethod: 'INCOME_PERCENTAGE' | 'EXPENDITURE_AUDIT' | 'COURT_DETERMINATION',
    assessmentDate: Date,
  ): DependencyCalculation {
    return new DependencyCalculation({
      ...this._value,
      dependencyLevel,
      dependencyPercentage,
      assessmentMethod,
      assessmentDate,
    });
  }

  addEvidenceDocument(documentId: string): DependencyCalculation {
    const evidenceDocuments = [...this._value.evidenceDocuments, documentId];
    return new DependencyCalculation({
      ...this._value,
      evidenceDocuments,
    });
  }

  removeEvidenceDocument(documentId: string): DependencyCalculation {
    const evidenceDocuments = this._value.evidenceDocuments.filter((id) => id !== documentId);
    return new DependencyCalculation({
      ...this._value,
      evidenceDocuments,
    });
  }

  verify(
    verifiedBy: string,
    courtOrderReference?: string,
    courtOrderDate?: Date,
  ): DependencyCalculation {
    return new DependencyCalculation({
      ...this._value,
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy,
      courtOrderReference: courtOrderReference || this._value.courtOrderReference,
      courtOrderDate: courtOrderDate || this._value.courtOrderDate,
    });
  }

  markAsUnverified(): DependencyCalculation {
    return new DependencyCalculation({
      ...this._value,
      isVerified: false,
      verifiedAt: undefined,
      verifiedBy: undefined,
    });
  }

  addSpecialCircumstance(circumstance: string): DependencyCalculation {
    const specialCircumstances = [...(this._value.specialCircumstances || []), circumstance];
    return new DependencyCalculation({
      ...this._value,
      specialCircumstances,
    });
  }

  get deceasedMonthlyIncome(): number {
    return this._value.deceasedMonthlyIncome;
  }

  get dependantMonthlyNeeds(): number {
    return this._value.dependantMonthlyNeeds;
  }

  get supportProvided(): number {
    return this._value.supportProvided;
  }

  get supportFrequency(): string {
    return this._value.supportFrequency;
  }

  get supportStartDate(): Date {
    return this._value.supportStartDate;
  }

  get supportEndDate(): Date | undefined {
    return this._value.supportEndDate;
  }

  get dependencyBasis(): DependencyBasis {
    return this._value.dependencyBasis;
  }

  get dependencyLevel(): DependencyLevel {
    return this._value.dependencyLevel;
  }

  get dependencyPercentage(): number {
    return this._value.dependencyPercentage;
  }

  get evidenceDocuments(): string[] {
    return [...this._value.evidenceDocuments];
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

  get assessmentDate(): Date {
    return this._value.assessmentDate;
  }

  get assessmentMethod(): string {
    return this._value.assessmentMethod;
  }

  get courtOrderReference(): string | undefined {
    return this._value.courtOrderReference;
  }

  get courtOrderDate(): Date | undefined {
    return this._value.courtOrderDate;
  }

  get specialCircumstances(): string[] {
    return [...(this._value.specialCircumstances || [])];
  }

  // Calculated properties

  get monthlySupportAmount(): number {
    return this.getMonthlySupportAmount(this._value.supportProvided, this._value.supportFrequency);
  }

  get dependencyRatio(): number {
    if (this._value.deceasedMonthlyIncome === 0) return 0;
    return this.monthlySupportAmount / this._value.deceasedMonthlyIncome;
  }

  get supportCoverage(): number {
    if (this._value.dependantMonthlyNeeds === 0) return 0;
    return (this.monthlySupportAmount / this._value.dependantMonthlyNeeds) * 100;
  }

  get isTotalDependency(): boolean {
    return this.supportCoverage >= 90;
  }

  get isPartialDependency(): boolean {
    return this.supportCoverage >= 30 && this.supportCoverage < 90;
  }

  get isMinimalDependency(): boolean {
    return this.supportCoverage > 0 && this.supportCoverage < 30;
  }

  get supportDurationMonths(): number {
    const endDate = this._value.supportEndDate || new Date();
    const startDate = this._value.supportStartDate;

    const years = endDate.getFullYear() - startDate.getFullYear();
    const months = endDate.getMonth() - startDate.getMonth();

    return years * 12 + months;
  }

  get supportDurationYears(): number {
    return this.supportDurationMonths / 12;
  }

  // S.29 qualification checks

  get qualifiesForS29(): boolean {
    // S.29 requires substantial dependency
    return (
      this.supportDurationYears >= 0.5 && // At least 6 months support
      this.supportCoverage >= 30 && // At least 30% of needs covered
      this.dependencyBasis !== 'OTHER' // Must be recognized relationship
    );
  }

  get qualifiesForEnhancedProvision(): boolean {
    // Enhanced provision for total dependants
    return this.qualifiesForS29 && this.isTotalDependency && this.supportDurationYears >= 2;
  }

  // Calculated monthly provision amount (for court orders)
  get recommendedMonthlyProvision(): number {
    if (!this.qualifiesForS29) return 0;

    // Use 60% of previous support or actual needs, whichever is lower
    const previousSupport = this.monthlySupportAmount;
    const basedOnNeeds = this._value.dependantMonthlyNeeds * 0.6;

    return Math.min(previousSupport, basedOnNeeds);
  }

  get recommendedLumpSumProvision(): number {
    if (!this.qualifiesForS29) return 0;

    // Lump sum = recommended monthly provision * 24 months
    return this.recommendedMonthlyProvision * 24;
  }

  toJSON() {
    return {
      deceasedMonthlyIncome: this._value.deceasedMonthlyIncome,
      dependantMonthlyNeeds: this._value.dependantMonthlyNeeds,
      supportProvided: this._value.supportProvided,
      supportFrequency: this._value.supportFrequency,
      supportStartDate: this._value.supportStartDate.toISOString(),
      supportEndDate: this._value.supportEndDate?.toISOString(),
      dependencyBasis: this._value.dependencyBasis,
      dependencyLevel: this._value.dependencyLevel,
      dependencyPercentage: this._value.dependencyPercentage,
      evidenceDocuments: this._value.evidenceDocuments,
      isVerified: this._value.isVerified,
      verifiedAt: this._value.verifiedAt?.toISOString(),
      verifiedBy: this._value.verifiedBy,
      assessmentDate: this._value.assessmentDate.toISOString(),
      assessmentMethod: this._value.assessmentMethod,
      courtOrderReference: this._value.courtOrderReference,
      courtOrderDate: this._value.courtOrderDate?.toISOString(),
      specialCircumstances: this._value.specialCircumstances,
      monthlySupportAmount: this.monthlySupportAmount,
      dependencyRatio: this.dependencyRatio,
      supportCoverage: this.supportCoverage,
      isTotalDependency: this.isTotalDependency,
      isPartialDependency: this.isPartialDependency,
      isMinimalDependency: this.isMinimalDependency,
      supportDurationMonths: this.supportDurationMonths,
      supportDurationYears: this.supportDurationYears,
      qualifiesForS29: this.qualifiesForS29,
      qualifiesForEnhancedProvision: this.qualifiesForEnhancedProvision,
      recommendedMonthlyProvision: this.recommendedMonthlyProvision,
      recommendedLumpSumProvision: this.recommendedLumpSumProvision,
    };
  }
}
