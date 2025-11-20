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

/** Thrown when maximum OTP attempts are exceeded. */
export class MaxOTPAttemptsExceededError extends TokenError {
  constructor(maxAttempts: number) {
    super(`Maximum OTP verification attempts (${maxAttempts}) exceeded.`);
    this.name = 'MaxOTPAttemptsExceededError';
  }
}

/** Thrown when an invalid OTP is provided. */
export class InvalidOTPError extends TokenError {
  constructor() {
    super('The provided OTP is invalid.');
    this.name = 'InvalidOTPError';
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

  isValid(): boolean {
    return !this.isExpired();
  }

  getRemainingTime(): number {
    const now = new Date().getTime();
    const expiry = this.expiresAt.getTime();
    return Math.max(0, expiry - now);
  }

  getRemainingTimeInMinutes(): number {
    return Math.floor(this.getRemainingTime() / (1000 * 60));
  }
}

// ============================================================================
// Password Reset Token
// ============================================================================

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

  validate(): void {
    if (this.isUsed) throw new TokenAlreadyUsedError();
    if (this.isExpired()) throw new TokenExpiredError();
  }

  use(): void {
    this.validate();
    this.isUsed = true;
  }

  canBeUsed(): boolean {
    return !this.isUsed && !this.isExpired();
  }
}

// ============================================================================
// Refresh Token
// ============================================================================

export interface RefreshTokenProps extends ITokenProps {
  revokedAt: Date | null;
  deviceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export class RefreshToken extends Token<RefreshTokenProps> {
  public revokedAt: Date | null;
  public readonly deviceId: string | null;
  public readonly ipAddress: string | null;
  public readonly userAgent: string | null;

  private constructor(props: RefreshTokenProps & { id: string; createdAt: Date }) {
    super(props);
    this.revokedAt = props.revokedAt;
    this.deviceId = props.deviceId;
    this.ipAddress = props.ipAddress;
    this.userAgent = props.userAgent;
  }

  static create(props: Omit<RefreshTokenProps, 'isRevoked'>): RefreshToken {
    return new RefreshToken({
      ...props,
      id: randomUUID(),
      createdAt: new Date(),
      revokedAt: null,
    });
  }

  static fromPersistence(props: RefreshTokenProps & { id: string; createdAt: Date }): RefreshToken {
    return new RefreshToken(props);
  }

  validate(): void {
    if (this.revokedAt) throw new TokenRevokedError();
    if (this.isExpired()) throw new TokenExpiredError();
  }

  revoke(): void {
    if (this.revokedAt) return; // Already revoked
    this.revokedAt = new Date();
  }

  rotate(newHash: string, newExpiresAt: Date): RefreshToken {
    this.validate();
    this.revoke();

    return RefreshToken.create({
      tokenHash: newHash,
      userId: this.userId,
      expiresAt: newExpiresAt,
      deviceId: this.deviceId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      revokedAt: this.revokedAt,
    });
  }

  canBeUsed(): boolean {
    return !this.revokedAt && !this.isExpired();
  }

  isSameDevice(deviceId: string): boolean {
    return this.deviceId === deviceId;
  }
}

// ============================================================================
// Email Verification Token
// ============================================================================

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

  validate(): void {
    if (this.isExpired()) throw new TokenExpiredError();
  }

  canBeUsed(): boolean {
    return !this.isExpired();
  }
}

// ============================================================================
// Phone Verification Token (OTP)
// ============================================================================

export interface PhoneVerificationTokenProps extends ITokenProps {
  isUsed: boolean;
  attempts: number;
}

export class PhoneVerificationToken extends Token<PhoneVerificationTokenProps> {
  public isUsed: boolean;
  public attempts: number;

  private static readonly MAX_ATTEMPTS = 3;

  private constructor(props: PhoneVerificationTokenProps & { id: string; createdAt: Date }) {
    super(props);
    this.isUsed = props.isUsed;
    this.attempts = props.attempts;
  }

