import { ValueObject } from '../base/value-object';
import { InvalidTitleDeedException } from '../exceptions/title-deed.exception';

export enum TitleDeedType {
  FREEHOLD = 'FREEHOLD',
  LEASEHOLD = 'LEASEHOLD',
  COMMUNITY_LAND = 'COMMUNITY_LAND',
  SECTIONAL_TITLE = 'SECTIONAL_TITLE',
}

export interface TitleDeedProps {
  deedNumber: string;
  type: TitleDeedType;
  parcelNumber: string;
  issueDate: Date;
  expiryDate?: Date; // Only for Leasehold
  leaseTermYears?: number;
  acreage?: number;
}

export class TitleDeed extends ValueObject<TitleDeedProps> {
  private static readonly MIN_LEASE_YEARS = 33;
  private static readonly MAX_LEASE_YEARS = 999;

  constructor(props: TitleDeedProps) {
    super(props);
  }

  protected validate(): void {
    this.validateDeedNumber();
    this.validateParcelNumber();
    this.validateLeaseDetails();
  }

  private validateDeedNumber(): void {
    const deed = this.props.deedNumber.trim();
    if (deed.length < 3) throw new InvalidTitleDeedException('Deed number too short');

    // Strict Kenyan formats
    const patterns = [
      /^(IR|CR)\s*\d+$/i, // IR 12345
      /^L\.?R\.?\s*No\.?\s*\d+$/i, // L.R. No. 1234
      /^Title\s*No\.?\s*.*$/i, // Title No. ...
      /^[A-Z]+\/\d+\/\d+$/i, // BLOCK/123/456
    ];

    if (!patterns.some((p) => p.test(deed))) {
      // We throw, or in "No MVP" legacy data import scenarios, we might log warning.
      // Assuming strict new entry:
      throw new InvalidTitleDeedException(`Invalid format: ${deed}`);
    }
  }

  private validateParcelNumber(): void {
    if (this.props.parcelNumber.length < 2) {
      throw new InvalidTitleDeedException('Parcel number too short');
    }
  }

  private validateLeaseDetails(): void {
    if (this.props.type === TitleDeedType.LEASEHOLD) {
      if (!this.props.expiryDate) {
        throw new InvalidTitleDeedException('Leasehold must have expiry date');
      }
      if (!this.props.leaseTermYears) {
        throw new InvalidTitleDeedException('Leasehold must specify term years');
      }

      if (
        this.props.leaseTermYears < TitleDeed.MIN_LEASE_YEARS ||
        this.props.leaseTermYears > TitleDeed.MAX_LEASE_YEARS
      ) {
        throw new InvalidTitleDeedException(`Invalid lease term: ${this.props.leaseTermYears}`);
      }

      if (this.props.expiryDate <= this.props.issueDate) {
        throw new InvalidTitleDeedException('Expiry must be after issue date');
      }
    }
  }

  // --- Factory Methods ---

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
    term: number,
  ): TitleDeed {
    const expiry = new Date(issueDate);
    expiry.setFullYear(expiry.getFullYear() + term);

    return new TitleDeed({
      deedNumber,
      parcelNumber,
      type: TitleDeedType.LEASEHOLD,
      issueDate,
      leaseTermYears: term,
      expiryDate: expiry,
    });
  }

  // --- Business Logic ---

  isExpired(): boolean {
    if (this.props.type !== TitleDeedType.LEASEHOLD) return false;
    return (this.props.expiryDate as Date) < new Date();
  }

  getYearsRemaining(): number | null {
    if (this.props.type !== TitleDeedType.LEASEHOLD) return null;
    const now = new Date();
    if (this.isExpired()) return 0;

    const diff = (this.props.expiryDate as Date).getTime() - now.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  }

  // Formatting for Legal Docs
  getLegalDescription(): string {
    return `${this.props.type} Title ${this.props.deedNumber} for Parcel ${this.props.parcelNumber}`;
  }

  // --- Getters ---
  get deedNumber(): string {
    return this.props.deedNumber;
  }
  get type(): TitleDeedType {
    return this.props.type;
  }

  public toJSON(): Record<string, any> {
    return {
      deedNumber: this.props.deedNumber,
      type: this.props.type,
      parcelNumber: this.props.parcelNumber,
      issueDate: this.props.issueDate,
      expiryDate: this.props.expiryDate,
      isExpired: this.isExpired(),
      yearsRemaining: this.getYearsRemaining(),
    };
  }
}
