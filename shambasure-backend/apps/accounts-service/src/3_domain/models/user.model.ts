import { UserRole } from '@shamba/common';
import { Email, Password } from '../value-objects';
import {
  DomainEvent,
  UserCreatedEvent,
  UserUpdatedEvent,
  UpdatedFields,
  EmailVerifiedEvent,
  RoleChangedEvent,
  UserLockedEvent,
  UserDeletedEvent,
  PasswordChangedEvent,
  PasswordResetEvent,
} from '../events';

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

  private readonly _domainEvents: DomainEvent[] = [];

  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MINUTES = 15;

  private constructor(props: UserProps) {
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
  }

  /**
   * Factory for creating a brand new user (e.g., during registration).
   */
  static create(props: {
    id: string;
    email: Email;
    password: Password;
    firstName: string;
    lastName: string;
    marketingOptIn: boolean;
  }): User {
    const now = new Date();
    const user = new User({
      id: props.id,
      email: props.email,
      password: props.password,
      firstName: props.firstName,
      lastName: props.lastName,
      role: UserRole.USER,
      isActive: false, // Start as inactive until email is verified
      lastLoginAt: null,
      loginAttempts: 0,
      lockedUntil: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

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
  static fromPersistence(props: UserProps): User {
    return new User(props);
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

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }

  // ============================================================================
  // Business Logic Methods
  // ============================================================================

  async login(plainPassword: string): Promise<boolean> {
    if (this.isLocked()) throw new AccountLockedError(this._lockedUntil!);
    if (!this._isActive)
      throw new UserDomainError('Account is inactive. Please verify your email.');

    const isValid = await this._password.compare(plainPassword);
    if (isValid) {
      this._loginAttempts = 0;
      this._lastLoginAt = new Date();
      this._lockedUntil = null;
      this._updatedAt = new Date();
      // NOTE: A UserLoggedIn event could be added here if needed
      return true;
    } else {
      this.incrementLoginAttempts();
      return false;
    }
  }

  private incrementLoginAttempts(): void {
    this._loginAttempts++;
    this._updatedAt = new Date();
    if (this._loginAttempts >= User.MAX_LOGIN_ATTEMPTS) {
      this.lock({ reason: 'failed_attempts' });
    }
  }

  lock(props: {
    reason: 'failed_attempts' | 'admin_action' | 'suspicious_activity';
    by?: string;
    durationMinutes?: number;
  }): void {
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

  unlock(): void {
    this._lockedUntil = null;
    this._loginAttempts = 0;
    this._updatedAt = new Date();
  }

  isLocked(): boolean {
    return this._lockedUntil ? new Date() < this._lockedUntil : false;
  }

  async changePassword(currentPassword: string, newPassword: Password): Promise<void> {
    const isValid = await this._password.compare(currentPassword);
    if (!isValid) throw new IncorrectPasswordError();

    this._password = newPassword;
    this._updatedAt = new Date();

    // Add this line
    this.addDomainEvent(
      new PasswordChangedEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        firstName: this.firstName,
      }),
    );
  }

  resetPassword(newPassword: Password): void {
    this._password = newPassword;
    this.unlock();
    this._updatedAt = new Date();

    // Add this line
    this.addDomainEvent(
      new PasswordResetEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        firstName: this.firstName,
      }),
    );
  }

  updateInfo(props: { firstName?: string; lastName?: string }): void {
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
      this.addDomainEvent(new UserUpdatedEvent({ aggregateId: this.id, updatedFields }));
    }
  }

  changeRole(newRole: UserRole, changedByAdminId: string): void {
    if (this._role === newRole) return;

    const oldRole = this._role;
    this._role = newRole;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new RoleChangedEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        oldRole: oldRole,
        newRole: this.role,
        changedBy: changedByAdminId,
      }),
    );
  }

  softDelete(): void {
    if (this._deletedAt) return;

    this._deletedAt = new Date();
    this._isActive = false;
    this._updatedAt = new Date();

    // Add this line
    this.addDomainEvent(
      new UserDeletedEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
      }),
    );
  }

  /** Call this after a user successfully verifies their email. */
  activate(): void {
    if (this._isActive) return;

    this._isActive = true;
    this.unlock();
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
}
