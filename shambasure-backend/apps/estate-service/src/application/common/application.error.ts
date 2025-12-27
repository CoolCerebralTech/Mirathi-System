// src/application/common/application.error.ts

/**
 * Base class for all Application Layer errors.
 * These are expected errors (validation, not found) vs System errors (DB down).
 */
export abstract class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super(`Validation Error: ${message}`);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string) {
    super(`${resource} with identifier ${id} was not found.`);
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string) {
    super(`Conflict: ${message}`);
  }
}

export class UnexpectedError extends ApplicationError {
  constructor(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    super(`Unexpected Error: ${message}`);
  }
}

export class SecurityError extends ApplicationError {
  constructor(message: string) {
    super(`Security Violation: ${message}`);
  }
}

/**
 * Grouped export to mimic the old namespace usage.
 */
export const AppErrors = {
  ValidationError,
  NotFoundError,
  ConflictError,
  UnexpectedError,
  SecurityError,
};
