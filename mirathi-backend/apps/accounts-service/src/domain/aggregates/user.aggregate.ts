// src/domain/aggregates/user.aggregate.ts
import { AccountStatus, UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { UserIdentity, UserProfile, UserSettings } from '../entities';
import {
  DomainError,
  LastIdentityError,
  UserDeletedError,
  UserSuspendedError,
} from '../errors/domain.errors';
import {
  DomainEvent,
  IdentityLinkedEvent,
  ProfileUpdatedEvent,
  RoleChangedEvent,
  SettingsUpdatedEvent,
  UserActivatedEvent,
  UserDeletedEvent,
  UserOnboardingCompletedEvent,
  UserRegisteredEvent,
  UserRestoredEvent,
  UserSuspendedEvent,
} from '../events';
import { UserInvariants } from '../invariants/user.invariants';
import { County, PhoneNumber, Timestamp } from '../value-objects';

/**
 * Aggregate Root Properties
 */
export interface UserProps {
  id: string;
  role: UserRole;
  status: AccountStatus;
  identities: UserIdentity[];
  profile?: UserProfile;
  settings?: UserSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
}

/**
 * User Aggregate Root
 *
 * Single source of truth for all business logic and state changes.
 * Enforces all domain invariants and emits domain events.
 */
export class User {
  private readonly _id: string;
  private _role: UserRole;
  private _status: AccountStatus;
  private _identities: UserIdentity[];
  private _profile?: UserProfile;
  private _settings?: UserSettings;
  private readonly _createdAt: Timestamp;
  private _updatedAt: Timestamp;
  private _deletedAt?: Timestamp;

  private readonly _domainEvents: DomainEvent[] = [];

  private constructor(props: UserProps) {
    this._id = props.id;
    this._role = props.role;
    this._status = props.status;
    this._identities = props.identities;
    this._profile = props.profile;
    this._settings = props.settings;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;

    UserInvariants.validateAll(this, 'create user');
  }

  // ======================================================================
  // FACTORY METHODS
  // ======================================================================

  static registerViaOAuth(props: {
    provider: any;
    providerUserId: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }): User {
    const userId = uuidv4();
    const now = Timestamp.now();

    // Use email parts for name if not provided
    const firstName = props.firstName || props.email.split('@')[0] || 'User';
    const lastName = props.lastName || '';

    const identity = UserIdentity.create({
      id: uuidv4(),
      provider: props.provider,
      providerUserId: props.providerUserId,
      email: props.email,
      isPrimary: true,
    });

    const profile = UserProfile.create({
      id: uuidv4(),
      userId: userId,
      firstName,
      lastName,
    });

    const settings = UserSettings.create({
      id: uuidv4(),
      userId: userId,
    });

    const user = new User({
      id: userId,
      role: UserRole.USER,
      status: AccountStatus.PENDING_ONBOARDING,
      identities: [identity],
      profile,
      settings,
      createdAt: now,
      updatedAt: now,
    });

    user.addDomainEvent(
      new UserRegisteredEvent({
        userId,
        provider: props.provider,
        providerUserId: props.providerUserId,
        email: props.email,
        firstName,
        lastName,
        role: UserRole.USER,
        registeredAt: now.toISOString(),
      }),
    );

    return user;
  }

  static fromPersistence(props: {
    id: string;
    role: UserRole;
    status: AccountStatus;
    identities: any[];
    profile?: any;
    settings?: any;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
  }): User {
    const identities = props.identities.map((i) => UserIdentity.fromPersistence(i));
    const profile = props.profile ? UserProfile.fromPersistence(props.profile) : undefined;
    const settings = props.settings ? UserSettings.fromPersistence(props.settings) : undefined;

    return new User({
      id: props.id,
      role: props.role,
      status: props.status,
      identities,
      profile,
      settings,
      createdAt: Timestamp.create(props.createdAt),
      updatedAt: Timestamp.create(props.updatedAt),
      deletedAt: props.deletedAt ? Timestamp.create(props.deletedAt) : undefined,
    });
  }

  // ======================================================================
  // GETTERS
  // ======================================================================

  get id(): string {
    return this._id;
  }

  get role(): UserRole {
    return this._role;
  }

  get status(): AccountStatus {
    return this._status;
  }

  get identities(): UserIdentity[] {
    return [...this._identities];
  }

  get profile(): UserProfile | undefined {
    return this._profile;
  }

  get settings(): UserSettings | undefined {
    return this._settings;
  }

  get createdAt(): Timestamp {
    return this._createdAt;
  }

  get updatedAt(): Timestamp {
    return this._updatedAt;
  }

  get deletedAt(): Timestamp | undefined {
    return this._deletedAt;
  }

  get isDeleted(): boolean {
    return !!this._deletedAt;
  }

  get isSuspended(): boolean {
    return this._status === AccountStatus.SUSPENDED;
  }

  get isActive(): boolean {
    return this._status === AccountStatus.ACTIVE;
  }

  get isPendingOnboarding(): boolean {
    return this._status === AccountStatus.PENDING_ONBOARDING;
  }

  get primaryIdentity(): UserIdentity | undefined {
    return this._identities.find((id) => id.isPrimary);
  }

  get phoneNumber(): PhoneNumber | undefined {
    return this._profile?.phoneNumber;
  }

  get isPhoneVerified(): boolean {
    return this._profile?.phoneVerified || false;
  }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  // ======================================================================
  // PRIVATE HELPERS
  // ======================================================================

  private addDomainEvent(event: DomainEvent) {
    this._domainEvents.push(event);
  }

  private updateTimestamp() {
    this._updatedAt = Timestamp.now();
  }

  private ensureNotDeleted(action: string) {
    if (this.isDeleted) throw new UserDeletedError(`Cannot ${action} on deleted user`);
  }

  private ensureNotSuspended(action: string) {
    if (this.isSuspended) throw new UserSuspendedError(`Cannot ${action} while suspended`);
  }

  private ensureActiveOrPending(action: string) {
    if (!this.isActive && !this.isPendingOnboarding) {
      throw new DomainError(`User must be active or pending to ${action}`);
    }
  }

  private ensureHasProfile(): UserProfile {
    if (!this._profile) throw new DomainError('Profile is required');
    return this._profile;
  }

  private ensureHasSettings(): UserSettings {
    if (!this._settings) throw new DomainError('Settings are required');
    return this._settings;
  }

  // ======================================================================
  // IDENTITY MANAGEMENT
  // ======================================================================

  linkIdentity(props: { provider: any; providerUserId: string; email: string }) {
    this.ensureNotDeleted('link identity');
    this.ensureNotSuspended('link identity');

    const exists = this._identities.find(
      (i) => i.provider === props.provider && i.providerUserId === props.providerUserId,
    );
    if (exists) {
      exists.markAsUsed();
      return;
    }

    const identity = UserIdentity.create({
      id: uuidv4(),
      provider: props.provider,
      providerUserId: props.providerUserId,
      email: props.email,
      isPrimary: false,
    });

    this._identities.push(identity);
    this.updateTimestamp();

    this.addDomainEvent(
      new IdentityLinkedEvent({
        userId: this._id,
        provider: props.provider,
        providerUserId: props.providerUserId,
        email: props.email,
        linkedAt: Timestamp.now().toISOString(),
      }),
    );

    UserInvariants.validateAll(this, 'link identity');
  }

  removeIdentity(identityId: string) {
    this.ensureNotDeleted('remove identity');
    this.ensureNotSuspended('remove identity');

    if (this._identities.length <= 1) throw new LastIdentityError();

    const identityToRemove = this._identities.find((id) => id.id === identityId);
    if (!identityToRemove) throw new DomainError('Identity not found');

    if (identityToRemove.isPrimary) {
      const other = this._identities.find((i) => i.id !== identityId);
      if (other) other.setPrimary(true);
    }

    this._identities = this._identities.filter((i) => i.id !== identityId);
    this.updateTimestamp();

    UserInvariants.validateAll(this, 'remove identity');
  }

  setPrimaryIdentity(identityId: string) {
    this.ensureNotDeleted('set primary identity');
    this.ensureNotSuspended('set primary identity');

    const identity = this._identities.find((id) => id.id === identityId);
    if (!identity) throw new DomainError('Identity not found');

    this._identities.forEach((i) => i.setPrimary(false));
    identity.setPrimary(true);
    identity.markAsUsed();
    this.updateTimestamp();

    UserInvariants.validateAll(this, 'set primary identity');
  }

  // ======================================================================
  // PROFILE MANAGEMENT
  // ======================================================================

  updateProfile(props: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    phoneNumber?: PhoneNumber;
    county?: string;
    physicalAddress?: string;
    postalAddress?: string;
  }) {
    this.ensureNotDeleted('update profile');
    this.ensureNotSuspended('update profile');
    this.ensureActiveOrPending('update profile');

    const profile = this.ensureHasProfile();
    const updatedFields: string[] = [];

    if (props.firstName || props.lastName) {
      profile.updateName(props.firstName ?? profile.firstName, props.lastName ?? profile.lastName);
      if (props.firstName) updatedFields.push('firstName');
      if (props.lastName) updatedFields.push('lastName');
    }

    if (props.avatarUrl !== undefined) {
      profile.updateAvatar(props.avatarUrl);
      updatedFields.push('avatarUrl');
    }

    if (props.phoneNumber !== undefined) {
      profile.updatePhoneNumber(props.phoneNumber);
      updatedFields.push('phoneNumber');
    }

    if (props.county !== undefined) {
      profile.updateCounty(props.county ? County.create(props.county) : undefined);
      updatedFields.push('county');
    }

    if (props.physicalAddress !== undefined) {
      profile.updatePhysicalAddress(props.physicalAddress);
      updatedFields.push('physicalAddress');
    }

    if (props.postalAddress !== undefined) {
      profile.updatePostalAddress(props.postalAddress);
      updatedFields.push('postalAddress');
    }

    if (updatedFields.length > 0) {
      this.updateTimestamp();
      this.addDomainEvent(
        new ProfileUpdatedEvent({
          userId: this._id,
          updatedFields,
          updatedAt: Timestamp.now().toISOString(),
        }),
      );
    }

    UserInvariants.validateAll(this, 'update profile');
  }

  updatePhoneNumber(phoneNumber?: PhoneNumber): void {
    this.ensureNotDeleted('update phone number');
    this.ensureNotSuspended('update phone number');
    this.ensureActiveOrPending('update phone number');

    const profile = this.ensureHasProfile();
    profile.updatePhoneNumber(phoneNumber);
    this.updateTimestamp();

    UserInvariants.validateAll(this, 'update phone number');
  }

  updatePhoneVerification(verified: boolean): void {
    this.ensureNotDeleted('update phone verification');
    this.ensureNotSuspended('update phone verification');
    this.ensureActiveOrPending('update phone verification');

    const profile = this.ensureHasProfile();
    profile.updatePhoneVerification(verified);
    this.updateTimestamp();

    UserInvariants.validateAll(this, 'update phone verification');
  }

  // ======================================================================
  // SETTINGS MANAGEMENT
  // ======================================================================

  updateSettings(props: {
    language?: any;
    theme?: any;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
    marketingOptIn?: boolean;
  }) {
    this.ensureNotDeleted('update settings');
    this.ensureNotSuspended('update settings');
    this.ensureActiveOrPending('update settings');

    const settings = this.ensureHasSettings();
    const updatedFields: string[] = [];

    if (props.language !== undefined) {
      settings.updateLanguage(props.language);
      updatedFields.push('language');
    }

    if (props.theme !== undefined) {
      settings.updateTheme(props.theme);
      updatedFields.push('theme');
    }

    if (props.emailNotifications !== undefined) {
      settings.updateEmailNotifications(props.emailNotifications);
      updatedFields.push('emailNotifications');
    }

    if (props.smsNotifications !== undefined) {
      settings.updateSmsNotifications(props.smsNotifications);
      updatedFields.push('smsNotifications');
    }

    if (props.pushNotifications !== undefined) {
      settings.updatePushNotifications(props.pushNotifications);
      updatedFields.push('pushNotifications');
    }

    if (props.marketingOptIn !== undefined) {
      settings.updateMarketingOptIn(props.marketingOptIn);
      updatedFields.push('marketingOptIn');
    }

    if (updatedFields.length > 0) {
      this.updateTimestamp();
      this.addDomainEvent(
        new SettingsUpdatedEvent({
          userId: this._id,
          updatedFields,
          updatedAt: Timestamp.now().toISOString(),
        }),
      );
    }

    UserInvariants.validateAll(this, 'update settings');
  }

  // ======================================================================
  // ACCOUNT STATUS & ROLES
  // ======================================================================

  activate(activatedBy?: string) {
    this.ensureNotDeleted('activate');
    if (this.isActive) return;

    this._status = AccountStatus.ACTIVE;
    this.updateTimestamp();

    this.addDomainEvent(
      new UserActivatedEvent({
        userId: this._id,
        activatedBy,
        activatedAt: Timestamp.now().toISOString(),
      }),
    );

    UserInvariants.validateAll(this, 'activate');
  }

  completeOnboarding() {
    this.ensureNotDeleted('complete onboarding');
    if (this.isActive) return;

    this._status = AccountStatus.ACTIVE;
    this.updateTimestamp();

    this.addDomainEvent(
      new UserOnboardingCompletedEvent({
        userId: this._id,
        completedAt: Timestamp.now().toISOString(),
      }),
    );

    UserInvariants.validateAll(this, 'complete onboarding');
  }

  suspend(by: string, reason?: string) {
    this.ensureNotDeleted('suspend');
    if (this.isSuspended) return;

    this._status = AccountStatus.SUSPENDED;
    this.updateTimestamp();

    this.addDomainEvent(
      new UserSuspendedEvent({
        userId: this._id,
        suspendedBy: by,
        reason,
        suspendedAt: Timestamp.now().toISOString(),
      }),
    );

    UserInvariants.validateAll(this, 'suspend');
  }

  unsuspend(_by: string) {
    this.ensureNotDeleted('unsuspend');
    if (!this.isSuspended) return;

    this._status = AccountStatus.ACTIVE;
    this.updateTimestamp();

    UserInvariants.validateAll(this, 'unsuspend');
  }

  archive() {
    this.ensureNotDeleted('archive');
    this._status = AccountStatus.ARCHIVED;
    this.updateTimestamp();

    UserInvariants.validateAll(this, 'archive');
  }

  changeRole(newRole: UserRole, changedBy: string, reason?: string) {
    this.ensureNotDeleted('change role');
    if (this._role === newRole) return;

    const oldRole = this._role;
    this._role = newRole;
    this.updateTimestamp();

    this.addDomainEvent(
      new RoleChangedEvent({
        userId: this._id,
        oldRole,
        newRole,
        changedBy,
        reason,
        changedAt: Timestamp.now().toISOString(),
      }),
    );

    UserInvariants.validateAll(this, 'change role');
  }

  delete(deletedBy?: string) {
    if (this.isDeleted) return;

    this._deletedAt = Timestamp.now();
    this._status = AccountStatus.ARCHIVED;
    this.updateTimestamp();

    this.addDomainEvent(
      new UserDeletedEvent({
        userId: this._id,
        deletedBy,
        deletedAt: this._deletedAt.toISOString(),
      }),
    );

    UserInvariants.validateAll(this, 'delete');
  }

  restore() {
    if (!this.isDeleted) return;

    this._deletedAt = undefined;
    this._status = AccountStatus.ACTIVE;
    this.updateTimestamp();

    this.addDomainEvent(
      new UserRestoredEvent({
        userId: this._id,
        restoredAt: Timestamp.now().toISOString(),
      }),
    );

    UserInvariants.validateAll(this, 'restore');
  }

  // ======================================================================
  // BUSINESS LOGIC METHODS
  // ======================================================================

  get displayName(): string {
    if (this._profile) {
      return this._profile.fullName;
    }

    // Fallback to email from primary identity
    const primary = this.primaryIdentity;
    if (primary?.email) {
      return primary.email.split('@')[0];
    }

    return 'User';
  }

  get hasCompletedOnboarding(): boolean {
    return this.isActive && this._profile !== undefined && this._settings !== undefined;
  }

  get needsOnboarding(): boolean {
    return this.isPendingOnboarding || !this._profile || !this._settings;
  }

  canReceiveSms(): boolean {
    if (!this._settings) return false;
    if (!this._profile?.phoneNumber) return false;
    if (!this.isPhoneVerified) return false;

    return this._settings.smsNotifications && this.isActive;
  }

  canReceiveEmail(): boolean {
    if (!this._settings) return false;
    if (!this.primaryIdentity?.email) return false;

    return this._settings.emailNotifications && this.isActive;
  }

  // ======================================================================
  // PERSISTENCE METHODS
  // ======================================================================

  toPersistence() {
    return {
      id: this._id,
      role: this._role,
      status: this._status,
      identities: this._identities.map((i) => i.toPersistence()),
      profile: this._profile?.toPersistence(),
      settings: this._settings?.toPersistence(),
      createdAt: this._createdAt.value,
      updatedAt: this._updatedAt.value,
      deletedAt: this._deletedAt?.value,
    };
  }

  clearDomainEvents() {
    this._domainEvents.length = 0;
  }
}
