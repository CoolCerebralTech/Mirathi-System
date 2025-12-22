// domain/value-objects/financial/kenyan-money.vo.ts
import { ValueObject, ValueObjectValidationError } from '../../base/value-object';

/**
 * Kenyan Money Value Object
 *
 * Represents money amounts in Kenyan Shillings (KES)
 *
 * PURPOSE:
 * - Type-safe money handling (no accidental string/number mixing)
 * - Precision handling (avoid floating point errors)
 * - Validation (no negative amounts in most contexts)
 * - Formatting (proper KES display)
 *
 * KENYAN CONTEXT:
 * - Currency: Kenyan Shilling (KES)
 * - Smallest unit: 1 cent = 0.01 KES (though rarely used)
 * - Common amounts: 10 KES, 50 KES, 100 KES, 1000 KES
 * - Large amounts: Millions and billions common in estates
 *
 * DESIGN:
 * - Store as integer cents (avoid floating point)
 * - Immutable operations (return new instances)
 * - Rich comparison methods
 */

interface KenyanMoneyProps {
  amountInCents: number; // Store as cents to avoid floating point errors
  currency: 'KES'; // Always KES for this system
}

export class KenyanMoney extends ValueObject<KenyanMoneyProps> {
  private constructor(props: KenyanMoneyProps) {
    super(props);
  }

  /**
   * Create from KES amount (e.g., 1000.50 KES)
   */
  public static create(amountInKES: number): KenyanMoney {
    // Convert to cents to avoid floating point errors
    const amountInCents = Math.round(amountInKES * 100);

    return new KenyanMoney({
      amountInCents,
      currency: 'KES',
    });
  }

  /**
   * Create from cents (for precision operations)
   */
  public static fromCents(cents: number): KenyanMoney {
    return new KenyanMoney({
      amountInCents: Math.round(cents),
      currency: 'KES',
    });
  }

  /**
   * Create zero amount
   */
  public static zero(): KenyanMoney {
    return KenyanMoney.create(0);
  }

  protected validate(): void {
    // Check for valid number
    if (!Number.isFinite(this.props.amountInCents)) {
      throw new ValueObjectValidationError('Money amount must be a finite number', 'amountInCents');
    }

    // Check for integer (no fractional cents)
    if (!Number.isInteger(this.props.amountInCents)) {
      throw new ValueObjectValidationError(
        'Money amount in cents must be an integer',
        'amountInCents',
      );
    }

    // Warn for very large amounts (> 10 billion KES)
    const amountInKES = this.props.amountInCents / 100;
    if (Math.abs(amountInKES) > 10_000_000_000) {
      console.warn(`Money amount ${this.formatKES()} is very large (>10 billion KES)`);
    }
  }

  // === GETTERS ===

  /**
   * Get amount in KES (e.g., 1000.50)
   */
  public getAmount(): number {
    return this.props.amountInCents / 100;
  }

  /**
   * Get amount in cents (for precision)
   */
  public getAmountInCents(): number {
    return this.props.amountInCents;
  }

  public get currency(): string {
    return this.props.currency;
  }

  // === COMPARISON METHODS ===

  /**
   * Check if zero
   */
  public isZero(): boolean {
    return this.props.amountInCents === 0;
  }

  /**
   * Check if positive
   */
  public isPositive(): boolean {
    return this.props.amountInCents > 0;
  }

  /**
   * Check if negative
   */
  public isNegative(): boolean {
    return this.props.amountInCents < 0;
  }

  /**
   * Compare with another amount
   */
  public isGreaterThan(other: KenyanMoney): boolean {
    return this.props.amountInCents > other.props.amountInCents;
  }

  public isGreaterThanOrEqual(other: KenyanMoney): boolean {
    return this.props.amountInCents >= other.props.amountInCents;
  }

  public isLessThan(other: KenyanMoney): boolean {
    return this.props.amountInCents < other.props.amountInCents;
  }

  public isLessThanOrEqual(other: KenyanMoney): boolean {
    return this.props.amountInCents <= other.props.amountInCents;
  }

  // === ARITHMETIC OPERATIONS (Return new instances) ===

  /**
   * Add two amounts
   */
  public add(other: KenyanMoney): KenyanMoney {
    return KenyanMoney.fromCents(this.props.amountInCents + other.props.amountInCents);
  }

  /**
   * Subtract amount
   */
  public subtract(other: KenyanMoney): KenyanMoney {
    return KenyanMoney.fromCents(this.props.amountInCents - other.props.amountInCents);
  }

  /**
   * Multiply by scalar
   */
  public multiply(multiplier: number): KenyanMoney {
    if (!Number.isFinite(multiplier)) {
      throw new ValueObjectValidationError('Multiplier must be a finite number', 'multiplier');
    }

    return KenyanMoney.fromCents(Math.round(this.props.amountInCents * multiplier));
  }

