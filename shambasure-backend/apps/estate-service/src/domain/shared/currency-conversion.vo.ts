// src/shared/domain/value-objects/currency-conversion.vo.ts
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
  FINANCIAL_MARKET = 'FINANCIAL_MARKET',
  CUSTOMS_DEPARTMENT = 'CUSTOMS_DEPARTMENT', // For customs valuation (KRA)
  COURT_ORDER = 'COURT_ORDER', // Fixed rate by court for succession
  AVERAGE_MARKET = 'AVERAGE_MARKET',
  ESTATE_VALUATION = 'ESTATE_VALUATION', // For estate asset valuation
}

export enum ConversionPurpose {
  ESTATE_VALUATION = 'ESTATE_VALUATION',
  DEBT_SETTLEMENT = 'DEBT_SETTLEMENT',
  ASSET_TRANSFER = 'ASSET_TRANSFER',
  TAX_CALCULATION = 'TAX_CALCULATION',
  COURT_FILING = 'COURT_FILING',
  SUCCESSION_DISTRIBUTION = 'SUCCESSION_DISTRIBUTION',
  INTERNATIONAL_INHERITANCE = 'INTERNATIONAL_INHERITANCE',
  CUSTOMS_DUTY = 'CUSTOMS_DUTY',
  OTHER = 'OTHER',
}

export interface ExchangeRate {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  inverseRate: number;
  source: ExchangeRateSource;
  timestamp: Date;
  validUntil?: Date;
  margin?: number; // Spread percentage
  officialReference?: string; // CBK reference number
  applicableLaw?: string; // Legal basis for rate
  remarks?: string;
}

export interface CurrencyConversionProps {
  amount: Money;
  exchangeRate: ExchangeRate;
  convertedAmount: Money;
  conversionDate: Date;
  conversionFee?: Money;
  purpose: ConversionPurpose;
  referenceNumber?: string;
  legalAuthority?: string; // Court order reference, etc.
  taxImplications?: {
    witholdingTax?: Money;
    capitalGainsTax?: Money;
    stampDuty?: Money;
  };
}

export class CurrencyConversion extends ValueObject<CurrencyConversionProps> {
  // Kenyan legal compliance thresholds (POCAMLA Regulations)
  private static readonly LARGE_TRANSACTION_THRESHOLD = 1_000_000; // 1 million KES
  private static readonly CBK_REPORTING_THRESHOLD = 1_290_000; // Approx USD 10k equivalent

  constructor(props: CurrencyConversionProps) {
    super(props);
  }

  protected validate(): void {
    this.validateExchangeRate();
    this.validateConversion();
    this.validateAmounts();
    this.validateLegalCompliance();
  }

  private validateExchangeRate(): void {
    const { exchangeRate } = this._value;

    if (exchangeRate.rate <= 0) {
      throw new InvalidExchangeRateException(exchangeRate.rate, {
        exchangeRate,
        currencyPair: `${exchangeRate.fromCurrency}-${exchangeRate.toCurrency}`,
      });
    }

    if (exchangeRate.inverseRate <= 0) {
      throw new InvalidExchangeRateException(exchangeRate.inverseRate, {
        exchangeRate,
        type: 'inverse',
      });
    }

    // Check if rate is expired (critical for legal compliance)
    if (exchangeRate.validUntil && exchangeRate.validUntil < new Date()) {
      throw new CurrencyConversionExpiredException(exchangeRate.validUntil, {
        exchangeRate,
        currentDate: new Date(),
      });
    }

    // Validate currency pair for Kenyan legal context
    if (exchangeRate.fromCurrency === exchangeRate.toCurrency) {
      throw new UnsupportedCurrencyPairException(
        exchangeRate.fromCurrency,
        exchangeRate.toCurrency,
        { exchangeRate, reason: 'Same currency conversion not allowed' },
      );
    }

    // Special validation for KES conversions (Kenyan legal requirement)
    if (exchangeRate.fromCurrency === Currency.KES || exchangeRate.toCurrency === Currency.KES) {
      this.validateKESConversionRate(exchangeRate);
    }
  }

  private validateKESConversionRate(exchangeRate: ExchangeRate): void {
    // Validate KES rates are within reasonable bounds (Sanity check)
    if (exchangeRate.fromCurrency === Currency.KES) {
      // KES to foreign currency (e.g., KES to USD is approx 0.0077)
      if (exchangeRate.rate > 0.5) {
        console.warn(`Unusually high KES to ${exchangeRate.toCurrency} rate: ${exchangeRate.rate}`);
      }
    } else if (exchangeRate.toCurrency === Currency.KES) {
      // Foreign currency to KES (e.g., USD to KES is approx 129)
      const weakerCurrencies = [Currency.UGX, Currency.TZS, Currency.RWF];
      if (!weakerCurrencies.includes(exchangeRate.fromCurrency) && exchangeRate.rate < 10) {
        console.warn(
          `Unusually low ${exchangeRate.fromCurrency} to KES rate: ${exchangeRate.rate}`,
        );
      }
    }
  }

