export class KenyanId {
  private readonly value: string;
  private static readonly ID_PATTERN = /^\d{8,9}$/;

  constructor(value: string) {
    const cleanedValue = value.trim().replace(/\s+/g, '');

    if (!KenyanId.ID_PATTERN.test(cleanedValue)) {
      throw new Error('Invalid Kenyan ID format. Must be 8 or 9 digits');
    }

    if (!KenyanId.validateCheckDigit(cleanedValue)) {
      throw new Error('Invalid Kenyan ID check digit');
    }

    this.value = cleanedValue;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: KenyanId): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return this.value;
  }

  private static validateCheckDigit(id: string): boolean {
    // Kenyan ID validation algorithm
    if (id.length !== 8 && id.length !== 9) return false;

    // Basic validation - in production, implement proper check digit validation
    // This is a simplified version - actual Kenyan ID has more complex validation
    const digits = id.split('').map(Number);
    const sum = digits.reduce((acc, digit) => acc + digit, 0);

    return sum > 0; // Basic sanity check
  }

  getFormatted(): string {
    return this.value.replace(/(\d{3})(\d{3})(\d{2,3})/, '$1 $2 $3');
  }

  static isValid(id: string): boolean {
    try {
      new KenyanId(id);
      return true;
    } catch {
      return false;
    }
  }
}
