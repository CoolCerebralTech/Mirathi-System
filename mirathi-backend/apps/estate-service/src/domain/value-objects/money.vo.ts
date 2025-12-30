// src/estate-service/src/domain/value-objects/money.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

export interface MoneyProps {
  amount: number;
  currency: string;
}

/**
 * Money Value Object
 *
 * Kenyan Legal Requirements:
 * - Amounts must be non-negative (cannot have negative inheritance).
 * - Currency must be valid (KES default).
 * - Precision up to 2 decimal places.
 */
export class MoneyVO extends ValueObject<MoneyProps> {
  private static readonly VALID_CURRENCIES = ['KES', 'USD', 'EUR', 'GBP'];
  private static readonly MAX_DECIMALS = 2;

  constructor(props: MoneyProps) {
    super(props);
  }

  // ===========================================================================
  // PUBLIC GETTERS
  // ===========================================================================
  /**
   * Get the minimum of two amounts
   */
  public static min(a: MoneyVO, b: MoneyVO): MoneyVO {
    if (a.currency !== b.currency) {
      throw new Error('Cannot compare money in different currencies');
    }
    return a.isLessThan(b) ? a : b;
  }
  public static create(props: MoneyProps): MoneyVO {
    return new MoneyVO(props);
  }
  /**
   * Get the maximum of two amounts
   */
  public static max(a: MoneyVO, b: MoneyVO): MoneyVO {
    if (a.currency !== b.currency) {
      throw new Error('Cannot compare money in different currencies');
    }
    return a.isGreaterThan(b) ? a : b;
  }
  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  // ===========================================================================
  // VALIDATION & LOGIC
  // ===========================================================================

  protected validate(): void {
    if (this.props.amount < 0) {
      throw new ValueObjectValidationError('Money amount cannot be negative', 'amount');
    }

    if (!MoneyVO.VALID_CURRENCIES.includes(this.props.currency)) {
      throw new ValueObjectValidationError(
        `Invalid currency: ${this.props.currency}. Valid currencies: ${MoneyVO.VALID_CURRENCIES.join(', ')}`,
        'currency',
      );
    }

    const decimalPlaces = (this.props.amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > MoneyVO.MAX_DECIMALS) {
      throw new ValueObjectValidationError(
        `Amount can have at most ${MoneyVO.MAX_DECIMALS} decimal places`,
        'amount',
      );
    }
  }
  /**
   * Check if this amount is less than another amount
   */
  public isLessThan(other: MoneyVO): boolean {
    this.assertSameCurrency(other);
    return this.props.amount < other.props.amount;
  }

  /**
   * Check if this amount is less than or equal to another amount
   */
  public isLessThanOrEqual(other: MoneyVO): boolean {
    this.assertSameCurrency(other);
    return this.props.amount <= other.props.amount;
  }

  /**
   * Check if this amount is greater than or equal to another amount
   */
  public isGreaterThanOrEqual(other: MoneyVO): boolean {
    this.assertSameCurrency(other);
    return this.props.amount >= other.props.amount;
  }

  /**
   * Check if amount is positive (greater than zero)
   */
  public isPositive(): boolean {
    return this.props.amount > 0;
  }

  /**
   * Check if amount is negative
   */
  public isNegative(): boolean {
    return this.props.amount < 0;
  }

  public add(other: MoneyVO): MoneyVO {
    this.assertSameCurrency(other);
    return new MoneyVO({
      amount: this.round(this.props.amount + other.props.amount),
      currency: this.props.currency,
    });
  }

  public subtract(other: MoneyVO): MoneyVO {
    this.assertSameCurrency(other);
    const newAmount = this.round(this.props.amount - other.props.amount);
    if (newAmount < 0) {
      throw new Error('Resulting amount cannot be negative (Estate cannot be in negative value)');
    }
    return new MoneyVO({
      amount: newAmount,
      currency: this.props.currency,
    });
  }

  public multiply(factor: number): MoneyVO {
    if (factor < 0) throw new Error('Multiplication factor cannot be negative');
    return new MoneyVO({
      amount: this.round(this.props.amount * factor),
      currency: this.props.currency,
    });
  }

  /**
   * Allocates money into ratios without losing cents.
   * e.g., 100 KES split 3 ways -> [33.34, 33.33, 33.33]
   */
  public allocate(ratios: number[]): MoneyVO[] {
    const totalRatio = ratios.reduce((sum, r) => sum + r, 0);
    const totalCents = Math.round(this.props.amount * 100);

    let remainder = totalCents;
    const results: number[] = [];

    for (let i = 0; i < ratios.length; i++) {
      const share = Math.floor((totalCents * ratios[i]) / totalRatio);
      results.push(share);
      remainder -= share;
    }

    for (let i = 0; i < remainder; i++) {
      results[i] += 1;
    }

    return results.map(
      (cents) =>
        new MoneyVO({
          amount: cents / 100,
          currency: this.props.currency,
        }),
    );
  }

  public equals(other: MoneyVO): boolean {
    return this.props.amount === other.props.amount && this.props.currency === other.props.currency;
  }

  public isGreaterThan(other: MoneyVO): boolean {
    this.assertSameCurrency(other);
    return this.props.amount > other.props.amount;
  }

  public isZero(): boolean {
    return this.props.amount === 0;
  }

  public toString(): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: this.props.currency,
    }).format(this.props.amount);
  }

  public toJSON(): Record<string, any> {
    return {
      amount: this.props.amount,
      currency: this.props.currency,
      formatted: this.toString(),
    };
  }

  private assertSameCurrency(other: MoneyVO): void {
    if (this.props.currency !== other.props.currency) {
      throw new Error(
        `Currency mismatch: Cannot operate ${this.props.currency} with ${other.props.currency}`,
      );
    }
  }

  private round(val: number): number {
    return Math.round(val * 100) / 100;
  }

  public static fromKES(amount: number): MoneyVO {
    return new MoneyVO({ amount, currency: 'KES' });
  }

  public static createKES(amount: number): MoneyVO {
    return new MoneyVO({ amount, currency: 'KES' });
  }

  public static zero(currency: string = 'KES'): MoneyVO {
    return new MoneyVO({ amount: 0, currency });
  }
  /**
   * Check if amount is within range (inclusive)
   */
  public isBetween(min: MoneyVO, max: MoneyVO): boolean {
    this.assertSameCurrency(min);
    this.assertSameCurrency(max);
    return this.props.amount >= min.amount && this.props.amount <= max.amount;
  }

  /**
   * Calculate percentage difference from another amount
   */
  public percentageDifferenceFrom(other: MoneyVO): number {
    this.assertSameCurrency(other);
    if (other.amount === 0) return Infinity;
    return ((this.props.amount - other.amount) / other.amount) * 100;
  }
}
