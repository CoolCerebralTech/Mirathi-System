// src/shared/domain/value-objects/title-deed.vo.ts
import { ValueObject } from '../base/value-object';
import { InvalidTitleDeedException } from '../exceptions/title-deed.exception';

export enum TitleDeedType {
  FREEHOLD = 'FREEHOLD',
  LEASEHOLD = 'LEASEHOLD',
  ABSOLUTE = 'ABSOLUTE', // Government land converted to freehold
  PROVISIONAL = 'PROVISIONAL', // Waiting for survey/registration
  COMMUNITY_LAND = 'COMMUNITY_LAND', // Group ranches, community titles
  SECTIONAL_TITLE = 'SECTIONAL_TITLE', // Apartments/condominiums
}

// Succession requirement types
export type SuccessionRequirement =
  | 'Grant of representation'
  | 'Death certificate'
  | 'Title deed'
  | 'Consent to transfer from Commissioner of Lands'
  | 'Lease renewal may be required'
  | 'Lease renewal required before transfer'
  | 'Certificate of confirmation of grant (S. 71 LSA)'
  | 'Mutation form (Transfer of land)'
  | 'Consent from County Government'
  | 'Land rates clearance certificate'
  | 'Land rent clearance certificate'
  | 'Survey diagram/plan'
  | 'Consent from co-owners'
  | 'Court order for transmission'
  | 'Community land management committee consent'
  | 'Discharge of charge/mortgage'
  | 'Removal of caveat or court order';

export interface TitleDeedProps {
  deedNumber: string;
  type: TitleDeedType;
  parcelNumber: string;
  issueDate: Date;
  expiryDate?: Date; // For leasehold
  registryReference?: string;
  leaseTermYears?: number; // For leasehold (33, 50, 99, 999 years)
  hasCharges?: boolean; // Mortgages, charges registered
  hasCaveats?: boolean; // Caveats/restrictions
  acreage?: number; // Size in acres/hectares
}

export class TitleDeed extends ValueObject<TitleDeedProps> {
  private static readonly MIN_LEASE_YEARS = 33; // Minimum lease term in Kenya
  private static readonly MAX_LEASE_YEARS = 999; // Maximum lease term

  constructor(props: TitleDeedProps) {
    super(props);
  }

  protected validate(): void {
    this.validateDeedNumber();
    this.validateParcelNumber();
    this.validateDates();
    this.validateLeaseTerm();
  }

  private validateDeedNumber(): void {
    const deedNumber = this._value.deedNumber.trim();

    if (!deedNumber || deedNumber.length < 3) {
      throw new InvalidTitleDeedException('Title deed number cannot be empty or too short');
    }

    // Kenyan title deed formats with comprehensive patterns:
    const patterns = [
      /^(IR|CR)\s*\d{4,8}$/i, // Individual/Corporate Registration
      /^L\.?R\.?\s*(No\.?)?\s*\d{4,8}$/i, // Land Reference Number
      /^Title\s*(No\.?)?\s*[A-Z]{1,5}\/\d{1,5}\/\d{1,5}$/i, // Title No. ABC/123/456
      /^\d{1,5}\/[A-Z]{1,5}\/\d{1,5}$/i, // e.g., 123/ABC/456
      /^[A-Z]{2,3}\/\d{4,6}$/i, // e.g., MN/12345
      /^GRANT\s*NO\.?\s*\d{1,5}$/i, // Grant numbers
      /^C\.?R\.?\s*\d{1,5}$/i, // Certificate of Registration
      /^COMMUNITY\/[A-Z]{2,4}\/\d{1,5}$/i, // Community land titles
      /^SECTIONAL\/[A-Z]{1,5}\/\d{1,5}$/i, // Sectional titles
    ];

    const isValid = patterns.some((pattern) => pattern.test(deedNumber));

    if (!isValid) {
      throw new InvalidTitleDeedException(
        `Invalid title deed number format: ${deedNumber}. Valid formats: IR 12345, L.R. No. 12345, Title No. ABC/123/456`,
      );
    }
  }

