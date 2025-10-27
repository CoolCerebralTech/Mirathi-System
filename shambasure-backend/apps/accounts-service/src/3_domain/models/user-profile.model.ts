import { RelationshipType } from '@shamba/common';
import { PhoneNumber } from '../value-objects';
import { DomainEvent, PhoneVerifiedEvent } from '../events';

// ============================================================================
// Custom Domain Errors
// ============================================================================

/** Base error for user profile-related business rule violations. */
export class UserProfileDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserProfileDomainError';
  }
}

// ============================================================================
// Embedded Value Objects
// ============================================================================

export interface Address {
  street?: string;
  city?: string;
  postCode?: string;
  country: string;
}

export interface NextOfKin {
  fullName: string;
  relationship: RelationshipType;
  phoneNumber: string;
  email?: string;
  address?: Address;
}

// ============================================================================
// UserProfile Entity
// ============================================================================

export interface UserProfileProps {
  id: string;
  userId: string;
  bio: string | null;
  phoneNumber: PhoneNumber | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  marketingOptIn: boolean;
  address: Address | null;
  nextOfKin: NextOfKin | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * UserProfile Domain Model.
 * Manages all personal information related to a user, separate from their
 * core identity and authentication details.
 */
export class UserProfile {
  private readonly _id: string;
  private readonly _userId: string;
  private _bio: string | null;
  private _phoneNumber: PhoneNumber | null;
  private _phoneVerified: boolean;
  private _emailVerified: boolean;
  private _marketingOptIn: boolean;
  private _address: Address | null;
  private _nextOfKin: NextOfKin | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private readonly _domainEvents: DomainEvent[] = [];

  private constructor(props: UserProfileProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._bio = props.bio;
    this._phoneNumber = props.phoneNumber;
    this._phoneVerified = props.phoneVerified;
    this._emailVerified = props.emailVerified;
    this._marketingOptIn = props.marketingOptIn;
    this._address = props.address;
    this._nextOfKin = props.nextOfKin;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * Factory for creating a new, empty profile for a user.
   */
  static create(props: { id: string; userId: string; marketingOptIn?: boolean }): UserProfile {
    const now = new Date();
    return new UserProfile({
      id: props.id,
      userId: props.userId,
      bio: null,
      phoneNumber: null,
      phoneVerified: false,
      emailVerified: false, // This will be set by an event from the User aggregate
      marketingOptIn: props.marketingOptIn ?? false,
      address: null,
      nextOfKin: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory for re-hydrating an existing profile from the database.
   */
  static fromPersistence(props: UserProfileProps): UserProfile {
    return new UserProfile(props);
  }

  // ============================================================================
  // Getters & Event Management
  // ============================================================================

  get id(): string {
    return this._id;
  }
  get userId(): string {
    return this._userId;
  }
  get bio(): string | null {
    return this._bio;
  }
  get phoneNumber(): PhoneNumber | null {
    return this._phoneNumber;
  }
  get isPhoneVerified(): boolean {
    return this._phoneVerified;
  }
  get isEmailVerified(): boolean {
    return this._emailVerified;
  }
  get marketingOptIn(): boolean {
    return this._marketingOptIn;
  }
  get address(): Address | null {
    return this._address;
  }
  get nextOfKin(): NextOfKin | null {
    return this._nextOfKin;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
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

  update(props: {
    bio?: string;
    phoneNumber?: PhoneNumber | null;
    address?: Address | null;
    nextOfKin?: NextOfKin | null;
  }): void {
    let hasChanged = false;

    if (props.bio !== undefined) {
      this._bio = props.bio || null;
      hasChanged = true;
    }
    if (props.phoneNumber !== undefined) {
      // If phone number changes, we must reset its verification status
      const newNumber = props.phoneNumber?.getValue();
      const oldNumber = this._phoneNumber?.getValue();
      if (newNumber !== oldNumber) {
        this._phoneVerified = false;
      }
      this._phoneNumber = props.phoneNumber;
      hasChanged = true;
    }
    if (props.address !== undefined) {
      this._address = props.address || null;
      hasChanged = true;
    }
    if (props.nextOfKin !== undefined) {
      this._nextOfKin = props.nextOfKin || null;
      hasChanged = true;
    }

    if (hasChanged) {
      this._updatedAt = new Date();
    }
  }

  /** Marks the phone number as verified and publishes an event. */
  verifyPhone(): void {
    if (this._phoneVerified) return;
    if (!this._phoneNumber) {
      throw new UserProfileDomainError('Cannot verify phone because no phone number is set.');
    }

    this._phoneVerified = true;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PhoneVerifiedEvent({
        aggregateId: this.userId,
        phoneNumber: this._phoneNumber.getValue(),
        provider: this._phoneNumber.getProvider(),
      }),
    );
  }

  /** This should be called in response to an EmailVerifiedEvent from the User aggregate. */
  markEmailAsVerified(): void {
    if (this._emailVerified) return;
    this._emailVerified = true;
    this._updatedAt = new Date();
  }

  updateMarketingPreferences(optIn: boolean): void {
    if (this._marketingOptIn === optIn) return;
    this._marketingOptIn = optIn;
    this._updatedAt = new Date();
  }
}
