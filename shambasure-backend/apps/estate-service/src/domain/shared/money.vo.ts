// src/shared/domain/value-objects/money.vo.ts
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
  GBP = 'GBP', // British Pound
  EUR = 'EUR', // Euro
  UGX = 'UGX', // Ugandan Shilling
  TZS = 'TZS', // Tanzanian Shilling
  ETB = 'ETB', // Ethiopian Birr
  ZAR = 'ZAR', // South African Rand
  RWF = 'RWF', // Rwandan Franc
}

interface MoneyProps {
  amount: number;
  currency: Currency;
}

export class Money extends ValueObject<MoneyProps> {
  private static readonly MIN_AMOUNT = 0;
  private static readonly MAX_AMOUNT = 1_000_000_000_000; // 1 trillion
  private static readonly KES_ROUNDING_PRECISION = 0; // KES rounds to whole shillings
  private static readonly OTHER_CURRENCY_PRECISION = 2; // Other currencies to 2 decimals

  constructor(props: MoneyProps) {
    super(props);
  }

  protected validate(): void {
    if (this._value.amount < Money.MIN_AMOUNT) {
      throw new NegativeAmountException(this._value.amount, {
        currency: this._value.currency,
        minAmount: Money.MIN_AMOUNT,
      });
    }

    if (this._value.amount > Money.MAX_AMOUNT) {
      throw new AmountExceedsLimitException(this._value.amount, Money.MAX_AMOUNT, {
        currency: this._value.currency,
        maxAmount: Money.MAX_AMOUNT,
      });
    }

    if (!Object.values(Currency).includes(this._value.currency)) {
      throw new InvalidCurrencyException(this._value.currency);
    }

    // Kenyan specific validation: KES amounts should be whole numbers
    if (this._value.currency === Currency.KES) {
      const hasDecimals = this._value.amount % 1 !== 0;
      if (hasDecimals) {
        // Check if it's just .00 (allowable for accounting)
        const cents = Math.round((this._value.amount % 1) * 100);
        if (cents !== 0) {
          throw new InvalidKESAmountException(this._value.amount);
        }
      }
    }
  }

  // Rounding utility
  private round(amount: number): number {
    const precision =
      this._value.currency === Currency.KES
        ? Money.KES_ROUNDING_PRECISION
        : Money.OTHER_CURRENCY_PRECISION;

    const factor = Math.pow(10, precision);
    return Math.round(amount * factor) / factor;
  }

  // Arithmetic operations
  add(other: Money): Money {
    if (this._value.currency !== other.value.currency) {
      throw new CurrencyMismatchException(this._value.currency, other.value.currency);
    }
    const newAmount = this.round(this._value.amount + other.value.amount);
    return new Money({
      amount: newAmount,
      currency: this._value.currency,
    });
  }

  subtract(other: Money): Money {
    if (this._value.currency !== other.value.currency) {
      throw new CurrencyMismatchException(this._value.currency, other.value.currency);
    }
    const newAmount = this.round(this._value.amount - other.value.amount);
    if (newAmount < 0) {
      throw new NegativeAmountException(newAmount, {
        currency: this._value.currency,
        operation: 'subtraction',
      });
    }
    return new Money({
      amount: newAmount,
      currency: this._value.currency,
    });
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new NegativeMultiplicationFactorException(factor);
    }
    if (factor === 0) {
      throw new ZeroAmountException('Multiplication by zero results in zero amount');
    }
    return new Money({
      amount: this.round(this._value.amount * factor),
      currency: this._value.currency,
    });
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new DivisionByZeroException();
    }
    if (divisor < 0) {
      throw new NegativeMultiplicationFactorException(divisor);
    }
    return new Money({
      amount: this.round(this._value.amount / divisor),
      currency: this._value.currency,
    });
  }

  percentage(percent: number): Money {
    if (percent < 0 || percent > 100) {
      throw new InvalidPercentageException(percent);
    }
    return this.multiply(percent / 100);
  }

  convertTo(targetCurrency: Currency, exchangeRate: number): Money {
    if (exchangeRate <= 0) {
      throw new InvalidExchangeRateException(exchangeRate);
    }
    const convertedAmount = this.round(this._value.amount * exchangeRate);
    return new Money({
      amount: convertedAmount,
      currency: targetCurrency,
    });
  }

  // Comparison operations
  equals(other: Money): boolean {
    return (
      this._value.currency === other.value.currency &&
      Math.abs(this._value.amount - other.value.amount) < 0.001
    );
  }

  greaterThan(other: Money): boolean {
    if (this._value.currency !== other.value.currency) {
      throw new CurrencyMismatchException(this._value.currency, other.value.currency);
    }
    return this._value.amount > other.value.amount;
  }

  lessThan(other: Money): boolean {
    if (this._value.currency !== other.value.currency) {
      throw new CurrencyMismatchException(this._value.currency, other.value.currency);
    }
    return this._value.amount < other.value.amount;
  }

  // Factory methods
  static zero(currency: Currency): Money {
    return new Money({ amount: 0, currency });
  }

  static fromString(amountStr: string, currency: Currency): Money {
    const amount = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(amount)) {
      throw new InvalidMoneyFormatException(amountStr);
    }
    return new Money({ amount, currency });
  }

  // Formatting
  format(locale: string = 'en-KE'): string {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this._value.currency,
      minimumFractionDigits: this._value.currency === Currency.KES ? 0 : 2,
      maximumFractionDigits: this._value.currency === Currency.KES ? 0 : 2,
    });
    return formatter.format(this._value.amount);
  }

  getKesEquivalent(conversionRate: number = 1): Money {
    if (this._value.currency === Currency.KES) {
      return this;
    }
    return this.convertTo(Currency.KES, conversionRate);
  }

  // Business logic for Kenyan succession
  getStampDutyAmount(): Money {
    // Stamp duty rates in Kenya (simplified - actual rates vary by property type/value)
    if (this._value.currency !== Currency.KES) {
      throw new CurrencyMismatchException(this._value.currency, Currency.KES);
    }

    const amount = this._value.amount;
    let stampDuty = 0;

    if (amount <= 100000) {
      stampDuty = amount * 0.01; // 1%
    } else if (amount <= 500000) {
      stampDuty = 1000 + (amount - 100000) * 0.02; // 2%
    } else {
      stampDuty = 9000 + (amount - 500000) * 0.03; // 3%
    }

    return new Money({
      amount: this.round(stampDuty),
      currency: Currency.KES,
    });
  }

  getCapitalGainsTaxAmount(): Money {
    // CGT in Kenya is 15% of gain (simplified)
    if (this._value.currency !== Currency.KES) {
      throw new CurrencyMismatchException(this._value.currency, Currency.KES);
    }

    const cgt = this._value.amount * 0.15; // 15% CGT
    return new Money({
      amount: this.round(cgt),
      currency: Currency.KES,
    });
  }

  // Getters
  get amount(): number {
    return this._value.amount;
  }

  get currency(): Currency {
    return this._value.currency;
  }

  get isZero(): boolean {
    return this._value.amount === 0;
  }

  get isPositive(): boolean {
    return this._value.amount > 0;
  }
}
