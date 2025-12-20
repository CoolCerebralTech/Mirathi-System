// src/shared/domain/value-objects/kenyan-id.vo.ts
import { ValueObject } from '../base/value-object';
import { InvalidKenyanIdException } from '../exceptions/kenyan-id.exception';

export enum KenyanIdType {
  NATIONAL_ID = 'NATIONAL_ID',
  KRA_PIN = 'KRA_PIN',
  PASSPORT = 'PASSPORT',
  ALIEN_CARD = 'ALIEN_CARD',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  MILITARY_ID = 'MILITARY_ID',
  REFUGEE_ID = 'REFUGEE_ID',
  STUDENT_ID = 'STUDENT_ID',
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  NSSF_NUMBER = 'NSSF_NUMBER',
  NHIF_NUMBER = 'NHIF_NUMBER',
}

export enum Gender {
  MALE = 'M',
  FEMALE = 'F',
}

export interface KenyanIdProps {
  value: string;
  type: KenyanIdType;
  issueDate?: Date;
  expiryDate?: Date;
  issuingAuthority?: string;
  verified?: boolean;
  verificationDate?: Date;
}

export class KenyanId extends ValueObject<KenyanIdProps> {
  // County codes for National ID (first 2 digits)
  private static readonly COUNTY_CODES: Record<string, string> = {
    '01': 'Mombasa',
    '02': 'Kwale',
    '03': 'Kilifi',
    '04': 'Tana River',
    '05': 'Lamu',
    '06': 'Taita Taveta',
    '07': 'Garissa',
    '08': 'Wajir',
    '09': 'Mandera',
    '10': 'Marsabit',
    '11': 'Isiolo',
    '12': 'Meru',
    '13': 'Tharaka Nithi',
    '14': 'Embu',
    '15': 'Kitui',
    '16': 'Machakos',
    '17': 'Makueni',
    '18': 'Nyandarua',
    '19': 'Nyeri',
    '20': 'Kirinyaga',
    '21': 'Muranga',
    '22': 'Kiambu',
    '23': 'Turkana',
    '24': 'West Pokot',
    '25': 'Samburu',
    '26': 'Trans Nzoia',
    '27': 'Uasin Gishu',
    '28': 'Elgeyo Marakwet',
    '29': 'Nandi',
    '30': 'Baringo',
    '31': 'Laikipia',
    '32': 'Nakuru',
    '33': 'Narok',
    '34': 'Kajiado',
    '35': 'Kericho',
    '36': 'Bomet',
    '37': 'Kakamega',
    '38': 'Vihiga',
    '39': 'Bungoma',
    '40': 'Busia',
    '41': 'Siaya',
    '42': 'Kisumu',
    '43': 'Homa Bay',
    '44': 'Migori',
    '45': 'Kisii',
    '46': 'Nyamira',
    '47': 'Nairobi',
  };

  constructor(props: KenyanIdProps) {
    super(props);
  }

  protected validate(): void {
    const value = this._value.value;

    // Common validations
    if (!value || value.length === 0) {
      throw new InvalidKenyanIdException('ID value cannot be empty');
    }

    // Type-specific validation
    switch (this._value.type) {
      case KenyanIdType.NATIONAL_ID:
        this.validateNationalId(value);
        break;
      case KenyanIdType.KRA_PIN:
        this.validateKraPin(value);
        break;
      case KenyanIdType.PASSPORT:
        this.validatePassport(value);
        break;
      case KenyanIdType.ALIEN_CARD:
        this.validateAlienCard(value);
        break;
      case KenyanIdType.BIRTH_CERTIFICATE:
        this.validateBirthCertificate(value);
        break;
      case KenyanIdType.MILITARY_ID:
        this.validateMilitaryId(value);
        break;
      case KenyanIdType.REFUGEE_ID:
        this.validateRefugeeId(value);
        break;
      case KenyanIdType.DRIVER_LICENSE:
        this.validateDriverLicense(value);
        break;
      default:
        // For other types, just basic length check
        if (value.length < 3 || value.length > 50) {
          throw new InvalidKenyanIdException(
            `Invalid ${this._value.type} length: ${value}. Must be 3-50 characters`,
          );
        }
    }
  }