  private validateParcelNumber(): void {
    const parcelNumber = this._value.parcelNumber.trim();

    if (!parcelNumber || parcelNumber.length < 3) {
      throw new InvalidTitleDeedException('Parcel number cannot be empty or too short');
    }

    // Kenyan parcel number formats:
    const patterns = [
      /^\d{1,6}\/\d{1,3}$/, // LR Number/Subdivision (e.g., 12345/67)
      /^[A-Z]{2,6}\/[A-Z]{2,10}\/\d{1,5}$/i, // Township/Block/Plot (e.g., MSA/BLOCK/123)
      /^[A-Z]{2,6}\/SCHEME\/\d{1,5}$/i, // Scheme/Plot (e.g., KILIFI/SCHEME/456)
      /^PLOT\s*NO\.?\s*\d{1,5}\s*[A-Z]?$/i, // Plot No. 123
      /^BLOCK\s*[A-Z]{1,5}\s*PLOT\s*\d{1,5}$/i, // Block A Plot 123
      /^LR\s*NO\.?\s*\d{1,6}\s*\/\s*\d{1,3}$/i, // LR NO. 12345/67
      /^[A-Z]{2,6}\/\d{1,5}\/\d{1,5}$/i, // County/Division/Sub-location
    ];

    const isValid = patterns.some((pattern) => pattern.test(parcelNumber));

    if (!isValid) {
      throw new InvalidTitleDeedException(
        `Invalid parcel number format: ${parcelNumber}. Valid formats: 12345/67, MSA/BLOCK/123, PLOT NO. 123`,
      );
    }
  }

  private validateDates(): void {
    // Issue date cannot be in the future
    if (this._value.issueDate > new Date()) {
      throw new InvalidTitleDeedException('Issue date cannot be in the future');
    }

    // For leasehold, validate expiry date
    if (this._value.type === TitleDeedType.LEASEHOLD) {
      if (!this._value.expiryDate) {
        throw new InvalidTitleDeedException('Leasehold title deed must have an expiry date');
      }

      if (this._value.expiryDate <= this._value.issueDate) {
        throw new InvalidTitleDeedException('Expiry date must be after issue date');
      }

      // Check minimum lease term (33 years for agricultural, 50/99 for urban)
      const leaseYears = this.getLeaseTermYears();
      if (leaseYears && leaseYears < TitleDeed.MIN_LEASE_YEARS) {
        throw new InvalidTitleDeedException(
          `Lease term must be at least ${TitleDeed.MIN_LEASE_YEARS} years for leasehold property`,
        );
      }
    }
  }

  private validateLeaseTerm(): void {
    if (this._value.leaseTermYears) {
      if (this._value.leaseTermYears < TitleDeed.MIN_LEASE_YEARS) {
        throw new InvalidTitleDeedException(
          `Lease term cannot be less than ${TitleDeed.MIN_LEASE_YEARS} years`,
        );
      }
      if (this._value.leaseTermYears > TitleDeed.MAX_LEASE_YEARS) {
        throw new InvalidTitleDeedException(
          `Lease term cannot exceed ${TitleDeed.MAX_LEASE_YEARS} years`,
        );
      }
    }
  }

  // Factory methods
  static createFreehold(
    deedNumber: string,
    parcelNumber: string,
    issueDate: Date,
    acreage?: number,
  ): TitleDeed {
    return new TitleDeed({
      deedNumber,
      parcelNumber,
      type: TitleDeedType.FREEHOLD,
      issueDate,
      acreage,
    });
  }

  static createLeasehold(
    deedNumber: string,
    parcelNumber: string,
    issueDate: Date,
    leaseTermYears: number,
    acreage?: number,
  ): TitleDeed {
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + leaseTermYears);

