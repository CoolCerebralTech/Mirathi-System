// domain/value-objects/legal/dependency-level.vo.ts
import { ValueObject } from '../../base/value-object';
import { KenyanLawSection } from './kenyan-law-section.vo';

export type DependencyLevelType = 'NONE' | 'PARTIAL' | 'FULL';

export interface DependencyLevelProps {
  level: DependencyLevelType;
  description: string;
  dependencyPercentage: number; // 0-100
  assessmentDate: Date;
  assessedBy: string;
  assessmentMethod: string;
  applicableSections: KenyanLawSection[];
  isMinorDependant: boolean;
  minorUntil?: Date;
  isStudentDependant: boolean;
  studentUntil?: Date;
  isDisabledDependant: boolean;
  disabilityType?: string;
  requiresOngoingCare: boolean;
  monthlySupportAmountKES: number;
  supportStartDate: Date;
  supportEndDate?: Date;
  evidenceDocuments: string[];
  evidenceVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  notes?: string;
}

export class DependencyLevel extends ValueObject<DependencyLevelProps> {
  private constructor(props: DependencyLevelProps) {
    super(props);
    this.validate();
  }

  static create(
    level: DependencyLevelType,
    dependencyPercentage: number,
    assessmentDate: Date,
    assessedBy: string,
  ): DependencyLevel {
    const applicableSections = this.determineApplicableSections(level, dependencyPercentage);

    return new DependencyLevel({
      level,
      description: this.getLevelDescription(level),
      dependencyPercentage,
      assessmentDate,
      assessedBy,
      assessmentMethod: 'INITIAL_ASSESSMENT',
      applicableSections,
      isMinorDependant: false,
      isStudentDependant: false,
      isDisabledDependant: false,
      requiresOngoingCare: false,
      monthlySupportAmountKES: 0,
      supportStartDate: assessmentDate,
      evidenceDocuments: [],
      evidenceVerified: false,
    });
  }

  static createFromProps(props: DependencyLevelProps): DependencyLevel {
    return new DependencyLevel(props);
  }

  private static determineApplicableSections(
    level: DependencyLevelType,
    percentage: number,
  ): KenyanLawSection[] {
    const sections: KenyanLawSection[] = [];

    // All dependants are covered by S.29
    sections.push(KenyanLawSection.create('S29_DEPENDANTS'));

    // If dependency is high, S.26 may apply for court provision
    if (percentage >= 50 || level === 'FULL') {
      sections.push(KenyanLawSection.create('S26_DEPENDANT_PROVISION'));
    }

    return sections;
  }

  private static getLevelDescription(level: DependencyLevelType): string {
    switch (level) {
      case 'NONE':
        return 'No financial dependency';
      case 'PARTIAL':
        return 'Partial financial dependency';
      case 'FULL':
        return 'Complete financial dependency';
      default:
        return 'Unknown dependency level';
    }
  }

  validate(): void {
    if (!this._value.level) {
      throw new Error('Dependency level is required');
    }

    if (this._value.dependencyPercentage < 0 || this._value.dependencyPercentage > 100) {
      throw new Error('Dependency percentage must be between 0 and 100');
    }

    if (!this._value.assessmentDate) {
      throw new Error('Assessment date is required');
    }

    if (this._value.assessmentDate > new Date()) {
      throw new Error('Assessment date cannot be in the future');
    }

    if (!this._value.assessedBy || this._value.assessedBy.trim().length === 0) {
      throw new Error('Assessed by is required');
    }

    if (!this._value.assessmentMethod || this._value.assessmentMethod.trim().length === 0) {
      throw new Error('Assessment method is required');
    }

    // Level vs percentage consistency
    if (this._value.level === 'NONE' && this._value.dependencyPercentage > 0) {
      throw new Error('Dependency percentage must be 0 when level is NONE');
    }

    if (this._value.level === 'FULL' && this._value.dependencyPercentage < 100) {
      console.warn('Full dependency typically implies 100% dependency');
    }

    // Minor dependant validation
    if (this._value.isMinorDependant && !this._value.minorUntil) {
      throw new Error('Minor until date is required for minor dependants');
    }

    if (this._value.minorUntil && this._value.minorUntil <= new Date()) {
      console.warn('Minor until date should be in the future for current minors');
    }

    // Student dependant validation
    if (this._value.isStudentDependant && !this._value.studentUntil) {
      throw new Error('Student until date is required for student dependants');
    }

    if (this._value.studentUntil && this._value.studentUntil <= new Date()) {
      console.warn('Student until date should be in the future for current students');
    }

    // Disability validation
    if (this._value.isDisabledDependant && !this._value.disabilityType) {
      throw new Error('Disability type is required for disabled dependants');
    }

    // Support amount validation
    if (this._value.monthlySupportAmountKES < 0) {
      throw new Error('Monthly support amount cannot be negative');
    }

    // Support dates validation
    if (!this._value.supportStartDate) {
      throw new Error('Support start date is required');
    }

    if (this._value.supportEndDate && this._value.supportEndDate < this._value.supportStartDate) {
      throw new Error('Support end date cannot be before start date');
    }

    // Evidence verification
    if (this._value.evidenceVerified && !this._value.verifiedAt) {
      throw new Error('Verification date is required when evidence is verified');
    }

    if (this._value.verifiedAt && !this._value.verifiedBy) {
      throw new Error('Verified by is required when verification date is set');
    }
  }

