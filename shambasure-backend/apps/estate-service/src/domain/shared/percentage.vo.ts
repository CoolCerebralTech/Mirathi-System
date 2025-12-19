// src/shared/domain/value-objects/percentage.vo.ts
import { ValueObject } from '../base/value-object';
import { InvalidPercentageException } from '../exceptions/percentage.exception';

export class Percentage extends ValueObject<number> {
  private static readonly MIN = 0;
  private static readonly MAX = 100;

  constructor(value: number) {
    super(value);
  }

  protected validate(): void {
    if (this._value < Percentage.MIN) {
      throw new InvalidPercentageException(
        `Percentage cannot be less than ${Percentage.MIN}: ${this._value}`,
      );
    }

    if (this._value > Percentage.MAX) {
      throw new InvalidPercentageException(
        `Percentage cannot exceed ${Percentage.MAX}: ${this._value}`,
      );
    }

    // Check for NaN
    if (isNaN(this._value)) {
      throw new InvalidPercentageException('Percentage cannot be NaN');
    }
  }

  // Factory methods
  static fromFraction(fraction: number): Percentage {
    if (fraction < 0 || fraction > 1) {
      throw new InvalidPercentageException(`Fraction must be between 0 and 1: ${fraction}`);
    }
    return new Percentage(fraction * 100);
  }

  static fromRatio(numerator: number, denominator: number): Percentage {
    if (denominator === 0) {
      throw new InvalidPercentageException('Denominator cannot be zero');
    }
    return Percentage.fromFraction(numerator / denominator);
  }

  // Conversion methods
  toFraction(): number {
    return this._value / 100;
  }

  toDecimal(): number {
    return this._value / 100;
  }

  // Arithmetic operations
  add(other: Percentage): Percentage {
    const result = this._value + other.value;
    if (result > Percentage.MAX) {
      throw new InvalidPercentageException(`Addition exceeds ${Percentage.MAX}%: ${result}`);
    }
    return new Percentage(result);
  }

  subtract(other: Percentage): Percentage {
    const result = this._value - other.value;
    if (result < Percentage.MIN) {
      throw new InvalidPercentageException(`Subtraction results in negative percentage: ${result}`);
    }
    return new Percentage(result);
  }

  multiply(factor: number): Percentage {
    if (factor < 0) {
      throw new InvalidPercentageException('Multiplication factor cannot be negative');
    }
    const result = this._value * factor;
    if (result > Percentage.MAX) {
      throw new InvalidPercentageException(`Multiplication exceeds ${Percentage.MAX}%: ${result}`);
    }
    return new Percentage(result);
  }

  // Business logic methods
  ofAmount(amount: number): number {
    return amount * this.toFraction();
  }

  ofMoney(money: Money): Money {
    return money.multiply(this.toFraction());
  }

  isWholeNumber(): boolean {
    return this._value % 1 === 0;
  }

  isRounded(): boolean {
    // Check if percentage is rounded to 2 decimal places
    return Math.round(this._value * 100) / 100 === this._value;
  }

  // Formatting
  format(decimalPlaces: number = 2): string {
    return `${this._value.toFixed(decimalPlaces)}%`;
  }

  formatForLegalDocument(): string {
    if (this.isWholeNumber()) {
      return `${this._value.toFixed(0)} per cent`;
    }
    return `${this._value.toFixed(2)} per cent`;
  }

  // Comparison methods
  isGreaterThan(other: Percentage): boolean {
    return this._value > other.value;
  }

  isLessThan(other: Percentage): boolean {
    return this._value < other.value;
  }

  equals(other: Percentage): boolean {
    return Math.abs(this._value - other.value) < 0.0001; // Tolerance for floating point
  }

  // Getters
  get value(): number {
    return this._value;
  }

  // For inheritance calculations
  getRemainingPercentage(): Percentage {
    return new Percentage(Percentage.MAX - this._value);
  }

  // Validation for estate distribution
  isValidForDistribution(): boolean {
    return this._value > 0 && this._value <= Percentage.MAX;
  }
}
