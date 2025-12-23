// domain/value-objects/money.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Money Value Object - Kenyan Shillings (KES)
 *
 * CRITICAL: Prevents floating-point arithmetic errors in legal calculations
 *
 * Legal Requirements:
 * - Estate valuations must be precise (S.83 LSA - executor accountability)
 * - Currency must be KES (Law of Succession Act is Kenyan jurisdiction)
 * - Negative values allowed only for debts/liabilities
 * - All calculations maintain 2 decimal precision
 *
 * Design Pattern: Store as integer cents (100 cents = 1 KES)
 * This prevents: 0.1 + 0.2 = 0.30000000000000004
 */

interface MoneyProps {
  amountInCents: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  private static readonly CURRENCY = 'KES';
  private static readonly CENTS_PER_UNIT = 100;

  private constructor(props: MoneyProps) {
    super(props);
  }

  /**
   * Create Money from KES amount (e.g., 1000.50 KES)
   */
  public static fromKES(amount: number): Money {
    if (!Number.isFinite(amount)) {
      throw new ValueObjectValidationError('Amount must be a finite number', 'amount');
    }

    // Round to 2 decimal places, convert to cents
    const amountInCents = Math.round(amount * this.CENTS_PER_UNIT);

    return new Money({
      amountInCents,
      currency: this.CURRENCY,
    });
  }

  /**
   * Create Money from cents (internal use)
   */
  public static fromCents(cents: number): Money {
    if (!Number.isInteger(cents)) {
      throw new ValueObjectValidationError('Cents must be an integer', 'cents');
    }

    return new Money({
      amountInCents: cents,
      currency: this.CURRENCY,
    });
  }

  /**
   * Zero money (useful for initializations)
   */
  public static zero(): Money {
    return new Money({
      amountInCents: 0,
      currency: this.CURRENCY,
    });
  }

  protected validate(): void {
    if (!Number.isInteger(this.props.amountInCents)) {
      throw new ValueObjectValidationError('Amount in cents must be an integer');
    }

    if (this.props.currency !== Money.CURRENCY) {
      throw new ValueObjectValidationError(
        `Only KES currency supported. Got: ${this.props.currency}`,
        'currency',
      );
    }
  }

  /**
   * Get amount in KES (decimal format)
   */
  public getAmount(): number {
    return this.props.amountInCents / Money.CENTS_PER_UNIT;
  }

  /**
   * Get amount in cents (integer)
   */
  public getCents(): number {
    return this.props.amountInCents;
  }

  /**
   * Get currency code
   */
  public getCurrency(): string {
    return this.props.currency;
  }

  /**
   * Check if positive (for assets)
   */
  public isPositive(): boolean {
    return this.props.amountInCents > 0;
  }

  /**
   * Check if negative (for debts)
   */
  public isNegative(): boolean {
    return this.props.amountInCents < 0;
  }

  /**
   * Check if zero
   */
  public isZero(): boolean {
    return this.props.amountInCents === 0;
  }

  /**
   * Add money (returns new Money instance)
   */
  public add(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.fromCents(this.props.amountInCents + other.props.amountInCents);
  }

  /**
   * Subtract money (returns new Money instance)
   */
  public subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.fromCents(this.props.amountInCents - other.props.amountInCents);
  }

  /**
   * Multiply by scalar (for percentage calculations)
   */
  public multiply(multiplier: number): Money {
    if (!Number.isFinite(multiplier)) {
      throw new ValueObjectValidationError('Multiplier must be finite', 'multiplier');
    }

    const result = Math.round(this.props.amountInCents * multiplier);
    return Money.fromCents(result);
  }

  /**
   * Divide by scalar
   */
  public divide(divisor: number): Money {
    if (divisor === 0) {
      throw new ValueObjectValidationError('Cannot divide by zero', 'divisor');
    }

    if (!Number.isFinite(divisor)) {
      throw new ValueObjectValidationError('Divisor must be finite', 'divisor');
    }

    const result = Math.round(this.props.amountInCents / divisor);
    return Money.fromCents(result);
  }

  /**
   * Calculate percentage (for inheritance shares)
   * Example: estate.netValue.percentage(20) = 20% of estate
   */
  public percentage(percent: number): Money {
    if (percent < 0 || percent > 100) {
      throw new ValueObjectValidationError('Percentage must be between 0 and 100', 'percent');
    }

    return this.multiply(percent / 100);
  }

  /**
   * Allocate money proportionally (for S.35/S.40 distribution)
   * Example: allocate 100,000 KES among [30%, 40%, 30%] = [30k, 40k, 30k]
   * Handles remainder by giving to first beneficiary (legal precedent)
   */
  public allocate(ratios: number[]): Money[] {
    if (ratios.length === 0) {
      throw new ValueObjectValidationError('Ratios array cannot be empty');
    }

    const totalRatio = ratios.reduce((sum, ratio) => sum + ratio, 0);
    if (totalRatio === 0) {
      throw new ValueObjectValidationError('Total ratio cannot be zero');
    }

    const results: Money[] = [];
    let remainder = this.props.amountInCents;

    for (let i = 0; i < ratios.length; i++) {
      const isLast = i === ratios.length - 1;

      if (isLast) {
        // Give all remainder to last beneficiary (avoids rounding errors)
        results.push(Money.fromCents(remainder));
      } else {
        const share = Math.floor((this.props.amountInCents * ratios[i]) / totalRatio);
        results.push(Money.fromCents(share));
        remainder -= share;
      }
    }

    return results;
  }

  /**
   * Compare money amounts
   */
  public greaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.props.amountInCents > other.props.amountInCents;
  }

  public greaterThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.props.amountInCents >= other.props.amountInCents;
  }

  public lessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.props.amountInCents < other.props.amountInCents;
  }

  public lessThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.props.amountInCents <= other.props.amountInCents;
  }

  /**
   * Absolute value (for debt calculations)
   */
  public abs(): Money {
    return Money.fromCents(Math.abs(this.props.amountInCents));
  }

  /**
   * Negate (convert asset to liability or vice versa)
   */
  public negate(): Money {
    return Money.fromCents(-this.props.amountInCents);
  }

  /**
   * Sum array of Money instances
   */
  public static sum(amounts: Money[]): Money {
    if (amounts.length === 0) {
      return Money.zero();
    }

    return amounts.reduce((sum, amount) => sum.add(amount), Money.zero());
  }

  /**
   * Format for display (e.g., "KES 1,234,567.89")
   */
  public format(): string {
    const amount = this.getAmount();
    const formatted = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return formatted;
  }

  /**
   * Format for legal documents (no currency symbol)
   */
  public formatForLegal(): string {
    const amount = this.getAmount();
    return amount.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private ensureSameCurrency(other: Money): void {
    if (this.props.currency !== other.props.currency) {
      throw new ValueObjectValidationError(
        `Currency mismatch: ${this.props.currency} vs ${other.props.currency}`,
        'currency',
      );
    }
  }

  public toJSON(): Record<string, any> {
    return {
      amount: this.getAmount(),
      currency: this.props.currency,
      amountInCents: this.props.amountInCents,
    };
  }

  public toString(): string {
    return this.format();
  }
}
