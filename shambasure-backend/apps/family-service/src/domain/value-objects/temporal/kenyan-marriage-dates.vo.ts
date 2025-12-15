// domain/value-objects/temporal/kenyan-marriage-dates.vo.ts
import { ValueObject } from '../../base/value-object';

export interface KenyanMarriageDatesProps {
  marriageDate: Date;
  marriageType: 'CUSTOMARY' | 'CHRISTIAN' | 'CIVIL' | 'ISLAMIC' | 'TRADITIONAL';
  registrationDate?: Date;
  dissolutionDate?: Date;
  dissolutionType?: 'DEATH' | 'DIVORCE' | 'ANNULMENT' | 'CUSTOMARY_DISSOLUTION';
  customaryMarriageStages?: {
    introductionDate?: Date;
    engagementDate?: Date;
    bridePricePaymentDate?: Date;
    traditionalCeremonyDate?: Date;
  };
  islamicMarriageDates?: {
    nikahDate?: Date;
    mahrPaymentDate?: Date;
    talaqDate?: Date;
  };
  civilRegistrationNumber?: string;
  certificateIssueDate?: Date;
  polygamousHouseEstablishmentDate?: Date;
  cohabitationStartDate?: Date;
  marriageEndReason?: string;
}

export class KenyanMarriageDates extends ValueObject<KenyanMarriageDatesProps> {
  private constructor(props: KenyanMarriageDatesProps) {
    super(props);
    this.validate();
  }

  static create(
    marriageDate: Date,
    marriageType: 'CUSTOMARY' | 'CHRISTIAN' | 'CIVIL' | 'ISLAMIC' | 'TRADITIONAL',
  ): KenyanMarriageDates {
    return new KenyanMarriageDates({
      marriageDate,
      marriageType,
    });
  }

  static createFromProps(props: KenyanMarriageDatesProps): KenyanMarriageDates {
    return new KenyanMarriageDates(props);
  }

  validate(): void {
    // Marriage date validation
    if (!this._value.marriageDate) {
      throw new Error('Marriage date is required');
    }

    if (this._value.marriageDate > new Date()) {
      throw new Error('Marriage date cannot be in the future');
    }

    // Registration date validation
    if (this._value.registrationDate) {
      if (this._value.registrationDate < this._value.marriageDate) {
        throw new Error('Registration date cannot be before marriage date');
      }
      if (this._value.registrationDate > new Date()) {
        throw new Error('Registration date cannot be in the future');
      }
    }

    // Dissolution date validation
    if (this._value.dissolutionDate) {
      if (this._value.dissolutionDate < this._value.marriageDate) {
        throw new Error('Dissolution date cannot be before marriage date');
      }
      if (this._value.dissolutionDate > new Date()) {
        throw new Error('Dissolution date cannot be in the future');
      }
    }

    // Customary marriage stages validation
    if (this._value.customaryMarriageStages) {
      const stages = this._value.customaryMarriageStages;

      if (stages.introductionDate && stages.introductionDate > this._value.marriageDate) {
        throw new Error('Introduction date cannot be after marriage date');
      }

      if (stages.engagementDate && stages.engagementDate > this._value.marriageDate) {
        throw new Error('Engagement date cannot be after marriage date');
      }

      if (stages.bridePricePaymentDate && stages.bridePricePaymentDate > this._value.marriageDate) {
        throw new Error('Bride price payment date cannot be after marriage date');
      }

      if (
        stages.traditionalCeremonyDate &&
        stages.traditionalCeremonyDate !== this._value.marriageDate
      ) {
        throw new Error(
          'Traditional ceremony date must match marriage date for customary marriages',
        );
      }
    }

    // Islamic marriage dates validation
    if (this._value.islamicMarriageDates) {
      const islamicDates = this._value.islamicMarriageDates;

      if (islamicDates.nikahDate && islamicDates.nikahDate !== this._value.marriageDate) {
        throw new Error('Nikah date must match marriage date for Islamic marriages');
      }

      if (islamicDates.talaqDate && islamicDates.talaqDate < this._value.marriageDate) {
        throw new Error('Talaq date cannot be before marriage date');
      }
    }

    // Polygamous house establishment date validation
    if (this._value.polygamousHouseEstablishmentDate) {
      if (this._value.polygamousHouseEstablishmentDate < this._value.marriageDate) {
        throw new Error('Polygamous house establishment date cannot be before marriage date');
      }
    }

    // Cohabitation start date validation
    if (this._value.cohabitationStartDate) {
      if (this._value.cohabitationStartDate > this._value.marriageDate) {
        throw new Error('Cohabitation start date cannot be after marriage date');
      }
    }
  }

