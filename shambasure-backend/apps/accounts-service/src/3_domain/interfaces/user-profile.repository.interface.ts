import { UserProfile } from '../models/user-profile.model';
import { PhoneNumber } from '../value-objects';

/**
 * Filter options for querying user profiles.
 */
export interface ProfileFilters {
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  hasMarketingOptIn?: boolean;
  isComplete?: boolean; // A flag to find profiles missing key info
}

/**
 * IProfileRepository (Port)
 *
 * Defines the contract for all UserProfile persistence operations. The domain
 * layer depends on this, and the infrastructure layer provides the implementation.
 */
export interface IProfileRepository {
  /**
   * Persists a UserProfile.
   * This handles both the creation of new profiles and updates to existing ones.
   * @param profile The UserProfile instance to save.
   */
  save(profile: UserProfile): Promise<void>;

  /**
   * Finds a profile by its unique ID.
   * @param id The profile's unique identifier.
   */
  findById(id: string): Promise<UserProfile | null>;

  /**
   * Finds a profile belonging to a specific user.
   * This will be the most common way to retrieve a profile.
   * @param userId The ID of the user who owns the profile.
   */
  findByUserId(userId: string): Promise<UserProfile | null>;

  /**
   * Finds a profile by a unique phone number.
   * Useful for "find by phone" features or preventing duplicate numbers.
   * @param phoneNumber The PhoneNumber Value Object.
   */
  findByPhoneNumber(phoneNumber: PhoneNumber): Promise<UserProfile | null>;

  /**
   * Checks if a phone number is already in use by another profile.
   * More efficient than fetching the full profile.
   * @param phoneNumber The PhoneNumber Value Object.
   */
  isPhoneNumberUnique(phoneNumber: PhoneNumber): Promise<boolean>;

  /**
   * Deletes a profile, typically when its parent user is deleted.
   * @param id The ID of the profile to delete.
   */
  delete(id: string): Promise<void>;

  /**
   * Finds all profiles matching a set of criteria.
   * Useful for admin tasks or marketing campaigns.
   * @param filters The filtering criteria.
   */
  findAll(filters: ProfileFilters): Promise<UserProfile[]>;
}
