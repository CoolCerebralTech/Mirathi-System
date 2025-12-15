// domain/value-objects/identity/death-certificate.vo.ts
import { InvalidDeathCertificateException } from '../../exceptions/identity.exceptions';
import { ValueObject } from '../base/value-object';

export enum DeathProofType {
  CERTIFICATE = 'CERTIFICATE',
  BURIAL_PERMIT = 'BURIAL_PERMIT',
  COURT_ORDER_PRESUMPTION = 'COURT_ORDER_PRESUMPTION', // S. 118 Evidence Act
  POLICE_ABSTRACT = 'POLICE_ABSTRACT', // Temporary
}

export interface DeathCertificateProps {
  // Identification
  entryNumber: string; // "Entry No." in the register (Permanent)
  serialNumber?: string; // "Serial No." on the paper
  proofType: DeathProofType;

  // Core Event Data
  dateOfDeath: Date;
  placeOfDeath: string; // "Kenyatta National Hospital", "Home - Siaya"

  // Registration Details
  dateOfRegistration: Date;
  registrationDistrict: string; // "Nairobi", "Murang'a South"

  // Informant (Critical for Fraud Detection)
  informantName?: string;
  informantRelationship?: string; // "Son", "Widow"

  // Verification
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export class DeathCertificate extends ValueObject<DeathCertificateProps> {
  private constructor(props: DeathCertificateProps) {
    super(props);
    this.validate();
  }

  // --- Factory Methods ---

  static create(
    entryNumber: string,
    dateOfDeath: Date,
    dateOfRegistration: Date,
    placeOfDeath: string,
  ): DeathCertificate {
    return new DeathCertificate({
      entryNumber: this.sanitize(entryNumber),
      proofType: DeathProofType.CERTIFICATE,
      dateOfDeath,
      dateOfRegistration,
      placeOfDeath: this.sanitize(placeOfDeath),
      registrationDistrict: 'UNKNOWN', // Default
      isVerified: false,
    });
  }

  static createFromCourtOrder(
    courtOrderNumber: string,
    presumedDateOfDeath: Date,
  ): DeathCertificate {
    return new DeathCertificate({
      entryNumber: courtOrderNumber,
      proofType: DeathProofType.COURT_ORDER_PRESUMPTION,
      dateOfDeath: presumedDateOfDeath,
      dateOfRegistration: new Date(), // Registered in system now
      placeOfDeath: 'UNKNOWN / PRESUMED',
      registrationDistrict: 'HIGH COURT',
      isVerified: true, // Court orders are inherently verified (but need manual check)
    });
  }

  static reconstruct(props: DeathCertificateProps): DeathCertificate {
    return new DeathCertificate(props);
  }

  // --- Validation ---

  protected validate(): void {
    const { entryNumber, dateOfDeath, dateOfRegistration, proofType } = this._value;

    if (!entryNumber) {
      throw new InvalidDeathCertificateException('Certificate/Entry Number is required');
    }

    if (dateOfDeath > new Date()) {
      throw new InvalidDeathCertificateException('Date of Death cannot be in the future');
    }

    // Logic: Registration cannot happen before death
    if (proofType === DeathProofType.CERTIFICATE && dateOfRegistration < dateOfDeath) {
      throw new InvalidDeathCertificateException(
        'Registration Date cannot be before Date of Death',
      );
    }
  }

  // --- Business Logic ---

  /**
   * Returns true if registered > 6 months after death.
   * Late registration often requires a "Late Death Registration" form
   * and carries higher fraud risk.
   */
  get isLateRegistration(): boolean {
    const { dateOfDeath, dateOfRegistration } = this._value;
    const sixMonthsLater = new Date(dateOfDeath);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    return dateOfRegistration > sixMonthsLater;
  }

  /**
   * Official date of death as recorded in the register or court order.
   */
  get dateOfDeath(): Date {
    return this._value.dateOfDeath;
  }

  /**
   * Adds physical serial number for verification
   */
  public withSerialNumber(serial: string): DeathCertificate {
    return new DeathCertificate({
      ...this._value,
      serialNumber: serial,
    });
  }

  public withInformant(name: string, relationship: string): DeathCertificate {
    return new DeathCertificate({
      ...this._value,
      informantName: name,
      informantRelationship: relationship,
    });
  }

  public verify(verifiedBy: string): DeathCertificate {
    return new DeathCertificate({
      ...this._value,
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy,
    });
  }

  // --- Helpers ---

  private static sanitize(val: string): string {
    return val ? val.trim().toUpperCase() : '';
  }

  public toJSON() {
    return {
      proofType: this._value.proofType,
      entryNumber: this._value.entryNumber,
      dateOfDeath: this._value.dateOfDeath,
      placeOfDeath: this._value.placeOfDeath,
      isLateRegistration: this.isLateRegistration,
      isVerified: this._value.isVerified,
    };
  }
}
