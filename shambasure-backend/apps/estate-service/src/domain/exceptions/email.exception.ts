import { InvalidValueObjectException } from './base-domain.exception';

export class InvalidEmailException extends InvalidValueObjectException {
  constructor(message: string, field: string = 'email', context?: Record<string, any>) {
    super(message, field, { ...context, code: 'DOMAIN_EMAIL_001' });
  }
}

export class InvalidEmailFormatException extends InvalidEmailException {
  constructor(email: string, context?: Record<string, any>) {
    super(`Invalid email format: ${email}`, 'email', { ...context, email });
  }
}

export class InvalidKenyanEmailException extends InvalidEmailException {
  constructor(email: string, context?: Record<string, any>) {
    super(`Invalid Kenyan email domain: ${email}`, 'email', { ...context, email });
  }
}

export class EmailDomainBlacklistedException extends InvalidEmailException {
  constructor(domain: string, context?: Record<string, any>) {
    super(`Email domain is blacklisted: ${domain}`, 'domain', { ...context, domain });
  }
}

export class EmailAlreadyVerifiedException extends InvalidEmailException {
  constructor(email: string, context?: Record<string, any>) {
    super(`Email already verified: ${email}`, 'email', { ...context, email, verified: true });
  }
}

export class EmailVerificationTokenExpiredException extends InvalidEmailException {
  constructor(email: string, expiresAt: Date, context?: Record<string, any>) {
    super(
      `Email verification token expired at ${expiresAt.toISOString()} for email: ${email}`,
      'verificationToken',
      { ...context, email, expiresAt },
    );
  }
}

export class InvalidVerificationTokenException extends InvalidEmailException {
  constructor(email: string, context?: Record<string, any>) {
    super(`Invalid verification token for email: ${email}`, 'verificationToken', {
      ...context,
      email,
    });
  }
}
