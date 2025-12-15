// domain/value-objects/identity/alternative-identity.vo.ts
import { InvalidIdentityException } from '../../exceptions/identity.exceptions';
import { ValueObject } from '../base/value-object';

export enum IdentityType {
  PASSPORT = 'PASSPORT',
  ALIEN_ID = 'ALIEN_ID', // For Foreign Residents (issued by Immigration)
  MILITARY_ID = 'MILITARY_ID', // For KDF Personnel
  REFUGEE_ID = 'REFUGEE_ID',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE', // NTSA Smart License
  BIRTH_ENTRY_NUMBER = 'BIRTH_ENTRY_NUMBER', // For Minors w/o ID, referencing the Birth Register directly
}

export interface AlternativeIdentityProps {
  type: IdentityType;
  idNumber: string;
  countryOfIssue: string; // ISO 3166-1 alpha-3 code (e.g., 'KEN', 'GBR')

  // Verification Status
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string; // UUID of Admin or System
  verificationMethod?: string; // "NTSA_API", "IMMIGRATION_API", "MANUAL_UPLOAD"

  // Document Validity
  expiryDate?: Date;
  issueDate?: Date;
  issuingAuthority?: string;

  // Storage for raw API responses (e.g., IPRS dump)
  metadata?: Record<string, any>;
}

export class AlternativeIdentity extends ValueObject<AlternativeIdentityProps> {
  private constructor(props: AlternativeIdentityProps) {
    super(props);
    this.validate();
  }

  // --- Factory Methods ---

  /**
   * Creates a new, unverified alternative identity document.
   * Default country is Kenya ('KEN').
   */
  static create(
    type: IdentityType,
    idNumber: string,
    countryOfIssue: string = 'KEN',
  ): AlternativeIdentity {
    return new AlternativeIdentity({
      type,
      idNumber: this.sanitize(idNumber),
      countryOfIssue: countryOfIssue.toUpperCase(),
      isVerified: false,
    });
  }

  /**
   * Creates an instance that has already been verified (e.g., via API integration).
   */
  static createVerified(
    type: IdentityType,
    idNumber: string,
    verifiedBy: string,
    method: string,
    expiryDate?: Date,
    metadata?: Record<string, any>,
  ): AlternativeIdentity {
    return new AlternativeIdentity({
      type,
      idNumber: this.sanitize(idNumber),
      countryOfIssue: 'KEN',
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy,
      verificationMethod: method,
      expiryDate,
      metadata,
    });
  }

  /**
   * Reconstructs an instance from the database.
   */
  static reconstruct(props: AlternativeIdentityProps): AlternativeIdentity {
    return new AlternativeIdentity(props);
  }

  // --- Validation ---

  protected validate(): void {
    const { type, idNumber, countryOfIssue } = this._value;

    if (!idNumber) {
      throw new InvalidIdentityException('ID Number is required');
    }

    if (!countryOfIssue || countryOfIssue.length !== 3) {
      throw new InvalidIdentityException('Invalid Country Code. Use ISO 3-letter code (e.g., KEN)');
    }

    // Strict format validation applies ONLY to Kenyan documents.
    // We cannot easily validate foreign document formats.
    if (countryOfIssue === 'KEN') {
      this.validateKenyanFormats(type, idNumber);
    }
  }

  private validateKenyanFormats(type: IdentityType, idNumber: string): void {
    switch (type) {
      case IdentityType.PASSPORT:
        // Kenyan Passports:
        // Diplomatic (D), Service (S), Ordinary (A, B, C)
        // Format: 1-2 Letters followed by 6-9 digits
        // Regex: ^[A-Z]{1,2}\d{6,9}$
        if (!/^[A-Z]{1,2}\d{6,9}$/.test(idNumber)) {
          throw new InvalidIdentityException(
            `Invalid Kenyan Passport format: ${idNumber}. Expected format like A1234567.`,
          );
        }
        break;

      case IdentityType.ALIEN_ID:
        // Alien IDs usually have 6-9 digits, sometimes prefixed
        if (idNumber.length < 6) {
          throw new InvalidIdentityException(`Invalid Alien ID format: ${idNumber}. Too short.`);
        }
        break;

      case IdentityType.MILITARY_ID:
        // KDF IDs are typically numeric
        if (!/^\d+$/.test(idNumber)) {
          throw new InvalidIdentityException('KDF Military IDs must be strictly numeric');
        }
        break;

      case IdentityType.DRIVERS_LICENSE:
        // NTSA Smart DL usually matches ID number, but old red books differ.
        // We allow basic alphanumeric to support both.
        if (idNumber.length < 5) {
          throw new InvalidIdentityException('Invalid Drivers License Number');
        }
        break;
    }
  }

  // --- Business Logic ---

  public verify(verifiedBy: string, method: string): AlternativeIdentity {
    return new AlternativeIdentity({
      ...this._value,
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy,
      verificationMethod: method,
    });
  }

  /**
   * Marks the document as Expired manually (optional, as getter handles date check)
   */
  public expire(): AlternativeIdentity {
    // We don't change the date, just ensure logic reflects it.
    // Usually, we just let the date speak for itself.
    // If we need to force expiry (e.g., lost/stolen), we might need a status field.
    // For now, relies on expiryDate.
    return this;
  }

  // --- Getters ---

  get idNumber(): string {
    return this._value.idNumber;
  }

  get type(): IdentityType {
    return this._value.type;
  }

  get isExpired(): boolean {
    if (!this._value.expiryDate) return false;
    return this._value.expiryDate < new Date();
  }

  get isVerified(): boolean {
    return this._value.isVerified;
  }

  /**
   * Determines if this document allows the user to perform legal transactions TODAY.
   * Requirement: Verified AND Not Expired.
   */
  get isValidForTransaction(): boolean {
    return this._value.isVerified && !this.isExpired;
  }

  // --- Helpers ---

  private static sanitize(val: string): string {
    // Remove spaces and force uppercase
    return val.trim().replace(/\s+/g, '').toUpperCase();
  }

  public toJSON() {
    return {
      type: this._value.type,
      idNumber: this._value.idNumber,
      countryOfIssue: this._value.countryOfIssue,
      isVerified: this._value.isVerified,
      isExpired: this.isExpired,
      expiryDate: this._value.expiryDate,
      issueDate: this._value.issueDate,
    };
  }
}