  updateLevel(
    level: DependencyLevelType,
    percentage: number,
    assessmentDate: Date,
    assessedBy: string,
    method: string,
  ): DependencyLevel {
    const applicableSections = DependencyLevel.determineApplicableSections(level, percentage);

    return new DependencyLevel({
      ...this._value,
      level,
      dependencyPercentage: percentage,
      assessmentDate,
      assessedBy,
      assessmentMethod: method,
      applicableSections,
    });
  }

  markAsMinor(minorUntil: Date): DependencyLevel {
    return new DependencyLevel({
      ...this._value,
      isMinorDependant: true,
      minorUntil,
      applicableSections: [
        ...this._value.applicableSections,
        KenyanLawSection.create('S29_DEPENDANTS'),
      ],
    });
  }

  markAsStudent(studentUntil: Date): DependencyLevel {
    return new DependencyLevel({
      ...this._value,
      isStudentDependant: true,
      studentUntil,
    });
  }

  markAsDisabled(disabilityType: string, requiresOngoingCare: boolean = false): DependencyLevel {
    return new DependencyLevel({
      ...this._value,
      isDisabledDependant: true,
      disabilityType,
      requiresOngoingCare,
      applicableSections: [
        ...this._value.applicableSections,
        KenyanLawSection.create('S26_DEPENDANT_PROVISION'),
      ],
    });
  }

  updateSupportDetails(monthlyAmountKES: number, startDate: Date, endDate?: Date): DependencyLevel {
    if (monthlyAmountKES < 0) {
      throw new Error('Monthly support amount cannot be negative');
    }

    if (endDate && endDate < startDate) {
      throw new Error('Support end date cannot be before start date');
    }

    return new DependencyLevel({
      ...this._value,
      monthlySupportAmountKES: monthlyAmountKES,
      supportStartDate: startDate,
      supportEndDate: endDate,
    });
  }

  addEvidence(documentId: string): DependencyLevel {
    const evidenceDocuments = [...this._value.evidenceDocuments, documentId];

    return new DependencyLevel({
      ...this._value,
      evidenceDocuments,
    });
  }

  verifyEvidence(verifiedBy: string, verifiedAt: Date): DependencyLevel {
    return new DependencyLevel({
      ...this._value,
      evidenceVerified: true,
      verifiedBy,
      verifiedAt,
    });
  }

  markEvidenceUnverified(): DependencyLevel {
    return new DependencyLevel({
      ...this._value,
      evidenceVerified: false,
      verifiedBy: undefined,
      verifiedAt: undefined,
    });
  }

  updateNotes(notes: string): DependencyLevel {
    return new DependencyLevel({
      ...this._value,
      notes,
    });
  }

  get level(): DependencyLevelType {
    return this._value.level;
  }

  get description(): string {
    return this._value.description;
  }

  get dependencyPercentage(): number {
    return this._value.dependencyPercentage;
  }

  get assessmentDate(): Date {
    return this._value.assessmentDate;
  }

  get assessedBy(): string {
    return this._value.assessedBy;
  }

  get assessmentMethod(): string {
    return this._value.assessmentMethod;
  }

  get applicableSections(): KenyanLawSection[] {
    return [...this._value.applicableSections];
  }

  get isMinorDependant(): boolean {
    return this._value.isMinorDependant;
  }

  get minorUntil(): Date | undefined {
    return this._value.minorUntil;
  }

  get isStudentDependant(): boolean {
    return this._value.isStudentDependant;
  }

  get studentUntil(): Date | undefined {
    return this._value.studentUntil;
  }

  get isDisabledDependant(): boolean {
    return this._value.isDisabledDependant;
  }

  get disabilityType(): string | undefined {
    return this._value.disabilityType;
  }

  get requiresOngoingCare(): boolean {
    return this._value.requiresOngoingCare;
  }

  get monthlySupportAmountKES(): number {
    return this._value.monthlySupportAmountKES;
  }

  get supportStartDate(): Date {
    return this._value.supportStartDate;
  }

  get supportEndDate(): Date | undefined {
    return this._value.supportEndDate;
  }

  get evidenceDocuments(): string[] {
    return [...this._value.evidenceDocuments];
  }

  get evidenceVerified(): boolean {
    return this._value.evidenceVerified;
  }

  get verifiedBy(): string | undefined {
    return this._value.verifiedBy;
  }

  get verifiedAt(): Date | undefined {
    return this._value.verifiedAt;
  }

  get notes(): string | undefined {
    return this._value.notes;
  }

