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

// ============================================================================
// Profile Update Result (for aggregate root event publishing)
// ============================================================================

export interface ProfileUpdateResult {
  updatedFields: string[];
  changes: Record<string, { old: unknown; new: unknown }>;
}

export interface UserProfilePrimitives {
  id: string;
  userId: string;
  phoneNumber: string | null;
  marketingOptIn: boolean;
  address: Address | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// UserProfile Entity
// ============================================================================

export interface UserProfileProps {
  id: string;
  userId: string;
  phoneNumber: PhoneNumber | null;
  marketingOptIn: boolean;
  address: Address | null;
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
  private _phoneNumber: PhoneNumber | null;
  private _marketingOptIn: boolean;
  private _address: Address | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: UserProfileProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._phoneNumber = props.phoneNumber;
    this._marketingOptIn = props.marketingOptIn;
    this._address = props.address;
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
      phoneNumber: null,
      marketingOptIn: props.marketingOptIn ?? false,
      address: null,
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
  get phoneNumber(): PhoneNumber | null {
    return this._phoneNumber;
  }
  get phoneNumberValue(): string | null {
    return this._phoneNumber?.getValue() ?? null;
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
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  get isComplete(): boolean {
    return this._phoneNumber !== null && this._address !== null;
  }

  get completionPercentage(): number {
    let completed = 0;
    const total = 2; // Changed from 3 to 2 (phone and address only)

    if (this._phoneNumber) completed++;
    if (this._address) completed++;

    return Math.round((completed / total) * 100);
  }

  // ============================================================================
  // Validation Helpers
  // ============================================================================

  private validateAddress(address: Address): void {
    if (!address.country || address.country.trim().length === 0) {
      throw new UserProfileDomainError('Address country is required');
    }
  }

  // ============================================================================
  // Profile Update Methods (Return changes for aggregate root event publishing)
  // ============================================================================

  updatePhoneNumber(phoneNumber: PhoneNumber): ProfileUpdateResult {
    const previousPhoneNumber = this._phoneNumber?.getValue();
    const newPhoneNumber = phoneNumber.getValue();

    if (previousPhoneNumber === newPhoneNumber) {
      return { updatedFields: [], changes: {} };
    }

    this._phoneNumber = phoneNumber;
    this._updatedAt = new Date();

    return {
      updatedFields: ['phoneNumber'],
      changes: {
        phoneNumber: { old: previousPhoneNumber, new: newPhoneNumber },
      },
    };
  }

  removePhoneNumber(): ProfileUpdateResult {
    if (!this._phoneNumber) {
      return { updatedFields: [], changes: {} };
    }

    const previousPhoneNumber = this._phoneNumber.getValue();

    this._phoneNumber = null;
    this._updatedAt = new Date();

    return {
      updatedFields: ['phoneNumber'],
      changes: {
        phoneNumber: { old: previousPhoneNumber, new: null },
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
  // Bulk Update Method (Used by User aggregate root)
  // ============================================================================

  private isDeepEqual(obj1: unknown, obj2: unknown): boolean {
    // A simple implementation for demonstration
    return JSON.stringify(obj1) === JSON.stringify(obj2);
    // For production, a more robust library like lodash.isEqual or a custom recursive function is better
  }

  update(props: {
    marketingOptIn?: boolean;
    address?: Address | null;
  }): Record<string, { old: unknown; new: unknown }> {
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    const updatedFields: string[] = [];

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

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      userId: this._userId,
      phoneNumber: this._phoneNumber?.getValue() ?? null,
      marketingOptIn: this._marketingOptIn,
      address: this._address,
      isComplete: this.isComplete,
      completionPercentage: this.completionPercentage,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public toPrimitives(): UserProfilePrimitives {
    return {
      id: this._id,
      userId: this._userId,
      phoneNumber: this._phoneNumber?.getValue() ?? null,
      marketingOptIn: this._marketingOptIn,
      address: this._address,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
