// src/shared/domain/exceptions/common-vo.exception.ts
import { InvalidValueObjectException } from './base-domain.exception';

export class EmptyValueException extends InvalidValueObjectException {
  constructor(field: string, context?: Record<string, any>) {
    // 3rd argument is now valid because the parent accepts Record<string, any>
    super(`${field} cannot be empty`, field, { ...context, empty: true });
  }
}

export class InvalidLengthException extends InvalidValueObjectException {
  constructor(
    field: string,
    value: string,
    min: number,
    max: number,
    context?: Record<string, any>,
  ) {
    super(`${field} '${value}' must be between ${min} and ${max} characters`, field, {
      ...context,
      value,
      min,
      max,
      length: value.length,
    });
  }
}

export class InvalidFormatException extends InvalidValueObjectException {
  constructor(field: string, value: string, format: string, context?: Record<string, any>) {
    super(`${field} '${value}' does not match required format: ${format}`, field, {
      ...context,
      value,
      format,
    });
  }
}

export class ValueTooSmallException extends InvalidValueObjectException {
  constructor(field: string, value: number, min: number, context?: Record<string, any>) {
    super(`${field} ${value} is too small. Minimum is ${min}`, field, {
      ...context,
      value,
      min,
    });
  }
}

export class ValueTooLargeException extends InvalidValueObjectException {
  constructor(field: string, value: number, max: number, context?: Record<string, any>) {
    super(`${field} ${value} is too large. Maximum is ${max}`, field, {
      ...context,
      value,
      max,
    });
  }
}