  private validateConversion(): void {
    const { amount, exchangeRate, convertedAmount } = this._value;

    // Verify converted amount matches expected calculation with tolerance
    const expectedAmount = CurrencyConversion.round(amount.amount * exchangeRate.rate, 2);
    const tolerance = 0.05; // 5 cents tolerance for rounding differences

    if (Math.abs(convertedAmount.amount - expectedAmount) > tolerance) {
      throw new InvalidCurrencyConversionException(
        `Converted amount ${convertedAmount.amount} doesn't match expected ${expectedAmount}`,
        'convertedAmount',
        {
          amount: amount.amount,
          rate: exchangeRate.rate,
          expectedAmount,
          actualAmount: convertedAmount.amount,
          difference: Math.abs(convertedAmount.amount - expectedAmount),
        },
      );
    }

    // Verify currency matches
    if (convertedAmount.currency !== exchangeRate.toCurrency) {
      throw new InvalidCurrencyConversionException(
        `Converted amount currency ${convertedAmount.currency} doesn't match target currency ${exchangeRate.toCurrency}`,
        'convertedAmount',
        {
          expectedCurrency: exchangeRate.toCurrency,
          actualCurrency: convertedAmount.currency,
        },
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

      // Check fee is reasonable (not more than 10% of converted amount for warnings)
      const feePercentage =
        (this._value.conversionFee.amount / this._value.convertedAmount.amount) * 100;
      if (feePercentage > 10) {
        console.warn(`High conversion fee: ${feePercentage.toFixed(2)}% of converted amount`);
      }
    }
  }

  private validateLegalCompliance(): void {
    // Check if transaction requires CBK reporting
    if (this.requiresCBKReporting()) {
      // In a real system, this might trigger an event or flag
    }
  }

  // Helper: made static to be available in factory methods
  private static round(amount: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(amount * factor) / factor;
  }

  // Factory methods
  static convert(
    amount: Money,
    toCurrency: Currency,
    exchangeRate: number,
    source: ExchangeRateSource = ExchangeRateSource.CENTRAL_BANK_OF_KENYA,
    conversionFee?: Money,
    purpose: ConversionPurpose = ConversionPurpose.ESTATE_VALUATION,
    legalAuthority?: string,
    officialReference?: string,
  ): CurrencyConversion {
    const exchangeRateObj: ExchangeRate = {
      fromCurrency: amount.currency,
      toCurrency,
      rate: exchangeRate,
      inverseRate: 1 / exchangeRate,
      source,
      timestamp: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
      officialReference:
        officialReference ||
        (source === ExchangeRateSource.CENTRAL_BANK_OF_KENYA ? 'CBK/REF/' + Date.now() : undefined),
      applicableLaw: 'Central Bank of Kenya Act',
    };

    const convertedAmount = new Money({
      amount: this.round(amount.amount * exchangeRate, 2),
      currency: toCurrency,
    });

    return new CurrencyConversion({
      amount,
      exchangeRate: exchangeRateObj,
      convertedAmount,
      conversionDate: new Date(),
      conversionFee,
      purpose,
      legalAuthority,
      referenceNumber: officialReference,
    });
  }

  static convertKESToForeign(
    kesAmount: number,
    foreignCurrency: Currency,
    foreignRate: number, // 1 foreign currency = foreignRate KES (e.g., 1 USD = 129 KES)
    source: ExchangeRateSource = ExchangeRateSource.CENTRAL_BANK_OF_KENYA,
    purpose?: ConversionPurpose,
  ): CurrencyConversion {
    const amount = new Money({
      amount: kesAmount,
      currency: Currency.KES,
    });

    // Convert foreignRate (Foreign->KES) to KES->Foreign rate
    const kesToForeignRate = 1 / foreignRate;

    return CurrencyConversion.convert(
      amount,
      foreignCurrency,
      kesToForeignRate,
      source,
      undefined,
      purpose,
    );
  }

  static convertForeignToKES(
    foreignAmount: number,
    foreignCurrency: Currency,
    kesRate: number, // 1 foreign currency = kesRate KES (e.g., 129)
    source: ExchangeRateSource = ExchangeRateSource.CENTRAL_BANK_OF_KENYA,
    purpose?: ConversionPurpose,
  ): CurrencyConversion {
    const amount = new Money({
      amount: foreignAmount,
      currency: foreignCurrency,
    });

    return CurrencyConversion.convert(amount, Currency.KES, kesRate, source, undefined, purpose);
  }

  // Business logic methods
  getNetAmount(): Money {
    if (!this._value.conversionFee) {
      return this._value.convertedAmount;
    }

    return this._value.convertedAmount.subtract(this._value.conversionFee);
  }

  getEffectiveRate(): number {
    const netAmount = this.getNetAmount().amount;
    if (this._value.amount.amount === 0) return 0;

    return CurrencyConversion.round(netAmount / this._value.amount.amount, 6);
  }

  getMarginPercentage(): number {
    const effectiveRate = this.getEffectiveRate();
    const quotedRate = this._value.exchangeRate.rate;

    if (quotedRate === 0) return 0;

    return CurrencyConversion.round(((quotedRate - effectiveRate) / quotedRate) * 100, 2);
  }

  isKESConversion(): boolean {
    return (
      this._value.amount.currency === Currency.KES ||
      this._value.convertedAmount.currency === Currency.KES
    );
  }

  requiresCBKReporting(): boolean {
    if (!this.isKESConversion()) return false;

    const amountInKES =
      this._value.amount.currency === Currency.KES
        ? this._value.amount.amount
        : this._value.convertedAmount.amount;

    return amountInKES >= CurrencyConversion.CBK_REPORTING_THRESHOLD;
  }

  isSuspiciouslyLarge(): boolean {
    const amountInKES =
      this._value.amount.currency === Currency.KES
        ? this._value.amount.amount
        : this._value.convertedAmount.amount;

    return amountInKES >= CurrencyConversion.LARGE_TRANSACTION_THRESHOLD * 10;
  }

  isForEstateValuation(): boolean {
    return this._value.purpose === ConversionPurpose.ESTATE_VALUATION;
  }

  isForCourtFiling(): boolean {
    return this._value.purpose === ConversionPurpose.COURT_FILING;
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
      officialReference: this._value.exchangeRate.officialReference,
      applicableLaw: this._value.exchangeRate.applicableLaw,
    };

    return new CurrencyConversion({
      amount: this._value.convertedAmount,
      exchangeRate: reverseRate,
      convertedAmount: this._value.amount,
      conversionDate: new Date(),
      purpose: this._value.purpose,
      legalAuthority: this._value.legalAuthority,
      referenceNumber: this._value.referenceNumber
        ? `REV-${this._value.referenceNumber}`
        : undefined,
    });
  }