  static create(
    props: Omit<PhoneVerificationTokenProps, 'isUsed' | 'attempts'>,
  ): PhoneVerificationToken {
    return new PhoneVerificationToken({
      ...props,
      id: randomUUID(),
      createdAt: new Date(),
      isUsed: false,
      attempts: 0,
    });
  }

  static fromPersistence(
    props: PhoneVerificationTokenProps & { id: string; createdAt: Date },
  ): PhoneVerificationToken {
    return new PhoneVerificationToken(props);
  }

  validate(): void {
    if (this.isUsed) throw new TokenAlreadyUsedError();
    if (this.isExpired()) throw new TokenExpiredError();
    if (this.attempts >= PhoneVerificationToken.MAX_ATTEMPTS) {
      throw new MaxOTPAttemptsExceededError(PhoneVerificationToken.MAX_ATTEMPTS);
    }
  }

  incrementAttempts(): void {
    this.attempts++;
  }

  verify(providedOTPHash: string): boolean {
    this.validate();
    this.incrementAttempts();

    const isValid = this.tokenHash === providedOTPHash;

    if (isValid) {
      this.isUsed = true;
      return true;
    }

    if (this.attempts >= PhoneVerificationToken.MAX_ATTEMPTS) {
      throw new MaxOTPAttemptsExceededError(PhoneVerificationToken.MAX_ATTEMPTS);
    }

    return false;
  }

  canBeUsed(): boolean {
    return !this.isUsed && !this.isExpired() && this.attempts < PhoneVerificationToken.MAX_ATTEMPTS;
  }

  getRemainingAttempts(): number {
    return Math.max(0, PhoneVerificationToken.MAX_ATTEMPTS - this.attempts);
  }

  hasAttemptsRemaining(): boolean {
    return this.attempts < PhoneVerificationToken.MAX_ATTEMPTS;
  }
}

// ============================================================================
// Email Change Token
// ============================================================================

export interface EmailChangeTokenProps extends ITokenProps {
  newEmail: string;
  isUsed: boolean;
}

export class EmailChangeToken extends Token<EmailChangeTokenProps> {
  public readonly newEmail: string;
  public isUsed: boolean;

  private constructor(props: EmailChangeTokenProps & { id: string; createdAt: Date }) {
    super(props);
    this.newEmail = props.newEmail;
    this.isUsed = props.isUsed;
  }

  static create(props: Omit<EmailChangeTokenProps, 'isUsed'>): EmailChangeToken {
    return new EmailChangeToken({
      ...props,
      id: randomUUID(),
      createdAt: new Date(),
      isUsed: false,
    });
  }

  static fromPersistence(
    props: EmailChangeTokenProps & { id: string; createdAt: Date },
  ): EmailChangeToken {
    return new EmailChangeToken(props);
  }

  validate(): void {
    if (this.isUsed) throw new TokenAlreadyUsedError();
    if (this.isExpired()) throw new TokenExpiredError();
  }

  use(): void {
    this.validate();
    this.isUsed = true;
  }

  canBeUsed(): boolean {
    return !this.isUsed && !this.isExpired();
  }
}

// ============================================================================
// Login Session Token
// ============================================================================

export interface LoginSessionProps extends ITokenProps {
  ipAddress: string | null;
  userAgent: string | null;
  deviceId: string | null;
  lastActivity: Date;
  revokedAt: Date | null;
}

export class LoginSession extends Token<LoginSessionProps> {
  public readonly ipAddress: string | null;
  public readonly userAgent: string | null;
  public readonly deviceId: string | null;
  public lastActivity: Date;
  public revokedAt: Date | null;

  private static readonly ACTIVITY_TIMEOUT_MINUTES = 30;

  private constructor(props: LoginSessionProps & { id: string; createdAt: Date }) {
    super(props);
    this.ipAddress = props.ipAddress;
    this.userAgent = props.userAgent;
    this.deviceId = props.deviceId;
    this.lastActivity = props.lastActivity;
    this.revokedAt = props.revokedAt;
  }

