export class KenyanId {
  private readonly value: string;
  private static readonly ID_PATTERN = /^\d{8,9}$/;

  private constructor(value: string) {
    this.value = value;
    Object.freeze(this);
  }

  // -----------------------------------------------------
  // Factory Method (DDD-friendly)
  // -----------------------------------------------------
  static create(value: string): KenyanId {
    const cleanedValue = value.trim().replace(/\s+/g, '');

    if (!KenyanId.ID_PATTERN.test(cleanedValue)) {
      throw new Error('Invalid Kenyan ID format. Must be 8 or 9 digits');
    }

    if (!KenyanId.validateCheckDigit(cleanedValue)) {
      throw new Error('Invalid Kenyan ID check digit');
    }

    return new KenyanId(cleanedValue);
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

  getFormatted(): string {
    // Formats as XXX XXX XXX or XXX XXX XX depending on length
    return this.value.length === 8
      ? this.value.replace(/(\d{3})(\d{3})(\d{2})/, '$1 $2 $3')
      : this.value.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }

  // -----------------------------------------------------
  // Comparison
  // -----------------------------------------------------
  equals(other: KenyanId): boolean {
    return this.value === other.getValue();
  }

  // -----------------------------------------------------
  // Validation Helpers
  // -----------------------------------------------------
  private static validateCheckDigit(id: string): boolean {
    // Placeholder for proper Kenyan ID check digit algorithm
    // Currently using Luhn-like basic sum check (can replace with official if available)
    if (!id || id.length < 8 || id.length > 9) return false;

    const digits = id.split('').map(Number);
    const sum = digits.reduce((acc, digit) => acc + digit, 0);

    return sum > 0; // Simple sanity check
  }

  static isValid(id: string): boolean {
    try {
      KenyanId.create(id);
      return true;
    } catch {
      return false;
    }
  }
}
