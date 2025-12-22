import { ValueObject } from '../base/value-object';
import { InvalidPercentageException } from '../exceptions/percentage.exception';

export class Percentage extends ValueObject<number> {
  private static readonly MIN = 0;
  private static readonly MAX = 100;
  private static readonly PRECISION = 4; // 4 decimal places (e.g., 33.3333%)

  constructor(value: number) {
    // Round immediately upon creation to ensure consistency
    super(Percentage.round(value));
  }

  protected validate(): void {
    if (this.props < Percentage.MIN || this.props > Percentage.MAX) {
      throw new InvalidPercentageException(
        `Percentage must be between ${Percentage.MIN} and ${Percentage.MAX}. Got: ${this.props}`,
      );
    }

    if (!Number.isFinite(this.props)) {
      throw new InvalidPercentageException('Percentage must be a finite number');
    }
  }

  private static round(value: number): number {
    const factor = Math.pow(10, Percentage.PRECISION);
    return Math.round(value * factor) / factor;
  }

  // --- Factory Methods ---

  static fromFraction(fraction: number): Percentage {
    if (fraction < 0 || fraction > 1) {
      throw new InvalidPercentageException(`Fraction must be between 0 and 1. Got: ${fraction}`);
    }
    return new Percentage(fraction * 100);
  }

  static fromRatio(numerator: number, denominator: number): Percentage {
    if (denominator === 0) throw new InvalidPercentageException('Denominator cannot be zero');
    if (denominator < 0) throw new InvalidPercentageException('Denominator cannot be negative');

    return Percentage.fromFraction(numerator / denominator);
  }

  // --- Arithmetic (Immutable) ---

  add(other: Percentage): Percentage {
    return new Percentage(this.props + other.value);
  }

  subtract(other: Percentage): Percentage {
    return new Percentage(this.props - other.value);
  }

  multiply(factor: number): Percentage {
    if (factor < 0)
      throw new InvalidPercentageException('Multiplication factor cannot be negative');
    return new Percentage(this.props * factor);
  }

  // --- Business Logic ---

  toFraction(): number {
    return Percentage.round(this.props / 100);
  }

  isWholeNumber(): boolean {
    return this.props % 1 === 0;
  }

  // Distribution Helper: Checks if this percentage represents a full share (100%)
  isFull(): boolean {
    return Math.abs(this.props - 100) < 0.0001;
  }

  // Formatting for Legal Documents (e.g. "50.00%")
  format(): string {
    return `${this.props.toFixed(2)}%`;
  }

  // Getters
  get value(): number {
    return this.props;
  }

  public toJSON(): Record<string, any> {
    return {
      value: this.props,
      formatted: this.format(),
      fraction: this.toFraction(),
    };
  }
}