  private validateNationalId(id: string): void {
    // Note: ID should be sanitized before creating the ValueObject (via factory)
    // Kenyan National ID formats:
    // 1. Old format: 7 digits + 1 letter (e.g., 1234567A)
    // 2. New format: 8 digits (e.g., 12345678)
    // 3. Very old: 6 digits + letter (rare)

    const oldFormatRegex = /^(\d{7})([A-Z])$/;
    const newFormatRegex = /^(\d{8})$/;
    const veryOldFormatRegex = /^(\d{6})([A-Z])$/;

    if (!oldFormatRegex.test(id) && !newFormatRegex.test(id) && !veryOldFormatRegex.test(id)) {
      throw new InvalidKenyanIdException(
        `Invalid National ID format: ${id}. Valid formats: 1234567A (old), 12345678 (new)`,
      );
    }

    // Validate checksum for new format IDs
    if (newFormatRegex.test(id)) {
      this.validateNewNationalIdChecksum(id);
    }

    // Validate county code (first 2 digits)
    if (id.length >= 2 && /^\d/.test(id)) {
      const countyCode = id.slice(0, 2);
      if (!KenyanId.COUNTY_CODES[countyCode]) {
        // Warning only, as codes might change or be special
        // console.warn(`Unknown county code in National ID: ${countyCode}`);
      }
    }
  }

  private validateNewNationalIdChecksum(id: string): void {
    // Implementation of Kenyan National ID checksum algorithm
    // The checksum is the last digit (8th digit)

    const digits = id.split('').map(Number);
    const checksumDigit = digits[7];

    // Calculate checksum using algorithm
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      let digit = digits[i];

      // Double every other digit starting from the right (relative to payload)
      // Indexes 1, 3, 5 (0-based) are doubled in this specific variation
      if ((7 - i) % 2 === 0) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
    }

    const calculatedChecksum = (10 - (sum % 10)) % 10;