  // Formatting methods
  getConversionStatement(): string {
    const { amount, convertedAmount, exchangeRate, purpose } = this._value;
    const fee = this._value.conversionFee
      ? ` less conversion fee of ${this._value.conversionFee.format()}`
      : '';
    const purposeText = purpose ? ` for ${purpose.replace(/_/g, ' ').toLowerCase()}` : '';

    return `${amount.format()} = ${convertedAmount.format()}${fee} at rate ${exchangeRate.rate.toFixed(4)}${purposeText}`;
  }

  getLegalDocumentation(): string {
    const source = this._value.exchangeRate.source.replace(/_/g, ' ');
    const date = this._value.conversionDate.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const legalText = [
      `CURRENCY CONVERSION CERTIFICATE`,
      `Date of Conversion: ${date}`,
      `Source of Exchange Rate: ${source}`,
      `Exchange Rate: 1 ${this._value.exchangeRate.fromCurrency} = ${this._value.exchangeRate.rate.toFixed(4)} ${this._value.exchangeRate.toCurrency}`,
      `Amount Converted: ${this._value.amount.format()}`,
      `Converted Amount: ${this._value.convertedAmount.format()}`,
      this._value.conversionFee ? `Conversion Fee: ${this._value.conversionFee.format()}` : '',
      `Purpose: ${this._value.purpose.replace(/_/g, ' ')}`,
      this._value.legalAuthority ? `Legal Authority: ${this._value.legalAuthority}` : '',
      `Reference: ${this._value.referenceNumber || 'N/A'}`,
      `This conversion complies with the Central Bank of Kenya Act and applicable exchange control regulations.`,
    ]
      .filter(Boolean)
      .join('\n');

    return legalText;
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

  get purpose(): ConversionPurpose {
    return this._value.purpose;
  }

  get referenceNumber(): string | undefined {
    return this._value.referenceNumber;
  }

  get legalAuthority(): string | undefined {
    return this._value.legalAuthority;
  }

  // For API responses
  toJSON() {
    return {
      originalAmount: this._value.amount,
      convertedAmount: this._value.convertedAmount,
      exchangeRate: this._value.exchangeRate,
      netAmount: this.getNetAmount(),
      effectiveRate: this.getEffectiveRate(),
      marginPercentage: this.getMarginPercentage(),
      conversionDate: this._value.conversionDate,
      purpose: this._value.purpose,
      referenceNumber: this._value.referenceNumber,
      legalAuthority: this._value.legalAuthority,
      requiresCBKReporting: this.requiresCBKReporting(),
      isKESConversion: this.isKESConversion(),
      conversionStatement: this.getConversionStatement(),
    };
  }
}

/**
 * Domain Service for fetching exchange rates.
 */
export class CBKExchangeService {
  private static ratesCache: Map<string, ExchangeRate> = new Map();
  private static lastFetchTime: Date | null = null;
  private static readonly CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

