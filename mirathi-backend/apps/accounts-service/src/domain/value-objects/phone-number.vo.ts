/**
 * A custom error for phone number validation failures.
 */
export class InvalidPhoneNumberError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPhoneNumberError';
  }
}

// REFINEMENT: Use Sets for efficient prefix lookups. Easy to update.
const SAFARICOM_PREFIXES = new Set([
  '100',
  '101',
  '102',
  '110',
  '111',
  '112',
  '113',
  '114',
  '115',
  '700',
  '701',
  '702',
  '703',
  '704',
  '705',
  '706',
  '707',
  '708',
  '709',
  '710',
  '711',
  '712',
  '713',
  '714',
  '715',
  '716',
  '717',
  '718',
  '719',
  '720',
  '721',
  '722',
  '723',
  '724',
  '725',
  '726',
  '727',
  '728',
  '729',
  '740',
  '741',
  '742',
  '743',
  '745',
  '746',
  '748',
  '757',
  '758',
  '759',
  '768',
  '769',
  '790',
  '791',
  '792',
  '793',
  '794',
  '795',
  '796',
  '797',
  '798',
  '799',
]);
const AIRTEL_PREFIXES = new Set([
  '103',
  '104',
  '105',
  '730',
  '731',
  '732',
  '733',
  '734',
  '735',
  '736',
  '737',
  '738',
  '739',
  '750',
  '751',
  '752',
  '753',
  '754',
  '755',
  '756',
  '786',
  '787',
  '788',
  '789',
]);
const TELKOM_PREFIXES = new Set([
  '770',
  '771',
  '772',
  '773',
  '774',
  '775',
  '776',
  '777',
  '778',
  '779',
]);

/**
 * PhoneNumber Value Object
 * Encapsulates phone number validation and formatting for Kenyan phone numbers.
 */
export class PhoneNumber {
  private readonly value: string; // Stored in E.164 format

  private constructor(phoneNumber: string) {
    this.value = phoneNumber;
  }

  /**
   * Creates a new PhoneNumber value object. This is the only safe factory.
   * @throws InvalidPhoneNumberError if phone number is invalid.
   */
  static create(phoneNumber: string): PhoneNumber {
    const normalized = this.normalize(phoneNumber);

    if (!this.isValid(normalized)) {
      throw new InvalidPhoneNumberError(
        'Invalid Kenyan phone number format. Must be convertible to +254[17]XXXXXXXXX.',
      );
    }

    return new PhoneNumber(normalized);
  }

  private static normalize(phoneNumber: string): string {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new InvalidPhoneNumberError('Phone number must be a non-empty string.');
    }
    const cleaned = phoneNumber.replace(/[\s\-\\(\\)]/g, '');
    if (cleaned.startsWith('+254')) return cleaned;
    if (cleaned.startsWith('254')) return `+${cleaned}`;
    if (cleaned.startsWith('0')) return `+254${cleaned.substring(1)}`;
    // Caters for both 7... (9 digits) and 1... (9 digits) formats
    if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
      return `+254${cleaned}`;
    }
    return cleaned; // Return as-is for validation to fail
  }

  /**
   * Validates if a number matches the Kenyan E.164 structure.
   * This is intentionally not checking for specific network prefixes to avoid brittleness.
   */
  private static isValid(phoneNumber: string): boolean {
    // Valid Kenyan numbers in E.164 start with +254, followed by 1 (new) or 7 (older), and are 13 chars total.
    const kenyanE164Regex = /^\+254[17]\d{8}$/;
    return kenyanE164Regex.test(phoneNumber);
  }

  /**
   * REASONING: The `fromString` method was removed as it was an unsafe factory
   * that bypassed the crucial validation and normalization logic in `create()`.
   * All instantiations must go through `PhoneNumber.create()` to guarantee validity.
   */

  getValue(): string {
    return this.value;
  }

  getLocalFormat(): string {
    return `0${this.value.substring(4)}`;
  }

  getMasked(): string {
    const lastFour = this.value.slice(-4);
    return `+254****${lastFour}`;
  }

  /**
   * Returns the network provider based on the number's prefix.
   */
  getProvider(): 'Safaricom' | 'Airtel' | 'Telkom' | 'Unknown' {
    const prefix = this.value.substring(4, 7); // e.g., "712" from "+254712..." or "110" from "+254110..."

    if (SAFARICOM_PREFIXES.has(prefix)) return 'Safaricom';
    if (AIRTEL_PREFIXES.has(prefix)) return 'Airtel';
    if (TELKOM_PREFIXES.has(prefix)) return 'Telkom';

    return 'Unknown';
  }

  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
