// src/domain/errors/domain.errors.ts

/**
 * Base class for all domain errors
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

/**
 * Thrown when trying to perform actions on deleted users
 */
export class UserDeletedError extends DomainError {
  constructor(message?: string) {
    super(message || 'Cannot perform actions on a deleted user');
    this.name = 'UserDeletedError';
  }
}

/**
 * Thrown when user is suspended
 */
export class UserSuspendedError extends DomainError {
  constructor(message?: string) {
    super(message || 'User account is suspended');
    this.name = 'UserSuspendedError';
  }
}

/**
 * Thrown when phone verification fails
 */
export class PhoneVerificationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'PhoneVerificationError';
  }
}

/**
 * Thrown when trying to remove the last identity
 */
export class LastIdentityError extends DomainError {
  constructor() {
    super('Cannot remove the last identity from user');
    this.name = 'LastIdentityError';
  }
}

/**
 * Thrown when trying to perform action without required identity
 */
export class IdentityRequiredError extends DomainError {
  constructor(action: string) {
    super(`Identity is required to ${action}`);
    this.name = 'IdentityRequiredError';
  }
}
