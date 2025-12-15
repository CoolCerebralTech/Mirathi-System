// domain/value-objects/legal/marriage-details.vo.ts
import { ValueObject } from '../base/value-object';
import { KenyanLawSection } from './kenyan-law-section.vo';

export type MarriageType = 'CUSTOMARY' | 'CHRISTIAN' | 'CIVIL' | 'ISLAMIC' | 'TRADITIONAL';

export type MarriageStatus =
  | 'SINGLE'
  | 'MARRIED'
  | 'DIVORCED'
  | 'WIDOWED'
  | 'SEPARATED'
  | 'CUSTOMARY_MARRIAGE'
  | 'CIVIL_UNION'
  | 'ISLAMIC';

export type MarriageEndReason =
  | 'DEATH_OF_SPOUSE'
  | 'DIVORCE'
  | 'ANNULMENT'
  | 'CUSTOMARY_DISSOLUTION'
  | 'STILL_ACTIVE';

export interface MarriageDetailsProps {
  marriageType: MarriageType;
  status: MarriageStatus;
  startDate: Date;
  endDate?: Date;
  endReason?: MarriageEndReason;
  registrationNumber?: string;
  issuingAuthority?: string;
  certificateIssueDate?: Date;
  registrationDistrict?: string;
  isCustomary: boolean;
  customaryType?: string;
  bridePricePaid: boolean;
  bridePriceAmount?: number;
  bridePriceCurrency?: string;
  isIslamic: boolean;
  nikahDate?: Date;
  mahrAmount?: number;
  mahrCurrency?: string;
  waliName?: string;
  isPolygamous: boolean;
  polygamousHouseId?: string;
  isMatrimonialPropertySettled: boolean;
  matrimonialPropertyRegime?: string;
  courtValidated: boolean;
  validationDate?: Date;
  applicableSections: KenyanLawSection[];
}

export class MarriageDetails extends ValueObject<MarriageDetailsProps> {
  private constructor(props: MarriageDetailsProps) {
    super(props);
    this.validate();
  }

  static create(marriageType: MarriageType, startDate: Date): MarriageDetails {
    const isCustomary = marriageType === 'CUSTOMARY' || marriageType === 'TRADITIONAL';
    const isIslamic = marriageType === 'ISLAMIC';

    return new MarriageDetails({
      marriageType,
      status: 'MARRIED',
      startDate,
      isCustomary,
      isIslamic,
      bridePricePaid: false,
      isPolygamous: false,
      isMatrimonialPropertySettled: false,
      courtValidated: false,
      applicableSections: this.determineApplicableSections(marriageType),
    });
  }

  static createFromProps(props: MarriageDetailsProps): MarriageDetails {
    return new MarriageDetails(props);
  }

  private static determineApplicableSections(marriageType: MarriageType): KenyanLawSection[] {
    const sections: KenyanLawSection[] = [];

    // All marriages under Law of Succession Act
    sections.push(KenyanLawSection.create('S35_SPOUSAL_CHILDS_SHARE'));

    if (marriageType === 'CUSTOMARY' || marriageType === 'TRADITIONAL') {
      sections.push(KenyanLawSection.create('S40_POLY_GAMY'));
    }

    if (marriageType === 'ISLAMIC') {
      sections.push(KenyanLawSection.create('S29_DEPENDANTS'));
    }

    return sections;
  }

  validate(): void {
    // Start date validation
    if (!this._value.startDate) {
      throw new Error('Marriage start date is required');
    }

    if (this._value.startDate > new Date()) {
      throw new Error('Marriage cannot start in the future');
    }

    // End date validation
    if (this._value.endDate) {
      if (this._value.endDate < this._value.startDate) {
        throw new Error('Marriage end date cannot be before start date');
      }

      if (!this._value.endReason) {
        throw new Error('End reason is required when marriage has ended');
      }
    }

    // Customary marriage validation
    if (this._value.isCustomary) {
      if (!this._value.customaryType || this._value.customaryType.trim().length === 0) {
        throw new Error('Customary type is required for customary marriages');
      }

      if (this._value.customaryType.includes('NGURARIO') && !this._value.bridePricePaid) {
        console.warn('Kikuyu Ngurario typically requires bride price payment');
      }
    }

    // Islamic marriage validation
    if (this._value.isIslamic) {
      if (!this._value.nikahDate) {
        throw new Error('Nikah date is required for Islamic marriages');
      }

      if (this._value.nikahDate < this._value.startDate) {
        throw new Error('Nikah date cannot be before marriage start date');
      }

      if (!this._value.mahrAmount || this._value.mahrAmount <= 0) {
        throw new Error('Mahr amount is required for Islamic marriages');
      }
    }

    // Bride price validation
    if (this._value.bridePricePaid) {
      if (!this._value.bridePriceAmount || this._value.bridePriceAmount <= 0) {
        throw new Error('Bride price amount is required when bride price is paid');
      }

      if (!this._value.bridePriceCurrency) {
        throw new Error('Bride price currency is required');
      }
    }

    // Polygamous validation
    if (this._value.isPolygamous && !this._value.polygamousHouseId) {
      throw new Error('Polygamous house ID is required for polygamous marriages');
    }

    // Certificate validation
    if (this._value.certificateIssueDate) {
      if (this._value.certificateIssueDate < this._value.startDate) {
        throw new Error('Certificate cannot be issued before marriage start date');
      }

      if (!this._value.registrationNumber) {
        throw new Error('Registration number is required when certificate issue date is set');
      }
    }

    // Court validation
    if (this._value.courtValidated && !this._value.validationDate) {
      throw new Error('Validation date is required when marriage is court validated');
    }
  }

