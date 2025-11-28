export class SharePercentage {
  private readonly value: number;

  public constructor(value: number) {
    if (value < 0 || value > 100) {
      throw new Error('Share percentage must be between 0 and 100');
    }

    // Round to 2 decimal places for precision
    this.value = Math.round(value * 100) / 100;
    Object.freeze(this); // Ensure immutability
  }

  // -----------------------------------------------------
  // Factory
  // -----------------------------------------------------
  static create(value: number): SharePercentage {
    return new SharePercentage(value);
  }

  static createFromFraction(numerator: number, denominator: number): SharePercentage {
    if (denominator === 0) {
      throw new Error('Denominator cannot be zero');
    }
    const percentage = (numerator / denominator) * 100;
    return new SharePercentage(percentage);
  }

  // -----------------------------------------------------
  // Getters
  // -----------------------------------------------------
  getValue(): number {
    return this.value;
  }

  equals(other: SharePercentage): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return `${this.value}%`;
  }

  // -----------------------------------------------------
  // Business logic
  // -----------------------------------------------------
  static totalIsValid(percentages: SharePercentage[]): boolean {
    const total = percentages.reduce((sum, share) => sum + share.getValue(), 0);
    // Allow for floating point rounding errors
    return Math.abs(total - 100) < 0.01;
  }

  add(other: SharePercentage): SharePercentage {
    const result = this.value + other.getValue();
    if (result > 100) {
      throw new Error('Resulting share exceeds 100%');
    }
    return new SharePercentage(result);
  }

  subtract(other: SharePercentage): SharePercentage {
    const result = this.value - other.getValue();
    if (result < 0) {
      throw new Error('Resulting share cannot be negative');
    }
    return new SharePercentage(result);
  }
}
