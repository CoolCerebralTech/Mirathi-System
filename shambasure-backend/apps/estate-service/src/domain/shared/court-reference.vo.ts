import { ValueObject } from '../base/value-object';
import { InvalidCourtReferenceException } from '../exceptions/court-reference.exception';
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
  // Static mapping for validation logic
  private static readonly STATION_COUNTY_MAP: Readonly<Record<CourtStation, KenyanCounty>> = {
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
    const ref = this.props.referenceNumber.trim();

    if (!ref || ref.length === 0) {
      throw new InvalidCourtReferenceException(
        'Court reference number cannot be empty',
        'referenceNumber',
      );
    }

    // Validate format based on court level
    switch (this.props.courtLevel) {
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
      /^E\.?L\.?C\.?\s+No\.?\s*\d+\s+of\s+\d{4}$/i,
    ];

    if (!patterns.some((pattern) => pattern.test(ref))) {
      throw new InvalidCourtReferenceException(
        `Invalid High Court reference format: ${ref}`,
        'referenceNumber',
        { reference: ref, courtLevel: 'HIGH_COURT' },
      );
    }
  }

  private validateMagistrateCourtReference(ref: string): void {
    const patterns = [
      /^MC\s+(Succ|Prob)\s+Cause\s+No\.?\s*\d+\/\d{4}$/i,
      /^CMCC\s+No\.?\s*\d+\s+of\s+\d{4}$/i,
      /^PMCC\s+No\.?\s*\d+\/\d{4}$/i,
    ];

    if (!patterns.some((pattern) => pattern.test(ref))) {
      throw new InvalidCourtReferenceException(
        `Invalid Magistrate Court reference format: ${ref}`,
        'referenceNumber',
        { reference: ref, courtLevel: 'MAGISTRATE_COURT' },
      );
    }
  }

  private validateKadhiCourtReference(ref: string): void {
    const patterns = [
      /^Kadhi'?s?\s+Court\s+Cause\s+No\.?\s*\d+\/\d{4}$/i,
      /^KCC\s+No\.?\s*\d+\s+of\s+\d{4}$/i,
    ];

    if (!patterns.some((pattern) => pattern.test(ref))) {
      throw new InvalidCourtReferenceException(
        `Invalid Kadhi's Court reference format: ${ref}`,
        'referenceNumber',
        { reference: ref, courtLevel: 'KADHI_COURT' },
      );
    }
  }

  private validateELCReference(ref: string): void {
    const patterns = [
      /^E\.?L\.?C\.?\s+No\.?\s*\d+\s+of\s+\d{4}$/i,
      /^E&LC\s+(Succ|Prob)\s+Cause\s+No\.?\s*\d+\/\d{4}$/i,
    ];

    if (!patterns.some((pattern) => pattern.test(ref))) {
      throw new InvalidCourtReferenceException(
        `Invalid Environment & Land Court reference format: ${ref}`,
        'referenceNumber',
        { reference: ref, courtLevel: 'ENVIRONMENT_LAND_COURT' },
      );
    }
  }

  private validateGenericCourtReference(ref: string): void {
    const genericPattern = /^[A-Za-z\s]+No\.?\s*\d+[\s\\/\\-]?\d{4}$/i;
    if (!genericPattern.test(ref)) {
      throw new InvalidCourtReferenceException(
        `Invalid court reference format: ${ref}`,
        'referenceNumber',
        { reference: ref, courtLevel: this.props.courtLevel },
      );
    }
  }

  private validateYear(): void {
    const currentYear = new Date().getFullYear();
    // Allow filing one year into future (e.g. clerical errors near Dec 31st) but mostly historical
    if (this.props.year < 1900 || this.props.year > currentYear + 1) {
      throw new InvalidCourtReferenceException(
        `Invalid year in court reference: ${this.props.year}`,
        'year',
        { year: this.props.year, currentYear },
      );
    }
  }

  private validateSequenceNumber(): void {
    if (this.props.sequenceNumber <= 0) {
      throw new InvalidCourtReferenceException(
        `Invalid sequence number: ${this.props.sequenceNumber}`,
        'sequenceNumber',
        { sequenceNumber: this.props.sequenceNumber },
      );
    }
  }

  private validateCourtStation(): void {
    const expectedCounty = CourtReference.STATION_COUNTY_MAP[this.props.courtStation];

    if (expectedCounty && expectedCounty !== this.props.county) {
      throw new InvalidCourtReferenceException(
        `Court station ${this.props.courtStation} doesn't match county ${this.props.county}`,
        'courtStation',
        { courtStation: this.props.courtStation, county: this.props.county },
      );
    }
  }

  // --- Factory Methods ---

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
    courtStation: CourtStation, // Added courtStation parameter for context
  ): CourtReference {
    const prefix = grantType === 'PROBATE' ? 'P' : 'LA';
    const ref = `${prefix}.${sequenceNumber}/${year}`;

    // Note: Grants are typically issued by the same station as the cause
    // We default to Nairobi here if not provided in older systems, but strict factory should require it.
    // Assuming Nairobi for this specific factory signature or pass it in.
    // For this implementation, we take Nairobi as default for centralized grants.
    return new CourtReference({
      referenceNumber: ref,
      courtLevel: CourtLevel.HIGH_COURT,
      courtStation,
      county: CourtReference.STATION_COUNTY_MAP[courtStation] || KenyanCounty.NAIROBI,
      year,
      sequenceNumber,
      prefix,
      issuedDate: new Date(),
    });
  }

  // --- Business Logic ---

  isSuccessionCause(): boolean {
    return /succession/i.test(this.props.referenceNumber);
  }

  isProbateCause(): boolean {
    return /probate/i.test(this.props.referenceNumber);
  }

  getYearsOld(): number {
    return new Date().getFullYear() - this.props.year;
  }

  isArchivable(): boolean {
    // Succession cases can be archived after 7 years
    return this.getYearsOld() > 7;
  }

  getLegalCitation(deceasedName: string): string {
    return `In the Matter of the Estate of ${deceasedName}, ${this.props.referenceNumber}`;
  }

  public toJSON(): Record<string, any> {
    return {
      referenceNumber: this.props.referenceNumber,
      courtLevel: this.props.courtLevel,
      courtStation: this.props.courtStation,
      year: this.props.year,
      sequence: this.props.sequenceNumber,
      formattedCitation: `In Re Estate, ${this.props.referenceNumber}`,
      issuedDate: this.props.issuedDate,
    };
  }
}
