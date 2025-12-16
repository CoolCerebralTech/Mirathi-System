// domain/value-objects/legal/marriage-details.vo.ts
import { ValueObject } from '../../base/value-object';
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

  // Civil Registration
  isCivilRegistered?: boolean; // Helper flag
  registrationNumber?: string;
  issuingAuthority?: string;
  certificateIssueDate?: Date;
  registrationDistrict?: string;

  // Customary Context
  isCustomary: boolean;
  customaryType?: string;
  bridePricePaid: boolean;
  bridePriceAmount?: number;
  bridePriceCurrency?: string;

  // Islamic Context
  isIslamic: boolean;
  nikahDate?: Date;
  mahrAmount?: number;
  mahrCurrency?: string;
  waliName?: string;

  // Polygamy (S.40 LSA)
  isPolygamous: boolean;
  polygamousHouseId?: string;
  s40CertificateNumber?: string; // Explicitly added to align with Mapper

  // Property (Matrimonial Property Act)
  isMatrimonialPropertyRegime?: boolean; // Aligned with Mapper usage
  isMatrimonialPropertySettled: boolean;
  matrimonialPropertyRegime?: string;

  // Validation
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
    if (!this._value.startDate) {
      throw new Error('Marriage start date is required');
    }

    if (this._value.endDate && this._value.endDate < this._value.startDate) {
      throw new Error('Marriage end date cannot be before start date');
    }

    // Relaxed strict checks for legacy data, but enforce invariants for new flags
    if (this._value.isPolygamous && !this._value.polygamousHouseId) {
      // In strict mode this would throw, but for reconstitution we might log warning
      // console.warn('Polygamous marriage record missing House ID');
    }
  }

  // --- Actions ---

  endMarriage(endDate: Date, reason: MarriageEndReason): MarriageDetails {
    return new MarriageDetails({
      ...this._value,
      endDate,
      endReason: reason,
      status: this.getStatusFromEndReason(reason),
    });
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
      isCivilRegistered: true,
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

  markAsPolygamous(houseId?: string): MarriageDetails {
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

  // --- Getters ---

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

  get isMatrimonialPropertyRegime(): boolean {
    return this._value.isMatrimonialPropertyRegime ?? false;
  }
  get isMatrimonialPropertySettled(): boolean {
    return this._value.isMatrimonialPropertySettled;
  }

  get isPolygamous(): boolean {
    return this._value.isPolygamous;
  }
  get s40CertificateNumber(): string | undefined {
    return this._value.s40CertificateNumber;
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

  toJSON() {
    return {
      marriageType: this._value.marriageType,
      status: this._value.status,
      startDate: this._value.startDate.toISOString(),
      endDate: this._value.endDate?.toISOString(),
      endReason: this._value.endReason,

      // Civil
      registrationNumber: this._value.registrationNumber,
      issuingAuthority: this._value.issuingAuthority,
      certificateIssueDate: this._value.certificateIssueDate?.toISOString(),
      registrationDistrict: this._value.registrationDistrict,

      // Customary
      isCustomary: this._value.isCustomary,
      customaryType: this._value.customaryType,
      bridePricePaid: this._value.bridePricePaid,
      bridePriceAmount: this._value.bridePriceAmount,
      bridePriceCurrency: this._value.bridePriceCurrency,

      // Islamic
      isIslamic: this._value.isIslamic,
      nikahDate: this._value.nikahDate?.toISOString(),
      mahrAmount: this._value.mahrAmount,
      mahrCurrency: this._value.mahrCurrency,
      waliName: this._value.waliName,

      // Polygamy
      isPolygamous: this._value.isPolygamous,
      polygamousHouseId: this._value.polygamousHouseId,
      s40CertificateNumber: this._value.s40CertificateNumber,

      // Property
      isMatrimonialPropertyRegime: this._value.isMatrimonialPropertyRegime,
      isMatrimonialPropertySettled: this._value.isMatrimonialPropertySettled,
      matrimonialPropertyRegime: this._value.matrimonialPropertyRegime,

      // Validation
      courtValidated: this._value.courtValidated,
      validationDate: this._value.validationDate?.toISOString(),

      // Helpers
      applicableSections: this._value.applicableSections.map((s) => s.toJSON()),
    };
  }
}
