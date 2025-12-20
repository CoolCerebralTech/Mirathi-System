// src/shared/domain/value-objects/percentage.vo.ts
import { ValueObject } from '../base/value-object';
import { InvalidPercentageException } from '../exceptions/percentage.exception';
import { Currency, Money } from './money.vo';

export class Percentage extends ValueObject<number> {
  private static readonly MIN = 0;
  private static readonly MAX = 100;
  private static readonly PRECISION = 4; // 4 decimal places for precise calculations

  constructor(value: number) {
    // Fix: Use static method for rounding before super call to avoid 'this' access error
    super(Percentage.round(value));
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

    if (isNaN(this._value)) {
      throw new InvalidPercentageException('Percentage cannot be NaN');
    }

    if (!isFinite(this._value)) {
      throw new InvalidPercentageException('Percentage must be a finite number');
    }
  }

  // Made static to be accessible in constructor
  private static round(value: number): number {
    const factor = Math.pow(10, Percentage.PRECISION);
    return Math.round(value * factor) / factor;
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
    if (denominator < 0) {
      throw new InvalidPercentageException('Denominator cannot be negative');
    }
    return Percentage.fromFraction(numerator / denominator);
  }

  static fromString(str: string): Percentage {
    const cleanStr = str.replace('%', '').trim();
    const value = parseFloat(cleanStr);

    if (isNaN(value)) {
      throw new InvalidPercentageException(`Invalid percentage string: ${str}`);
    }

    return new Percentage(value);
  }

  // Kenyan succession specific factory methods
  static spouseShareUnderS35(hasChildren: boolean, isPolygamous: boolean = false): Percentage {
    // S. 35 LSA: Spouse gets personal chattels + life interest in matrimonial home
    // If polygamous under S. 40, different calculation applies
    if (isPolygamous) {
      // S. 40: Each wife gets equal share of spouse portion
      return new Percentage(0); // Special case - life interest only
    }

    // S. 35(1)(a): Personal chattels (100% but calculated separately)
    // S. 35(1)(b): Life interest in matrimonial home
    // For value calculations, we return 0 as it's a life interest
    return new Percentage(0);
  }

  static childShareUnderS35(numberOfChildren: number, hasSurvivingSpouse: boolean): Percentage {
    if (numberOfChildren <= 0) {
      return new Percentage(0);
    }

    if (hasSurvivingSpouse) {
      // S. 35(1)(c): Children get residue (100% after personal chattels and life interest)
      // For computation purposes, children share equally
      return new Percentage(100 / numberOfChildren);
    } else {
      // S. 35(5): If no spouse, children get everything equally
      return new Percentage(100 / numberOfChildren);
    }
  }

  static polygamousHouseShare(numberOfHouses: number): Percentage {
    if (numberOfHouses <= 0) {
      throw new InvalidPercentageException(
        `Invalid number of polygamous houses: ${numberOfHouses}`,
      );
    }

    // S. 40(2): Estate divided equally among houses
    return new Percentage(100 / numberOfHouses);
  }

  // Conversion methods
  toFraction(): number {
    return Percentage.round(this._value / 100);
  }

  toDecimal(): number {
    return Percentage.round(this._value / 100);
  }

  toRatio(): { numerator: number; denominator: number } {
    const fraction = this.toFraction();
    // Convert to simplest ratio approximation
    const precision = 10000;
    const numerator = Math.round(fraction * precision);
    return { numerator, denominator: precision };
  }

  // Arithmetic operations
  add(other: Percentage): Percentage {
    const result = this._value + other.value;
    if (result > Percentage.MAX) {
      throw new InvalidPercentageException(
        `Addition exceeds ${Percentage.MAX}%: ${result.toFixed(2)}%`,
      );
    }
    return new Percentage(result);
  }

  subtract(other: Percentage): Percentage {
    const result = this._value - other.value;
    if (result < Percentage.MIN) {
      throw new InvalidPercentageException(
        `Subtraction results in negative percentage: ${result.toFixed(2)}%`,
      );
    }
    return new Percentage(result);
  }

  multiply(factor: number): Percentage {
    if (factor < 0) {
      throw new InvalidPercentageException('Multiplication factor cannot be negative');
    }
    const result = this._value * factor;
    if (result > Percentage.MAX) {
      throw new InvalidPercentageException(
        `Multiplication exceeds ${Percentage.MAX}%: ${result.toFixed(2)}%`,
      );
    }
    return new Percentage(result);
  }