  static create(props: Omit<LoginSessionProps, 'lastActivity' | 'revokedAt'>): LoginSession {
    const now = new Date();
    return new LoginSession({
      ...props,
      id: randomUUID(),
      createdAt: now,
      lastActivity: now,
      revokedAt: null,
    });
  }

  static fromPersistence(props: LoginSessionProps & { id: string; createdAt: Date }): LoginSession {
    return new LoginSession(props);
  }

  validate(): void {
    if (this.revokedAt) throw new TokenRevokedError();
    if (this.isExpired()) throw new TokenExpiredError();
    if (this.isInactive()) {
      throw new TokenError('Session is inactive due to inactivity timeout.');
    }
  }

  updateActivity(): void {
    this.validate();
    this.lastActivity = new Date();
  }

  revoke(): void {
    if (this.revokedAt) return;
    this.revokedAt = new Date();
  }

  isInactive(): boolean {
    const now = new Date().getTime();
    const lastActivityTime = this.lastActivity.getTime();
    const timeoutMs = LoginSession.ACTIVITY_TIMEOUT_MINUTES * 60 * 1000;
    return now - lastActivityTime > timeoutMs;
  }

  canBeUsed(): boolean {
    return !this.revokedAt && !this.isExpired() && !this.isInactive();
  }

  isSameDevice(deviceId: string): boolean {
    return this.deviceId === deviceId;
  }

  isSameIP(ipAddress: string): boolean {
    return this.ipAddress === ipAddress;
  }

  getDeviceInfo(): { deviceId: string | null; userAgent: string | null; ipAddress: string | null } {
    return {
      deviceId: this.deviceId,
      userAgent: this.userAgent,
      ipAddress: this.ipAddress,
    };
  }

  getSessionDuration(): number {
    const now = new Date().getTime();
    const startTime = this.createdAt.getTime();
    return now - startTime;
  }

  getSessionDurationInMinutes(): number {
    return Math.floor(this.getSessionDuration() / (1000 * 60));
  }

  getInactivityDuration(): number {
    const now = new Date().getTime();
    const lastActivityTime = this.lastActivity.getTime();
    return now - lastActivityTime;
  }

  getInactivityDurationInMinutes(): number {
    return Math.floor(this.getInactivityDuration() / (1000 * 60));
  }
}

// ============================================================================
// Token Factory (Optional Helper)
// ============================================================================

export class TokenFactory {
  static createPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiryHours: number = 1,
  ): PasswordResetToken {
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    return PasswordResetToken.create({ tokenHash, userId, expiresAt });
  }

  static createEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiryHours: number = 24,
  ): EmailVerificationToken {
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    return EmailVerificationToken.create({ tokenHash, userId, expiresAt });
  }

  static createPhoneVerificationToken(
    userId: string,
    tokenHash: string,
    expiryMinutes: number = 10,
  ): PhoneVerificationToken {
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    return PhoneVerificationToken.create({ tokenHash, userId, expiresAt });
  }

  static createEmailChangeToken(
    userId: string,
    newEmail: string,
    tokenHash: string,
    expiryHours: number = 24,
  ): EmailChangeToken {
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    return EmailChangeToken.create({ tokenHash, userId, newEmail, expiresAt });
  }

  static createRefreshToken(
    userId: string,
    tokenHash: string,
    expiryDays: number = 7,
    metadata?: { deviceId?: string; ipAddress?: string; userAgent?: string },
  ): RefreshToken {
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    return RefreshToken.create({
      tokenHash,
      userId,
      expiresAt,
      revokedAt: null,
      deviceId: metadata?.deviceId ?? null,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
    });
  }

  static createLoginSession(
    userId: string,
    tokenHash: string,
    expiryHours: number = 24,
    metadata?: { deviceId?: string; ipAddress?: string; userAgent?: string },
  ): LoginSession {
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    return LoginSession.create({
      tokenHash,
      userId,
      expiresAt,
      deviceId: metadata?.deviceId ?? null,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
    });
  }
}
