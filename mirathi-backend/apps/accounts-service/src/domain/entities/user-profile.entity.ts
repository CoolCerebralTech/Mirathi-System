// src/domain/entities/user-profile.entity.ts
import { County, PhoneNumber, Timestamp } from '../value-objects';

/**
 * User Profile Entity
 *
 * Business Rules:
 * 1. Phone number must be verified before being marked as verified
 * 2. County is optional but must be valid if provided
 * 3. Phone verification requires OTP
 */
export interface UserProfileProps {
  id: string;
  userId: string; // Reference to User aggregate root
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phoneNumber?: PhoneNumber;
  phoneVerified: boolean;
  phoneVerificationRequestedAt?: Timestamp;
  phoneVerificationAttempts: number;
  county?: County;
  physicalAddress?: string;
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
  private _phoneVerificationRequestedAt?: Timestamp;
  private _phoneVerificationAttempts: number;
  private _county?: County;
  private _physicalAddress?: string;
  private _updatedAt: Timestamp;

  private static readonly MAX_VERIFICATION_ATTEMPTS = 3;
  private static readonly VERIFICATION_CODE_EXPIRY_MINUTES = 5;

  constructor(props: UserProfileProps) {
    this.validate(props);

    this._id = props.id;
    this._userId = props.userId;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._avatarUrl = props.avatarUrl;
    this._phoneNumber = props.phoneNumber;
    this._phoneVerified = props.phoneVerified;
    this._phoneVerificationRequestedAt = props.phoneVerificationRequestedAt;
    this._phoneVerificationAttempts = props.phoneVerificationAttempts;
    this._county = props.county;
    this._physicalAddress = props.physicalAddress;
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

    // Phone verification validation
    if (props.phoneVerified && !props.phoneNumber) {
      throw new Error('Cannot verify phone without phone number');
    }

    // Verification attempts validation
    if (props.phoneVerificationAttempts < 0) {
      throw new Error('Verification attempts cannot be negative');
    }

    if (props.phoneVerificationAttempts > UserProfile.MAX_VERIFICATION_ATTEMPTS) {
      throw new Error(
        `Exceeded maximum verification attempts: ${UserProfile.MAX_VERIFICATION_ATTEMPTS}`,
      );
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
      phoneVerificationAttempts: 0,
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
    phoneVerificationRequestedAt?: Date;
    phoneVerificationAttempts: number;
    county?: string;
    physicalAddress?: string;
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
      phoneVerificationRequestedAt: props.phoneVerificationRequestedAt
        ? Timestamp.create(props.phoneVerificationRequestedAt)
        : undefined,
      phoneVerificationAttempts: props.phoneVerificationAttempts,
      county: props.county ? County.create(props.county) : undefined,
      physicalAddress: props.physicalAddress,
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

  get phoneVerificationRequestedAt(): Timestamp | undefined {
    return this._phoneVerificationRequestedAt;
  }

  get phoneVerificationAttempts(): number {
    return this._phoneVerificationAttempts;
  }

  get county(): County | undefined {
    return this._county;
  }

  get physicalAddress(): string | undefined {
    return this._physicalAddress;
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

  updateAvatar(avatarUrl: string): void {
    if (avatarUrl !== this._avatarUrl) {
      this._avatarUrl = avatarUrl;
      this._updatedAt = Timestamp.now();
    }
  }

  updatePhoneNumber(phoneNumber: PhoneNumber): void {
    if (this._phoneNumber && this._phoneNumber.equals(phoneNumber)) {
      return; // No change
    }

    this._phoneNumber = phoneNumber;
    this._phoneVerified = false;
    this._phoneVerificationAttempts = 0;
    this._phoneVerificationRequestedAt = undefined;
    this._updatedAt = Timestamp.now();
  }

  removePhoneNumber(): void {
    if (this._phoneNumber) {
      this._phoneNumber = undefined;
      this._phoneVerified = false;
      this._phoneVerificationAttempts = 0;
      this._phoneVerificationRequestedAt = undefined;
      this._updatedAt = Timestamp.now();
    }
  }

  requestPhoneVerification(): void {
    if (!this._phoneNumber) {
      throw new Error('Phone number must be set before requesting verification');
    }

    if (this._phoneVerified) {
      throw new Error('Phone is already verified');
    }

    // Check if verification attempts are exhausted
    if (this._phoneVerificationAttempts >= UserProfile.MAX_VERIFICATION_ATTEMPTS) {
      throw new Error('Maximum verification attempts exceeded. Please contact support.');
    }

    // Check if there's a recent request
    if (this._phoneVerificationRequestedAt) {
      const minutesSinceLastRequest =
        this._phoneVerificationRequestedAt.daysDifference(Timestamp.now()) * 24 * 60;
      if (minutesSinceLastRequest < 1) {
        // 1 minute cooldown
        throw new Error('Please wait before requesting another verification code');
      }
    }

    this._phoneVerificationRequestedAt = Timestamp.now();
    this._updatedAt = Timestamp.now();
  }

  verifyPhone(): void {
    if (!this._phoneNumber) {
      throw new Error('Phone number must be set before verification');
    }

    if (this._phoneVerified) {
      return; // Already verified
    }

    // Check if verification was requested
    if (!this._phoneVerificationRequestedAt) {
      throw new Error('Phone verification must be requested first');
    }

    // Check if verification code expired
    const minutesSinceRequest =
      this._phoneVerificationRequestedAt.daysDifference(Timestamp.now()) * 24 * 60;
    if (minutesSinceRequest > UserProfile.VERIFICATION_CODE_EXPIRY_MINUTES) {
      throw new Error('Verification code has expired. Please request a new one.');
    }

    this._phoneVerified = true;
    this._phoneVerificationAttempts = 0;
    this._phoneVerificationRequestedAt = undefined;
    this._updatedAt = Timestamp.now();
  }

  recordVerificationAttempt(): void {
    this._phoneVerificationAttempts++;
    this._updatedAt = Timestamp.now();
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
      return; // No change
    }

    this._physicalAddress = trimmedAddress;
    this._updatedAt = Timestamp.now();
  }

  /**
   * Check if phone verification is in progress
   */
  get isVerificationInProgress(): boolean {
    if (!this._phoneVerificationRequestedAt) {
      return false;
    }

    const minutesSinceRequest =
      this._phoneVerificationRequestedAt.daysDifference(Timestamp.now()) * 24 * 60;
    return minutesSinceRequest <= UserProfile.VERIFICATION_CODE_EXPIRY_MINUTES;
  }

  /**
   * Check if verification attempts are exhausted
   */
  get isVerificationAttemptsExhausted(): boolean {
    return this._phoneVerificationAttempts >= UserProfile.MAX_VERIFICATION_ATTEMPTS;
  }

  /**
   * Get time remaining for verification code (in minutes)
   */
  get verificationTimeRemaining(): number {
    if (!this._phoneVerificationRequestedAt) {
      return 0;
    }

    const minutesSinceRequest =
      this._phoneVerificationRequestedAt.daysDifference(Timestamp.now()) * 24 * 60;
    const remaining = UserProfile.VERIFICATION_CODE_EXPIRY_MINUTES - minutesSinceRequest;
    return Math.max(0, Math.floor(remaining));
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
      phoneVerificationRequestedAt: this._phoneVerificationRequestedAt?.value,
      phoneVerificationAttempts: this._phoneVerificationAttempts,
      county: this._county?.value,
      physicalAddress: this._physicalAddress,
      updatedAt: this._updatedAt.value,
    };
  }
}
