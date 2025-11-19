export class KenyanPhoneNumber {
  private readonly value: string;

  // Regex for: +254..., 254..., 07..., 01...
  private static readonly PATTERN = /^(?:\+254|254|0)((7|1)\d{8})$/;

  constructor(phone: string) {
    const cleaned = phone.replace(/\s+/g, '');
    const match = cleaned.match(KenyanPhoneNumber.PATTERN);

    if (!match) {
      throw new Error('Invalid Kenyan phone number format');
    }

    // Normalize to international format: +254...
    this.value = `+254${match[1]}`;
  }

  getValue(): string {
    return this.value;
  }

  // Used for SMS gateways (e.g., Africa's Talking often wants 254...)
  toSmsFormat(): string {
    return this.value.substring(1); // Remove '+'
  }

  equals(other: KenyanPhoneNumber): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return this.value;
  }
}