  endMarriage(endDate: Date, reason: MarriageEndReason): MarriageDetails {
    if (endDate < this._value.startDate) {
      throw new Error('Marriage cannot end before it started');
    }

    return new MarriageDetails({
      ...this._value,
      endDate,
      endReason: reason,
      status: this.getStatusFromEndReason(reason),
    });
  }

  private getStatusFromEndReason(reason: MarriageEndReason): MarriageStatus {
    switch (reason) {
      case 'DEATH_OF_SPOUSE':
        return 'WIDOWED';
      case 'DIVORCE':
        return 'DIVORCED';
      case 'ANNULMENT':
        return 'SINGLE';
      case 'CUSTOMARY_DISSOLUTION':
        return 'DIVORCED';
      default:
        return 'MARRIED';
    }
  }

  registerCivilMarriage(
    registrationNumber: string,
    certificateIssueDate: Date,
    issuingAuthority: string,
    district: string,
  ): MarriageDetails {
    return new MarriageDetails({
      ...this._value,
      registrationNumber,
      certificateIssueDate,
      issuingAuthority,
      registrationDistrict: district,
      marriageType: 'CIVIL',
    });
  }

  addCustomaryDetails(
    customaryType: string,
    bridePricePaid: boolean,
    bridePriceAmount?: number,
    bridePriceCurrency: string = 'KES',
  ): MarriageDetails {
    return new MarriageDetails({
      ...this._value,
      isCustomary: true,
      customaryType,
      bridePricePaid,
      bridePriceAmount,
      bridePriceCurrency,
      marriageType: 'CUSTOMARY',
    });
  }

  addIslamicDetails(
    nikahDate: Date,
    mahrAmount: number,
    mahrCurrency: string = 'KES',
    waliName?: string,
  ): MarriageDetails {
    return new MarriageDetails({
      ...this._value,
      isIslamic: true,
      nikahDate,
      mahrAmount,
      mahrCurrency,
      waliName,
      marriageType: 'ISLAMIC',
    });
  }

  markAsPolygamous(houseId: string): MarriageDetails {
    if (this._value.endDate) {
      throw new Error('Cannot mark ended marriage as polygamous');
    }

    return new MarriageDetails({
      ...this._value,
      isPolygamous: true,
      polygamousHouseId: houseId,
    });
  }

  settleMatrimonialProperty(regime: string = 'COMMUNITY_OF_PROPERTY'): MarriageDetails {
    return new MarriageDetails({
      ...this._value,
      isMatrimonialPropertySettled: true,
      matrimonialPropertyRegime: regime,
    });
  }

  validateByCourt(validationDate: Date): MarriageDetails {
    return new MarriageDetails({
      ...this._value,
      courtValidated: true,
      validationDate,
    });
  }

  get marriageType(): MarriageType {
    return this._value.marriageType;
  }

  get status(): MarriageStatus {
    return this._value.status;
  }

  get startDate(): Date {
    return this._value.startDate;
  }

  get endDate(): Date | undefined {
    return this._value.endDate;
  }

  get endReason(): MarriageEndReason | undefined {
    return this._value.endReason;
  }

  get registrationNumber(): string | undefined {
    return this._value.registrationNumber;
  }

  get issuingAuthority(): string | undefined {
    return this._value.issuingAuthority;
  }

  get certificateIssueDate(): Date | undefined {
    return this._value.certificateIssueDate;
  }

  get registrationDistrict(): string | undefined {
    return this._value.registrationDistrict;
  }

  get isCustomary(): boolean {
    return this._value.isCustomary;
  }

  get customaryType(): string | undefined {
    return this._value.customaryType;
  }

  get bridePricePaid(): boolean {
    return this._value.bridePricePaid;
  }

