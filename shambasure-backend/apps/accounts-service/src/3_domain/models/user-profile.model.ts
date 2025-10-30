import { RelationshipType } from '@shamba/common';
import { PhoneNumber } from '../value-objects';

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

/** Thrown when phone verification is attempted without a phone number. */
export class PhoneNumberNotSetError extends UserProfileDomainError {
  constructor() {
    super('Cannot verify phone because no phone number is set.');
    this.name = 'PhoneNumberNotSetError';
  }
}

/** Thrown when next of kin validation fails. */
export class InvalidNextOfKinError extends UserProfileDomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNextOfKinError';
  }
}

// ============================================================================
// Embedded Value Objects
// ============================================================================

export interface Address {
  street?: string;
  city?: string;
  county?: string;
  postalCode?: string;
  country: string;
}

export interface NextOfKin {
  fullName: string;
  relationship: RelationshipType;
  phoneNumber: string; // E.164 format
  email?: string;
  address?: Address;
}

// ============================================================================
// Profile Update Result (for aggregate root event publishing)
// ============================================================================

export interface ProfileUpdateResult {
  updatedFields: string[];
  changes: Record<string, { old: any; new: any }>;
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
 *
 * Note: This entity does NOT publish domain events directly. All events
 * are published through the User aggregate root.
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

