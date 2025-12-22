// src/shared/domain/exceptions/base-domain.exception.ts

export abstract class DomainException extends Error {
  public readonly code: string;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();

    // Capture stack trace in Node.js environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serialize exception for API responses or Logging.
   * @param includeStack - Whether to include the stack trace (default: false)
   */
  toJSON(includeStack: boolean = false): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      ...(includeStack ? { stack: this.stack } : {}),
    };
  }
}

/**
 * Base exception for all Value Object validation failures.
 * Enforces a standard structure: Message + Field Name + Context.
 */
export abstract class InvalidValueObjectException extends DomainException {
  constructor(
    message: string,
    public readonly field: string,
    context?: Record<string, any>,
    specificCode: string = 'INVALID_VALUE_OBJECT', // Optional override for specific VOs
  ) {
    super(message, specificCode, {
      field,
      ...context,
      validationError: true,
    });
  }
}
