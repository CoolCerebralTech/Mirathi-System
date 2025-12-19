// src/shared/domain/value-objects/title-deed.vo.ts
import { ValueObject } from '../base/value-object';
import { InvalidTitleDeedException } from '../exceptions/title-deed.exception';

export enum TitleDeedType {
  FREEHOLD = 'FREEHOLD',
  LEASEHOLD = 'LEASEHOLD',
  ABSOLUTE = 'ABSOLUTE',
  PROVISIONAL = 'PROVISIONAL',
}

interface TitleDeedProps {
  deedNumber: string;
  type: TitleDeedType;
  parcelNumber: string;
  issueDate: Date;
  expiryDate?: Date; // For leasehold
  registryReference?: string;
}

export class TitleDeed extends ValueObject<TitleDeedProps> {
  constructor(props: TitleDeedProps) {
    super(props);
  }

  protected validate(): void {
    this.validateDeedNumber();
    this.validateParcelNumber();
    this.validateDates();
  }

  private validateDeedNumber(): void {
    const deedNumber = this._value.deedNumber;

    // Kenyan title deed formats:
    // - IR (Individual Registration) e.g., IR 12345
    // - CR (Corporate Registration) e.g., CR 12345
    // - L.R. No. (Land Reference) e.g., L.R. No. 12345
    // - Title No. e.g., Title No. ABC/123

    const patterns = [
      /^(IR|CR)\s*\d{4,8}$/i,
      /^L\.?R\.?\s*(No\.?)?\s*\d{4,8}$/i,
      /^Title\s*(No\.?)?\s*[A-Z]+\/\d+$/i,
      /^\d+\/[A-Z]+\/\d+$/i, // e.g., 123/ABC/456
    ];

    const isValid = patterns.some((pattern) => pattern.test(deedNumber));

    if (!isValid) {
      throw new InvalidTitleDeedException(`Invalid title deed number format: ${deedNumber}`);
    }
  }

  private validateParcelNumber(): void {
    const parcelNumber = this._value.parcelNumber;

    // Kenyan parcel number formats:
    // - LR No./Subdivision e.g., 12345/67
    // - Township/Block/Plot e.g., MSA/BLOCK/123
    // - Scheme/Plot e.g., KILIFI/SCHEME/456

    const patterns = [
      /^\d+\/\d+$/, // LR Number/Subdivision
      /^[A-Z]+\/[A-Z]+\/\d+$/i, // Township/Block/Plot
      /^[A-Z]+\/SCHEME\/\d+$/i, // Scheme/Plot
    ];

    const isValid = patterns.some((pattern) => pattern.test(parcelNumber));

    if (!isValid) {
      throw new InvalidTitleDeedException(`Invalid parcel number format: ${parcelNumber}`);
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

      // Check if expired
      if (this._value.expiryDate < new Date()) {
        console.warn(`Title deed ${this._value.deedNumber} has expired`);
      }
    }
  }

  // Factory methods
  static createFreehold(deedNumber: string, parcelNumber: string, issueDate: Date): TitleDeed {
    return new TitleDeed({
      deedNumber,
      parcelNumber,
      type: TitleDeedType.FREEHOLD,
      issueDate,
    });
  }

  static createLeasehold(
    deedNumber: string,
    parcelNumber: string,
    issueDate: Date,
    leaseYears: number,
  ): TitleDeed {
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + leaseYears);

    return new TitleDeed({
      deedNumber,
      parcelNumber,
      type: TitleDeedType.LEASEHOLD,
      issueDate,
      expiryDate,
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

    const diffTime = Math.abs(this._value.expiryDate.getTime() - now.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffYears);
  }

  // For land succession - freehold vs leasehold have different rules
  getSuccessionRequirements(): SuccessionRequirement[] {
    const requirements: SuccessionRequirement[] = [
      'Grant of representation',
      'Death certificate',
      'Title deed',
    ];

    if (this._value.type === TitleDeedType.LEASEHOLD) {
      requirements.push('Consent to transfer from Commissioner of Lands');
      requirements.push('Lease renewal may be required');
    }

    if (this.isExpired()) {
      requirements.push('Lease renewal required before transfer');
    }

    return requirements;
  }

  // Formatting
  getFormattedDeedNumber(): string {
    // Format based on type
    const deed = this._value.deedNumber.toUpperCase();

    if (deed.startsWith('IR') || deed.startsWith('CR')) {
      return deed.replace(/(IR|CR)\s*(\d+)/, '$1 $2');
    }

    if (deed.includes('L.R')) {
      return deed.replace(/L\.?R\.?\s*(No\.?)?\s*(\d+)/, 'L.R. No. $2');
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

  // For legal documents
  get legalDescription(): string {
    const typeDesc = this._value.type === TitleDeedType.FREEHOLD ? 'Freehold' : 'Leasehold';

    return `${typeDesc} Title No. ${this.getFormattedDeedNumber()}, Parcel No. ${this._value.parcelNumber}`;
  }
}
