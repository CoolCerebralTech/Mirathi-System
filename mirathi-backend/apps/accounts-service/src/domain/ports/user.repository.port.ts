// src/domain/ports/user.repository.port.ts
import { User } from '../aggregates/user.aggregate';

/**
 * Repository port for User aggregate
 * Abstract class for NestJS dependency injection (can be used as token)
 */
export abstract class UserRepositoryPort {
  /**
   * Find user by ID
   */
  abstract findById(id: string): Promise<User | null>;

  /**
   * Find user by email (from any identity)
   */
  abstract findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by phone number
   */
  abstract findByPhoneNumber(phoneNumber: string): Promise<User | null>;

  /**
   * Find user by OAuth provider identity
   */
  abstract findByProviderIdentity(provider: string, providerUserId: string): Promise<User | null>;

  /**
   * Find user by multiple criteria (for admin/search)
   */
  abstract findByCriteria(criteria: {
    status?: string;
    role?: string;
    county?: string;
    createdAtFrom?: Date;
    createdAtTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ users: User[]; total: number }>;

  /**
   * Save user (create or update)
   */
  abstract save(user: User): Promise<void>;

  /**
   * Delete user (soft delete)
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Check if email exists (across all identities)
   */
  abstract existsByEmail(email: string): Promise<boolean>;

  /**
   * Check if phone number exists
   */
  abstract existsByPhoneNumber(phoneNumber: string): Promise<boolean>;

  /**
   * Check if provider identity exists
   */
  abstract existsByProviderIdentity(provider: string, providerUserId: string): Promise<boolean>;

  /**
   * Get paginated users (for admin dashboard)
   */
  abstract getPaginatedUsers(options: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ users: User[]; total: number; page: number; totalPages: number }>;

  /**
   * Count users by status (for admin dashboard)
   */
  abstract countByStatus(): Promise<{ [status: string]: number }>;

  /**
   * Count users by role (for admin dashboard)
   */
  abstract countByRole(): Promise<{ [role: string]: number }>;
}

/**
 * Injection token for UserRepositoryPort (for constructor injection)
 */
export const USER_REPOSITORY_PORT = 'USER_REPOSITORY_PORT';
