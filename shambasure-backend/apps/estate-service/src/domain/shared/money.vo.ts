// src/shared/domain/value-objects/money.vo.ts
import { ValueObject } from '../base/value-object';
import {
  AmountExceedsLimitException,
  CurrencyMismatchException,
  DivisionByZeroException,
  InvalidCurrencyException,
  InvalidExchangeRateException,
  InvalidKESAmountException,
  NegativeAmountException,
  NegativeMultiplicationFactorException,
} from '../exceptions/money.exception';

export enum Currency {
  KES = 'KES',
  USD = 'USD',
  GBP = 'GBP',
  EUR = 'EUR',
  UGX = 'UGX',
  TZS = 'TZS',
}

interface MoneyProps {
  amount: number;
  currency: Currency;
}

export class Money extends ValueObject<MoneyProps> {
  private static readonly MIN_AMOUNT = 0;
  private static readonly MAX_AMOUNT = 100_000_000_000; // 100 billion KES

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
      const hasDecimal = this._value.amount % 1 !== 0;
      if (hasDecimal) {
        // Allow only .00 for KES
        if (Math.round(this._value.amount * 100) % 100 !== 0) {
          throw new InvalidKESAmountException(this._value.amount);
        }
      }
    }
  }

  // ... (rest of the Money class remains the same, with updated exception usage)

  add(other: Money): Money {
    if (this._value.currency !== other.value.currency) {
      throw new CurrencyMismatchException(this._value.currency, other.value.currency);
    }
    return new Money({
      amount: this.round(this._value.amount + other.value.amount),
      currency: this._value.currency,
    });
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new NegativeMultiplicationFactorException(factor);
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

  convertTo(targetCurrency: Currency, exchangeRate: number): Money {
    if (exchangeRate <= 0) {
      throw new InvalidExchangeRateException(exchangeRate);
    }
    const convertedAmount = this._value.amount * exchangeRate;
    return new Money({
      amount: this.round(convertedAmount),
      currency: targetCurrency,
    });
  }
}