  private static readonly MAX_BIO_LENGTH = 500;
  private static readonly MAX_NOK_NAME_LENGTH = 100;

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
      emailVerified: false,
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
  // Getters
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
  get phoneNumberValue(): string | null {
    return this._phoneNumber?.getValue() ?? null;
  }
  get isPhoneVerified(): boolean {
    return this._phoneVerified;
  }
  get isEmailVerified(): boolean {
    return this._emailVerified;
  }
  get hasPhoneNumber(): boolean {
    return this._phoneNumber !== null;
  }
  get marketingOptIn(): boolean {
    return this._marketingOptIn;
  }
  get address(): Address | null {
    return this._address ? { ...this._address } : null;
  }
  get nextOfKin(): NextOfKin | null {
    return this._nextOfKin ? { ...this._nextOfKin } : null;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  get isComplete(): boolean {
    return (
      this._bio !== null &&
      this._phoneNumber !== null &&
      this._phoneVerified &&
      this._emailVerified &&
      this._address !== null &&
      this._nextOfKin !== null
    );
  }

  get completionPercentage(): number {
    let completed = 0;
    const total = 6;

    if (this._bio) completed++;
    if (this._phoneNumber) completed++;
    if (this._phoneVerified) completed++;
    if (this._emailVerified) completed++;
    if (this._address) completed++;
    if (this._nextOfKin) completed++;

    return Math.round((completed / total) * 100);
  }

  // ============================================================================
  // Validation Helpers
  // ============================================================================

  private validateBio(bio: string): void {
    if (bio.length > UserProfile.MAX_BIO_LENGTH) {
      throw new UserProfileDomainError(
        `Bio cannot exceed ${UserProfile.MAX_BIO_LENGTH} characters`,
      );
    }
  }

  private validateNextOfKin(nok: NextOfKin): void {
    if (!nok.fullName || nok.fullName.trim().length === 0) {
      throw new InvalidNextOfKinError('Next of kin full name is required');
    }

    if (nok.fullName.length > UserProfile.MAX_NOK_NAME_LENGTH) {
      throw new InvalidNextOfKinError(
        `Next of kin name cannot exceed ${UserProfile.MAX_NOK_NAME_LENGTH} characters`,
      );
    }

    if (!nok.phoneNumber || nok.phoneNumber.trim().length === 0) {
      throw new InvalidNextOfKinError('Next of kin phone number is required');
    }

    // Validate phone number format (basic E.164 check)
    if (!nok.phoneNumber.startsWith('+')) {
      throw new InvalidNextOfKinError('Next of kin phone number must be in E.164 format (+254...)');
    }

    if (nok.email && !this.isValidEmail(nok.email)) {
      throw new InvalidNextOfKinError('Next of kin email format is invalid');
    }
  }

  private validateAddress(address: Address): void {
    if (!address.country || address.country.trim().length === 0) {
      throw new UserProfileDomainError('Address country is required');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ============================================================================
  // Profile Update Methods (Return changes for aggregate root event publishing)
  // ============================================================================

  updateBio(bio: string): ProfileUpdateResult {
    const trimmedBio = bio.trim();
    this.validateBio(trimmedBio);

    if (this._bio === trimmedBio) {
      return { updatedFields: [], changes: {} };
    }

    const oldBio = this._bio;
    this._bio = trimmedBio || null;
    this._updatedAt = new Date();

    return {
      updatedFields: ['bio'],
      changes: {
        bio: { old: oldBio, new: this._bio },
      },
    };
  }

  updatePhoneNumber(phoneNumber: PhoneNumber): ProfileUpdateResult {
    const previousPhoneNumber = this._phoneNumber?.getValue();
    const newPhoneNumber = phoneNumber.getValue();

    if (previousPhoneNumber === newPhoneNumber) {
      return { updatedFields: [], changes: {} };
    }

    // Reset verification status when phone changes
    const oldPhoneVerified = this._phoneVerified;
    this._phoneNumber = phoneNumber;
    this._phoneVerified = false;
    this._updatedAt = new Date();

    return {
      updatedFields: ['phoneNumber', 'phoneVerified'],
      changes: {
        phoneNumber: { old: previousPhoneNumber, new: newPhoneNumber },
        phoneVerified: { old: oldPhoneVerified, new: false },
      },
    };
  }

  removePhoneNumber(): ProfileUpdateResult {
    if (!this._phoneNumber) {
      return { updatedFields: [], changes: {} };
    }

    const previousPhoneNumber = this._phoneNumber.getValue();
    const oldPhoneVerified = this._phoneVerified;

    this._phoneNumber = null;
    this._phoneVerified = false;
    this._updatedAt = new Date();

    return {
      updatedFields: ['phoneNumber', 'phoneVerified'],
      changes: {
        phoneNumber: { old: previousPhoneNumber, new: null },
        phoneVerified: { old: oldPhoneVerified, new: false },
      },
    };
  }

  updateAddress(address: Address): ProfileUpdateResult {
    this.validateAddress(address);

    const oldAddress = this._address;
    this._address = { ...address };
    this._updatedAt = new Date();

    return {
      updatedFields: ['address'],
      changes: {
        address: { old: oldAddress, new: this._address },
      },
    };
  }

  removeAddress(): ProfileUpdateResult {
    if (!this._address) {
      return { updatedFields: [], changes: {} };
    }

    const oldAddress = this._address;
    this._address = null;
    this._updatedAt = new Date();

    return {
      updatedFields: ['address'],
      changes: {
        address: { old: oldAddress, new: null },
      },
    };
  }

  updateNextOfKin(nextOfKin: NextOfKin): ProfileUpdateResult {
    this.validateNextOfKin(nextOfKin);

    const oldNextOfKin = this._nextOfKin;
    this._nextOfKin = { ...nextOfKin };
    this._updatedAt = new Date();

    return {
      updatedFields: ['nextOfKin'],
      changes: {
        nextOfKin: { old: oldNextOfKin, new: this._nextOfKin },
      },
    };
  }

  removeNextOfKin(): ProfileUpdateResult {
    if (!this._nextOfKin) {
      return { updatedFields: [], changes: {} };
    }

    const oldNextOfKin = this._nextOfKin;
    this._nextOfKin = null;
    this._updatedAt = new Date();

    return {
      updatedFields: ['nextOfKin'],
      changes: {
        nextOfKin: { old: oldNextOfKin, new: null },
      },
    };
  }

  updateMarketingPreferences(optIn: boolean): ProfileUpdateResult {
    if (this._marketingOptIn === optIn) {
      return { updatedFields: [], changes: {} };
    }

    const oldOptIn = this._marketingOptIn;
    this._marketingOptIn = optIn;
    this._updatedAt = new Date();

    return {
      updatedFields: ['marketingOptIn'],
      changes: {
        marketingOptIn: { old: oldOptIn, new: optIn },
      },
    };
  }

  // ============================================================================
  // Phone Verification Methods
  // ============================================================================

  markPhoneAsVerified(): void {
    if (!this._phoneNumber) {
      throw new PhoneNumberNotSetError();
    }

    if (this._phoneVerified) return; // Already verified

    this._phoneVerified = true;
    this._updatedAt = new Date();
  }

  resetPhoneVerification(): void {
    if (!this._phoneVerified) return; // Already not verified

    this._phoneVerified = false;
    this._updatedAt = new Date();
  }

  // ============================================================================
  // Email Verification Methods
  // ============================================================================

  markEmailAsVerified(): void {
    if (this._emailVerified) return; // Already verified

    this._emailVerified = true;
    this._updatedAt = new Date();
  }

  markEmailAsUnverified(): void {
    if (!this._emailVerified) return; // Already not verified

    this._emailVerified = false;
    this._updatedAt = new Date();
  }

  resetEmailVerification(): void {
    if (!this._emailVerified) return; // Already not verified

    this._emailVerified = false;
    this._updatedAt = new Date();
  }

  // ============================================================================
  // Bulk Update Method (Used by User aggregate root)
  // ============================================================================

  private isDeepEqual(obj1: any, obj2: any): boolean {
    // A simple implementation for demonstration
    return JSON.stringify(obj1) === JSON.stringify(obj2);
    // For production, a more robust library like lodash.isEqual or a custom recursive function is better
  }
  update(props: {
    bio?: string;
    marketingOptIn?: boolean;
    address?: Address | null;
    nextOfKin?: NextOfKin | null;
  }): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};
    const updatedFields: string[] = [];

    // Update bio
    if (props.bio !== undefined) {
      const trimmedBio = props.bio.trim();
      this.validateBio(trimmedBio);
      if (this._bio !== trimmedBio) {
        changes.bio = { old: this._bio, new: trimmedBio || null };
        updatedFields.push('bio');
        this._bio = trimmedBio || null;
      }
    }

    // Update marketing preferences
    if (props.marketingOptIn !== undefined) {
      if (this._marketingOptIn !== props.marketingOptIn) {
        changes.marketingOptIn = { old: this._marketingOptIn, new: props.marketingOptIn };
        updatedFields.push('marketingOptIn');
        this._marketingOptIn = props.marketingOptIn;
      }
    }

    // Update address (handle null for removal)
    if (props.address !== undefined) {
      if (props.address === null) {
        // Remove address
        if (this._address !== null) {
          changes.address = { old: this._address, new: null };
          updatedFields.push('address');
          this._address = null;
        }
      } else {
        // Update address
        this.validateAddress(props.address);
        const newAddress = { ...props.address };
        if (!this.isDeepEqual(this._address, newAddress)) {
          changes.address = { old: this._address, new: newAddress };
          updatedFields.push('address');
          this._address = newAddress;
        }
      }
    }

    // Update next of kin (handle null for removal)
    if (props.nextOfKin !== undefined) {
      if (props.nextOfKin === null) {
        // Remove next of kin
        if (this._nextOfKin !== null) {
          changes.nextOfKin = { old: this._nextOfKin, new: null };
          updatedFields.push('nextOfKin');
          this._nextOfKin = null;
        }
      } else {
        // Update next of kin
        this.validateNextOfKin(props.nextOfKin);
        const newNextOfKin = { ...props.nextOfKin };
        if (!this.isDeepEqual(this._nextOfKin, newNextOfKin)) {
          changes.nextOfKin = { old: this._nextOfKin, new: newNextOfKin };
          updatedFields.push('nextOfKin');
          this._nextOfKin = newNextOfKin;
        }
      }
    }

    if (updatedFields.length > 0) {
      this._updatedAt = new Date();
    }

    return changes;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  getPhoneProvider(): 'Safaricom' | 'Airtel' | 'Telkom' | 'Unknown' | null {
    return this._phoneNumber?.getProvider() ?? null;
  }

  getMaskedPhone(): string | null {
    return this._phoneNumber?.getMasked() ?? null;
  }

  toJSON(): Record<string, any> {
    return {
      id: this._id,
      userId: this._userId,
      bio: this._bio,
      phoneNumber: this._phoneNumber?.getValue() ?? null,
      phoneVerified: this._phoneVerified,
      emailVerified: this._emailVerified,
      marketingOptIn: this._marketingOptIn,
      address: this._address,
      nextOfKin: this._nextOfKin,
      isComplete: this.isComplete,
      completionPercentage: this.completionPercentage,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public toPrimitives() {
    return {
      id: this._id,
      userId: this._userId,
      bio: this._bio,
      phoneNumber: this._phoneNumber?.getValue() ?? null,
      phoneVerified: this._phoneVerified,
      emailVerified: this._emailVerified,
      marketingOptIn: this._marketingOptIn,
      address: this._address,
      nextOfKin: this._nextOfKin,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
