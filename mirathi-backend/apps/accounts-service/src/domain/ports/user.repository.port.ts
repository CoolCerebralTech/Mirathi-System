// src/domain/ports/user.repository.port.ts
import { User } from '../aggregates/user.aggregate';

/**
 * Repository port for User aggregate
 * This is an application contract that defines how we interact with User persistence
 */
export interface UserRepositoryPort {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email (from any identity)
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by phone number
   */
  findByPhoneNumber(phoneNumber: string): Promise<User | null>;

  /**
   * Find user by OAuth provider identity
   */
  findByProviderIdentity(provider: string, providerUserId: string): Promise<User | null>;

  /**
   * Save user (create or update)
   */
  save(user: User): Promise<void>;

  /**
   * Delete user (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if email exists (across all identities)
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Check if phone number exists
   */
  existsByPhoneNumber(phoneNumber: string): Promise<boolean>;

  /**
   * Check if provider identity exists
   */
  existsByProviderIdentity(provider: string, providerUserId: string): Promise<boolean>;
}
