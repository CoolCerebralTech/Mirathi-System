// domain/value-objects/identity/birth-certificate.vo.ts
import { InvalidBirthCertificateException } from '../../exceptions/identity.exceptions';
import { ValueObject } from '../base/value-object';

export interface BirthCertificateProps {
  // Identification
  entryNumber: string; // The "Entry No." in the register (Permanent)
  serialNumber?: string; // The "Serial No." on the physical paper (Changes on replacement)

  // Core Data
  dateOfBirth: Date;
  placeOfBirth: string; // Hospital or Home

  // Administrative (Supports both Historical Districts and Modern Counties)
  districtOfBirth: string;
  countyOfBirth?: string; // Optional for old certs

  // Parents (Critical for establishing S.29 Dependancy)
  motherName: string;
  fatherName?: string; // Optional (many certs have "Not Stated")

  // Registration Details
  dateOfRegistration: Date;
  issuingAuthority: string; // e.g. "Registrar General", "District Registrar"

  // Verification
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export class BirthCertificate extends ValueObject<BirthCertificateProps> {
  private constructor(props: BirthCertificateProps) {
    super(props);
    this.validate();
  }

  // --- Factory Methods ---

  static create(
    entryNumber: string,
    dateOfBirth: Date,
    dateOfRegistration: Date,
    motherName: string,
    districtOfBirth: string,
  ): BirthCertificate {
    return new BirthCertificate({
      entryNumber: this.sanitize(entryNumber),
      dateOfBirth,
      dateOfRegistration,
      motherName: this.sanitizeName(motherName),
      districtOfBirth: this.sanitizeName(districtOfBirth),
      placeOfBirth: 'UNKNOWN', // User can update later
      issuingAuthority: 'CIVIL_REGISTRATION_DEPARTMENT',
      isVerified: false,
    });
  }

  static reconstruct(props: BirthCertificateProps): BirthCertificate {
    return new BirthCertificate(props);
  }

  // --- Validation ---

  protected validate(): void {
    const { entryNumber, dateOfBirth, dateOfRegistration, motherName } = this._value;

    if (!entryNumber) {
      throw new InvalidBirthCertificateException('Entry Number is required');
    }

    if (!motherName) {
      throw new InvalidBirthCertificateException("Mother's Name is required");
    }

    // Temporal Validation
    const now = new Date();
    if (dateOfBirth > now) {
      throw new InvalidBirthCertificateException('Date of Birth cannot be in the future');
    }

    if (dateOfRegistration > now) {
      throw new InvalidBirthCertificateException('Date of Registration cannot be in the future');
    }

    // Registration cannot happen before birth
    // (Allowing for same-day registration)
    if (dateOfRegistration < dateOfBirth) {
      // Edge case: Sometimes data entry errors happen.
      // We might throw or just log a warning depending on strictness level.
      // For legal domain, we throw.
      throw new InvalidBirthCertificateException(
        'Date of Registration cannot be before Date of Birth',
      );
    }
  }

  // --- Business Logic ---

  /**
   * Returns true if registered > 6 months after birth.
   * "Late Registration" is a fraud risk indicator in succession cases.
   */
  get isLateRegistration(): boolean {
    const { dateOfBirth, dateOfRegistration } = this._value;

    const sixMonthsLater = new Date(dateOfBirth);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    return dateOfRegistration > sixMonthsLater;
  }

  /**
   * Calculates age at time of verification/query
   */
  get currentAge(): number {
    const today = new Date();
    const birthDate = this._value.dateOfBirth;
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Official date of birth as recorded in the Civil Register.
   * This is a legally authoritative fact.
   */
  get dateOfBirth(): Date {
    return this._value.dateOfBirth;
  }

  get isMinor(): boolean {
    return this.currentAge < 18;
  }
  /**
   * Returns the legally recognized identifier for this birth record.
   * Priority: Entry Number (permanent) > Serial Number (physical paper)
   */
  get primaryIdentifier(): string {
    return this._value.entryNumber;
  }

  /**
   * Adds the physical serial number (from the top right red ink).
   * This is used to verify if the paper document is authentic/stolen.
   */
  public withSerialNumber(serial: string): BirthCertificate {
    return new BirthCertificate({
      ...this._value,
      serialNumber: serial,
    });
  }

  public verify(verifiedBy: string): BirthCertificate {
    return new BirthCertificate({
      ...this._value,
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy,
    });
  }

  // --- Helpers ---

  private static sanitize(val: string): string {
    return val.trim().toUpperCase();
  }

  private static sanitizeName(val: string): string {
    return val.trim().replace(/\s+/g, ' ').toUpperCase();
  }

  public toJSON() {
    return {
      entryNumber: this._value.entryNumber,
      serialNumber: this._value.serialNumber,
      dateOfBirth: this._value.dateOfBirth,
      isLateRegistration: this.isLateRegistration,
      motherName: this._value.motherName,
      fatherName: this._value.fatherName,
      isVerified: this._value.isVerified,
    };
  }
}
