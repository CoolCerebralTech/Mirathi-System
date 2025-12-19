// src/shared/domain/value-objects/court-reference.vo.ts
import { ValueObject } from '../base/value-object';
import {
  InvalidCaseNumberException,
  InvalidCourtReferenceException,
  InvalidFormNumberException,
  InvalidGrantNumberException,
} from '../exceptions/court-reference.exception';
import { KenyanCounty } from './kenyan-location.vo';

export enum CourtLevel {
  HIGH_COURT = 'HIGH_COURT',
  MAGISTRATE_COURT = 'MAGISTRATE_COURT',
  KADHI_COURT = 'KADHI_COURT',
  ENVIRONMENT_LAND_COURT = 'ENVIRONMENT_LAND_COURT',
  FAMILY_DIVISION = 'FAMILY_DIVISION',
  COMMERCIAL_COURT = 'COMMERCIAL_COURT',
}

export enum CourtStation {
  NAIROBI_HIGH_COURT = 'NAIROBI_HIGH_COURT',
  MOMBASA_HIGH_COURT = 'MOMBASA_HIGH_COURT',
  KISUMU_HIGH_COURT = 'KISUMU_HIGH_COURT',
  NAKURU_HIGH_COURT = 'NAKURU_HIGH_COURT',
  ELDORET_HIGH_COURT = 'ELDORET_HIGH_COURT',
  MERU_HIGH_COURT = 'MERU_HIGH_COURT',
  NYERI_HIGH_COURT = 'NYERI_HIGH_COURT',
  MACHAKOS_HIGH_COURT = 'MACHAKOS_HIGH_COURT',
  KAKAMEGA_HIGH_COURT = 'KAKAMEGA_HIGH_COURT',
}

export interface CourtReferenceProps {
  referenceNumber: string;
  courtLevel: CourtLevel;
  courtStation: CourtStation;
  county: KenyanCounty;
  year: number;
  sequenceNumber: number;
  prefix?: string;
  suffix?: string;
  issuedDate?: Date;
  judgeName?: string;
}

export class CourtReference extends ValueObject<CourtReferenceProps> {
  constructor(props: CourtReferenceProps) {
    super(props);
  }

  protected validate(): void {
    this.validateReferenceNumber();
    this.validateYear();
    this.validateSequenceNumber();
    this.validateCourtStation();
  }

  private validateReferenceNumber(): void {
    const ref = this._value.referenceNumber.trim();

    if (!ref || ref.length === 0) {
      throw new InvalidCourtReferenceException(
        'Court reference number cannot be empty',
        'referenceNumber',
      );
    }

    // Validate format based on court level
    switch (this._value.courtLevel) {
      case CourtLevel.HIGH_COURT:
        this.validateHighCourtReference(ref);
        break;
      case CourtLevel.MAGISTRATE_COURT:
        this.validateMagistrateCourtReference(ref);
        break;
      case CourtLevel.KADHI_COURT:
        this.validateKadhiCourtReference(ref);
        break;
      case CourtLevel.ENVIRONMENT_LAND_COURT:
        this.validateELCReference(ref);
        break;
      default:
        this.validateGenericCourtReference(ref);
    }
  }

  private validateHighCourtReference(ref: string): void {
    // High Court formats:
    // - Succession Cause No. 123 of 2024
    // - HC Succ Cause No. 123/2024
    // - HCSC No. 123 of 2024

    const patterns = [
      /^(Succession|Probate)\s+Cause\s+No\.?\s*\d+\s+of\s+\d{4}$/i,
      /^HC\s+(Succ|Prob)\s+Cause\s+No\.?\s*\d+\/\d{4}$/i,
      /^HCSC\s+No\.?\s*\d+\s+of\s+\d{4}$/i,
      /^E\.?L\.?C\.?\s+No\.?\s*\d+\s+of\s+\d{4}$/i, // Environment & Land Court
    ];

    const isValid = patterns.some((pattern) => pattern.test(ref));

    if (!isValid) {
      throw new InvalidCourtReferenceException(
        `Invalid High Court reference format: ${ref}`,
        'referenceNumber',
        { reference: ref, courtLevel: 'HIGH_COURT' },
      );
    }
  }

