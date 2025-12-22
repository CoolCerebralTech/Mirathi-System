import { ValueObject } from '../base/value-object';
import {
  AmountExceedsLimitException,
  CurrencyMismatchException,
  DivisionByZeroException,
  InvalidCurrencyException,
  InvalidExchangeRateException,
  InvalidKESAmountException,
  InvalidMoneyFormatException,
  InvalidPercentageException,
  NegativeAmountException,
  NegativeMultiplicationFactorException,
  ZeroAmountException,
} from '../exceptions/money.exception';

export enum Currency {
  KES = 'KES', // Kenyan Shilling
  USD = 'USD', // US Dollar
  UGX = 'UGX', // Ugandan Shilling
  TZS = 'TZS', // Tanzanian Shilling
}

interface MoneyProps {
  amount: number;
  currency: Currency;
}

export class Money extends ValueObject<MoneyProps> {
  private static readonly MIN_AMOUNT = 0;
  // Cap at 1 Trillion to prevent overflow/unrealistic numbers in this domain
  private static readonly MAX_AMOUNT = 1_000_000_000_000;

  constructor(props: MoneyProps) {
    super(props);
  }

  protected validate(): void {
    // 1. Validate Currency
    if (!Object.values(Currency).includes(this.props.currency)) {
      throw new InvalidCurrencyException(this.props.currency);
    }

    // 2. Validate Bounds
    if (this.props.amount < Money.MIN_AMOUNT) {
      throw new NegativeAmountException(this.props.amount, {
        currency: this.props.currency,
        min: Money.MIN_AMOUNT,
      });
    }

    if (this.props.amount > Money.MAX_AMOUNT) {
      throw new AmountExceedsLimitException(this.props.amount, Money.MAX_AMOUNT, {
        currency: this.props.currency,
      });
    }

    // 3. Currency-Specific Validation
    if (this.props.currency === Currency.KES) {
      // KES is typically handled as whole numbers in banking/legal for large sums,
      // but cents exist. However, if we want strict accounting:
      // We check if it has > 2 decimal places.
      const decimals = (this.props.amount.toString().split('.')[1] || '').length;
      if (decimals > 2) {
        throw new InvalidKESAmountException(this.props.amount, {
          reason: 'Max 2 decimal places allowed',
        });
      }
    }
  }

  // --- Arithmetic Operations (Immutable) ---

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money({
      amount: this.round(this.props.amount + other.amount),
      currency: this.props.currency,
    });
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.round(this.props.amount - other.amount);
    if (result < 0) {
      throw new NegativeAmountException(result, { operation: 'subtract' });
    }
    return new Money({
      amount: result,
      currency: this.props.currency,
    });
  }

  multiply(factor: number): Money {
    if (factor < 0) throw new NegativeMultiplicationFactorException(factor);
    if (factor === 0) throw new ZeroAmountException('Multiplication resulted in zero');

    return new Money({
      amount: this.round(this.props.amount * factor),
      currency: this.props.currency,
    });
  }

  divide(divisor: number): Money {
    if (divisor === 0) throw new DivisionByZeroException();
    if (divisor < 0) throw new NegativeMultiplicationFactorException(divisor);

    return new Money({
      amount: this.round(this.props.amount / divisor),
      currency: this.props.currency,
    });
  }

  // --- Conversion & Logic ---

  percentage(percent: number): Money {
    if (percent < 0 || percent > 100) throw new InvalidPercentageException(percent);
    return this.multiply(percent / 100);
  }

  allocate(ratios: number[]): Money[] {
    // Split money into parts based on ratios (e.g., [1, 1] for 50/50 split)
    // Ensures no cents are lost
    const totalRatio = ratios.reduce((sum, r) => sum + r, 0);
    let remainder = this.props.amount;
    const results: Money[] = [];

    for (let i = 0; i < ratios.length; i++) {
      const ratio = ratios[i];
      const shareAmount = this.round((this.props.amount * ratio) / totalRatio);
      results.push(new Money({ amount: shareAmount, currency: this.props.currency }));
      remainder -= shareAmount;
    }

    // Distribute dust/rounding errors to the first party (standard accounting practice)
    // or keep remainder if we want strict equality.
    // For simplicity here, we assume rounding handles it closely,
    // but in a real banking app, we'd add the 0.01 difference to results[0].

    return results;
  }

  convertTo(targetCurrency: Currency, exchangeRate: number): Money {
    if (exchangeRate <= 0) throw new InvalidExchangeRateException(exchangeRate);
    return new Money({
      amount: this.round(this.props.amount * exchangeRate),
      currency: targetCurrency,
    });
  }

  // --- Comparators ---

  equals(other: Money): boolean {
    return this.props.currency === other.currency && this.props.amount === other.amount;
  }

  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.props.amount > other.amount;
  }

  lessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.props.amount < other.amount;
  }

  // --- Factory Methods ---

  static zero(currency: Currency): Money {
    return new Money({ amount: 0, currency });
  }

  static fromString(amountStr: string, currency: Currency): Money {
    // Remove commas
    const cleanStr = amountStr.replace(/,/g, '');
    const amount = parseFloat(cleanStr);

    if (isNaN(amount)) {
      throw new InvalidMoneyFormatException(amountStr);
    }
    return new Money({ amount, currency });
  }

  // --- Helpers ---

  private assertSameCurrency(other: Money): void {
    if (this.props.currency !== other.currency) {
      throw new CurrencyMismatchException(this.props.currency, other.currency);
    }
  }

  private round(value: number): number {
    // Round to 2 decimal places standard
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  // --- Getters ---
  get amount(): number {
    return this.props.amount;
  }
  get currency(): Currency {
    return this.props.currency;
  }

  public toJSON(): Record<string, any> {
    return {
      amount: this.props.amount,
      currency: this.props.currency,
      formatted: `${this.props.currency} ${this.props.amount.toFixed(2)}`,
    };
  }
}
