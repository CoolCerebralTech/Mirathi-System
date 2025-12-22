import { InvalidValueObjectException } from './base-domain.exception';

export class InvalidMoneyException extends InvalidValueObjectException {
  constructor(message: string, field: string = 'money', context?: Record<string, any>) {
    super(message, field, { ...context, code: 'DOMAIN_MONEY_001' });
  }
}

export class CurrencyMismatchException extends InvalidMoneyException {
  constructor(currency1: string, currency2: string, context?: Record<string, any>) {
    super(`Currency mismatch: ${currency1} vs ${currency2}`, 'currency', {
      ...context,
      currency1,
      currency2,
    });
  }
}

export class NegativeAmountException extends InvalidMoneyException {
  constructor(amount: number, context?: Record<string, any>) {
    super(`Money amount cannot be negative: ${amount}`, 'amount', { ...context, amount });
  }
}

export class InvalidCurrencyException extends InvalidMoneyException {
  constructor(currency: string, context?: Record<string, any>) {
    super(`Invalid currency: ${currency}`, 'currency', { ...context, currency });
  }
}

export class InvalidKESAmountException extends InvalidMoneyException {
  constructor(amount: number, context?: Record<string, any>) {
    super(`KES amounts must be in whole shillings: ${amount}`, 'amount', {
      ...context,
      amount,
      currency: 'KES',
    });
  }
}

export class AmountExceedsLimitException extends InvalidMoneyException {
  constructor(amount: number, limit: number, context?: Record<string, any>) {
    super(`Amount ${amount} exceeds maximum limit of ${limit}`, 'amount', {
      ...context,
      amount,
      limit,
    });
  }
}

export class InvalidExchangeRateException extends InvalidMoneyException {
  constructor(exchangeRate: number, context?: Record<string, any>) {
    super(`Exchange rate must be positive: ${exchangeRate}`, 'exchangeRate', {
      ...context,
      exchangeRate,
    });
  }
}

export class DivisionByZeroException extends InvalidMoneyException {
  constructor(context?: Record<string, any>) {
    super('Cannot divide by zero', 'divisor', context);
  }
}

export class NegativeMultiplicationFactorException extends InvalidMoneyException {
  constructor(factor: number, context?: Record<string, any>) {
    super(`Multiplication factor cannot be negative: ${factor}`, 'factor', { ...context, factor });
  }
}

export class ZeroAmountException extends InvalidMoneyException {
  constructor(message: string = 'Amount cannot be zero', context?: Record<string, any>) {
    super(message, 'amount', context);
  }
}

export class InvalidMoneyFormatException extends InvalidMoneyException {
  constructor(amountStr: string, context?: Record<string, any>) {
    super(`Invalid money format: ${amountStr}`, 'format', { ...context, amountStr });
  }
}

export class InvalidPercentageException extends InvalidMoneyException {
  constructor(percent: number, context?: Record<string, any>) {
    super(`Invalid percentage: ${percent}. Must be between 0 and 100`, 'percentage', {
      ...context,
      percent,
    });
  }
}
