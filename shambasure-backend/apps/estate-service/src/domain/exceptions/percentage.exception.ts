import { InvalidValueObjectException } from './base-domain.exception';

export class InvalidPercentageException extends InvalidValueObjectException {
  constructor(message: string, field: string = 'percentage', context?: Record<string, any>) {
    super(message, field, { ...context, code: 'DOMAIN_PERCENTAGE_001' });
  }
}

export class PercentageOutOfRangeException extends InvalidPercentageException {
  constructor(value: number, min: number, max: number, context?: Record<string, any>) {
    super(`Percentage ${value} is out of range. Must be between ${min} and ${max}`, 'percentage', {
      ...context,
      value,
      min,
      max,
    });
  }
}

export class PercentageTooLowException extends InvalidPercentageException {
  constructor(value: number, min: number = 0, context?: Record<string, any>) {
    super(`Percentage cannot be less than ${min}: ${value}`, 'percentage', {
      ...context,
      value,
      min,
    });
  }
}

export class PercentageTooHighException extends InvalidPercentageException {
  constructor(value: number, max: number = 100, context?: Record<string, any>) {
    super(`Percentage cannot exceed ${max}: ${value}`, 'percentage', { ...context, value, max });
  }
}

export class InvalidFractionException extends InvalidPercentageException {
  constructor(fraction: number, context?: Record<string, any>) {
    super(`Fraction must be between 0 and 1: ${fraction}`, 'fraction', { ...context, fraction });
  }
}

export class InvalidDenominatorException extends InvalidPercentageException {
  constructor(denominator: number, context?: Record<string, any>) {
    super(`Denominator cannot be zero: ${denominator}`, 'denominator', { ...context, denominator });
  }
}

export class InvalidPercentageOperationException extends InvalidPercentageException {
  constructor(operation: string, reason: string, context?: Record<string, any>) {
    super(`Cannot ${operation}: ${reason}`, 'operation', { ...context, operation, reason });
  }
}

export class PercentageAdditionOverflowException extends InvalidPercentageOperationException {
  constructor(
    value1: number,
    value2: number,
    result: number,
    max: number = 100,
    context?: Record<string, any>,
  ) {
    super('add', `Addition exceeds ${max}%: ${value1}% + ${value2}% = ${result}%`, {
      ...context,
      value1,
      value2,
      result,
      max,
    });
  }
}

export class PercentageSubtractionUnderflowException extends InvalidPercentageOperationException {
  constructor(
    value1: number,
    value2: number,
    result: number,
    min: number = 0,
    context?: Record<string, any>,
  ) {
    super(
      'subtract',
      `Subtraction results in negative percentage: ${value1}% - ${value2}% = ${result}%`,
      { ...context, value1, value2, result, min },
    );
  }
}

export class InvalidNaNPercentageException extends InvalidPercentageException {
  constructor(context?: Record<string, any>) {
    super('Percentage cannot be NaN', 'percentage', context);
  }
}

export class NegativeFactorException extends InvalidPercentageException {
  constructor(factor: number, context?: Record<string, any>) {
    super(`Multiplication factor cannot be negative: ${factor}`, 'factor', { ...context, factor });
  }
}
