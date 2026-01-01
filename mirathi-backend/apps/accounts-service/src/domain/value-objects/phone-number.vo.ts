// src/domain/value-objects/phone-number.vo.ts
import { SingleValueObject } from './base.vo';

/**
 * Domain-specific error for phone number validation
 */
export class InvalidPhoneNumberError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPhoneNumberError';
  }
}

/**
 * Kenyan Phone Number Value Object
 *
 * Business Rules:
 * 1. Must be a valid Kenyan phone number
 * 2. Must be in E.164 format (+254...)
 * 3. Must be from a valid Kenyan carrier (Safaricom, Airtel, Telkom)
 * 4. Must not be a toll-free or premium rate number
 *
 * Formats accepted:
 * - 0712 345 678
 * - +254712345678
 * - 254712345678
 *
 * All normalized to: +254712345678
 */
export class PhoneNumber extends SingleValueObject<string> {
  // Kenyan mobile prefixes (updated as of 2024)
  private static readonly VALID_PREFIXES = new Set([
    '70',
    '71',
    '72',
    '74',
    '75',
    '76',
    '77',
    '78',
    '79', // Safaricom
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19', // Safaricom (new)
    '73', // Airtel
    '56',
    '57',
    '58',
    '59', // Airtel (new)
    '60',
    '61',
    '62',
    '63',
    '64',
    '65',
    '66',
    '67',
    '68',
    '69', // Telkom
    '30',
    '31',
    '32',
    '33',
    '34',
    '35',
    '36',
    '37',
    '38',
    '39', // Equitel
    '50',
    '51',
    '52',
    '53',
    '54',
    '55', // Faiba
  ]);

  // Known invalid prefixes (toll-free, emergency, premium)
  private static readonly INVALID_PREFIXES = new Set([
    '0800', // Toll-free
    '0900', // Premium rate
    '999', // Emergency
    '112', // Emergency
    '911', // Emergency
    '100', // Operator
  ]);

  protected validate(): void {
    if (!this._value) {
      throw new InvalidPhoneNumberError('Phone number is required');
    }

    // Remove all non-digit characters except leading +
    const cleaned = this._value.trim();

    // Check if it's a valid Kenyan number
    if (!this.isValidKenyanNumber(cleaned)) {
      throw new InvalidPhoneNumberError(
        `Invalid Kenyan phone number: ${this._value}. Must be a valid Kenyan mobile number`,
      );
    }
  }

  /**
   * Check if a phone number is a valid Kenyan mobile number
   */
  private isValidKenyanNumber(phone: string): boolean {
    // Step 1: Check for invalid prefixes
    for (const invalidPrefix of PhoneNumber.INVALID_PREFIXES) {
      if (phone.startsWith(invalidPrefix) || phone.startsWith(`+${invalidPrefix}`)) {
        return false;
      }
    }

    // Step 2: Remove country code for prefix checking
    let numberWithoutCountryCode = phone;

    if (phone.startsWith('+254')) {
      numberWithoutCountryCode = phone.substring(4); // Remove +254
    } else if (phone.startsWith('254')) {
      numberWithoutCountryCode = phone.substring(3); // Remove 254
    } else if (phone.startsWith('0')) {
      numberWithoutCountryCode = phone.substring(1); // Remove leading 0
    } else {
      // Doesn't match any known Kenyan format
      return false;
    }

    // Step 3: Check length (should be 9 digits after removing country code)
    if (numberWithoutCountryCode.length !== 9) {
      return false;
    }

    // Step 4: Check if first 2-3 digits are a valid mobile prefix
    const twoDigitPrefix = numberWithoutCountryCode.substring(0, 2);
    const threeDigitPrefix = numberWithoutCountryCode.substring(0, 3);

    if (
      !PhoneNumber.VALID_PREFIXES.has(twoDigitPrefix) &&
      !PhoneNumber.VALID_PREFIXES.has(threeDigitPrefix)
    ) {
      return false;
    }

    // Step 5: Ensure all remaining characters are digits
    return /^\d+$/.test(numberWithoutCountryCode);
  }

  /**
   * Factory method to create PhoneNumber from various formats
   */
  static create(value: string): PhoneNumber {
    return new PhoneNumber(this.normalize(value));
  }

  /**
   * Normalize phone number to E.164 format (+254XXXXXXXXX)
   */
  private static normalize(phone: string): string {
    // Remove all non-digits (turns +254... into 254..., 07... into 07...)
    const cleaned = phone.replace(/\D/g, '');

    // Case 1: Handles "2547..." or inputs that were "+2547..."
    if (cleaned.startsWith('254') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    // Case 2: Handles "07..." or "01..."
    else if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `+254${cleaned.substring(1)}`;
    }
    // Case 3: Handles "7..." (9 digits without prefix)
    else if (cleaned.length === 9) {
      return `+254${cleaned}`;
    }
    // Fallback
    else {
      // Try to parse as is, validation will catch if invalid
      return phone;
    }
  }

  /**
   * Check if this is a Safaricom number (for M-Pesa integration)
   */
  isSafaricom(): boolean {
    const number = this.value;
    const prefixes = [
      '70',
      '71',
      '72',
      '74',
      '75',
      '76',
      '77',
      '78',
      '79',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
    ];

    for (const prefix of prefixes) {
      if (number.includes(prefix)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if this is an Airtel number
   */
  isAirtel(): boolean {
    const number = this.value;
    const prefixes = ['73', '56', '57', '58', '59'];

    for (const prefix of prefixes) {
      if (number.includes(prefix)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get the carrier name
   */
  get carrier(): string {
    if (this.isSafaricom()) return 'Safaricom';
    if (this.isAirtel()) return 'Airtel';

    // Check other carriers
    const number = this.value;
    if (
      number.includes('60') ||
      number.includes('61') ||
      number.includes('62') ||
      number.includes('63') ||
      number.includes('64') ||
      number.includes('65') ||
      number.includes('66') ||
      number.includes('67') ||
      number.includes('68') ||
      number.includes('69')
    ) {
      return 'Telkom';
    }

    if (
      number.includes('30') ||
      number.includes('31') ||
      number.includes('32') ||
      number.includes('33') ||
      number.includes('34') ||
      number.includes('35') ||
      number.includes('36') ||
      number.includes('37') ||
      number.includes('38') ||
      number.includes('39')
    ) {
      return 'Equitel';
    }

    if (
      number.includes('50') ||
      number.includes('51') ||
      number.includes('52') ||
      number.includes('53') ||
      number.includes('54') ||
      number.includes('55')
    ) {
      return 'Faiba';
    }

    return 'Unknown';
  }

  /**
   * Get the last 4 digits (for display purposes)
   */
  get lastFourDigits(): string {
    return this.value.slice(-4);
  }

  /**
   * Get masked version for display (e.g., +2547*****5678)
   */
  get masked(): string {
    const digits = this.value.replace(/\D/g, '');
    if (digits.length >= 7) {
      return `+${digits.slice(0, -6)}*****${digits.slice(-4)}`;
    }
    return this.value;
  }
}