  /**
   * Divide by scalar
   */
  public divide(divisor: number): KenyanMoney {
    if (!Number.isFinite(divisor) || divisor === 0) {
      throw new ValueObjectValidationError('Divisor must be a finite non-zero number', 'divisor');
    }

    return KenyanMoney.fromCents(Math.round(this.props.amountInCents / divisor));
  }

  /**
   * Calculate percentage
   */
  public percentage(percent: number): KenyanMoney {
    if (percent < 0 || percent > 100) {
      throw new ValueObjectValidationError('Percentage must be between 0 and 100', 'percent');
    }

    return this.multiply(percent / 100);
  }

  /**
   * Get absolute value
   */
  public abs(): KenyanMoney {
    return KenyanMoney.fromCents(Math.abs(this.props.amountInCents));
  }

  /**
   * Negate (flip sign)
   */
  public negate(): KenyanMoney {
    return KenyanMoney.fromCents(-this.props.amountInCents);
  }

  // === FORMATTING ===

  /**
   * Format as KES with thousands separator
   * Example: "KES 1,234,567.89"
   */
  public formatKES(): string {
    const amount = this.getAmount();
    const formatted = amount.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `KES ${formatted}`;
  }

  /**
   * Format for display (without currency symbol)
   * Example: "1,234,567.89"
   */
  public formatAmount(): string {
    const amount = this.getAmount();
    return amount.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Format as compact (for large amounts)
   * Example: "KES 1.2M", "KES 3.5B"
   */
  public formatCompact(): string {
    const amount = this.getAmount();
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (absAmount >= 1_000_000_000) {
      return `${sign}KES ${(absAmount / 1_000_000_000).toFixed(1)}B`;
    }
    if (absAmount >= 1_000_000) {
      return `${sign}KES ${(absAmount / 1_000_000).toFixed(1)}M`;
    }
    if (absAmount >= 1_000) {
      return `${sign}KES ${(absAmount / 1_000).toFixed(1)}K`;
    }
    return this.formatKES();
  }

  // === UTILITY METHODS ===

  /**
   * Split amount into equal parts
   */
  public splitEqually(parts: number): KenyanMoney[] {
    if (!Number.isInteger(parts) || parts <= 0) {
      throw new ValueObjectValidationError('Parts must be a positive integer', 'parts');
    }

    const baseAmount = Math.floor(this.props.amountInCents / parts);
    const remainder = this.props.amountInCents % parts;

    const results: KenyanMoney[] = [];
    for (let i = 0; i < parts; i++) {
      // Distribute remainder across first N parts
      const amount = baseAmount + (i < remainder ? 1 : 0);
      results.push(KenyanMoney.fromCents(amount));
    }

    return results;
  }

  /**
   * Split by percentages (must sum to 100)
   */
  public splitByPercentages(percentages: number[]): KenyanMoney[] {
    const sum = percentages.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 100) > 0.01) {
      throw new ValueObjectValidationError('Percentages must sum to 100', 'percentages');
    }

    return percentages.map((pct) => this.percentage(pct));
  }

  /**
   * Round to nearest shilling (no cents)
   */
  public roundToShilling(): KenyanMoney {
    const rounded = Math.round(this.getAmount());
    return KenyanMoney.create(rounded);
  }

  // === STATIC OPERATIONS ===

  /**
   * Sum multiple amounts
   */
  public static sum(amounts: KenyanMoney[]): KenyanMoney {
    const totalCents = amounts.reduce((sum, amount) => sum + amount.props.amountInCents, 0);
    return KenyanMoney.fromCents(totalCents);
  }

  /**
   * Get maximum amount
   */
  public static max(...amounts: KenyanMoney[]): KenyanMoney {
    if (amounts.length === 0) {
      throw new ValueObjectValidationError('Cannot get max of empty array', 'amounts');
    }

    return amounts.reduce((max, current) => (current.isGreaterThan(max) ? current : max));
  }

  /**
   * Get minimum amount
   */
  public static min(...amounts: KenyanMoney[]): KenyanMoney {
    if (amounts.length === 0) {
      throw new ValueObjectValidationError('Cannot get min of empty array', 'amounts');
    }

    return amounts.reduce((min, current) => (current.isLessThan(min) ? current : min));
  }

  /**
   * Calculate average
   */
  public static average(amounts: KenyanMoney[]): KenyanMoney {
    if (amounts.length === 0) {
      throw new ValueObjectValidationError('Cannot average empty array', 'amounts');
    }

    const sum = KenyanMoney.sum(amounts);
    return sum.divide(amounts.length);
  }

  // === SERIALIZATION ===

  public toJSON(): Record<string, any> {
    return {
      amount: this.getAmount(),
      amountInCents: this.props.amountInCents,
      currency: this.props.currency,
      formatted: this.formatKES(),
      compact: this.formatCompact(),
    };
  }

  public toString(): string {
    return this.formatKES();
  }
}
