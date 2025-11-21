export class KenyanPhoneNumber {
  private readonly value: string;

  // Regex to match: +2547..., 2547..., 07..., 01...
  private static readonly PATTERN = /^(?:\+254|254|0)((7|1)\d{8})$/;

  private constructor(normalized: string) {
    this.value = normalized;
    Object.freeze(this); // Make immutable
  }

  // -----------------------------------------------------
  // Factory method (DDD-friendly)
  // -----------------------------------------------------
  static create(phone: string): KenyanPhoneNumber {
    const cleaned = phone.replace(/\s+/g, '');
    const match = cleaned.match(KenyanPhoneNumber.PATTERN);

    if (!match) {
      throw new Error('Invalid Kenyan phone number format');
    }

    // Normalize to international format: +2547XXXXXXXX
    const normalized = `+254${match[1]}`;
    return new KenyanPhoneNumber(normalized);
  }

  // -----------------------------------------------------
  // Getters
  // -----------------------------------------------------
  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  // SMS-compatible format (remove '+')
  toSmsFormat(): string {
    return this.value.substring(1); // '2547XXXXXXXX'
  }

  // Display-friendly format (07XXXXXXXX)
  toLocalFormat(): string {
    return `0${this.value.substring(4)}`;
  }

  // -----------------------------------------------------
  // Comparison
  // -----------------------------------------------------
  equals(other: KenyanPhoneNumber): boolean {
    return this.value === other.getValue();
  }

  // -----------------------------------------------------
  // Validation helper
  // -----------------------------------------------------
  static isValid(phone: string): boolean {
    try {
      KenyanPhoneNumber.create(phone);
      return true;
    } catch {
      return false;
    }
  }
}
