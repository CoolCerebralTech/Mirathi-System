// domain/value-objects/identity/kra-pin.vo.ts
import { ValueObject } from '../../base/value-object';
import { InvalidKraPinException } from '../../exceptions/identity.exceptions';

export enum TaxPayerType {
  INDIVIDUAL = 'INDIVIDUAL', // Starts with A
  COMPANY = 'COMPANY', // Starts with P (also used for Estates/Trusts)
  FOREIGNER = 'FOREIGNER', // Starts with F (rare but possible)
  UNKNOWN = 'UNKNOWN',
}

export interface KraPinProps {
  pinNumber: string;
  taxPayerType: TaxPayerType;
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string; // UUID or "ITAX_SYSTEM"

  // Tax Compliance Status (Critical for S.45 Clearance Certificates)
  isTaxCompliant?: boolean;
  complianceCertificateDate?: Date;
}

export class KraPin extends ValueObject<KraPinProps> {
  private constructor(props: KraPinProps) {
    super(props);
    this.validate();
  }

  // --- Factory Methods ---

  static create(pinNumber: string): KraPin {
    const sanitized = this.sanitize(pinNumber);
    return new KraPin({
      pinNumber: sanitized,
      taxPayerType: this.determineType(sanitized),
      isVerified: false,
    });
  }

  static createVerified(
    pinNumber: string,
    verifiedBy: string,
    isTaxCompliant: boolean = false,
  ): KraPin {
    const sanitized = this.sanitize(pinNumber);
    return new KraPin({
      pinNumber: sanitized,
      taxPayerType: this.determineType(sanitized),
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy,
      isTaxCompliant,
    });
  }

  static reconstruct(props: KraPinProps): KraPin {
    return new KraPin(props);
  }

  // --- Validation & Helpers ---

  private static sanitize(pin: string): string {
    return pin.trim().replace(/\s/g, '').toUpperCase();
  }

  private static determineType(pin: string): TaxPayerType {
    if (!pin) return TaxPayerType.UNKNOWN;
    const firstChar = pin.charAt(0);

    if (firstChar === 'A') return TaxPayerType.INDIVIDUAL;
    if (firstChar === 'P') return TaxPayerType.COMPANY; // Estates use P
    if (firstChar === 'F') return TaxPayerType.FOREIGNER; // Foreign residents

    return TaxPayerType.UNKNOWN;
  }

  protected validate(): void {
    const { pinNumber } = this._value;

    if (!pinNumber) {
      throw new InvalidKraPinException('KRA PIN is required');
    }

    // KENYAN CONTEXT:
    // Format: A000000000Z (11 Characters)
    // 1 Letter + 9 Digits + 1 Letter
    const kraRegex = /^[A-Z]\d{9}[A-Z]$/;

    if (!kraRegex.test(pinNumber)) {
      throw new InvalidKraPinException(
        `Invalid KRA PIN format: ${pinNumber}. Expected 11 characters (A123456789Z).`,
      );
    }

    // Note: We do not implement the Modulo 26 checksum here.
    // The algorithm is obscure and changing it creates risk.
    // We rely on iTax API verification for deep validation.
  }

  // --- Business Logic ---

  /**
   * Returns a new instance marked as Verified
   * Used after successful iTax API call
   */
  public verify(verifiedBy: string, isCompliant: boolean): KraPin {
    return new KraPin({
      ...this._value,
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy,
      isTaxCompliant: isCompliant,
    });
  }

  /**
   * Checks if this PIN belongs to a Company or Estate (Starts with P)
   * Essential for preventing personal assets from being mixed with Estate assets
   */
  get isNonIndividual(): boolean {
    return this._value.taxPayerType === TaxPayerType.COMPANY;
  }

  /**
   * Checks if this PIN belongs to an Individual (Starts with A)
   */
  get isIndividual(): boolean {
    return this._value.taxPayerType === TaxPayerType.INDIVIDUAL;
  }

  // --- Getters ---

  get pinNumber(): string {
    return this._value.pinNumber;
  }

  get taxPayerType(): TaxPayerType {
    return this._value.taxPayerType;
  }

  get isVerified(): boolean {
    return this._value.isVerified;
  }

  get isTaxCompliant(): boolean {
    return this._value.isTaxCompliant || false;
  }

  public toJSON() {
    return {
      pinNumber: this._value.pinNumber,
      taxPayerType: this._value.taxPayerType,
      isVerified: this._value.isVerified,
      isTaxCompliant: this._value.isTaxCompliant,
      verifiedAt: this._value.verifiedAt,
    };
  }
}