  // Check if dependency is currently active
  get isActive(): boolean {
    if (this._value.level === 'NONE') return false;

    // Check if support period has ended
    if (this._value.supportEndDate && new Date() > this._value.supportEndDate) {
      return false;
    }

    // Check if minor dependency has ended
    if (
      this._value.isMinorDependant &&
      this._value.minorUntil &&
      new Date() > this._value.minorUntil
    ) {
      return false;
    }

    // Check if student dependency has ended
    if (
      this._value.isStudentDependant &&
      this._value.studentUntil &&
      new Date() > this._value.studentUntil
    ) {
      return false;
    }

    return true;
  }

  // Get dependency category
  get dependencyCategory(): string {
    if (this._value.isMinorDependant) return 'MINOR';
    if (this._value.isStudentDependant) return 'STUDENT';
    if (this._value.isDisabledDependant) return 'DISABLED';
    return 'OTHER';
  }

  // Check if this qualifies for S.29 dependant status
  get qualifiesForDependantStatus(): boolean {
    return (
      this._value.dependencyPercentage >= 50 ||
      this._value.level === 'FULL' ||
      this._value.isMinorDependant ||
      this._value.isDisabledDependant
    );
  }

  // Get annual support amount
  get annualSupportAmountKES(): number {
    return this._value.monthlySupportAmountKES * 12;
  }

  // Get total support provided to date
  get totalSupportProvidedKES(): number {
    if (!this._value.supportStartDate) return 0;

    const endDate = this._value.supportEndDate || new Date();
    const months = this.calculateMonthsBetween(this._value.supportStartDate, endDate);

    return this._value.monthlySupportAmountKES * months;
  }

  private calculateMonthsBetween(startDate: Date, endDate: Date): number {
    const years = endDate.getFullYear() - startDate.getFullYear();
    const months = endDate.getMonth() - startDate.getMonth();
    const totalMonths = years * 12 + months;

    // Adjust for partial month
    if (endDate.getDate() < startDate.getDate()) {
      return Math.max(0, totalMonths - 1);
    }

    return Math.max(0, totalMonths);
  }

  // Check if evidence is sufficient
  get hasSufficientEvidence(): boolean {
    const requiredEvidence = this.getRequiredEvidence();
    const hasRequired = requiredEvidence.every((evidence) =>
      this._value.evidenceDocuments.some((doc) => doc.includes(evidence)),
    );

    return hasRequired && this._value.evidenceDocuments.length >= 2;
  }

  private getRequiredEvidence(): string[] {
    const evidence: string[] = [];

    if (this._value.isMinorDependant) {
      evidence.push('BIRTH_CERTIFICATE');
    }

    if (this._value.isStudentDependant) {
      evidence.push('SCHOOL_FEES_RECEIPT', 'ADMISSION_LETTER');
    }

    if (this._value.isDisabledDependant) {
      evidence.push('MEDICAL_REPORT', 'DISABILITY_CERTIFICATE');
    }

    if (this._value.monthlySupportAmountKES > 0) {
      evidence.push('BANK_STATEMENT', 'MONEY_TRANSFER');
    }

    return evidence;
  }

  // Get dependency status
  get dependencyStatus(): string {
    if (!this.isActive) return 'TERMINATED';
    if (!this._value.evidenceVerified) return 'PENDING_VERIFICATION';
    if (!this.hasSufficientEvidence) return 'INSUFFICIENT_EVIDENCE';
    return 'ACTIVE';
  }

  toJSON() {
    return {
      level: this._value.level,
      description: this._value.description,
      dependencyPercentage: this._value.dependencyPercentage,
      assessmentDate: this._value.assessmentDate.toISOString(),
      assessedBy: this._value.assessedBy,
      assessmentMethod: this._value.assessmentMethod,
      applicableSections: this._value.applicableSections.map((s) => s.toJSON()),
      isMinorDependant: this._value.isMinorDependant,
      minorUntil: this._value.minorUntil?.toISOString(),
      isStudentDependant: this._value.isStudentDependant,
      studentUntil: this._value.studentUntil?.toISOString(),
      isDisabledDependant: this._value.isDisabledDependant,
      disabilityType: this._value.disabilityType,
      requiresOngoingCare: this._value.requiresOngoingCare,
      monthlySupportAmountKES: this._value.monthlySupportAmountKES,
      supportStartDate: this._value.supportStartDate.toISOString(),
      supportEndDate: this._value.supportEndDate?.toISOString(),
      evidenceDocuments: this._value.evidenceDocuments,
      evidenceVerified: this._value.evidenceVerified,
      verifiedBy: this._value.verifiedBy,
      verifiedAt: this._value.verifiedAt?.toISOString(),
      notes: this._value.notes,
      isActive: this.isActive,
      dependencyCategory: this.dependencyCategory,
      qualifiesForDependantStatus: this.qualifiesForDependantStatus,
      annualSupportAmountKES: this.annualSupportAmountKES,
      totalSupportProvidedKES: this.totalSupportProvidedKES,
      hasSufficientEvidence: this.hasSufficientEvidence,
      dependencyStatus: this.dependencyStatus,
    };
  }
}