  private validateMagistrateCourtReference(ref: string): void {
    // Magistrate Court formats:
    // - MC Succ Cause No. 123/2024
    // - CMCC No. 123 of 2024 (Chief Magistrate)
    // - PMCC No. 123/2024 (Principal Magistrate)

    const patterns = [
      /^MC\s+(Succ|Prob)\s+Cause\s+No\.?\s*\d+\/\d{4}$/i,
      /^CMCC\s+No\.?\s*\d+\s+of\s+\d{4}$/i,
      /^PMCC\s+No\.?\s*\d+\/\d{4}$/i,
    ];

    const isValid = patterns.some((pattern) => pattern.test(ref));

    if (!isValid) {
      throw new InvalidCourtReferenceException(
        `Invalid Magistrate Court reference format: ${ref}`,
        'referenceNumber',
        { reference: ref, courtLevel: 'MAGISTRATE_COURT' },
      );
    }
  }

  private validateKadhiCourtReference(ref: string): void {
    // Kadhi's Court formats (for Islamic succession):
    // - Kadhi's Court Cause No. 123/2024
    // - KCC No. 123 of 2024

    const patterns = [
      /^Kadhi'?s?\s+Court\s+Cause\s+No\.?\s*\d+\/\d{4}$/i,
      /^KCC\s+No\.?\s*\d+\s+of\s+\d{4}$/i,
    ];

    const isValid = patterns.some((pattern) => pattern.test(ref));

    if (!isValid) {
      throw new InvalidCourtReferenceException(
        `Invalid Kadhi's Court reference format: ${ref}`,
        'referenceNumber',
        { reference: ref, courtLevel: 'KADHI_COURT' },
      );
    }
  }

  private validateELCReference(ref: string): void {
    // Environment & Land Court formats:
    // - ELC No. 123 of 2024
    // - E&LC Succ Cause No. 123/2024

    const patterns = [
      /^E\.?L\.?C\.?\s+No\.?\s*\d+\s+of\s+\d{4}$/i,
      /^E&LC\s+(Succ|Prob)\s+Cause\s+No\.?\s*\d+\/\d{4}$/i,
    ];

    const isValid = patterns.some((pattern) => pattern.test(ref));

    if (!isValid) {
      throw new InvalidCourtReferenceException(
        `Invalid Environment & Land Court reference format: ${ref}`,
        'referenceNumber',
        { reference: ref, courtLevel: 'ENVIRONMENT_LAND_COURT' },
      );
    }
  }

  private validateGenericCourtReference(ref: string): void {
    // Generic pattern for other courts
    const genericPattern = /^[A-Za-z\s]+No\.?\s*\d+[\s\/\-]?\d{4}$/i;

    if (!genericPattern.test(ref)) {
      throw new InvalidCourtReferenceException(
        `Invalid court reference format: ${ref}`,
        'referenceNumber',
        { reference: ref, courtLevel: this._value.courtLevel },
      );
    }
  }

  private validateYear(): void {
    const currentYear = new Date().getFullYear();

    if (this._value.year < 1900 || this._value.year > currentYear + 1) {
      throw new InvalidCourtReferenceException(
        `Invalid year in court reference: ${this._value.year}`,
        'year',
        { year: this._value.year, currentYear },
      );
    }
  }

  private validateSequenceNumber(): void {
    if (this._value.sequenceNumber <= 0) {
      throw new InvalidCourtReferenceException(
        `Invalid sequence number: ${this._value.sequenceNumber}`,
        'sequenceNumber',
        { sequenceNumber: this._value.sequenceNumber },
      );
    }
  }

  private validateCourtStation(): void {
    // Ensure court station matches county (simplified validation)
    const stationCountyMap: Record<CourtStation, KenyanCounty> = {
      [CourtStation.NAIROBI_HIGH_COURT]: KenyanCounty.NAIROBI,
      [CourtStation.MOMBASA_HIGH_COURT]: KenyanCounty.MOMBASA,
      [CourtStation.KISUMU_HIGH_COURT]: KenyanCounty.KISUMU,
      [CourtStation.NAKURU_HIGH_COURT]: KenyanCounty.NAKURU,
      [CourtStation.ELDORET_HIGH_COURT]: KenyanCounty.UASIN_GISHU,
      [CourtStation.MERU_HIGH_COURT]: KenyanCounty.MERU,
      [CourtStation.NYERI_HIGH_COURT]: KenyanCounty.NYERI,
      [CourtStation.MACHAKOS_HIGH_COURT]: KenyanCounty.MACHAKOS,
      [CourtStation.KAKAMEGA_HIGH_COURT]: KenyanCounty.KAKAMEGA,
    };

    const expectedCounty = stationCountyMap[this._value.courtStation];

    if (expectedCounty && expectedCounty !== this._value.county) {
      throw new InvalidCourtReferenceException(
        `Court station ${this._value.courtStation} doesn't match county ${this._value.county}`,
        'courtStation',
        { courtStation: this._value.courtStation, county: this._value.county },
      );
    }
  }

