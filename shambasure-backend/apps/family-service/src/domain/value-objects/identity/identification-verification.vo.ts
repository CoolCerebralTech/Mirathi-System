// domain/value-objects/identity/alternative-identity.vo.ts
import { InvalidIdentityException } from '../../exceptions/identity.exceptions';
import { ValueObject } from '../base/value-object';

export enum IdentityType {
  PASSPORT = 'PASSPORT',
  ALIEN_ID = 'ALIEN_ID', // For Foreign Residents
  MILITARY_ID = 'MILITARY_ID', // For KDF Personnel
  REFUGEE_ID = 'REFUGEE_ID',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE', // Secondary ID
  BIRTH_ENTRY_NUMBER = 'BIRTH_ENTRY_NUMBER', // For Minors w/o ID
}

export interface AlternativeIdentityProps {
  type: IdentityType;
  idNumber: string;
  countryOfIssue: string; // Default 'KEN'

  // Verification
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  verificationMethod?: string; // "NTSA_API", "IMMIGRATION_API"

  // Validity
  expiryDate?: Date;
  issueDate?: Date;
  issuingAuthority?: string;

  metadata?: Record<string, any>; // Store raw API response
}

export class AlternativeIdentity extends ValueObject<AlternativeIdentityProps> {
  private constructor(props: AlternativeIdentityProps) {
    super(props);
    this.validate();
  }

  // --- Factory Methods ---

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

  static createVerified(
    type: IdentityType,
    idNumber: string,
    verifiedBy: string,
    method: string,
    expiryDate?: Date,
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
    });
  }

  static reconstruct(props: AlternativeIdentityProps): AlternativeIdentity {
    return new AlternativeIdentity(props);
  }

  // --- Validation ---

  protected validate(): void {
    const { type, idNumber, countryOfIssue } = this._value;

    if (!idNumber) {
      throw new InvalidIdentityException('ID Number is required');
    }

    // Only validate format for Kenyan documents
    if (countryOfIssue === 'KEN') {
      switch (type) {
        case IdentityType.PASSPORT:
          // A1234567, B1234567, D123456...
          if (!/^[A-Z]{1,2}\d{7,9}$/.test(idNumber)) {
            throw new InvalidIdentityException(`Invalid Kenyan Passport format: ${idNumber}`);
          }
          break;

        case IdentityType.ALIEN_ID:
          // Usually numeric, sometimes with A- prefix
          if (idNumber.length < 6) {
            throw new InvalidIdentityException(`Invalid Alien ID format: ${idNumber}`);
          }
          break;

        case IdentityType.MILITARY_ID:
          // KDF IDs are typically numeric
          if (!/^\d+$/.test(idNumber)) {
            throw new InvalidIdentityException('KDF Military IDs must be numeric');
          }
          break;
      }
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

  get isExpired(): boolean {
    if (!this._value.expiryDate) return false;
    return this._value.expiryDate < new Date();
  }

  /**
   * Can this document be used for legal transactions today?
   * (Must be Verified AND Not Expired)
   */
  get isValidForTransaction(): boolean {
    return this._value.isVerified && !this.isExpired;
  }

  // --- Helpers ---

  private static sanitize(val: string): string {
    return val.trim().replace(/\s/g, '').toUpperCase();
  }

  public toJSON() {
    return {
      type: this._value.type,
      idNumber: this._value.idNumber,
      isExpired: this.isExpired,
      isVerified: this._value.isVerified,
      countryOfIssue: this._value.countryOfIssue,
    };
  }
}
