// domain/value-objects/identity/national-id.vo.ts
import { ValueObject } from '../../base/value-object';
import { InvalidNationalIdException } from '../../exceptions/identity.exceptions';

export interface NationalIdProps {
  idNumber: string;
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  verificationMethod?: string;
  issueDate?: Date;
  issuingStation?: string;
  expiryDate?: Date; // Critical for Maisha Namba
}

export class NationalId extends ValueObject<NationalIdProps> {
  private constructor(props: NationalIdProps) {
    super(props);
    this.validate();
  }

  // Factory Methods
  static createUnverified(idNumber: string): NationalId {
    return new NationalId({
      idNumber: this.normalizeIdNumber(idNumber),
      isVerified: false,
    });
  }

  static createVerified(
    idNumber: string,
    verifiedBy: string,
    verificationMethod: string,
    issueDate?: Date,
    issuingStation?: string,
  ): NationalId {
    return new NationalId({
      idNumber: this.normalizeIdNumber(idNumber),
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy,
      verificationMethod,
      issueDate,
      issuingStation,
    });
  }

  static createFromPersistence(props: NationalIdProps): NationalId {
    return new NationalId(props);
  }

  // FIXED: Visibility matches the Base Class (protected)
  protected validate(): void {
    this.validateFormat();
    // We do NOT call validateCheckDigit() here blindly because
    // older valid IDs might fail strict modern checksums.
    // Validation should be strict on FORMAT, lenient on ALGORITHM until verified.
    this.validateTemporalConstraints();
  }

  private validateFormat(): void {
    const id = this._value.idNumber;

    if (!id) {
      throw new InvalidNationalIdException('National ID number is required');
    }

    // KENYAN CONTEXT:
    // Old IDs: 6, 7, or 8 digits.
    // New Maisha Namba: 8 digits.
    // Alien IDs: May have different formats, but National ID is strictly numeric.
    // We allow 6-9 digits to cover historical (grandparents) and future.
    if (!/^\d{6,9}$/.test(id)) {
      throw new InvalidNationalIdException(
        `Invalid Kenyan National ID format: "${id}". Must be 6-9 digits.`,
      );
    }
  }

  private validateTemporalConstraints(): void {
    const { issueDate, expiryDate } = this._value;

    if (issueDate && issueDate > new Date()) {
      throw new InvalidNationalIdException('Issue date cannot be in the future');
    }

    if (issueDate && expiryDate && expiryDate < issueDate) {
      throw new InvalidNationalIdException('Expiry date must be after issue date');
    }
  }

  // --- Business Logic ---

  verify(verifiedBy: string, verificationMethod: string): NationalId {
    return new NationalId({
      ...this._value,
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy,
      verificationMethod,
    });
  }

  // --- Getters ---

  get idNumber(): string {
    return this.props.idNumber;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get verificationDetails() {
    return {
      method: this.props.verificationMethod,
      at: this.props.verifiedAt,
      by: this.props.verifiedBy,
    };
  }

  // NOTE: Removed `estimatedBirthYear` and `isMinor`.
  // In Kenya, ID numbers are serials, not date-encoded.
  // Calculating age from ID number is legally factually incorrect.
  // Use `FamilyMember.dateOfBirth` instead.

  toJSON(): Record<string, unknown> {
    return {
      idNumber: this.props.idNumber,
      isVerified: this.props.isVerified,
      verifiedAt: this.props.verifiedAt?.toISOString(),
      verifiedBy: this.props.verifiedBy,
      verificationMethod: this.props.verificationMethod,
      issueDate: this._value.issueDate?.toISOString(),
      issuingStation: this._value.issuingStation,
    };
  }

  private static normalizeIdNumber(raw: string): string {
    // Remove spaces/dashes
    return raw.replace(/[\s-]/g, '');
  }
}