  // Factory methods
  static createSuccessionCause(
    sequenceNumber: number,
    year: number,
    courtStation: CourtStation,
    county: KenyanCounty,
    judgeName?: string,
  ): CourtReference {
    const ref = `Succession Cause No. ${sequenceNumber} of ${year}`;

    return new CourtReference({
      referenceNumber: ref,
      courtLevel: CourtLevel.HIGH_COURT,
      courtStation,
      county,
      year,
      sequenceNumber,
      judgeName,
      issuedDate: new Date(),
    });
  }

  static createProbateCause(
    sequenceNumber: number,
    year: number,
    courtStation: CourtStation,
    county: KenyanCounty,
  ): CourtReference {
    const ref = `Probate Cause No. ${sequenceNumber}/${year}`;

    return new CourtReference({
      referenceNumber: ref,
      courtLevel: CourtLevel.HIGH_COURT,
      courtStation,
      county,
      year,
      sequenceNumber,
      issuedDate: new Date(),
    });
  }

  static createGrantNumber(
    grantType: 'PROBATE' | 'LETTERS_OF_ADMINISTRATION',
    sequenceNumber: number,
    year: number,
    courtStation: CourtStation,
  ): CourtReference {
    const prefix = grantType === 'PROBATE' ? 'P' : 'LA';
    const ref = `${prefix}.${sequenceNumber}/${year}`;

    return new CourtReference({
      referenceNumber: ref,
      courtLevel: CourtLevel.HIGH_COURT,
      courtStation,
      county: KenyanCounty.NAIROBI, // Default
      year,
      sequenceNumber,
      prefix,
      issuedDate: new Date(),
    });
  }

  // Business logic methods
  isSuccessionCause(): boolean {
    return this._value.referenceNumber.toLowerCase().includes('succession');
  }

  isProbateCause(): boolean {
    return this._value.referenceNumber.toLowerCase().includes('probate');
  }

  isCurrentYear(): boolean {
    return this._value.year === new Date().getFullYear();
  }

  getYearsOld(): number {
    return new Date().getFullYear() - this._value.year;
  }

  isArchivable(): boolean {
    // Succession cases can be archived after 7 years
    return this.getYearsOld() > 7;
  }

  // Formatting methods
  getFormattedReference(): string {
    return this._value.referenceNumber;
  }

  getShortReference(): string {
    const match = this._value.referenceNumber.match(/\d+\s+(of|\/)\s+\d{4}/);
    return match ? match[0] : this._value.referenceNumber;
  }

  getCitationFormat(): string {
    // Legal citation format
    return `In the Matter of the Estate of [Deceased Name], ${this._value.referenceNumber}`;
  }

  getCourtDetails(): string {
    return `${this._value.courtLevel.replace('_', ' ')} at ${this._value.courtStation.replace('_', ' ')}`;
  }

  // Getters
  get referenceNumber(): string {
    return this._value.referenceNumber;
  }

  get courtLevel(): CourtLevel {
    return this._value.courtLevel;
  }

  get courtStation(): CourtStation {
    return this._value.courtStation;
  }

  get county(): KenyanCounty {
    return this._value.county;
  }

  get year(): number {
    return this._value.year;
  }

  get sequenceNumber(): number {
    return this._value.sequenceNumber;
  }

  get prefix(): string | undefined {
    return this._value.prefix;
  }

  get suffix(): string | undefined {
    return this._value.suffix;
  }

  get issuedDate(): Date | undefined {
    return this._value.issuedDate;
  }

  get judgeName(): string | undefined {
    return this._value.judgeName;
  }
}
