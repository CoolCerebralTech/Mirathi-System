// src/application/exceptions/user.exception.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor(identifier: string, identifierType: string = 'id') {
    super(`User not found with ${identifierType}: ${identifier}`);
  }
}

export class DuplicateEmailException extends ConflictException {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
  }
}

export class DuplicatePhoneException extends ConflictException {
  constructor(phoneNumber: string) {
    super(`User with phone number ${phoneNumber} already exists`);
  }
}

export class DuplicateIdentityException extends ConflictException {
  constructor(provider: string, providerUserId: string) {
    super(`Identity already linked: ${provider}:${providerUserId}`);
  }
}

export class UnauthorizedOperationException extends ForbiddenException {
  constructor(operation: string, reason?: string) {
    const message = reason
      ? `Unauthorized to perform ${operation}: ${reason}`
      : `Unauthorized to perform ${operation}`;
    super(message);
  }
}

export class OAuthProviderException extends BadRequestException {
  constructor(provider: string, message: string) {
    super(`OAuth error with ${provider}: ${message}`);
  }
}

export class InvalidInputException extends BadRequestException {
  constructor(field: string, reason: string) {
    super(`Invalid input for ${field}: ${reason}`);
  }
}

/**
 * Wraps domain layer errors for HTTP responses
 */
export class DomainErrorException extends BadRequestException {
  constructor(domainError: Error) {
    super(domainError.message);
  }
}
