import { UserRole } from '@shamba/common';
import { Email, Password } from '../value-objects';
import {
  DomainEvent,
  UserCreatedEvent,
  UserUpdatedEvent,
  EmailVerifiedEvent,
  RoleChangedEvent,
  UserLockedEvent,
  UserUnlockedEvent,
  UserDeletedEvent,
  UserDeactivatedEvent,
  UserReactivatedEvent,
  PasswordChangedEvent,
  PasswordResetEvent,
  UserLoggedInEvent,
  LoginFailedEvent,
  EmailChangeRequestedEvent,
  EmailChangedEvent,
  UserLoggedOutEvent,
  SessionRevokedEvent,
} from '../events';
import { UserProfile } from './user-profile.model';

// ============================================================================
// Custom Domain Errors
// ============================================================================

/** Base error for user-related business rule violations. */
export class UserDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserDomainError';
  }
}

/** Thrown when an action is attempted on a locked account. */
export class AccountLockedError extends UserDomainError {
  constructor(public readonly lockedUntil: Date) {
    super(`Account is locked until ${lockedUntil.toISOString()}`);
    this.name = 'AccountLockedError';
  }
}

/** Thrown when a password comparison fails. */
export class IncorrectPasswordError extends UserDomainError {
  constructor() {
    super('The provided password is incorrect.');
    this.name = 'IncorrectPasswordError';
  }
}

/** Thrown when trying to perform actions on deleted users. */
export class UserDeletedError extends UserDomainError {
  constructor() {
    super('Cannot perform actions on a deleted user.');
    this.name = 'UserDeletedError';
  }
}

/** Thrown when email change validation fails. */
export class InvalidEmailChangeError extends UserDomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailChangeError';
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface UpdatedFields {
  [key: string]: { old: any; new: any };
}

export interface LoginMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
}

// ============================================================================
// User Aggregate Root
// ============================================================================

/**
 * The properties required to rehydrate a User from persistence.
 */
export interface UserProps {
  id: string;
  email: Email;
  password: Password;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  loginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * User Domain Model (Aggregate Root).
 * This class is the single source of truth for all business logic
 * and state changes related to a user.
 */
export class User {
  private readonly _id: string;
  private _email: Email;
  private _password: Password;
  private _firstName: string;
  private _lastName: string;
  private _role: UserRole;
  private _isActive: boolean;
  private _lastLoginAt: Date | null;
  private _loginAttempts: number;
  private _lockedUntil: Date | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;
  private readonly _profile: UserProfile;

  private readonly _domainEvents: DomainEvent[] = [];

  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MINUTES = 15;

  private constructor(props: UserProps, profile: UserProfile) {
    this._id = props.id;
    this._email = props.email;
    this._password = props.password;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._role = props.role;
    this._isActive = props.isActive;
    this._lastLoginAt = props.lastLoginAt;
    this._loginAttempts = props.loginAttempts;
    this._lockedUntil = props.lockedUntil;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;
    this._profile = profile;
  }