  registerMarriage(registrationDate: Date, civilRegistrationNumber?: string): KenyanMarriageDates {
    return new KenyanMarriageDates({
      ...this._value,
      registrationDate,
      civilRegistrationNumber,
    });
  }

  dissolveMarriage(
    dissolutionDate: Date,
    dissolutionType: 'DEATH' | 'DIVORCE' | 'ANNULMENT' | 'CUSTOMARY_DISSOLUTION',
    reason?: string,
  ): KenyanMarriageDates {
    return new KenyanMarriageDates({
      ...this._value,
      dissolutionDate,
      dissolutionType,
      marriageEndReason: reason,
    });
  }

  updateCustomaryStages(stages: {
    introductionDate?: Date;
    engagementDate?: Date;
    bridePricePaymentDate?: Date;
    traditionalCeremonyDate?: Date;
  }): KenyanMarriageDates {
    return new KenyanMarriageDates({
      ...this._value,
      customaryMarriageStages: stages,
    });
  }

  updateIslamicDates(dates: {
    nikahDate?: Date;
    mahrPaymentDate?: Date;
    talaqDate?: Date;
  }): KenyanMarriageDates {
    return new KenyanMarriageDates({
      ...this._value,
      islamicMarriageDates: dates,
    });
  }

  issueCertificate(issueDate: Date): KenyanMarriageDates {
    return new KenyanMarriageDates({
      ...this._value,
      certificateIssueDate: issueDate,
    });
  }

  establishPolygamousHouse(establishmentDate: Date): KenyanMarriageDates {
    return new KenyanMarriageDates({
      ...this._value,
      polygamousHouseEstablishmentDate: establishmentDate,
    });
  }

  setCohabitationStart(startDate: Date): KenyanMarriageDates {
    return new KenyanMarriageDates({
      ...this._value,
      cohabitationStartDate: startDate,
    });
  }

  get marriageDate(): Date {
    return this._value.marriageDate;
  }

  get marriageType(): string {
    return this._value.marriageType;
  }

  get registrationDate(): Date | undefined {
    return this._value.registrationDate;
  }

  get dissolutionDate(): Date | undefined {
    return this._value.dissolutionDate;
  }

  get dissolutionType(): string | undefined {
    return this._value.dissolutionType;
  }

  get customaryMarriageStages() {
    return this._value.customaryMarriageStages;
  }

  get islamicMarriageDates() {
    return this._value.islamicMarriageDates;
  }

  get civilRegistrationNumber(): string | undefined {
    return this._value.civilRegistrationNumber;
  }

  get certificateIssueDate(): Date | undefined {
    return this._value.certificateIssueDate;
  }

  get polygamousHouseEstablishmentDate(): Date | undefined {
    return this._value.polygamousHouseEstablishmentDate;
  }

  get cohabitationStartDate(): Date | undefined {
    return this._value.cohabitationStartDate;
  }

  get marriageEndReason(): string | undefined {
    return this._value.marriageEndReason;
  }

  // Check if marriage is registered
  get isRegistered(): boolean {
    return !!this._value.registrationDate;
  }

  // Check if marriage is dissolved
  get isDissolved(): boolean {
    return !!this._value.dissolutionDate;
  }

  // Check if marriage is active
  get isActive(): boolean {
    return !this._value.dissolutionDate;
  }

