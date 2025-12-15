// domain/value-objects/temporal/cohabitation-duration.vo.ts
import { ValueObject } from '../../base/value-object';

export type CohabitationStatus = 'ACTIVE' | 'ENDED' | 'INTERRUPTED' | 'DISPUTED';
export type RecognitionType = 'FAMILY' | 'COMMUNITY' | 'BOTH' | 'NONE';

export interface CohabitationDurationProps {
  startDate: Date;
  endDate?: Date;
  status: CohabitationStatus;
  recognition: RecognitionType;
  hasChildren: boolean;
  childrenCount: number;
  isAcknowledgedByFamilies: boolean;
  familyConsentDate?: Date;
  communityRecognitionDate?: Date;
  interruptions: {
    startDate: Date;
    endDate: Date;
    reason: string;
  }[];
  evidenceDocuments?: string[];
  witnesses: string[];
  reasonForEnd?: string;
  isRegistered: boolean;
  registrationDate?: Date;
  registrationNumber?: string;
  cohabitationAddress: string;
  sharedFinancialResponsibilities: boolean;
  sharedProperty: boolean;
  publicRecognition: boolean;
}

export class CohabitationDuration extends ValueObject<CohabitationDurationProps> {
  private constructor(props: CohabitationDurationProps) {
    super(props);
    this.validate();
  }

  static create(startDate: Date, cohabitationAddress: string): CohabitationDuration {
    return new CohabitationDuration({
      startDate,
      cohabitationAddress,
      status: 'ACTIVE',
      recognition: 'NONE',
      hasChildren: false,
      childrenCount: 0,
      isAcknowledgedByFamilies: false,
      interruptions: [],
      witnesses: [],
      isRegistered: false,
      sharedFinancialResponsibilities: false,
      sharedProperty: false,
      publicRecognition: false,
    });
  }

  static createFromProps(props: CohabitationDurationProps): CohabitationDuration {
    return new CohabitationDuration(props);
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
    }

    // Children count validation
    if (this._value.childrenCount < 0) {
      throw new Error('Children count cannot be negative');
    }

    if (this._value.hasChildren && this._value.childrenCount === 0) {
      throw new Error('Children count must be > 0 when hasChildren is true');
    }

    // Family consent date validation
    if (this._value.familyConsentDate) {
      if (this._value.familyConsentDate < this._value.startDate) {
        throw new Error('Family consent date cannot be before start date');
      }
    }

    // Community recognition date validation
    if (this._value.communityRecognitionDate) {
      if (this._value.communityRecognitionDate < this._value.startDate) {
        throw new Error('Community recognition date cannot be before start date');
      }
    }

    // Registration date validation
    if (this._value.registrationDate) {
      if (this._value.registrationDate < this._value.startDate) {
        throw new Error('Registration date cannot be before start date');
      }
    }

