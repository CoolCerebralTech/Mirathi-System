import { InvalidValueObjectException } from './base-domain.exception';

export class InvalidCurrencyConversionException extends InvalidValueObjectException {
  constructor(
    message: string,
    field: string = 'currencyConversion',
    context?: Record<string, any>,
  ) {
    super(message, field, { ...context, code: 'DOMAIN_CURRENCY_CONV_001' });
  }
}

export class InvalidExchangeRateException extends InvalidCurrencyConversionException {
  constructor(rate: number, context?: Record<string, any>) {
    super(`Invalid exchange rate: ${rate}`, 'exchangeRate', { ...context, rate });
  }
}

export class CurrencyConversionExpiredException extends InvalidCurrencyConversionException {
  constructor(validUntil: Date, context?: Record<string, any>) {
    super(`Exchange rate expired on ${validUntil.toISOString()}`, 'exchangeRate', {
      ...context,
      validUntil,
    });
  }
}

export class UnsupportedCurrencyPairException extends InvalidCurrencyConversionException {
  constructor(fromCurrency: string, toCurrency: string, context?: Record<string, any>) {
    super(`Unsupported currency pair: ${fromCurrency} to ${toCurrency}`, 'currencyPair', {
      ...context,
      fromCurrency,
      toCurrency,
    });
  }
}

export class CurrencyMismatchInConversionException extends InvalidCurrencyConversionException {
  constructor(expected: string, actual: string, context?: Record<string, any>) {
    super(`Currency mismatch: expected ${expected}, got ${actual}`, 'currency', {
      ...context,
      expected,
      actual,
    });
  }
}

export class ConversionAmountMismatchException extends InvalidCurrencyConversionException {
  constructor(expected: number, actual: number, context?: Record<string, any>) {
    super(`Converted amount mismatch: expected ${expected}, got ${actual}`, 'convertedAmount', {
      ...context,
      expected,
      actual,
    });
  }
}
