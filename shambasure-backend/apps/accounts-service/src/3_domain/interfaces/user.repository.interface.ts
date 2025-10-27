import { UserRole } from '@shamba/common';
import { User, UserProps } from '../models/user.model';
import { Email } from '../value-objects';

/**
 * Defines the data structure for bulk updating user fields.
 * This is a subset of UserProps containing only persistable, mutable fields.
 */
export type UserUpdateData = Partial<Pick<UserProps, 'role' | 'isActive' | 'lockedUntil'>>;

/** Filter options for querying users. */
export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string; // Search in email, firstName, lastName
  isDeleted?: boolean; // Replaces includeDeleted for clarity
}

/** Pagination options. */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: keyof UserProps; // Ensures sorting is on a valid property
  sortOrder?: 'asc' | 'desc';
}

/** Represents a paginated list of results. */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;

    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Represents user statistics for an admin dashboard. */
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
  byRole: Record<UserRole, number>;
  newLast30Days: number;
  locked: number;
}

/**
 * IUserRepository (Port)
 *
 * This interface defines the contract for all User persistence operations.
 * The domain layer depends on this interface, while the infrastructure layer
 * provides a concrete implementation (e.g., PrismaUserRepository).
 */
export interface IUserRepository {
  /**
   * Persists a User aggregate.
   * This handles both creation of new users and updates to existing ones.
   * @param user The User aggregate instance to save.
   */
  save(user: User): Promise<void>;

  /**
   * Finds a user by their unique ID.
   * @param id The user's ID.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Finds a user by their unique email address.
   * @param email The user's Email Value Object.
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Finds all users matching the given criteria with pagination.
   * @param filters The filtering criteria.
   * @param pagination The pagination and sorting options.
   */
  findAll(filters: UserFilters, pagination: PaginationOptions): Promise<PaginatedResult<User>>;

  /**
   * Checks if a user with the given email already exists.
   * @param email The user's Email Value Object.
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * Retrieves aggregated user statistics for the admin dashboard.
   */
  getStats(): Promise<UserStats>;

  /**
   * Performs a bulk update on a set of users.
   * Primarily for admin-driven mass actions.
   * @returns The number of users successfully updated.
   */
  bulkUpdate(userIds: string[], data: UserUpdateData): Promise<number>;
}
