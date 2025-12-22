import { ValueObject } from '../base/value-object';
import {
  CurrencyConversionExpiredException,
  InvalidCurrencyConversionException,
  InvalidExchangeRateException,
  UnsupportedCurrencyPairException,
} from '../exceptions/currency-conversion.exception';
import { Currency, Money } from './money.vo';

export enum ExchangeRateSource {
  CENTRAL_BANK_OF_KENYA = 'CENTRAL_BANK_OF_KENYA',
  COMMERCIAL_BANK = 'COMMERCIAL_BANK',
  FOREX_BUREAU = 'FOREX_BUREAU',
  COURT_ORDER = 'COURT_ORDER',
  ESTATE_VALUATION = 'ESTATE_VALUATION',
}

export enum ConversionPurpose {
  ESTATE_VALUATION = 'ESTATE_VALUATION',
  DEBT_SETTLEMENT = 'DEBT_SETTLEMENT',
  ASSET_TRANSFER = 'ASSET_TRANSFER',
  TAX_CALCULATION = 'TAX_CALCULATION',
  COURT_FILING = 'COURT_FILING',
}

export interface ExchangeRate {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  source: ExchangeRateSource;
  timestamp: Date;
  validUntil?: Date;
  officialReference?: string;
}

export interface CurrencyConversionProps {
  amount: Money;
  exchangeRate: ExchangeRate;
  convertedAmount: Money;
  conversionDate: Date;
  purpose: ConversionPurpose;
  referenceNumber?: string;
}

export class CurrencyConversion extends ValueObject<CurrencyConversionProps> {
  // POCAMLA Thresholds (approximate)
  private static readonly REPORTING_THRESHOLD_KES = 1_000_000;

  constructor(props: CurrencyConversionProps) {
    super(props);
  }

  protected validate(): void {
    this.validateExchangeRate();
    this.validateConversionMath();
  }

  private validateExchangeRate(): void {
    const { exchangeRate } = this.props;

    if (exchangeRate.rate <= 0) {
      throw new InvalidExchangeRateException(exchangeRate.rate);
    }

    if (exchangeRate.fromCurrency === exchangeRate.toCurrency) {
      throw new UnsupportedCurrencyPairException(
        exchangeRate.fromCurrency,
        exchangeRate.toCurrency,
        { reason: 'Same currency conversion not permitted in this context' },
      );
    }

    if (exchangeRate.validUntil && exchangeRate.validUntil < new Date()) {
      // We only throw if we are creating a NEW conversion based on an old rate.
      // If restoring from DB, we trust the snapshot.
      // Since VO constructor is used for both, we usually assume creation time check
      // unless this is a reconstruction. Ideally, use a factory for new vs restore.
      // For strict VO validation, we allow expired rates if the conversionDate was within validity.
      if (this.props.conversionDate > exchangeRate.validUntil) {
        throw new CurrencyConversionExpiredException(exchangeRate.validUntil);
      }
    }
  }

  private validateConversionMath(): void {
    const { amount, exchangeRate, convertedAmount } = this.props;

    // Tolerance for floating point math
    const expected = amount.amount * exchangeRate.rate;
    const actual = convertedAmount.amount;
    const tolerance = 0.05; // 5 cents

    if (Math.abs(expected - actual) > tolerance) {
      throw new InvalidCurrencyConversionException(
        `Math mismatch: ${amount.amount} * ${exchangeRate.rate} != ${actual}`,
        'convertedAmount',
      );
    }

    if (
      amount.currency !== exchangeRate.fromCurrency ||
      convertedAmount.currency !== exchangeRate.toCurrency
    ) {
      throw new InvalidCurrencyConversionException(
        'Currency mismatch in conversion parameters',
        'currency',
      );
    }
  }

  // --- Factory Methods ---

  static convert(
    amount: Money,
    toCurrency: Currency,
    rate: number,
    source: ExchangeRateSource,
    purpose: ConversionPurpose,
    reference?: string,
  ): CurrencyConversion {
    const now = new Date();
    const convertedValue = Math.round((amount.amount * rate + Number.EPSILON) * 100) / 100;

    return new CurrencyConversion({
      amount,
      convertedAmount: new Money({ amount: convertedValue, currency: toCurrency }),
      exchangeRate: {
        fromCurrency: amount.currency,
        toCurrency,
        rate,
        source,
        timestamp: now,
        // Default validity 24h
        validUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        officialReference: reference,
      },
      conversionDate: now,
      purpose,
      referenceNumber: reference,
    });
  }

  // --- Business Logic ---

  requiresReporting(): boolean {
    // Check if either side is KES and above threshold
    const isKesSource = this.props.amount.currency === Currency.KES;
    const isKesTarget = this.props.convertedAmount.currency === Currency.KES;

    if (isKesSource && this.props.amount.amount >= CurrencyConversion.REPORTING_THRESHOLD_KES)
      return true;
    if (
      isKesTarget &&
      this.props.convertedAmount.amount >= CurrencyConversion.REPORTING_THRESHOLD_KES
    )
      return true;

    return false;
  }

  // --- Getters ---
  get amount(): Money {
    return this.props.amount;
  }
  get convertedAmount(): Money {
    return this.props.convertedAmount;
  }
  get rate(): number {
    return this.props.exchangeRate.rate;
  }

  public toJSON(): Record<string, any> {
    return {
      from: this.props.amount.toJSON(),
      to: this.props.convertedAmount.toJSON(),
      rate: this.props.exchangeRate.rate,
      date: this.props.conversionDate,
      purpose: this.props.purpose,
      requiresReporting: this.requiresReporting(),
    };
  }
}