    // Interruptions validation
    for (const interruption of this._value.interruptions) {
      if (interruption.startDate < this._value.startDate) {
        throw new Error('Interruption cannot start before cohabitation start');
      }

      if (interruption.endDate < interruption.startDate) {
        throw new Error('Interruption end date cannot be before start date');
      }

      if (interruption.endDate > (this._value.endDate || new Date())) {
        throw new Error('Interruption cannot end after cohabitation end');
      }
    }
  }

  endCohabitation(endDate: Date, reason?: string): CohabitationDuration {
    return new CohabitationDuration({
      ...this._value,
      endDate,
      status: 'ENDED',
      reasonForEnd: reason,
    });
  }

  updateStatus(status: CohabitationStatus): CohabitationDuration {
    return new CohabitationDuration({
      ...this._value,
      status,
    });
  }

  updateRecognition(recognition: RecognitionType): CohabitationDuration {
    return new CohabitationDuration({
      ...this._value,
      recognition,
    });
  }

  recordFamilyConsent(consentDate: Date): CohabitationDuration {
    return new CohabitationDuration({
      ...this._value,
      isAcknowledgedByFamilies: true,
      familyConsentDate: consentDate,
    });
  }

  recordCommunityRecognition(recognitionDate: Date): CohabitationDuration {
    return new CohabitationDuration({
      ...this._value,
      communityRecognitionDate: recognitionDate,
    });
  }

  addChild(): CohabitationDuration {
    return new CohabitationDuration({
      ...this._value,
      hasChildren: true,
      childrenCount: this._value.childrenCount + 1,
    });
  }

  updateChildrenCount(count: number): CohabitationDuration {
    return new CohabitationDuration({
      ...this._value,
      hasChildren: count > 0,
      childrenCount: count,
    });
  }

  addInterruption(startDate: Date, endDate: Date, reason: string): CohabitationDuration {
    const interruptions = [...this._value.interruptions, { startDate, endDate, reason }];

    return new CohabitationDuration({
      ...this._value,
      interruptions,
    });
  }

  removeInterruption(index: number): CohabitationDuration {
    const interruptions = this._value.interruptions.filter((_, i) => i !== index);

    return new CohabitationDuration({
      ...this._value,
      interruptions,
    });
  }

  addEvidence(documents: string[]): CohabitationDuration {
    const evidenceDocuments = [...(this._value.evidenceDocuments || []), ...documents];

    return new CohabitationDuration({
      ...this._value,
      evidenceDocuments,
    });
  }

  addWitness(witness: string): CohabitationDuration {
    const witnesses = [...this._value.witnesses, witness];

    return new CohabitationDuration({
      ...this._value,
      witnesses,
    });
  }

  registerCohabitation(registrationDate: Date, registrationNumber: string): CohabitationDuration {
    return new CohabitationDuration({
      ...this._value,
      isRegistered: true,
      registrationDate,
      registrationNumber,
    });
  }

  updateSharedResponsibilities(
    financial: boolean,
    property: boolean,
    publicRecognition: boolean,
  ): CohabitationDuration {
    return new CohabitationDuration({
      ...this._value,
      sharedFinancialResponsibilities: financial,
      sharedProperty: property,
      publicRecognition,
    });
  }

  get startDate(): Date {
    return this._value.startDate;
  }

  get endDate(): Date | undefined {
    return this._value.endDate;
  }

  get status(): CohabitationStatus {
    return this._value.status;
  }

  get recognition(): RecognitionType {
    return this._value.recognition;
  }

  get hasChildren(): boolean {
    return this._value.hasChildren;
  }

  get childrenCount(): number {
    return this._value.childrenCount;
  }

  get isAcknowledgedByFamilies(): boolean {
    return this._value.isAcknowledgedByFamilies;
  }

  get familyConsentDate(): Date | undefined {
    return this._value.familyConsentDate;
  }

  get communityRecognitionDate(): Date | undefined {
    return this._value.communityRecognitionDate;
  }

  get interruptions() {
    return this._value.interruptions.map((i) => ({ ...i }));
  }

  get evidenceDocuments(): string[] | undefined {
    return this._value.evidenceDocuments ? [...this._value.evidenceDocuments] : undefined;
  }

  get witnesses(): string[] {
    return [...this._value.witnesses];
  }

  get reasonForEnd(): string | undefined {
    return this._value.reasonForEnd;
  }

  get isRegistered(): boolean {
    return this._value.isRegistered;
  }

  get registrationDate(): Date | undefined {
    return this._value.registrationDate;
  }

  get registrationNumber(): string | undefined {
    return this._value.registrationNumber;
  }

  get cohabitationAddress(): string {
    return this._value.cohabitationAddress;
  }

  get sharedFinancialResponsibilities(): boolean {
    return this._value.sharedFinancialResponsibilities;
  }

  get sharedProperty(): boolean {
    return this._value.sharedProperty;
  }

  get publicRecognition(): boolean {
    return this._value.publicRecognition;
  }

  // Check if cohabitation is active
  get isActive(): boolean {
    return this._value.status === 'ACTIVE' && !this._value.endDate;
  }

  // Get cohabitation duration in years (excluding interruptions)
  get effectiveDurationYears(): number {
    const endDate = this._value.endDate || new Date();
    const totalMilliseconds = endDate.getTime() - this._value.startDate.getTime();

    // Subtract interruption durations
    const interruptionMilliseconds = this._value.interruptions.reduce((total, interruption) => {
      return total + (interruption.endDate.getTime() - interruption.startDate.getTime());
    }, 0);

    const effectiveMilliseconds = totalMilliseconds - interruptionMilliseconds;
    const effectiveYears = effectiveMilliseconds / (1000 * 60 * 60 * 24 * 365.25);

    return Math.max(0, effectiveYears);
  }

  // Get total duration in years (including interruptions)
  get totalDurationYears(): number {
    const endDate = this._value.endDate || new Date();
    const years = endDate.getFullYear() - this._value.startDate.getFullYear();
    const monthDiff = endDate.getMonth() - this._value.startDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < this._value.startDate.getDate())) {
      return years - 1;
    }
    return years;
  }

  // Check if cohabitation qualifies for S.29(5) (5+ years)
  get qualifiesForSection29(): boolean {
    if (!this.isActive && !this._value.endDate) return false;

    // Must have at least 5 years of effective cohabitation
    if (this.effectiveDurationYears < 5) return false;

    // Must have family or community recognition
    if (this._value.recognition === 'NONE') return false;

    // Must have evidence of cohabitation
    if (!this._value.evidenceDocuments || this._value.evidenceDocuments.length === 0) {
      console.warn('No evidence documents for cohabitation');
    }

    return true;
  }

  // Check if cohabitation is recognized by family
  get isFamilyRecognized(): boolean {
    return this._value.recognition === 'FAMILY' || this._value.recognition === 'BOTH';
  }

  // Check if cohabitation is recognized by community
  get isCommunityRecognized(): boolean {
    return this._value.recognition === 'COMMUNITY' || this._value.recognition === 'BOTH';
  }

  // Check if cohabitation has strong evidence
  get hasStrongEvidence(): boolean {
    const evidenceCount = this._value.evidenceDocuments?.length || 0;
    const witnessCount = this._value.witnesses.length;

    return evidenceCount >= 3 || witnessCount >= 2 || this._value.isRegistered;
  }

  // Get years until 5-year threshold (for S.29)
  get yearsUntilQualification(): number {
    return Math.max(0, 5 - this.effectiveDurationYears);
  }

  // Check if currently interrupted
  get isCurrentlyInterrupted(): boolean {
    const now = new Date();

    return this._value.interruptions.some(
      (interruption) => now >= interruption.startDate && now <= interruption.endDate,
    );
  }

  // Get current interruption (if any)
  get currentInterruption() {
    const now = new Date();

    return this._value.interruptions.find(
      (interruption) => now >= interruption.startDate && now <= interruption.endDate,
    );
  }

  // Get interruption duration in days
  get totalInterruptionDays(): number {
    return this._value.interruptions.reduce((total, interruption) => {
      const days =
        (interruption.endDate.getTime() - interruption.startDate.getTime()) / (1000 * 60 * 60 * 24);
      return total + days;
    }, 0);
  }

  // Check if cohabitation has shared responsibilities
  get hasSharedLife(): boolean {
    return (
      this._value.sharedFinancialResponsibilities ||
      this._value.sharedProperty ||
      this._value.publicRecognition
    );
  }

  // Get evidence score (0-100)
  get evidenceScore(): number {
    let score = 0;

    // Evidence documents
    if (this._value.evidenceDocuments && this._value.evidenceDocuments.length > 0) {
      score += Math.min(this._value.evidenceDocuments.length * 10, 40);
    }

    // Witnesses
    score += Math.min(this._value.witnesses.length * 5, 20);

    // Recognition
    if (this._value.recognition === 'BOTH') score += 20;
    else if (this._value.recognition === 'FAMILY' || this._value.recognition === 'COMMUNITY')
      score += 10;

    // Registration
    if (this._value.isRegistered) score += 20;

    return Math.min(score, 100);
  }

  // Check if cohabitation is likely valid for legal purposes
  get isLikelyValid(): boolean {
    return this.evidenceScore >= 50 && this.effectiveDurationYears >= 2;
  }

  toJSON() {
    return {
      startDate: this._value.startDate.toISOString(),
      endDate: this._value.endDate?.toISOString(),
      status: this._value.status,
      recognition: this._value.recognition,
      hasChildren: this._value.hasChildren,
      childrenCount: this._value.childrenCount,
      isAcknowledgedByFamilies: this._value.isAcknowledgedByFamilies,
      familyConsentDate: this._value.familyConsentDate?.toISOString(),
      communityRecognitionDate: this._value.communityRecognitionDate?.toISOString(),
      interruptions: this._value.interruptions.map((i) => ({
        startDate: i.startDate.toISOString(),
        endDate: i.endDate.toISOString(),
        reason: i.reason,
      })),
      evidenceDocuments: this._value.evidenceDocuments,
      witnesses: this._value.witnesses,
      reasonForEnd: this._value.reasonForEnd,
      isRegistered: this._value.isRegistered,
      registrationDate: this._value.registrationDate?.toISOString(),
      registrationNumber: this._value.registrationNumber,
      cohabitationAddress: this._value.cohabitationAddress,
      sharedFinancialResponsibilities: this._value.sharedFinancialResponsibilities,
      sharedProperty: this._value.sharedProperty,
      publicRecognition: this._value.publicRecognition,
      isActive: this.isActive,
      effectiveDurationYears: this.effectiveDurationYears,
      totalDurationYears: this.totalDurationYears,
      qualifiesForSection29: this.qualifiesForSection29,
      isFamilyRecognized: this.isFamilyRecognized,
      isCommunityRecognized: this.isCommunityRecognized,
      hasStrongEvidence: this.hasStrongEvidence,
      yearsUntilQualification: this.yearsUntilQualification,
      isCurrentlyInterrupted: this.isCurrentlyInterrupted,
      currentInterruption: this.currentInterruption,
      totalInterruptionDays: this.totalInterruptionDays,
      hasSharedLife: this.hasSharedLife,
      evidenceScore: this.evidenceScore,
      isLikelyValid: this.isLikelyValid,
    };
  }
}