  /**
   * Factory for creating a brand new user (e.g., during registration).
   */
  static create(
    props: {
      id: string;
      email: Email;
      password: Password;
      firstName: string;
      lastName: string;
      marketingOptIn: boolean;
    },
    profile: UserProfile,
  ): User {
    const now = new Date();
    const user = new User(
      {
        id: props.id,
        email: props.email,
        password: props.password,
        firstName: props.firstName,
        lastName: props.lastName,
        role: UserRole.USER,
        isActive: false,
        lastLoginAt: null,
        loginAttempts: 0,
        lockedUntil: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      profile,
    );

    user.addDomainEvent(
      new UserCreatedEvent({
        aggregateId: user.id,
        email: user.email.getValue(),
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        marketingOptIn: props.marketingOptIn,
      }),
    );

    return user;
  }

  /**
   * Factory for re-hydrating an existing user from the database.
   */
  static fromPersistence(props: UserProps, profile: UserProfile): User {
    return new User(props, profile);
  }

  // ============================================================================
  // Getters & Event Management
  // ============================================================================

  get id(): string {
    return this._id;
  }
  get email(): Email {
    return this._email;
  }
  get password(): Password {
    return this._password;
  }
  get firstName(): string {
    return this._firstName;
  }
  get lastName(): string {
    return this._lastName;
  }
  get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }
  get role(): UserRole {
    return this._role;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get lastLoginAt(): Date | null {
    return this._lastLoginAt;
  }
  get loginAttempts(): number {
    return this._loginAttempts;
  }
  get lockedUntil(): Date | null {
    return this._lockedUntil;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get deletedAt(): Date | null {
    return this._deletedAt;
  }
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }
  get profile(): UserProfile {
    return this._profile;
  }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents]; // Return copy to prevent external mutations
  }

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }

  // ============================================================================
  // Guard Methods
  // ============================================================================

  private ensureNotDeleted(): void {
    if (this.isDeleted) {
      throw new UserDeletedError();
    }
  }

  private ensureNotLocked(): void {
    if (this.isLocked()) {
      throw new AccountLockedError(this._lockedUntil!);
    }
  }

  private ensureActive(): void {
    if (!this._isActive) {
      throw new UserDomainError('Account is inactive. Please verify your email.');
    }
  }

  // ============================================================================
  // Authentication & Session Management
  // ============================================================================

  async login(plainPassword: string, metadata?: LoginMetadata): Promise<boolean> {
    this.ensureNotDeleted();
    this.ensureNotLocked();
    this.ensureActive();

    const isValid = await this._password.compare(plainPassword);

    if (isValid) {
      this._loginAttempts = 0;
      this._lastLoginAt = new Date();
      this._lockedUntil = null;
      this._updatedAt = new Date();

      // FIX: Explicitly assign each metadata property, defaulting to undefined/null
      // This makes the linter happy by ensuring the passed object conforms perfectly to the required shape.
      this.addDomainEvent(
        new UserLoggedInEvent({
          aggregateId: this.id,
          email: this.email.getValue(),
          ipAddress: metadata?.ipAddress ?? undefined, // Explicit undefined
          userAgent: metadata?.userAgent ?? undefined, // Explicit undefined
          deviceId: metadata?.deviceId ?? undefined, // Explicit undefined
        }),
      );

      return true;
    } else {
      this.recordFailedLoginAttempt(metadata);
      return false;
    }
  }

  private recordFailedLoginAttempt(metadata?: LoginMetadata): void {
    this._loginAttempts++;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new LoginFailedEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        reason: 'incorrect_password',
        attemptCount: this._loginAttempts,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      }),
    );

    if (this._loginAttempts >= User.MAX_LOGIN_ATTEMPTS) {
      this.lock({ reason: 'failed_attempts' });
    }
  }

  logout(sessionId?: string, deviceId?: string): void {
    this.ensureNotDeleted();

    this.addDomainEvent(
      new UserLoggedOutEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        sessionId,
        deviceId,
      }),
    );
  }

  revokeAllSessions(revokedBy: string, sessionIds: string[], reason?: string): void {
    this.ensureNotDeleted();

    this.addDomainEvent(
      new SessionRevokedEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        sessionIds,
        revokedBy,
        reason,
      }),
    );
  }

  // ============================================================================
  // Account Security & Locking
  // ============================================================================

  lock(props: {
    reason: 'failed_attempts' | 'admin_action' | 'suspicious_activity';
    by?: string;
    durationMinutes?: number;
  }): void {
    this.ensureNotDeleted();

    if (this.isLocked()) return; // Already locked

    const duration = props.durationMinutes ?? User.LOCKOUT_DURATION_MINUTES;
    this._lockedUntil = new Date(Date.now() + duration * 60 * 1000);
    this._updatedAt = new Date();

    this.addDomainEvent(
      new UserLockedEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        reason: props.reason,
        lockedUntil: this._lockedUntil,
        lockedBy: props.by,
      }),
    );
  }

  unlock(unlockedBy?: string): void {
    this.ensureNotDeleted();

    if (!this.isLocked()) return; // Already unlocked

    const previousLockReason = 'Account was previously locked';

    this._lockedUntil = null;
    this._loginAttempts = 0;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new UserUnlockedEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        unlockedBy,
        previousLockReason,
      }),
    );
  }

  isLocked(): boolean {
    if (!this._lockedUntil) return false;

    const now = new Date();
    if (now >= this._lockedUntil) {
      // Auto-unlock if lockout period has expired
      this._lockedUntil = null;
      this._loginAttempts = 0;
      return false;
    }

    return true;
  }

  // ============================================================================
  // Password Management
  // ============================================================================

  async changePassword(currentPassword: string, newPassword: Password): Promise<void> {
    this.ensureNotDeleted();
    this.ensureActive();

    const isValid = await this._password.compare(currentPassword);
    if (!isValid) {
      throw new IncorrectPasswordError();
    }

    this._password = newPassword;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PasswordChangedEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        firstName: this.firstName,
      }),
    );
  }

  resetPassword(newPassword: Password): void {
    this.ensureNotDeleted();

    this._password = newPassword;
    this.unlock(); // Clear any locks on password reset
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PasswordResetEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        firstName: this.firstName,
      }),
    );
  }

  needsPasswordRehash(): boolean {
    return this._password.needsRehash();
  }

  async rehashPassword(plainPassword: string): Promise<void> {
    if (!this.needsPasswordRehash()) return;

    const isValid = await this._password.compare(plainPassword);
    if (!isValid) return;

    // Create new password hash with updated parameters
    const newPassword = await Password.create(plainPassword);
    this._password = newPassword;
    this._updatedAt = new Date();
  }

  // ============================================================================
  // Email Management
  // ============================================================================

  requestEmailChange(newEmail: Email, token: string): void {
    this.ensureNotDeleted();
    this.ensureActive();

    if (this.email.equals(newEmail)) {
      throw new InvalidEmailChangeError('New email must be different from current email');
    }

    this._updatedAt = new Date();

    this.addDomainEvent(
      new EmailChangeRequestedEvent({
        aggregateId: this.id,
        currentEmail: this.email.getValue(),
        newEmail: newEmail.getValue(),
        token,
      }),
    );
  }

  confirmEmailChange(newEmail: Email): void {
    this.ensureNotDeleted();

    if (this.email.equals(newEmail)) {
      throw new InvalidEmailChangeError('Email is already set to this value');
    }

    const previousEmail = this._email.getValue();
    this._email = newEmail;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new EmailChangedEvent({
        aggregateId: this.id,
        previousEmail,
        newEmail: newEmail.getValue(),
      }),
    );
  }

  // ============================================================================
  // Account Activation & Status Management
  // ============================================================================

  activate(): void {
    this.ensureNotDeleted();

    if (this._isActive) return; // Already active

    this._isActive = true;
    this.unlock(); // Clear any locks on activation
    this._updatedAt = new Date();

    this.addDomainEvent(
      new EmailVerifiedEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        firstName: this.firstName,
        lastName: this.lastName,
      }),
    );
  }

  deactivate(deactivatedBy: string, reason?: string): void {
    this.ensureNotDeleted();

    if (!this._isActive) return; // Already inactive

    this._isActive = false;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new UserDeactivatedEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        deactivatedBy,
        reason,
      }),
    );
  }

  reactivate(reactivatedBy: string, reason?: string): void {
    this.ensureNotDeleted();

    if (this._isActive) return; // Already active

    this._isActive = true;
    this.unlock(); // Clear any locks on reactivation
    this._updatedAt = new Date();

    this.addDomainEvent(
      new UserReactivatedEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        reactivatedBy,
        reason,
      }),
    );
  }

  softDelete(deletedBy?: string): void {
    this.ensureNotDeleted();

    this._deletedAt = new Date();
    this._isActive = false;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new UserDeletedEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        deletedBy,
      }),
    );
  }

  // ============================================================================
  // Profile & Role Management
  // ============================================================================

  updateInfo(props: { firstName?: string; lastName?: string }): void {
    this.ensureNotDeleted();

    const updatedFields: UpdatedFields = {};

    if (props.firstName && props.firstName !== this._firstName) {
      updatedFields.firstName = { old: this._firstName, new: props.firstName };
      this._firstName = props.firstName;
    }
    if (props.lastName && props.lastName !== this._lastName) {
      updatedFields.lastName = { old: this._lastName, new: props.lastName };
      this._lastName = props.lastName;
    }

    if (Object.keys(updatedFields).length > 0) {
      this._updatedAt = new Date();
      this.addDomainEvent(
        new UserUpdatedEvent({
          aggregateId: this.id,
          email: this.email.getValue(),
          updatedFields,
        }),
      );
    }
  }

  changeRole(newRole: UserRole, changedByAdminId: string, reason?: string): void {
    this.ensureNotDeleted();

    if (this._role === newRole) return; // Role unchanged

    const oldRole = this._role;
    this._role = newRole;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new RoleChangedEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        oldRole,
        newRole: this.role,
        changedBy: changedByAdminId,
        reason,
      }),
    );
  }

  hasRole(role: UserRole): boolean {
    return this._role === role;
  }

  isAdmin(): boolean {
    return this._role === UserRole.ADMIN;
  }

  isVerifier(): boolean {
    return this._role === UserRole.VERIFIER;
  }

  isAuditor(): boolean {
    return this._role === UserRole.AUDITOR;
  }

  isRegularUser(): boolean {
    return this._role === UserRole.USER;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  toJSON(): Record<string, any> {
    return {
      id: this._id,
      email: this._email.getValue(),
      firstName: this._firstName,
      lastName: this._lastName,
      fullName: this.fullName,
      role: this._role,
      isActive: this._isActive,
      lastLoginAt: this._lastLoginAt,
      loginAttempts: this._loginAttempts,
      lockedUntil: this._lockedUntil,
      isLocked: this.isLocked(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      isDeleted: this.isDeleted,
    };
  }
  public toPrimitives() {
    return {
      id: this._id,
      email: this._email.getValue(),
      passwordHash: this._password.getValue(),
      firstName: this._firstName,
      lastName: this._lastName,
      role: this._role,
      isActive: this._isActive,
      lastLoginAt: this._lastLoginAt,
      loginAttempts: this._loginAttempts,
      lockedUntil: this._lockedUntil,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
