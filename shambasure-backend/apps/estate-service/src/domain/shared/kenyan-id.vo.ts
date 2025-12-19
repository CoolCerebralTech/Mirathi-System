// src/shared/domain/value-objects/kenyan-id.vo.ts
import { ValueObject } from '../base/value-object';
import { InvalidKenyanIdException } from '../exceptions/kenyan-id.exception';

export enum KenyanIdType {
  NATIONAL_ID = 'NATIONAL_ID',
  KRA_PIN = 'KRA_PIN',
  PASSPORT = 'PASSPORT',
  ALIEN_CARD = 'ALIEN_CARD',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
}

export class KenyanId extends ValueObject<string> {
  private readonly type: KenyanIdType;

  constructor(value: string, type: KenyanIdType) {
    super(value.trim().toUpperCase());
    this.type = type;
  }

  protected validate(): void {
    const value = this._value;

    // Common validations
    if (!value || value.length === 0) {
      throw new InvalidKenyanIdException('ID value cannot be empty');
    }

    // Type-specific validation
    switch (this.type) {
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
      default:
        throw new InvalidKenyanIdException(`Unknown ID type: ${this.type}`);
    }
  }

  private validateNationalId(id: string): void {
    // Kenyan National ID format: 8 digits (new) or 7 digits + letter (old)
    const regex = /^(\d{8}|\d{7}[A-Z])$/;

    if (!regex.test(id)) {
      throw new InvalidKenyanIdException(
        `Invalid National ID format: ${id}. Must be 8 digits or 7 digits + letter`,
      );
    }

    // Check digit validation (Luhn algorithm variant for Kenyan IDs)
    if (id.length === 8) {
      this.validateNewNationalIdChecksum(id);
    } else {
      this.validateOldNationalIdChecksum(id);
    }
  }

  private validateNewNationalIdChecksum(id: string): void {
    // Implementation of Kenyan National ID checksum algorithm
    // (Simplified - actual algorithm is more complex)
    const digits = id.split('').map(Number);
    const checksum = this.calculateChecksum(digits.slice(0, 7));

    if (digits[7] !== checksum) {
      throw new InvalidKenyanIdException(`Invalid National ID checksum: ${id}`);
    }
  }

  private validateOldNationalIdChecksum(id: string): void {
    const digits = id.slice(0, 7).split('').map(Number);
    const letter = id[7].toUpperCase();
    const expectedLetter = this.calculateOldIdLetter(digits);

    if (letter !== expectedLetter) {
      throw new InvalidKenyanIdException(
        `Invalid old National ID letter: ${id}. Expected ${expectedLetter}`,
      );
    }
  }

  private validateKraPin(pin: string): void {
    // KRA PIN format: P/A followed by 10 digits
    const regex = /^[PA]\d{10}$/;

    if (!regex.test(pin)) {
      throw new InvalidKenyanIdException(
        `Invalid KRA PIN format: ${pin}. Must be P/A followed by 10 digits`,
      );
    }

    // First character indicates type
    const type = pin[0];
    if (type === 'P' && !this.isValidPersonalPin(pin)) {
      throw new InvalidKenyanIdException(`Invalid personal KRA PIN: ${pin}`);
    }
    if (type === 'A' && !this.isValidCompanyPin(pin)) {
      throw new InvalidKenyanIdException(`Invalid company KRA PIN: ${pin}`);
    }
  }

  private validatePassport(passport: string): void {
    // Kenyan passport format: 2 letters + 6 digits (e.g., A1234567)
    const regex = /^[A-Z]\d{7}$/;

    if (!regex.test(passport)) {
      throw new InvalidKenyanIdException(
        `Invalid passport format: ${passport}. Must be letter + 7 digits`,
      );
    }
  }

  private validateAlienCard(card: string): void {
    // Alien card format: Starts with 'A', then 8 digits
    const regex = /^A\d{8}$/;

    if (!regex.test(card)) {
      throw new InvalidKenyanIdException(
        `Invalid alien card format: ${card}. Must be A followed by 8 digits`,
      );
    }
  }

  private validateBirthCertificate(cert: string): void {
    // Birth certificate format varies, but typically starts with district code
    const regex = /^[A-Z]{2,3}\/\d{2}\/\d{2,5}$/;

    if (!regex.test(cert)) {
      throw new InvalidKenyanIdException(
        `Invalid birth certificate format: ${cert}. Expected format: XX/YY/NNNN`,
      );
    }
  }

  // Factory methods
  static createNationalId(id: string): KenyanId {
    return new KenyanId(id, KenyanIdType.NATIONAL_ID);
  }

  static createKraPin(pin: string): KenyanId {
    return new KenyanId(pin, KenyanIdType.KRA_PIN);
  }

  static createPassport(passport: string): KenyanId {
    return new KenyanId(passport, KenyanIdType.PASSPORT);
  }

  // Helper methods
  private calculateChecksum(digits: number[]): number {
    // Simplified checksum calculation
    const sum = digits.reduce((acc, digit, index) => {
      return acc + digit * (index + 1);
    }, 0);
    return sum % 10;
  }

  private calculateOldIdLetter(digits: number[]): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const sum = digits.reduce((acc, digit) => acc + digit, 0);
    return letters[sum % 26];
  }

  private isValidPersonalPin(pin: string): boolean {
    // Additional validation for personal PINs
    const digits = pin.slice(1).split('').map(Number);
    // Implementation of personal PIN validation logic
    return true;
  }

  private isValidCompanyPin(pin: string): boolean {
    // Additional validation for company PINs
    const digits = pin.slice(1).split('').map(Number);
    // Implementation of company PIN validation logic
    return true;
  }

  // Getters

  get value(): string {
    return this._value;
  }

  isNationalId(): boolean {
    return this.type === KenyanIdType.NATIONAL_ID;
  }

  isKraPin(): boolean {
    return this.type === KenyanIdType.KRA_PIN;
  }

  // For display
  get maskedValue(): string {
    if (this.type === KenyanIdType.NATIONAL_ID) {
      return `***${this._value.slice(-3)}`;
    }
    if (this.type === KenyanIdType.KRA_PIN) {
      return `${this._value.slice(0, 2)}******${this._value.slice(-2)}`;
    }
    return `***${this._value.slice(-4)}`;
  }

  // For legal documents
  get formattedForDocument(): string {
    switch (this.type) {
      case KenyanIdType.NATIONAL_ID:
        return `National ID No. ${this._value}`;
      case KenyanIdType.KRA_PIN:
        return `KRA PIN ${this._value}`;
      case KenyanIdType.PASSPORT:
        return `Passport No. ${this._value}`;
      default:
        return `${this.type.replace('_', ' ')}: ${this._value}`;
    }
  }
}
