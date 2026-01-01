// src/domain/errors/domain.errors.ts
/**
 * Domain-specific errors
 */

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class UserDeletedError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'UserDeletedError';
  }
}

export class UserSuspendedError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'UserSuspendedError';
  }
}

export class LastIdentityError extends DomainError {
  constructor() {
    super('Cannot remove the last identity');
    this.name = 'LastIdentityError';
  }
}

export class PhoneVerificationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'PhoneVerificationError';
  }
}

// Note: You mentioned we're not implementing phone verification,
// but I'm keeping the error for completeness. We'll remove actual
// verification logic but keep the structure in case we add it later.
