// src/shared/domain/value-objects/currency-conversion.vo.ts
import { ValueObject } from '../base/value-object';
import {
  CurrencyConversionExpiredException,
  InvalidCurrencyConversionException,
  InvalidExchangeRateException,
  UnsupportedCurrencyPairException,
} from '../exceptions/currency-conversion.exception';
import { Currency, Money } from './money.vo';

export interface ExchangeRate {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  inverseRate: number;
  source: 'CENTRAL_BANK' | 'COMMERCIAL_BANK' | 'FOREX_BUREAU' | 'API';
  timestamp: Date;
  validUntil?: Date;
  margin?: number; // Spread percentage
}

export interface CurrencyConversionProps {
  amount: Money;
  exchangeRate: ExchangeRate;
  convertedAmount: Money;
  conversionDate: Date;
  conversionFee?: Money;
  purpose?: string;
  referenceNumber?: string;
}

export class CurrencyConversion extends ValueObject<CurrencyConversionProps> {
  constructor(props: CurrencyConversionProps) {
    super(props);
  }

  protected validate(): void {
    this.validateExchangeRate();
    this.validateConversion();
    this.validateAmounts();
  }

  private validateExchangeRate(): void {
    const { exchangeRate } = this._value;

    if (exchangeRate.rate <= 0) {
      throw new InvalidExchangeRateException(exchangeRate.rate, { exchangeRate });
    }

    if (exchangeRate.inverseRate <= 0) {
      throw new InvalidExchangeRateException(exchangeRate.inverseRate, {
        exchangeRate,
        type: 'inverse',
      });
    }

    // Check if rate is expired
    if (exchangeRate.validUntil && exchangeRate.validUntil < new Date()) {
      throw new CurrencyConversionExpiredException(exchangeRate.validUntil, { exchangeRate });
    }

    // Validate currency pair
    if (exchangeRate.fromCurrency === exchangeRate.toCurrency) {
      throw new UnsupportedCurrencyPairException(
        exchangeRate.fromCurrency,
        exchangeRate.toCurrency,
        { exchangeRate },
      );
    }
  }

  private validateConversion(): void {
    const { amount, exchangeRate, convertedAmount } = this._value;

    // Verify converted amount matches expected calculation
    const expectedAmount = amount.amount * exchangeRate.rate;
    const tolerance = 0.01; // 1 cent tolerance

    if (Math.abs(convertedAmount.amount - expectedAmount) > tolerance) {
      throw new InvalidCurrencyConversionException(
        `Converted amount ${convertedAmount.amount} doesn't match expected ${expectedAmount}`,
        'convertedAmount',
        {
          amount: amount.amount,
          rate: exchangeRate.rate,
          expectedAmount,
          actualAmount: convertedAmount.amount,
        },
      );
    }

    // Verify currency matches
    if (convertedAmount.currency !== exchangeRate.toCurrency) {
      throw new InvalidCurrencyConversionException(
        `Converted amount currency ${convertedAmount.currency} doesn't match target currency ${exchangeRate.toCurrency}`,
        'convertedAmount',
        { expectedCurrency: exchangeRate.toCurrency, actualCurrency: convertedAmount.currency },
      );
    }
  }

  private validateAmounts(): void {
    if (this._value.conversionFee) {
      if (this._value.conversionFee.currency !== this._value.convertedAmount.currency) {
        throw new InvalidCurrencyConversionException(
          `Conversion fee currency ${this._value.conversionFee.currency} doesn't match converted amount currency ${this._value.convertedAmount.currency}`,
          'conversionFee',
        );
      }
    }
  }

  // Factory methods
  static convert(
    amount: Money,
    toCurrency: Currency,
    exchangeRate: number,
    source: ExchangeRate['source'] = 'CENTRAL_BANK',
    conversionFee?: Money,
    purpose?: string,
  ): CurrencyConversion {
    const exchangeRateObj: ExchangeRate = {
      fromCurrency: amount.currency,
      toCurrency,
      rate: exchangeRate,
      inverseRate: 1 / exchangeRate,
      source,
      timestamp: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
    };

    const convertedAmount = new Money({
      amount: amount.amount * exchangeRate,
      currency: toCurrency,
    });

    return new CurrencyConversion({
      amount,
      exchangeRate: exchangeRateObj,
      convertedAmount,
      conversionDate: new Date(),
      conversionFee,
      purpose,
    });
  }

  static convertKESToUSD(
    kesAmount: number,
    usdRate: number,
    source: ExchangeRate['source'] = 'CENTRAL_BANK',
  ): CurrencyConversion {
    const amount = Money.fromKES(kesAmount);
    return CurrencyConversion.convert(amount, Currency.USD, usdRate, source);
  }

  static convertUSDToKES(
    usdAmount: number,
    kesRate: number,
    source: ExchangeRate['source'] = 'CENTRAL_BANK',
  ): CurrencyConversion {
    const amount = Money.fromUSD(usdAmount);
    return CurrencyConversion.convert(amount, Currency.KES, kesRate, source);
  }

