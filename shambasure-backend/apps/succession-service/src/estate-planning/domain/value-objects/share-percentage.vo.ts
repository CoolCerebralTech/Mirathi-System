export class SharePercentage {
  private readonly value: number;

  constructor(value: number) {
    if (value < 0 || value > 100) {
      throw new Error('Share percentage must be between 0 and 100');
    }

    // Round to 2 decimal places for precision
    this.value = Math.round(value * 100) / 100;
  }

  getValue(): number {
    return this.value;
  }

  equals(other: SharePercentage): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return `${this.value}%`;
  }

  // Business logic methods
  static totalIsValid(percentages: SharePercentage[]): boolean {
    const total = percentages.reduce((sum, share) => sum + share.getValue(), 0);
    return Math.abs(total - 100) < 0.01; // Allow for floating point precision
  }

  static createFromFraction(numerator: number, denominator: number): SharePercentage {
    if (denominator === 0) {
      throw new Error('Denominator cannot be zero');
    }
    const percentage = (numerator / denominator) * 100;
    return new SharePercentage(percentage);
  }
}
