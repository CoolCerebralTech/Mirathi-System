// src/domain/entities/user-identity.entity.ts
import { AuthProvider } from '@prisma/client';

import { Timestamp } from '../value-objects';

/**
 * User Identity Entity
 *
 * Represents a linked OAuth identity from an external provider.
 *
 * Business Rules:
 * 1. A user must have at least one identity
 * 2. Only one identity can be primary
 * 3. ProviderUserId must be unique per provider
 */
export interface UserIdentityProps {
  id: string;
  provider: AuthProvider;
  providerUserId: string;
  email?: string; // Email from OAuth provider
  isPrimary: boolean;
  linkedAt: Timestamp;
  lastUsedAt: Timestamp;
}

export class UserIdentity {
  private readonly _id: string;
  private readonly _provider: AuthProvider;
  private readonly _providerUserId: string;
  private readonly _email?: string;
  private _isPrimary: boolean;
  private _linkedAt: Timestamp;
  private _lastUsedAt: Timestamp;

  constructor(props: UserIdentityProps) {
    this.validate(props);

    this._id = props.id;
    this._provider = props.provider;
    this._providerUserId = props.providerUserId;
    this._email = props.email;
    this._isPrimary = props.isPrimary;
    this._linkedAt = props.linkedAt;
    this._lastUsedAt = props.lastUsedAt;
  }

  private validate(props: UserIdentityProps): void {
    if (!props.id) {
      throw new Error('UserIdentity must have an id');
    }

    if (!props.provider) {
      throw new Error('UserIdentity must have a provider');
    }

    if (!props.providerUserId) {
      throw new Error('UserIdentity must have a providerUserId');
    }

    if (props.email && !this.isValidEmail(props.email)) {
      throw new Error(`Invalid email: ${props.email}`);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Factory method to create a new UserIdentity from OAuth provider data
   */
  static create(props: {
    id: string;
    provider: AuthProvider;
    providerUserId: string;
    email?: string;
    isPrimary: boolean;
  }): UserIdentity {
    const now = Timestamp.now();

    return new UserIdentity({
      id: props.id,
      provider: props.provider,
      providerUserId: props.providerUserId,
      email: props.email,
      isPrimary: props.isPrimary,
      linkedAt: now,
      lastUsedAt: now,
    });
  }

  /**
   * Factory method to recreate from persistence
   */
  static fromPersistence(props: {
    id: string;
    provider: AuthProvider;
    providerUserId: string;
    email?: string;
    isPrimary: boolean;
    linkedAt: Date;
    lastUsedAt: Date;
  }): UserIdentity {
    return new UserIdentity({
      id: props.id,
      provider: props.provider,
      providerUserId: props.providerUserId,
      email: props.email,
      isPrimary: props.isPrimary,
      linkedAt: Timestamp.create(props.linkedAt),
      lastUsedAt: Timestamp.create(props.lastUsedAt),
    });
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get provider(): AuthProvider {
    return this._provider;
  }

  get providerUserId(): string {
    return this._providerUserId;
  }

  get email(): string | undefined {
    return this._email;
  }

  get isPrimary(): boolean {
    return this._isPrimary;
  }

  get linkedAt(): Timestamp {
    return this._linkedAt;
  }

  get lastUsedAt(): Timestamp {
    return this._lastUsedAt;
  }

  // Business Methods
  markAsUsed(): void {
    this._lastUsedAt = Timestamp.now();
  }

  setPrimary(isPrimary: boolean): void {
    this._isPrimary = isPrimary;
  }

  updateEmail(newEmail?: string): void {
    if (newEmail && !this.isValidEmail(newEmail)) {
      throw new Error(`Invalid email: ${newEmail}`);
    }
    // Note: In real OAuth flow, email should come from provider, not be manually updated
    // This is for cases where provider doesn't provide email initially
  }

  /**
   * Check if this identity can be used for authentication
   */
  get isActive(): boolean {
    // Identity is always active unless we add suspension logic
    return true;
  }

  /**
   * Check if identity belongs to a specific provider
   */
  belongsToProvider(provider: AuthProvider): boolean {
    return this._provider === provider;
  }

  /**
   * Equality check by provider and providerUserId
   */
  equals(other: UserIdentity): boolean {
    return this._provider === other.provider && this._providerUserId === other.providerUserId;
  }

  /**
   * For persistence
   */
  toPersistence() {
    return {
      id: this._id,
      provider: this._provider,
      providerUserId: this._providerUserId,
      email: this._email,
      isPrimary: this._isPrimary,
      linkedAt: this._linkedAt.value,
      lastUsedAt: this._lastUsedAt.value,
    };
  }
}
