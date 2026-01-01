// src/domain/entities/user-profile.entity.ts
import { County, PhoneNumber, Timestamp } from '../value-objects';

/**
 * User Profile Entity
 * Aligned with schema: UserProfile model
 *
 * Business Rules:
 * 1. Phone number is optional (as per our agreement)
 * 2. County is optional but must be valid if provided
 * 3. First and last name are required
 */
export interface UserProfileProps {
  id: string;
  userId: string; // Reference to User aggregate root
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phoneNumber?: PhoneNumber;
  phoneVerified: boolean; // Present in schema but optional feature
  county?: County;
  physicalAddress?: string;
  postalAddress?: string;
  updatedAt: Timestamp;
}

export class UserProfile {
  private readonly _id: string;
  private readonly _userId: string;
  private _firstName: string;
  private _lastName: string;
  private _avatarUrl?: string;
  private _phoneNumber?: PhoneNumber;
  private _phoneVerified: boolean;
  private _county?: County;
  private _physicalAddress?: string;
  private _postalAddress?: string;
  private _updatedAt: Timestamp;

  constructor(props: UserProfileProps) {
    this.validate(props);

    this._id = props.id;
    this._userId = props.userId;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._avatarUrl = props.avatarUrl;
    this._phoneNumber = props.phoneNumber;
    this._phoneVerified = props.phoneVerified;
    this._county = props.county;
    this._physicalAddress = props.physicalAddress;
    this._postalAddress = props.postalAddress;
    this._updatedAt = props.updatedAt;
  }

  private validate(props: UserProfileProps): void {
    if (!props.id) {
      throw new Error('UserProfile must have an id');
    }

    if (!props.userId) {
      throw new Error('UserProfile must have a userId');
    }

    if (!props.firstName || props.firstName.trim().length < 1) {
      throw new Error('First name is required');
    }

    if (!props.lastName || props.lastName.trim().length < 1) {
      throw new Error('Last name is required');
    }

    // Phone verification validation (simple check)
    if (props.phoneVerified && !props.phoneNumber) {
      throw new Error('Cannot have phoneVerified without phone number');
    }
  }

  /**
   * Factory method to create a new UserProfile
   */
  static create(props: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }): UserProfile {
    return new UserProfile({
      id: props.id,
      userId: props.userId,
      firstName: props.firstName.trim(),
      lastName: props.lastName.trim(),
      avatarUrl: props.avatarUrl,
      phoneVerified: false,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Factory method to recreate from persistence
   */
  static fromPersistence(props: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    phoneNumber?: string;
    phoneVerified: boolean;
    county?: string;
    physicalAddress?: string;
    postalAddress?: string;
    updatedAt: Date;
  }): UserProfile {
    return new UserProfile({
      id: props.id,
      userId: props.userId,
      firstName: props.firstName,
      lastName: props.lastName,
      avatarUrl: props.avatarUrl,
      phoneNumber: props.phoneNumber ? PhoneNumber.create(props.phoneNumber) : undefined,
      phoneVerified: props.phoneVerified,
      county: props.county ? County.create(props.county) : undefined,
      physicalAddress: props.physicalAddress,
      postalAddress: props.postalAddress,
      updatedAt: Timestamp.create(props.updatedAt),
    });
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
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

  get avatarUrl(): string | undefined {
    return this._avatarUrl;
  }

  get phoneNumber(): PhoneNumber | undefined {
    return this._phoneNumber;
  }

  get phoneVerified(): boolean {
    return this._phoneVerified;
  }

  get county(): County | undefined {
    return this._county;
  }

  get physicalAddress(): string | undefined {
    return this._physicalAddress;
  }

  get postalAddress(): string | undefined {
    return this._postalAddress;
  }

  get updatedAt(): Timestamp {
    return this._updatedAt;
  }

  // Business Methods
  updateName(firstName: string, lastName: string): void {
    const newFirstName = firstName.trim();
    const newLastName = lastName.trim();

    if (newFirstName.length < 1) {
      throw new Error('First name cannot be empty');
    }

    if (newLastName.length < 1) {
      throw new Error('Last name cannot be empty');
    }

    if (newFirstName !== this._firstName || newLastName !== this._lastName) {
      this._firstName = newFirstName;
      this._lastName = newLastName;
      this._updatedAt = Timestamp.now();
    }
  }

  updateAvatar(avatarUrl?: string): void {
    if (avatarUrl !== this._avatarUrl) {
      this._avatarUrl = avatarUrl;
      this._updatedAt = Timestamp.now();
    }
  }

  updatePhoneNumber(phoneNumber?: PhoneNumber): void {
    // Check if it's actually a change
    const currentPhone = this._phoneNumber?.value;
    const newPhone = phoneNumber?.value;

    if (currentPhone !== newPhone) {
      this._phoneNumber = phoneNumber;
      this._phoneVerified = false; // Reset verification when phone changes
      this._updatedAt = Timestamp.now();
    }
  }

  updatePhoneVerification(verified: boolean): void {
    if (!this._phoneNumber) {
      throw new Error('Cannot set phone verification without phone number');
    }

    if (this._phoneVerified !== verified) {
      this._phoneVerified = verified;
      this._updatedAt = Timestamp.now();
    }
  }

  updateCounty(county?: County): void {
    if (county && this._county && county.equals(this._county)) {
      return; // No change
    }

    this._county = county;
    this._updatedAt = Timestamp.now();
  }

  updatePhysicalAddress(address?: string): void {
    const trimmedAddress = address?.trim();

    if (trimmedAddress === this._physicalAddress) {
      return;
    }

    this._physicalAddress = trimmedAddress;
    this._updatedAt = Timestamp.now();
  }

  updatePostalAddress(address?: string): void {
    const trimmedAddress = address?.trim();

    if (trimmedAddress === this._postalAddress) {
      return;
    }

    this._postalAddress = trimmedAddress;
    this._updatedAt = Timestamp.now();
  }

  /**
   * Check if profile has minimum required information
   */
  get isComplete(): boolean {
    return !!this._firstName && !!this._lastName;
  }

  /**
   * For persistence
   */
  toPersistence() {
    return {
      id: this._id,
      userId: this._userId,
      firstName: this._firstName,
      lastName: this._lastName,
      avatarUrl: this._avatarUrl,
      phoneNumber: this._phoneNumber?.value,
      phoneVerified: this._phoneVerified,
      county: this._county?.value,
      physicalAddress: this._physicalAddress,
      postalAddress: this._postalAddress,
      updatedAt: this._updatedAt.value,
    };
  }
}
