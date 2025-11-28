import { randomUUID } from 'crypto';

import { UserRole } from '@shamba/common';

import {
  DomainEvent,
  EmailChangeRequestedEvent,
  EmailChangedEvent,
  EmailVerifiedEvent,
  LoginFailedEvent,
  PasswordChangedEvent,
  PasswordResetEvent,
  PhoneNumberUpdatedEvent,
  PhoneVerificationRequestedEvent,
  ProfileUpdatedEvent,
  RoleChangedEvent,
  SessionRevokedEvent,
  SuspiciousActivityDetectedEvent,
  UserCreatedEvent,
  UserDeactivatedEvent,
  UserDeletedEvent,
  UserLockedEvent,
  UserLoggedInEvent,
  UserLoggedOutEvent,
  UserReactivatedEvent,
  UserUnlockedEvent,
  UserUpdatedEvent,
} from '../events';
import { Email, Password, PhoneNumber } from '../value-objects';
import { Address, NextOfKin, UserProfile } from './user-profile.model';

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

/** Thrown when phone number validation fails. */
export class InvalidPhoneNumberError extends UserDomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPhoneNumberError';
  }
}

export class PasswordReuseError extends UserDomainError {
  constructor() {
    super('Cannot reuse a recent password.');
    this.name = 'PasswordReuseError';
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
  private _profile: UserProfile;

  public readonly _domainEvents: DomainEvent[] = [];

  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MINUTES = 15;
  private static readonly SUSPICIOUS_ACTIVITY_THRESHOLD = 3;

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
  static create(props: {
    id: string;
    email: Email;
    password: Password;
    firstName: string;
    lastName: string;
    marketingOptIn: boolean;
  }): User {
    const now = new Date();

    // 1. Create the UserProfile internally. It belongs to the User.
    const profile = UserProfile.create({
      id: randomUUID(), // Generate a new UUID for the profile
      userId: props.id, // Link it to the user's ID
      marketingOptIn: props.marketingOptIn,
    });

    // 2. Create the User instance, passing the internally created profile to the constructor.
    const user = new User(
      {
        id: props.id,
        email: props.email,
        password: props.password,
        firstName: props.firstName,
        lastName: props.lastName,
        role: UserRole.USER,
        isActive: false, // User must verify email first
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
        requiresEmailVerification: true,
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
  get isEmailVerified(): boolean {
    return this._profile.isEmailVerified;
  }
  get isPhoneVerified(): boolean {
    return this._profile.isPhoneVerified;
  }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
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

  private _clearExpiredLock(): void {
    if (this._lockedUntil && new Date() >= this._lockedUntil) {
      this._lockedUntil = null;
      this._loginAttempts = 0;
      // You could even add a domain event here if you want to log auto-unlocks
    }
  }
  private ensureNotDeleted(): void {
    if (this.isDeleted) {
      throw new UserDeletedError();
    }
  }

  private ensureNotLocked(): void {
    this._clearExpiredLock(); // Explicitly update status first
    if (this._lockedUntil) {
      // Now check the result
      throw new AccountLockedError(this._lockedUntil);
    }
  }

  private ensureActive(): void {
    if (!this._isActive) {
      throw new UserDomainError('Account is inactive. Please verify your email.');
    }
  }

  private ensureEmailVerified(): void {
    if (!this.isEmailVerified) {
      throw new UserDomainError('Email verification required for this action.');
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

      this.addDomainEvent(
        new UserLoggedInEvent({
          aggregateId: this.id,
          email: this.email.getValue(),
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
          deviceId: metadata?.deviceId,
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

    // Check for suspicious activity (multiple failed attempts from same device/IP)
    if (this._loginAttempts >= User.SUSPICIOUS_ACTIVITY_THRESHOLD) {
      this.addDomainEvent(
        new SuspiciousActivityDetectedEvent({
          aggregateId: this.id,
          email: this.email.getValue(),
          activityType: 'multiple_failed_logins',
          severity: 'medium',
          details: {
            attemptCount: this._loginAttempts,
            ipAddress: metadata?.ipAddress,
            deviceId: metadata?.deviceId,
          },
        }),
      );
    }

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

    if (this.isLocked()) return;

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

    if (!this.isLocked()) return;

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
    // You can still call it here to ensure the state is always fresh when checked
    this._clearExpiredLock();
    return this._lockedUntil !== null;
  }
  public restore(restoredBy: string, reason?: string): void {
    if (!this.isDeleted) {
      // It's good practice for domain methods to protect their own state.
      return;
    }

    this._deletedAt = null;
    // The `reactivate` method can be called internally to handle the rest.
    this.reactivate(restoredBy, reason ?? 'Admin restored user');
  }

  // ============================================================================
  // Password Management
  // ============================================================================

  async changePassword(
    currentPassword: string,
    newPassword: Password,
    recentPasswordHashes: string[],
  ): Promise<void> {
    this.ensureNotDeleted();
    this.ensureActive();
    this.ensureEmailVerified();

    const isValid = await this._password.compare(currentPassword);
    if (!isValid) {
      throw new IncorrectPasswordError();
    }

    for (const hash of recentPasswordHashes) {
      if (await newPassword.matchesHash(hash)) {
        throw new PasswordReuseError();
      }
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

  async resetPassword(newPassword: Password, recentPasswordHashes: string[]): Promise<void> {
    this.ensureNotDeleted();

    // Check against password history
    for (const hash of recentPasswordHashes) {
      if (await newPassword.matchesHash(hash)) {
        // NOTE: We are throwing a generic error here to avoid confirming anything to a potential attacker.
        // A more specific PasswordReuseError could be used in `changePassword`.
        throw new UserDomainError('Invalid new password.');
      }
    }

    this._password = newPassword;
    this.unlock(); // A password reset should always unlock the account
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
    this.ensureEmailVerified();

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
    this._profile.markEmailAsUnverified(); // New email needs verification
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
  // Phone Number Management
  // ============================================================================

  updatePhoneNumber(phoneNumber: PhoneNumber): void {
    this.ensureNotDeleted();
    this.ensureActive();
    this.ensureEmailVerified(); // Require email verification before adding phone

    if (this._profile.phoneNumber && this._profile.phoneNumber.equals(phoneNumber)) {
      return; // No change
    }

    const previousPhone = this._profile.phoneNumber?.getValue();
    this._profile.updatePhoneNumber(phoneNumber);
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PhoneNumberUpdatedEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        previousPhone: previousPhone,
        newPhone: phoneNumber.getValue(),
      }),
    );

    // Automatically request phone verification when number is updated
    this.requestPhoneVerification();
  }
  removePhoneNumber(): void {
    this.ensureNotDeleted();

    const previousPhone = this._profile.phoneNumber?.getValue();

    if (previousPhone) {
      this._profile.removePhoneNumber(); // Delegate to the profile model
      this._updatedAt = new Date();
      // Optionally, you can create and add a new PhoneNumberRemovedEvent here
      // For example:
      // this.addDomainEvent(new PhoneNumberRemovedEvent({ ... }));
    }
  }
  requestPhoneVerification(): void {
    this.ensureNotDeleted();
    this.ensureActive();

    if (!this._profile.phoneNumber) {
      throw new InvalidPhoneNumberError('Phone number must be set before verification');
    }

    this.addDomainEvent(
      new PhoneVerificationRequestedEvent({
        aggregateId: this.id,
        email: this.email.getValue(),
        phoneNumber: this._profile.phoneNumber.getValue(),
      }),
    );
  }

  verifyPhone(): void {
    this.ensureNotDeleted();
    this.ensureActive();

    if (!this._profile.phoneNumber) {
      throw new InvalidPhoneNumberError('Phone number must be set before verification');
    }

    this._profile.markPhoneAsVerified();
    this._updatedAt = new Date();
  }

  // ============================================================================
  // Account Activation & Status Management
  // ============================================================================

  activate(): void {
    this.ensureNotDeleted();

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

  deactivate(deactivatedBy: string, reason?: string): void {
    this.ensureNotDeleted();

    if (!this._isActive) return;

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

    if (this._isActive) return;

    this._isActive = true;
    this.unlock();
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

  updateProfile(props: {
    bio?: string;
    marketingOptIn?: boolean;
    address?: Address | null;
    nextOfKin?: NextOfKin | null;
  }): void {
    this.ensureNotDeleted();
    this.ensureActive();

    const updatedFields = this._profile.update(props);
    this._updatedAt = new Date();

    if (Object.keys(updatedFields).length > 0) {
      this.addDomainEvent(
        new ProfileUpdatedEvent({
          aggregateId: this.id,
          email: this.email.getValue(),
          updatedFields,
        }),
      );
    }
  }

  changeRole(newRole: UserRole, changedByAdminId: string, reason?: string): void {
    this.ensureNotDeleted();

    if (this._role === newRole) return;

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
  updateMarketingPreferences(optIn: boolean): void {
    this.ensureNotDeleted();
    this.ensureActive();

    const result = this._profile.updateMarketingPreferences(optIn);

    if (result.updatedFields.length > 0) {
      this._updatedAt = new Date();
      // You can add a specific MarketingPreferencesUpdatedEvent here if you want
    }
  }
  public removeAddress(): void {
    this.ensureNotDeleted(); // This method exists here, so this is CORRECT.

    // Call the method on the internal profile object
    const result = this._profile.removeAddress();

    // Check if the profile actually changed
    if (result.updatedFields.length > 0) {
      this._updatedAt = new Date(); // Update the aggregate's timestamp

      // The aggregate root is responsible for adding the event
      this.addDomainEvent(
        new ProfileUpdatedEvent({
          // This method exists here, so this is CORRECT.
          aggregateId: this.id,
          email: this.email.getValue(),
          updatedFields: result.changes,
        }),
      );
    }
  }
  public removeNextOfKin(): void {
    this.ensureNotDeleted();

    const result = this._profile.removeNextOfKin();

    if (result.updatedFields.length > 0) {
      this._updatedAt = new Date();

      this.addDomainEvent(
        new ProfileUpdatedEvent({
          aggregateId: this.id,
          email: this.email.getValue(), // Include the email to match the event's required data
          updatedFields: result.changes,
        }),
      );
    }
  }
  public setInitialAdminState(
    props: {
      role?: UserRole;
      isActive?: boolean;
      isEmailVerified?: boolean;
    },
    adminId: string,
  ): void {
    // Set role if specified and different from default
    if (props.role && props.role !== this._role) {
      this.changeRole(props.role, adminId, 'Set during admin creation');
    }

    // Deactivate if specified as false
    if (props.isActive === false) {
      this.deactivate(adminId, 'Set as inactive during admin creation');
    }

    // Mark email as verified if specified
    if (props.isEmailVerified === true) {
      // This is a profile action, but the aggregate root controls it
      this._profile.markEmailAsVerified();
    }
  }
  public updateByAdmin(
    props: {
      firstName?: string;
      lastName?: string;
      email?: Email;
      isActive?: boolean;
      lockedUntil?: Date | null;
      loginAttempts?: number;
      isEmailVerified?: boolean;
      isPhoneVerified?: boolean;
      marketingOptIn?: boolean;
    },
    adminId: string, // The context is now just the adminId string
  ): void {
    this.ensureNotDeleted();

    this.updateInfo({ firstName: props.firstName, lastName: props.lastName });

    // --- EMAIL LOGIC IS NOW SIMPLER ---
    // The service is responsible for checking uniqueness BEFORE calling this.
    if (props.email && !this.email.equals(props.email)) {
      this.confirmEmailChange(props.email);
    }

    // Update active status
    if (props.isActive !== undefined && props.isActive !== this.isActive) {
      if (props.isActive) {
        this.reactivate(adminId, 'Admin action');
      } else {
        this.deactivate(adminId, 'Admin action');
      }
    }

    // Update lock status
    if (props.lockedUntil !== undefined) {
      if (props.lockedUntil === null) {
        this.unlock(adminId);
      } else {
        const durationMinutes = Math.ceil((props.lockedUntil.getTime() - Date.now()) / (1000 * 60));
        if (durationMinutes > 0) {
          this.lock({ reason: 'admin_action', by: adminId, durationMinutes });
        }
      }
    }

    if (props.loginAttempts === 0 && this.loginAttempts > 0) {
      this.unlock(adminId);
    }

    // --- Profile Updates (These are correct) ---
    if (
      props.isEmailVerified !== undefined &&
      props.isEmailVerified !== this._profile.isEmailVerified
    ) {
      if (props.isEmailVerified) {
        this._profile.markEmailAsVerified();
      } else {
        this._profile.markEmailAsUnverified();
      }
    }
    if (
      props.isPhoneVerified !== undefined &&
      props.isPhoneVerified !== this._profile.isPhoneVerified
    ) {
      if (props.isPhoneVerified) {
        this._profile.markPhoneAsVerified();
      } else {
        // Assuming you have a method for this, based on your original code.
        // If not, you might need to add `this._profile._phoneVerified = false;`
        this._profile.resetPhoneVerification();
      }
    }
    if (props.marketingOptIn !== undefined) {
      this._profile.updateMarketingPreferences(props.marketingOptIn);
    }
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
      isEmailVerified: this.isEmailVerified,
      isPhoneVerified: this.isPhoneVerified,
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
