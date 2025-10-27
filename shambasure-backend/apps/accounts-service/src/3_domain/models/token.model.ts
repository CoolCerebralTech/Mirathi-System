import { randomUUID } from 'crypto';

// ============================================================================
// Custom Domain Errors
// ============================================================================

/** Base error for all token-related business rule violations. */
export class TokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenError';
  }
}

/** Thrown when an operation is attempted with an expired token. */
export class TokenExpiredError extends TokenError {
  constructor() {
    super('The token has expired.');
    this.name = 'TokenExpiredError';
  }
}

/** Thrown when a single-use token is used more than once. */
export class TokenAlreadyUsedError extends TokenError {
  constructor() {
    super('The token has already been used.');
    this.name = 'TokenAlreadyUsedError';
  }
}

/** Thrown when an operation is attempted with a revoked token. */
export class TokenRevokedError extends TokenError {
  constructor() {
    super('The token has been revoked.');
    this.name = 'TokenRevokedError';
  }
}

// ============================================================================
// Base Token Entity
// ============================================================================

/** Defines the properties common to all token types. */
interface ITokenProps {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
}

abstract class Token<T extends ITokenProps> {
  public readonly id: string;
  public readonly tokenHash: string;
  public readonly userId: string;
  public readonly expiresAt: Date;
  public readonly createdAt: Date;

  constructor(props: T & { id: string; createdAt: Date }) {
    this.id = props.id;
    this.tokenHash = props.tokenHash;
    this.userId = props.userId;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}

// ============================================================================
// Specific Token Implementations
// ============================================================================

// --- Password Reset Token ---

export interface PasswordResetTokenProps extends ITokenProps {
  isUsed: boolean;
}

export class PasswordResetToken extends Token<PasswordResetTokenProps> {
  public isUsed: boolean;

  private constructor(props: PasswordResetTokenProps & { id: string; createdAt: Date }) {
    super(props);
    this.isUsed = props.isUsed;
  }

  static create(props: Omit<PasswordResetTokenProps, 'isUsed'>): PasswordResetToken {
    return new PasswordResetToken({
      ...props,
      id: randomUUID(),
      createdAt: new Date(),
      isUsed: false,
    });
  }

  static fromPersistence(
    props: PasswordResetTokenProps & { id: string; createdAt: Date },
  ): PasswordResetToken {
    return new PasswordResetToken(props);
  }

  /** Marks the token as used, enforcing single-use and expiry rules. */
  use(): void {
    if (this.isUsed) throw new TokenAlreadyUsedError();
    if (this.isExpired()) throw new TokenExpiredError();
    this.isUsed = true;
  }
}

// --- Refresh Token ---

export interface RefreshTokenProps extends ITokenProps {
  isRevoked: boolean;
  deviceId: string | null;
}

export class RefreshToken extends Token<RefreshTokenProps> {
  public isRevoked: boolean;
  public readonly deviceId: string | null;

  private constructor(props: RefreshTokenProps & { id: string; createdAt: Date }) {
    super(props);
    this.isRevoked = props.isRevoked;
    this.deviceId = props.deviceId;
  }

  static create(props: Omit<RefreshTokenProps, 'isRevoked'>): RefreshToken {
    return new RefreshToken({
      ...props,
      id: randomUUID(),
      createdAt: new Date(),
      isRevoked: false,
    });
  }

  static fromPersistence(props: RefreshTokenProps & { id: string; createdAt: Date }): RefreshToken {
    return new RefreshToken(props);
  }

  /** Marks the token as revoked (e.g., during logout). */
  revoke(): void {
    this.isRevoked = true;
  }

  /**
   * Implements refresh token rotation.
   * Revokes the current token and returns a new one.
   * @param newHash The hash of the new refresh token to be issued.
   * @param newExpiresAt The expiry date of the new refresh token.
   * @returns A new, valid RefreshToken instance.
   */
  rotate(newHash: string, newExpiresAt: Date): RefreshToken {
    if (this.isRevoked) throw new TokenRevokedError();
    if (this.isExpired()) throw new TokenExpiredError();

    this.revoke(); // Revoke the current token

    // Return a new token instance with the new details
    return RefreshToken.create({
      tokenHash: newHash,
      userId: this.userId,
      expiresAt: newExpiresAt,
      deviceId: this.deviceId,
    });
  }
}

// --- Email Verification Token ---

export type EmailVerificationTokenProps = ITokenProps;

export class EmailVerificationToken extends Token<EmailVerificationTokenProps> {
  private constructor(props: EmailVerificationTokenProps & { id: string; createdAt: Date }) {
    super(props);
  }

  static create(props: EmailVerificationTokenProps): EmailVerificationToken {
    return new EmailVerificationToken({ ...props, id: randomUUID(), createdAt: new Date() });
  }

  static fromPersistence(
    props: EmailVerificationTokenProps & { id: string; createdAt: Date },
  ): EmailVerificationToken {
    return new EmailVerificationToken(props);
  }

  /** Validates the token for use, checking only for expiry. */
  validate(): void {
    if (this.isExpired()) throw new TokenExpiredError();
  }
}