  // Business logic methods
  getNetAmount(): Money {
    if (!this._value.conversionFee) {
      return this._value.convertedAmount;
    }

    return this._value.convertedAmount.subtract(this._value.conversionFee);
  }

  getEffectiveRate(): number {
    const grossAmount = this._value.convertedAmount.amount;
    const netAmount = this.getNetAmount().amount;

    return netAmount / this._value.amount.amount;
  }

  getMarginPercentage(): number {
    const effectiveRate = this.getEffectiveRate();
    const quotedRate = this._value.exchangeRate.rate;

    return ((quotedRate - effectiveRate) / quotedRate) * 100;
  }

  isKESConversion(): boolean {
    return (
      this._value.amount.currency === Currency.KES ||
      this._value.convertedAmount.currency === Currency.KES
    );
  }

  isFavorableRate(comparedTo: ExchangeRate): boolean {
    return this._value.exchangeRate.rate > comparedTo.rate;
  }

  // Reverse conversion
  reverseConvert(): CurrencyConversion {
    const reverseRate: ExchangeRate = {
      fromCurrency: this._value.exchangeRate.toCurrency,
      toCurrency: this._value.exchangeRate.fromCurrency,
      rate: this._value.exchangeRate.inverseRate,
      inverseRate: this._value.exchangeRate.rate,
      source: this._value.exchangeRate.source,
      timestamp: new Date(),
      validUntil: this._value.exchangeRate.validUntil,
    };

    return new CurrencyConversion({
      amount: this._value.convertedAmount,
      exchangeRate: reverseRate,
      convertedAmount: this._value.amount,
      conversionDate: new Date(),
      purpose: `Reverse of ${this._value.purpose || 'conversion'}`,
    });
  }

  // Formatting methods
  getConversionStatement(): string {
    const { amount, convertedAmount, exchangeRate } = this._value;
    const fee = this._value.conversionFee
      ? ` less fee of ${this._value.conversionFee.format()}`
      : '';

    return `${amount.format()} = ${convertedAmount.format()}${fee} at rate ${exchangeRate.rate.toFixed(4)}`;
  }

  getForLegalDocument(): string {
    const statement = this.getConversionStatement();
    const source = this._value.exchangeRate.source.replace('_', ' ');

    return `Converted on ${this._value.conversionDate.toLocaleDateString()} using ${source} exchange rate. ${statement}`;
  }

  // Getters
  get amount(): Money {
    return this._value.amount;
  }

  get exchangeRate(): ExchangeRate {
    return this._value.exchangeRate;
  }

  get convertedAmount(): Money {
    return this._value.convertedAmount;
  }

  get conversionDate(): Date {
    return this._value.conversionDate;
  }

  get conversionFee(): Money | undefined {
    return this._value.conversionFee;
  }

  get purpose(): string | undefined {
    return this._value.purpose;
  }

  get referenceNumber(): string | undefined {
    return this._value.referenceNumber;
  }
}

// Central Bank of Kenya rates service
export class CBKExchangeRates {
  private static readonly BASE_URL = 'https://www.centralbank.go.ke';
  private rates: Map<string, ExchangeRate> = new Map();
  private lastUpdated: Date | null = null;

  static async getLatestRates(): Promise<Map<string, ExchangeRate>> {
    // In production, this would fetch from CBK API
    // For now, return mock rates

    const rates = new Map<string, ExchangeRate>();
    const now = new Date();
    const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // KES to USD
    rates.set('KES-USD', {
      fromCurrency: Currency.KES,
      toCurrency: Currency.USD,
      rate: 0.0068, // 1 KES = 0.0068 USD
      inverseRate: 147.06, // 1 USD = 147.06 KES
      source: 'CENTRAL_BANK',
      timestamp: now,
      validUntil,
    });

    // KES to EUR
    rates.set('KES-EUR', {
      fromCurrency: Currency.KES,
      toCurrency: Currency.EUR,
      rate: 0.0063, // 1 KES = 0.0063 EUR
      inverseRate: 158.73, // 1 EUR = 158.73 KES
      source: 'CENTRAL_BANK',
      timestamp: now,
      validUntil,
    });

    // KES to GBP
    rates.set('KES-GBP', {
      fromCurrency: Currency.KES,
      toCurrency: Currency.GBP,
      rate: 0.0054, // 1 KES = 0.0054 GBP
      inverseRate: 185.19, // 1 GBP = 185.19 KES
      source: 'CENTRAL_BANK',
      timestamp: now,
      validUntil,
    });

    // Add more currencies as needed

    return rates;
  }

  static async convertUsingCBK(amount: Money, toCurrency: Currency): Promise<CurrencyConversion> {
    const rates = await CBKExchangeRates.getLatestRates();
    const key = `${amount.currency}-${toCurrency}`;
    const rate = rates.get(key);

    if (!rate) {
      throw new UnsupportedCurrencyPairException(amount.currency, toCurrency, {
        availablePairs: Array.from(rates.keys()),
      });
    }

    return CurrencyConversion.convert(amount, toCurrency, rate.rate, 'CENTRAL_BANK');
  }
}