  // Get marriage duration in years
  get marriageDurationYears(): number {
    const endDate = this._value.dissolutionDate || new Date();
    const years = endDate.getFullYear() - this._value.marriageDate.getFullYear();
    const monthDiff = endDate.getMonth() - this._value.marriageDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && endDate.getDate() < this._value.marriageDate.getDate())
    ) {
      return years - 1;
    }
    return years;
  }

  // Get marriage duration in months
  get marriageDurationMonths(): number {
    const endDate = this._value.dissolutionDate || new Date();
    let months = (endDate.getFullYear() - this._value.marriageDate.getFullYear()) * 12;
    months += endDate.getMonth() - this._value.marriageDate.getMonth();

    if (endDate.getDate() < this._value.marriageDate.getDate()) {
      months--;
    }

    return months;
  }

  // Check if marriage qualifies for S.29 dependency (5+ years)
  get qualifiesForDependency(): boolean {
    return this.marriageDurationYears >= 5;
  }

  // Check if it's a customary marriage
  get isCustomaryMarriage(): boolean {
    return this._value.marriageType === 'CUSTOMARY' || this._value.marriageType === 'TRADITIONAL';
  }

  // Check if it's an Islamic marriage
  get isIslamicMarriage(): boolean {
    return this._value.marriageType === 'ISLAMIC';
  }

  // Check if it's a civil marriage
  get isCivilMarriage(): boolean {
    return this._value.marriageType === 'CIVIL';
  }

  // Check if marriage was polygamous
  get wasPolygamous(): boolean {
    return !!this._value.polygamousHouseEstablishmentDate;
  }

  // Get years since marriage registration
  get yearsSinceRegistration(): number | null {
    if (!this._value.registrationDate) return null;

    const now = new Date();
    return now.getFullYear() - this._value.registrationDate.getFullYear();
  }

  // Check if marriage was before legal age (18)
  get wasUnderageMarriage(): boolean {
    // This would need to be calculated with person's birth date
    return false; // Placeholder
  }

  // Get next anniversary date
  get nextAnniversary(): Date {
    const now = new Date();
    const anniversary = new Date(this._value.marriageDate);
    anniversary.setFullYear(now.getFullYear());

    if (anniversary < now) {
      anniversary.setFullYear(now.getFullYear() + 1);
    }

    return anniversary;
  }

  // Get days until next anniversary
  get daysUntilAnniversary(): number {
    const nextAnniversary = this.nextAnniversary;
    const now = new Date();
    const diffTime = nextAnniversary.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  toJSON() {
    return {
      marriageDate: this._value.marriageDate.toISOString(),
      marriageType: this._value.marriageType,
      registrationDate: this._value.registrationDate?.toISOString(),
      dissolutionDate: this._value.dissolutionDate?.toISOString(),
      dissolutionType: this._value.dissolutionType,
      customaryMarriageStages: this._value.customaryMarriageStages,
      islamicMarriageDates: this._value.islamicMarriageDates,
      civilRegistrationNumber: this._value.civilRegistrationNumber,
      certificateIssueDate: this._value.certificateIssueDate?.toISOString(),
      polygamousHouseEstablishmentDate: this._value.polygamousHouseEstablishmentDate?.toISOString(),
      cohabitationStartDate: this._value.cohabitationStartDate?.toISOString(),
      marriageEndReason: this._value.marriageEndReason,
      isRegistered: this.isRegistered,
      isDissolved: this.isDissolved,
      isActive: this.isActive,
      marriageDurationYears: this.marriageDurationYears,
      marriageDurationMonths: this.marriageDurationMonths,
      qualifiesForDependency: this.qualifiesForDependency,
      isCustomaryMarriage: this.isCustomaryMarriage,
      isIslamicMarriage: this.isIslamicMarriage,
      isCivilMarriage: this.isCivilMarriage,
      wasPolygamous: this.wasPolygamous,
      yearsSinceRegistration: this.yearsSinceRegistration,
      wasUnderageMarriage: this.wasUnderageMarriage,
      nextAnniversary: this.nextAnniversary.toISOString(),
      daysUntilAnniversary: this.daysUntilAnniversary,
    };
  }
}