  get bridePriceAmount(): number | undefined {
    return this._value.bridePriceAmount;
  }

  get bridePriceCurrency(): string | undefined {
    return this._value.bridePriceCurrency;
  }

  get isIslamic(): boolean {
    return this._value.isIslamic;
  }

  get nikahDate(): Date | undefined {
    return this._value.nikahDate;
  }

  get mahrAmount(): number | undefined {
    return this._value.mahrAmount;
  }

  get mahrCurrency(): string | undefined {
    return this._value.mahrCurrency;
  }

  get waliName(): string | undefined {
    return this._value.waliName;
  }

  get isPolygamous(): boolean {
    return this._value.isPolygamous;
  }

  get polygamousHouseId(): string | undefined {
    return this._value.polygamousHouseId;
  }

  get isMatrimonialPropertySettled(): boolean {
    return this._value.isMatrimonialPropertySettled;
  }

  get matrimonialPropertyRegime(): string | undefined {
    return this._value.matrimonialPropertyRegime;
  }

  get courtValidated(): boolean {
    return this._value.courtValidated;
  }

  get validationDate(): Date | undefined {
    return this._value.validationDate;
  }

  get applicableSections(): KenyanLawSection[] {
    return [...this._value.applicableSections];
  }

  // Check if marriage is active
  get isActive(): boolean {
    return !this._value.endDate && this._value.status === 'MARRIED';
  }

  // Get marriage duration in years
  get durationYears(): number {
    const endDate = this._value.endDate || new Date();
    const diffYears = endDate.getFullYear() - this._value.startDate.getFullYear();
    const monthDiff = endDate.getMonth() - this._value.startDate.getMonth();

    return monthDiff < 0 ? diffYears - 1 : diffYears;
  }

  // Check if marriage qualifies for S.40
  get qualifiesForPolygamousDistribution(): boolean {
    return this._value.isPolygamous && this._value.isCustomary;
  }

  // Check if marriage is legally recognized for inheritance
  get isLegallyRecognized(): boolean {
    return (
      this._value.courtValidated ||
      this._value.registrationNumber !== undefined ||
      this._value.isCustomary
    );
  }

  // Check if marriage needs court validation
  get requiresCourtValidation(): boolean {
    return this._value.isCustomary && !this._value.courtValidated && this.durationYears >= 5;
  }

  // Get applicable law sections for inheritance
  get inheritanceSections(): string[] {
    return this._value.applicableSections.map((section) => section.section);
  }

  // Check if this is a monogamous marriage
  get isMonogamous(): boolean {
    return !this._value.isPolygamous;
  }

  // Check if marriage has been dissolved
  get isDissolved(): boolean {
    return !!this._value.endDate && this._value.endReason !== 'STILL_ACTIVE';
  }

  toJSON() {
    return {
      marriageType: this._value.marriageType,
      status: this._value.status,
      startDate: this._value.startDate.toISOString(),
      endDate: this._value.endDate?.toISOString(),
      endReason: this._value.endReason,
      registrationNumber: this._value.registrationNumber,
      issuingAuthority: this._value.issuingAuthority,
      certificateIssueDate: this._value.certificateIssueDate?.toISOString(),
      registrationDistrict: this._value.registrationDistrict,
      isCustomary: this._value.isCustomary,
      customaryType: this._value.customaryType,
      bridePricePaid: this._value.bridePricePaid,
      bridePriceAmount: this._value.bridePriceAmount,
      bridePriceCurrency: this._value.bridePriceCurrency,
      isIslamic: this._value.isIslamic,
      nikahDate: this._value.nikahDate?.toISOString(),
      mahrAmount: this._value.mahrAmount,
      mahrCurrency: this._value.mahrCurrency,
      waliName: this._value.waliName,
      isPolygamous: this._value.isPolygamous,
      polygamousHouseId: this._value.polygamousHouseId,
      isMatrimonialPropertySettled: this._value.isMatrimonialPropertySettled,
      matrimonialPropertyRegime: this._value.matrimonialPropertyRegime,
      courtValidated: this._value.courtValidated,
      validationDate: this._value.validationDate?.toISOString(),
      applicableSections: this._value.applicableSections.map((s) => s.toJSON()),
      isActive: this.isActive,
      durationYears: this.durationYears,
      qualifiesForPolygamousDistribution: this.qualifiesForPolygamousDistribution,
      isLegallyRecognized: this.isLegallyRecognized,
      requiresCourtValidation: this.requiresCourtValidation,
      inheritanceSections: this.inheritanceSections,
      isMonogamous: this.isMonogamous,
      isDissolved: this.isDissolved,
    };
  }
}
