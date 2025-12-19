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

    // Capture stack trace in Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    };
  }
}

// Base exception for invalid value objects
export abstract class InvalidValueObjectException extends DomainException {
  constructor(
    message: string,
    code: string,
    public readonly field?: string,
    context?: Record<string, any>,
  ) {
    super(message, code, { field, ...context });
  }
}