  divide(divisor: number): Percentage {
    if (divisor === 0) {
      throw new InvalidPercentageException('Cannot divide by zero');
    }
    if (divisor < 0) {
      throw new InvalidPercentageException('Division divisor cannot be negative');
    }
    return new Percentage(this._value / divisor);
  }

  // Kenyan tax calculations
  applyVAT(): Percentage {
    // Kenyan VAT rate: 16%
    return this.multiply(0.16);
  }

  applyCapitalGainsTax(): Percentage {
    // Kenyan Capital Gains Tax: 15%
    return this.multiply(0.15);
  }

  applyWithholdingTax(): Percentage {
    // Kenyan Withholding Tax rate: varies, typically 10%
    return this.multiply(0.1);
  }

  // Business logic methods
  ofAmount(amount: number): number {
    return Percentage.round(amount * this.toFraction());
  }

  ofMoney(money: Money): Money {
    // Fix: Use Enum comparison instead of string literal
    if (money.currency !== Currency.KES) {
      console.warn('Applying Kenyan percentage to non-KES currency');
    }
    return money.multiply(this.toFraction());
  }

  isWholeNumber(): boolean {
    return this._value % 1 === 0;
  }

  isRounded(): boolean {
    const rounded = Percentage.round(this._value);
    return Math.abs(this._value - rounded) < 0.00001;
  }

  // Formatting
  format(decimalPlaces: number = 2): string {
    return `${this._value.toFixed(decimalPlaces)}%`;
  }

  formatForLegalDocument(): string {
    if (this.isWholeNumber()) {
      return `${this._value.toFixed(0)} per centum (${this._value}%)`;
    }
    return `${this._value.toFixed(3)} per centum (${this._value.toFixed(2)}%)`;
  }

  formatForCourt(): string {
    // Court documents require precise formatting
    const rounded = Percentage.round(this._value);
    if (rounded === this._value) {
      return `${this._value.toFixed(0)}%`;
    }
    return `${this._value.toFixed(3)}%`;
  }

  // Comparison methods
  isGreaterThan(other: Percentage): boolean {
    return this._value > other.value;
  }

  isLessThan(other: Percentage): boolean {
    return this._value < other.value;
  }

  isGreaterThanOrEqual(other: Percentage): boolean {
    return this._value >= other.value;
  }

  isLessThanOrEqual(other: Percentage): boolean {
    return this._value <= other.value;
  }

  equals(other: Percentage): boolean {
    const tolerance = 0.0001; // Tolerance for floating point comparison
    return Math.abs(this._value - other.value) < tolerance;
  }

  // For inheritance calculations
  getRemainingPercentage(): Percentage {
    return new Percentage(Percentage.MAX - this._value);
  }

  isValidForDistribution(): boolean {
    return this._value > 0 && this._value <= Percentage.MAX;
  }

  // Validation for estate distribution
  isValidForEstateDistribution(): { valid: boolean; reason?: string } {
    if (this._value <= 0) {
      return { valid: false, reason: 'Percentage must be greater than 0%' };
    }
    if (this._value > 100) {
      return { valid: false, reason: 'Percentage cannot exceed 100%' };
    }
    if (!this.isRounded()) {
      return { valid: false, reason: 'Percentage must be rounded to 4 decimal places' };
    }
    return { valid: true };
  }

  // Getters
  get value(): number {
    return this._value;
  }

  get precision(): number {
    return Percentage.PRECISION;
  }

  // For API responses
  toJSON() {
    return {
      value: this._value,
      formatted: this.format(),
      legalFormatted: this.formatForLegalDocument(),
      fraction: this.toFraction(),
      isWholeNumber: this.isWholeNumber(),
      isValidForDistribution: this.isValidForDistribution(),
      validation: this.isValidForEstateDistribution(),
    };
  }

  // Utility method for rounding errors in distribution
  static distributeRemainder(percentages: Percentage[], precision: number = 2): Percentage[] {
    const total = percentages.reduce((sum, p) => sum + p.value, 0);
    const remainder = 100 - total;

    if (Math.abs(remainder) < Math.pow(10, -precision)) {
      return percentages;
    }

    // Distribute remainder equally among percentages
    const adjusted = percentages.map(
      (p) => new Percentage(p.value + remainder / percentages.length),
    );

    return adjusted;
  }
}