    if (calculatedChecksum !== checksumDigit) {
      throw new InvalidKenyanIdException(
        `Invalid National ID checksum: ${id}. Expected last digit ${calculatedChecksum}`,
      );
    }
  }

  private validateKraPin(pin: string): void {
    // KRA PIN formats: P/A/G followed by 10 digits
    const pinRegex = /^[PAG]\d{10}$/;

    if (!pinRegex.test(pin)) {
      throw new InvalidKenyanIdException(
        `Invalid KRA PIN format: ${pin}. Must be P/A/G followed by 10 digits`,
      );
    }

    this.validateKraPinChecksum(pin);
  }

  private validateKraPinChecksum(pin: string): void {
    // KRA PIN validation algorithm
    const baseDigits = pin.slice(1); // Remove prefix
    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];

    let sum = 0;
    for (let i = 0; i < baseDigits.length; i++) {
      let digit = parseInt(baseDigits[i], 10) * weights[i];
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
      sum += digit;
    }

    const checksum = (10 - (sum % 10)) % 10;

    // The checksum should be 0 for valid KRA PINs
    if (checksum !== 0) {
      throw new InvalidKenyanIdException(`Invalid KRA PIN checksum: ${pin}`);
    }
  }

  private validatePassport(passport: string): void {
    // Kenyan passport formats:
    // 1. Old: A followed by 7 digits
    // 2. New: 2 letters followed by 7 digits (e.g., PA1234567)
    // 3. Diplomatic: D followed by 7 digits
    // 4. East African: EA followed by 7 digits

    const passportRegex = /^([A-Z]|[A-Z]{2}|D|EA)\d{7}$/;

    if (!passportRegex.test(passport)) {
      throw new InvalidKenyanIdException(
        `Invalid passport format: ${passport}. Must be letter(s) followed by 7 digits`,
      );
    }
  }

  private validateAlienCard(card: string): void {
    // Alien card format: A followed by 8 digits
    const alienCardRegex = /^A\d{8}$/;

    if (!alienCardRegex.test(card)) {
      throw new InvalidKenyanIdException(
        `Invalid alien card format: ${card}. Must be A followed by 8 digits`,
      );
    }
  }

  private validateBirthCertificate(cert: string): void {
    // Birth certificate format: DistrictCode/Year/SerialNumber
    // e.g.: NRB/2000/12345, MSA/1995/6789
    // More flexible regex to account for various district codes
    const birthCertRegex = /^[A-Z]{2,5}\/\d{4}\/\d{1,8}$/;

    if (!birthCertRegex.test(cert)) {
      throw new InvalidKenyanIdException(
        `Invalid birth certificate format: ${cert}. Expected format: ABC/YYYY/NNNNNN`,
      );
    }

    // Validate year
    const parts = cert.split('/');
    const year = parseInt(parts[1], 10);
    const currentYear = new Date().getFullYear();

    if (year < 1900 || year > currentYear) {
      throw new InvalidKenyanIdException(
        `Invalid birth year in certificate: ${year}. Must be between 1900 and ${currentYear}`,
      );
    }
  }

  private validateMilitaryId(id: string): void {
    // Military ID format: KM followed by 6-8 digits
    const militaryRegex = /^KM\d{6,8}$/;

    if (!militaryRegex.test(id)) {
      throw new InvalidKenyanIdException(
        `Invalid military ID format: ${id}. Must be KM followed by 6-8 digits`,
      );
    }
  }

  private validateRefugeeId(id: string): void {
    // Refugee ID format: starts with country code + year + serial
    const refugeeRegex = /^[A-Z]{3}\d{4}\d{4,8}$/;

    if (!refugeeRegex.test(id)) {
      throw new InvalidKenyanIdException(
        `Invalid refugee ID format: ${id}. Expected format: XXXYYYYNNNNNN`,
      );
    }
  }

  private validateDriverLicense(license: string): void {
    // Kenyan driver's license: 8-10 alphanumeric characters
    const licenseRegex = /^[A-Z0-9]{8,10}$/;

    if (!licenseRegex.test(license)) {
      throw new InvalidKenyanIdException(
        `Invalid driver's license format: ${license}. Must be 8-10 alphanumeric characters`,
      );
    }
  }

  // Factory methods - Sanitize inputs here
  static createNationalId(id: string, issueDate?: Date): KenyanId {
    // Remove any spaces or special characters
    const cleanId = id
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    return new KenyanId({
      value: cleanId,
      type: KenyanIdType.NATIONAL_ID,
      issueDate,
    });
  }

  static createKraPin(pin: string, issueDate?: Date): KenyanId {
    const cleanPin = pin
      .trim()
      .toUpperCase()
      .replace(/[^PAG0-9]/g, '');
    return new KenyanId({
      value: cleanPin,
      type: KenyanIdType.KRA_PIN,
      issueDate,
    });
  }

  static createPassport(passport: string, issueDate?: Date, expiryDate?: Date): KenyanId {
    const cleanPassport = passport.trim().toUpperCase().replace(/\s/g, '');
    return new KenyanId({
      value: cleanPassport,
      type: KenyanIdType.PASSPORT,
      issueDate,
      expiryDate,
    });
  }

  // Business logic methods
  extractGender(): Gender | null {
    if (this._value.type !== KenyanIdType.NATIONAL_ID) {
      return null;
    }

    // For National ID, the 7th digit indicates gender (heuristic)
    const id = this._value.value;

    if (id.length >= 7) {
      const genderDigit = parseInt(id[6], 10);
      if (!isNaN(genderDigit)) {
        // This is a common heuristic but not 100% strictly documented for all series
        return genderDigit <= 4 ? Gender.MALE : Gender.FEMALE;
      }
    }

    return null;
  }

  extractCounty(): string | null {
    if (this._value.type !== KenyanIdType.NATIONAL_ID) {
      return null;
    }

    const id = this._value.value;
    if (id.length >= 2) {
      const countyCode = id.slice(0, 2);
      return KenyanId.COUNTY_CODES[countyCode] || null;
    }

    return null;
  }

  extractDateOfBirth(): Date | null {
    if (this._value.type !== KenyanIdType.NATIONAL_ID) {
      return null;
    }

    const id = this._value.value;

    // For new format IDs (8 digits), digits 3-6 represent YYMM of birth
    if (id.length === 8 && /^\d{8}$/.test(id)) {
      const yearPart = id.slice(2, 4); // YY
      const monthPart = id.slice(4, 6); // MM

      const currentYear = new Date().getFullYear();
      const century = parseInt(yearPart) <= currentYear % 100 ? 2000 : 1900;
      const year = century + parseInt(yearPart);
      const month = parseInt(monthPart) - 1; // JavaScript months are 0-indexed

      if (month >= 0 && month < 12) {
        return new Date(year, month, 1); // First day of the month
      }
    }

    return null;
  }

  isExpired(): boolean {
    if (!this._value.expiryDate) {
      return false;
    }
    return this._value.expiryDate < new Date();
  }

  isValidForSuccession(): boolean {
    // Check if ID is valid for succession purposes
    if (!this._value.verified) {
      // In practice, we might allow unverified if manually checked, but domain rule suggests verification
      return false;
    }

    if (this.isExpired()) {
      // Expired passports might still be accepted for succession identity proof
      if (this._value.type === KenyanIdType.PASSPORT) {
        return true;
      }
      return false;
    }

    return true;
  }

  // Formatting methods
  getMaskedValue(): string {
    const value = this._value.value;

    switch (this._value.type) {
      case KenyanIdType.NATIONAL_ID:
        return `***${value.slice(-3)}`;
      case KenyanIdType.KRA_PIN:
        return `${value.slice(0, 2)}******${value.slice(-2)}`;
      case KenyanIdType.PASSPORT:
        return `${value.slice(0, 2)}*****${value.slice(-2)}`;
      default:
        return value.length > 4 ? `***${value.slice(-4)}` : value;
    }
  }

  getFormattedForDocument(): string {
    switch (this._value.type) {
      case KenyanIdType.NATIONAL_ID:
        return `National Identity Card No. ${this._value.value}`;
      case KenyanIdType.KRA_PIN:
        return `KRA PIN ${this._value.value}`;
      case KenyanIdType.PASSPORT:
        return `Passport No. ${this._value.value}`;
      case KenyanIdType.ALIEN_CARD:
        return `Alien Card No. ${this._value.value}`;
      case KenyanIdType.BIRTH_CERTIFICATE:
        return `Birth Certificate No. ${this._value.value}`;
      default:
        return `${this._value.type.replace(/_/g, ' ')}: ${this._value.value}`;
    }
  }

  // Getters
  // RENAMED from 'value' to 'idValue' to avoid conflict with ValueObject base class property
  get idValue(): string {
    return this._value.value;
  }

  get type(): KenyanIdType {
    return this._value.type;
  }

  get issueDate(): Date | undefined {
    return this._value.issueDate;
  }

  get expiryDate(): Date | undefined {
    return this._value.expiryDate;
  }

  get verified(): boolean {
    return this._value.verified || false;
  }

  get verificationDate(): Date | undefined {
    return this._value.verificationDate;
  }

  // For API responses
  toJSON() {
    return {
      type: this._value.type,
      value: this.getMaskedValue(), // Safe default
      idValue: this._value.verified ? this._value.value : undefined, // Exposed if verified
      issueDate: this._value.issueDate,
      expiryDate: this._value.expiryDate,
      verified: this._value.verified,
      verificationDate: this._value.verificationDate,
      gender: this.extractGender(),
      county: this.extractCounty(),
      dateOfBirth: this.extractDateOfBirth(),
      isExpired: this.isExpired(),
      isValidForSuccession: this.isValidForSuccession(),
      formatted: this.getFormattedForDocument(),
    };
  }
}