    return new TitleDeed({
      deedNumber,
      parcelNumber,
      type: TitleDeedType.LEASEHOLD,
      issueDate,
      expiryDate,
      leaseTermYears,
      acreage,
    });
  }

  static createCommunityLand(
    deedNumber: string,
    parcelNumber: string,
    issueDate: Date,
    acreage?: number,
  ): TitleDeed {
    return new TitleDeed({
      deedNumber,
      parcelNumber,
      type: TitleDeedType.COMMUNITY_LAND,
      issueDate,
      acreage,
    });
  }

  // Business logic methods
  isExpired(): boolean {
    if (this._value.type !== TitleDeedType.LEASEHOLD || !this._value.expiryDate) {
      return false;
    }
    return this._value.expiryDate < new Date();
  }

  getYearsRemaining(): number | null {
    if (this._value.type !== TitleDeedType.LEASEHOLD || !this._value.expiryDate) {
      return null;
    }

    const now = new Date();
    if (now >= this._value.expiryDate) {
      return 0;
    }

    const diffTime = this._value.expiryDate.getTime() - now.getTime();
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0, Math.floor(diffYears));
  }

  getLeaseTermYears(): number | null {
    if (this._value.leaseTermYears) {
      return this._value.leaseTermYears;
    }

    if (this._value.expiryDate && this._value.issueDate) {
      const diffTime = this._value.expiryDate.getTime() - this._value.issueDate.getTime();
      const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
      return Math.floor(diffYears);
    }

    return null;
  }

  // For land succession - different requirements based on type
  getSuccessionRequirements(): SuccessionRequirement[] {
    const requirements: SuccessionRequirement[] = [
      'Grant of representation',
      'Death certificate',
      'Title deed',
      'Certificate of confirmation of grant (S. 71 LSA)',
      'Mutation form (Transfer of land)',
    ];

    // County-specific requirements
    if (this._value.type === TitleDeedType.LEASEHOLD) {
      requirements.push('Consent to transfer from Commissioner of Lands');
      if (this.isExpired() || (this.getYearsRemaining() || 0) < 10) {
        requirements.push('Lease renewal required before transfer');
      } else {
        requirements.push('Lease renewal may be required');
      }
    }

    if (this._value.type === TitleDeedType.COMMUNITY_LAND) {
      requirements.push('Consent from County Government');
      requirements.push('Community land management committee consent');
    }

    // General land requirements
    requirements.push('Land rates clearance certificate');
    requirements.push('Land rent clearance certificate');

    if (this._value.hasCharges) {
      requirements.push('Discharge of charge/mortgage');
    }

    if (this._value.hasCaveats) {
      requirements.push('Removal of caveat or court order');
    }

    return requirements;
  }

  // Formatting
  getFormattedDeedNumber(): string {
    const deed = this._value.deedNumber.toUpperCase().trim();

    // Clean and format based on pattern
    if (deed.match(/^(IR|CR)\s*\d+/i)) {
      return deed.replace(/(IR|CR)\s*(\d+)/i, '$1 $2');
    }

    if (deed.match(/^L\.?R\.?\s*(No\.?)?\s*\d+/i)) {
      return deed.replace(/L\.?R\.?\s*(No\.?)?\s*(\d+)/i, 'L.R. No. $2');
    }

    if (deed.match(/^Title\s*(No\.?)?\s*[A-Z]+\/\d+/i)) {
      return deed.replace(/Title\s*(No\.?)?\s*([A-Z]+\/\d+.*)/i, 'Title No. $2');
    }

    return deed;
  }

  // Getters
  get deedNumber(): string {
    return this._value.deedNumber;
  }

  get type(): TitleDeedType {
    return this._value.type;
  }

  get parcelNumber(): string {
    return this._value.parcelNumber;
  }

  get issueDate(): Date {
    return this._value.issueDate;
  }

  get expiryDate(): Date | undefined {
    return this._value.expiryDate;
  }

  get acreage(): number | undefined {
    return this._value.acreage;
  }

  get hasCharges(): boolean {
    return this._value.hasCharges || false;
  }

  get hasCaveats(): boolean {
    return this._value.hasCaveats || false;
  }

  // For legal documents
  get legalDescription(): string {
    const typeDesc = this.getTitleTypeDescription();
    const formattedDeed = this.getFormattedDeedNumber();
    const parcelInfo = `Parcel No. ${this._value.parcelNumber}`;
    const sizeInfo = this._value.acreage ? `, ${this._value.acreage} acres` : '';

    return `${typeDesc} ${formattedDeed}, ${parcelInfo}${sizeInfo}`;
  }

  private getTitleTypeDescription(): string {
    switch (this._value.type) {
      case TitleDeedType.FREEHOLD:
        return 'Freehold Title';
      case TitleDeedType.LEASEHOLD: {
        const yearsRemaining = this.getYearsRemaining();
        const yearsInfo = yearsRemaining ? ` (${yearsRemaining} years remaining)` : '';
        return `Leasehold Title${yearsInfo}`;
      }
      case TitleDeedType.COMMUNITY_LAND:
        return 'Community Land Title';
      case TitleDeedType.SECTIONAL_TITLE:
        return 'Sectional Title';
      case TitleDeedType.ABSOLUTE:
        return 'Absolute Title';
      case TitleDeedType.PROVISIONAL:
        return 'Provisional Title';
      default:
        return 'Title';
    }
  }

  // Check if this is agricultural land (special succession rules)
  isAgriculturalLand(): boolean {
    const acreage = this._value.acreage || 0;
    return acreage >= 5; // Consider 5+ acres as agricultural
  }
}