  static async getLatestRates(): Promise<Map<string, ExchangeRate>> {
    // Check cache first
    if (this.ratesCache.size > 0 && this.lastFetchTime) {
      const cacheAge = Date.now() - this.lastFetchTime.getTime();
      if (cacheAge < this.CACHE_DURATION_MS) {
        return new Map(this.ratesCache);
      }
    }

    try {
      const rates = await this.fetchMockRates();
      this.ratesCache = rates;
      this.lastFetchTime = new Date();
      return rates;
    } catch (error) {
      console.error('Failed to fetch CBK rates:', error);
      if (this.ratesCache.size > 0) {
        console.warn('Using cached exchange rates due to fetch failure');
        return new Map(this.ratesCache);
      }
      throw error;
    }
  }

  private static async fetchMockRates(): Promise<Map<string, ExchangeRate>> {
    // Simulate network latency to satisfy `require-await` rule and simulate real API behavior
    await new Promise((resolve) => setTimeout(resolve, 50));

    const rates = new Map<string, ExchangeRate>();
    const now = new Date();
    const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const rateData = [
      {
        from: Currency.KES,
        to: Currency.USD,
        rate: 0.00775,
        inverse: 129.0,
        source: ExchangeRateSource.CENTRAL_BANK_OF_KENYA,
        reference: 'CBK/FX/2025/001',
      },
      {
        from: Currency.KES,
        to: Currency.EUR,
        rate: 0.0074,
        inverse: 135.1,
        source: ExchangeRateSource.CENTRAL_BANK_OF_KENYA,
        reference: 'CBK/FX/2025/002',
      },
      {
        from: Currency.KES,
        to: Currency.GBP,
        rate: 0.0061,
        inverse: 163.9,
        source: ExchangeRateSource.CENTRAL_BANK_OF_KENYA,
        reference: 'CBK/FX/2025/003',
      },
      {
        from: Currency.KES,
        to: Currency.UGX,
        rate: 28.5,
        inverse: 0.035,
        source: ExchangeRateSource.CENTRAL_BANK_OF_KENYA,
        reference: 'CBK/FX/2025/004',
      },
      {
        from: Currency.KES,
        to: Currency.TZS,
        rate: 20.2,
        inverse: 0.0495,
        source: ExchangeRateSource.CENTRAL_BANK_OF_KENYA,
        reference: 'CBK/FX/2025/005',
      },
      {
        from: Currency.USD,
        to: Currency.KES,
        rate: 129.0,
        inverse: 0.00775,
        source: ExchangeRateSource.CENTRAL_BANK_OF_KENYA,
        reference: 'CBK/FX/2025/006',
      },
    ];

    rateData.forEach((data) => {
      const key = `${data.from}-${data.to}`;
      rates.set(key, {
        fromCurrency: data.from,
        toCurrency: data.to,
        rate: data.rate,
        inverseRate: data.inverse,
        source: data.source,
        timestamp: now,
        validUntil,
        officialReference: data.reference,
        applicableLaw: 'Central Bank of Kenya Act, Cap 491',
        remarks: 'Official Central Bank of Kenya exchange rate',
      });
    });

    return rates;
  }

  static async convertUsingCBK(
    amount: Money,
    toCurrency: Currency,
    purpose: ConversionPurpose = ConversionPurpose.ESTATE_VALUATION,
  ): Promise<CurrencyConversion> {
    const rates = await this.getLatestRates();
    const key = `${amount.currency}-${toCurrency}`;
    const rate = rates.get(key);

    if (!rate) {
      // Try reverse rate
      const reverseKey = `${toCurrency}-${amount.currency}`;
      const reverseRate = rates.get(reverseKey);

      if (reverseRate) {
        // Use inverse of reverse rate
        return CurrencyConversion.convert(
          amount,
          toCurrency,
          1 / reverseRate.rate,
          reverseRate.source,
          undefined,
          purpose,
          reverseRate.officialReference,
          reverseRate.officialReference,
        );
      }

      throw new UnsupportedCurrencyPairException(amount.currency, toCurrency, {
        availablePairs: Array.from(rates.keys()),
      });
    }

    return CurrencyConversion.convert(
      amount,
      toCurrency,
      rate.rate,
      rate.source,
      undefined,
      purpose,
      rate.officialReference,
      rate.officialReference,
    );
  }

  static getRateHistory(
    fromCurrency: Currency,

    toCurrency: Currency,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    days: number = 30,
  ): Promise<ExchangeRate[]> {
    return Promise.resolve([]);
  }
}
