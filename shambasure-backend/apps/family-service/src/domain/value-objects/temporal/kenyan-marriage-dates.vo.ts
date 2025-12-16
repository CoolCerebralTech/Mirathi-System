// domain/value-objects/temporal/kenyan-marriage-dates.vo.ts
import { ValueObject } from '../../base/value-object';

export type KenyanMarriageType = 'CUSTOMARY' | 'CHRISTIAN' | 'CIVIL' | 'ISLAMIC' | 'TRADITIONAL';
export type DissolutionType = 'DEATH' | 'DIVORCE' | 'ANNULMENT' | 'CUSTOMARY_DISSOLUTION';

export interface KenyanMarriageDatesProps {
  marriageDate: Date;
  marriageType: KenyanMarriageType;

  // Registration
  registrationDate?: Date;
  civilRegistrationNumber?: string;
  certificateIssueDate?: Date;

  // Dissolution
  dissolutionDate?: Date;
  dissolutionType?: DissolutionType;
  marriageEndReason?: string;

  // Polygamy / Cohabitation
  polygamousHouseEstablishmentDate?: Date;
  cohabitationStartDate?: Date;

  // Cultural Specifics
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
}

export class KenyanMarriageDates extends ValueObject<KenyanMarriageDatesProps> {
  private constructor(props: KenyanMarriageDatesProps) {
    super(props);
    this.validate();
  }

  static create(marriageDate: Date, marriageType: KenyanMarriageType): KenyanMarriageDates {
    return new KenyanMarriageDates({
      marriageDate,
      marriageType,
    });
  }

  static createFromProps(props: KenyanMarriageDatesProps): KenyanMarriageDates {
    return new KenyanMarriageDates(props);
  }

  validate(): void {
    if (!this._value.marriageDate) {
      throw new Error('Marriage date is required');
    }

    // Registration validation
    if (this._value.registrationDate && this._value.registrationDate < this._value.marriageDate) {
      throw new Error('Registration date cannot be before marriage date');
    }

    // Dissolution validation
    if (this._value.dissolutionDate && this._value.dissolutionDate < this._value.marriageDate) {
      throw new Error('Dissolution date cannot be before marriage date');
    }

    // Customary stages validation
    if (this._value.customaryMarriageStages) {
      const stages = this._value.customaryMarriageStages;
      if (stages.introductionDate && stages.introductionDate > this._value.marriageDate) {
        throw new Error('Introduction date cannot be after marriage date');
      }
    }

    // Islamic dates validation
    if (this._value.islamicMarriageDates?.talaqDate) {
      if (this._value.islamicMarriageDates.talaqDate < this._value.marriageDate) {
        throw new Error('Talaq date cannot be before marriage date');
      }
    }
  }

  // --- Actions ---

  registerMarriage(registrationDate: Date, civilRegistrationNumber?: string): KenyanMarriageDates {
    return new KenyanMarriageDates({
      ...this._value,
      registrationDate,
      civilRegistrationNumber,
    });
  }

  dissolveMarriage(
    dissolutionDate: Date,
    dissolutionType: DissolutionType,
    reason?: string,
  ): KenyanMarriageDates {
    return new KenyanMarriageDates({
      ...this._value,
      dissolutionDate,
      dissolutionType,
      marriageEndReason: reason,
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

  updateCustomaryStages(
    stages: KenyanMarriageDatesProps['customaryMarriageStages'],
  ): KenyanMarriageDates {
    return new KenyanMarriageDates({
      ...this._value,
      customaryMarriageStages: {
        ...this._value.customaryMarriageStages,
        ...stages,
      },
    });
  }

  updateIslamicDates(dates: KenyanMarriageDatesProps['islamicMarriageDates']): KenyanMarriageDates {
    return new KenyanMarriageDates({
      ...this._value,
      islamicMarriageDates: {
        ...this._value.islamicMarriageDates,
        ...dates,
      },
    });
  }

  // --- Getters ---

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

  get civilRegistrationNumber(): string | undefined {
    return this._value.civilRegistrationNumber;
  }
  get certificateIssueDate(): Date | undefined {
    return this._value.certificateIssueDate;
  }
  get polygamousHouseEstablishmentDate(): Date | undefined {
    return this._value.polygamousHouseEstablishmentDate;
  }
  get marriageEndReason(): string | undefined {
    return this._value.marriageEndReason;
  }

  // Computed
  get isRegistered(): boolean {
    return !!this._value.registrationDate;
  }
  get isDissolved(): boolean {
    return !!this._value.dissolutionDate;
  }
  get isActive(): boolean {
    return !this._value.dissolutionDate;
  }

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

  // S.29 Dependency Qualification (5+ years cohabitation/marriage)
  get qualifiesForDependency(): boolean {
    return this.marriageDurationYears >= 5;
  }

  get endDate(): Date | undefined {
    return this._value.dissolutionDate;
  }

  get dissolutionReason(): string | undefined {
    return this._value.marriageEndReason;
  }

  // --- Serialization ---

  toJSON() {
    return {
      marriageDate: this._value.marriageDate.toISOString(),
      marriageType: this._value.marriageType,
      registrationDate: this._value.registrationDate?.toISOString(),

      dissolutionDate: this._value.dissolutionDate?.toISOString(),
      dissolutionType: this._value.dissolutionType,
      marriageEndReason: this._value.marriageEndReason,

      civilRegistrationNumber: this._value.civilRegistrationNumber,
      certificateIssueDate: this._value.certificateIssueDate?.toISOString(),
      polygamousHouseEstablishmentDate: this._value.polygamousHouseEstablishmentDate?.toISOString(),
      cohabitationStartDate: this._value.cohabitationStartDate?.toISOString(),

      // Explicitly serialize nested date objects to ISO strings
      customaryMarriageStages: this._value.customaryMarriageStages
        ? {
            introductionDate: this._value.customaryMarriageStages.introductionDate?.toISOString(),
            engagementDate: this._value.customaryMarriageStages.engagementDate?.toISOString(),
            bridePricePaymentDate:
              this._value.customaryMarriageStages.bridePricePaymentDate?.toISOString(),
            traditionalCeremonyDate:
              this._value.customaryMarriageStages.traditionalCeremonyDate?.toISOString(),
          }
        : undefined,

      islamicMarriageDates: this._value.islamicMarriageDates
        ? {
            nikahDate: this._value.islamicMarriageDates.nikahDate?.toISOString(),
            mahrPaymentDate: this._value.islamicMarriageDates.mahrPaymentDate?.toISOString(),
            talaqDate: this._value.islamicMarriageDates.talaqDate?.toISOString(),
          }
        : undefined,

      // Computed
      isRegistered: this.isRegistered,
      isDissolved: this.isDissolved,
      isActive: this.isActive,
      marriageDurationYears: this.marriageDurationYears,
      qualifiesForDependency: this.qualifiesForDependency,
    };
  }
}
