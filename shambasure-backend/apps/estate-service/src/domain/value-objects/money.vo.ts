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
 * - Amounts must be non-negative (cannot have negative inheritance)
 * - Currency must be valid Kenyan currency (KES, USD, EUR)
 * - Precision up to 2 decimal places for financial accuracy
 * - Immutable for audit trail
 */
export class Money extends ValueObject<MoneyProps> {
  private static readonly VALID_CURRENCIES = ['KES', 'USD', 'EUR', 'GBP'];
  private static readonly MAX_DECIMALS = 2;

  constructor(props: MoneyProps) {
    super(props);
  }

  protected validate(): void {
    // Amount must be non-negative
    if (this.props.amount < 0) {
      throw new ValueObjectValidationError('Money amount cannot be negative', 'amount');
    }

    // Currency must be valid
    if (!Money.VALID_CURRENCIES.includes(this.props.currency)) {
      throw new ValueObjectValidationError(
        `Invalid currency: ${this.props.currency}. Valid currencies are: ${Money.VALID_CURRENCIES.join(', ')}`,
        'currency',
      );
    }

    // Check for excessive decimal places
    const decimalPlaces = (this.props.amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > Money.MAX_DECIMALS) {
      throw new ValueObjectValidationError(
        `Amount can have at most ${Money.MAX_DECIMALS} decimal places`,
        'amount',
      );
    }
  }

  /**
   * Add two money amounts (same currency only)
   */
  public add(other: Money): Money {
    if (this.props.currency !== other.props.currency) {
      throw new Error('Cannot add money with different currencies');
    }

    return new Money({
      amount: this.props.amount + other.props.amount,
      currency: this.props.currency,
    });
  }

  /**
   * Subtract two money amounts (same currency only)
   */
  public subtract(other: Money): Money {
    if (this.props.currency !== other.props.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }

    const newAmount = this.props.amount - other.props.amount;
    if (newAmount < 0) {
      throw new Error('Resulting amount cannot be negative');
    }

    return new Money({
      amount: newAmount,
      currency: this.props.currency,
    });
  }

  /**
   * Multiply by a factor (for percentage calculations)
   */
  public multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Multiplication factor cannot be negative');
    }

    const newAmount = this.props.amount * factor;
    // Round to 2 decimal places for financial accuracy
    const roundedAmount = Math.round(newAmount * 100) / 100;

    return new Money({
      amount: roundedAmount,
      currency: this.props.currency,
    });
  }

  /**
   * Compare with another money value
   */
  public equals(other: Money): boolean {
    return this.props.amount === other.props.amount && this.props.currency === other.props.currency;
  }

  /**
   * Check if this amount is greater than another
   */
  public isGreaterThan(other: Money): boolean {
    if (this.props.currency !== other.props.currency) {
      throw new Error('Cannot compare money with different currencies');
    }

    return this.props.amount > other.props.amount;
  }

  /**
   * Get formatted string for display
   */
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

  // Static factory methods
  public static fromKES(amount: number): Money {
    return new Money({ amount, currency: 'KES' });
  }

  public static zero(currency: string = 'KES'): Money {
    return new Money({ amount: 0, currency });
  }
}
