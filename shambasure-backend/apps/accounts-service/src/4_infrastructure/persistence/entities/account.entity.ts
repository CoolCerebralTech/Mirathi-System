import { Prisma } from '@prisma/client';
import { Address, NextOfKin } from '../../../3_domain/models';

// ============================================================================
// JSON FIELD TYPE DEFINITIONS
// ============================================================================

/**
 * Enhanced type safety for JSON fields that are stored in the database.
 * These types match the domain value objects but are serialized for storage.
 */
export type AddressData = Address | null;
export type NextOfKinData = NextOfKin | null;

// ============================================================================
// USER ENTITY
// ============================================================================

/**
 * Defines the relations to always include when fetching a User.
 * This ensures the User aggregate's data (including its profile) is always consistent.
 */
export const UserInclude = {
  profile: true,
} as const;

/**
 * Extended include for user with all relations (for admin queries)
 */
export const UserIncludeWithAll = {
  profile: true,
  passwordResetTokens: true,
  refreshTokens: true,
  roleChanges: true,
  emailVerificationToken: true,
  phoneVerificationTokens: true,
  emailChangeTokens: true,
  loginSessions: true,
  passwordHistory: true,
} as const;

/**
 * UserEntity: The full User object from Prisma, including the profile relation.
 * This is the primary data transfer object within the infrastructure layer for a user.
 */
export type UserEntity = Prisma.UserGetPayload<{ include: typeof UserInclude }>;

/**
 * UserEntity with all relations (for admin and reporting purposes)
 */
export type UserEntityWithAll = Prisma.UserGetPayload<{ include: typeof UserIncludeWithAll }>;

/** Prisma type for creating a new User record. */
export type UserCreateData = Prisma.UserCreateInput;

/** Prisma type for updating an existing User record. */
export type UserUpdateData = Prisma.UserUpdateInput;

// ============================================================================
// USER PROFILE ENTITY
// ============================================================================

/** Defines the relations to include when fetching a UserProfile. Currently none. */
export const UserProfileInclude = {} as const;

/** UserProfileEntity: The UserProfile object from Prisma. */
export type UserProfileEntity = Prisma.UserProfileGetPayload<{
  include: typeof UserProfileInclude;
}>;

/** Prisma type for creating a new UserProfile record with enhanced JSON typing */
export type ProfileCreateData = Omit<Prisma.UserProfileCreateInput, 'address' | 'nextOfKin'> & {
  address?: AddressData;
  nextOfKin?: NextOfKinData;
};

/** Prisma type for updating an existing UserProfile record with enhanced JSON typing */
export type ProfileUpdateData = Omit<Prisma.UserProfileUpdateInput, 'address' | 'nextOfKin'> & {
  address?: AddressData;
  nextOfKin?: NextOfKinData;
};

// ============================================================================
// TOKENS & SESSIONS (Following a consistent pattern)
// ============================================================================

// --- Password Reset Token ---
export const PasswordResetTokenInclude = {} as const;
export type PasswordResetTokenEntity = Prisma.PasswordResetTokenGetPayload<{
  include: typeof PasswordResetTokenInclude;
}>;
export type PasswordResetTokenCreateData = Prisma.PasswordResetTokenCreateInput;
export type PasswordResetTokenUpdateData = Prisma.PasswordResetTokenUpdateInput;

// --- Email Verification Token ---
export const EmailVerificationTokenInclude = {} as const;
export type EmailVerificationTokenEntity = Prisma.EmailVerificationTokenGetPayload<{
  include: typeof EmailVerificationTokenInclude;
}>;
export type EmailVerificationTokenCreateData = Prisma.EmailVerificationTokenCreateInput;
export type EmailVerificationTokenUpdateData = Prisma.EmailVerificationTokenUpdateInput;

// --- Phone Verification Token ---
export const PhoneVerificationTokenInclude = {} as const;
export type PhoneVerificationTokenEntity = Prisma.PhoneVerificationTokenGetPayload<{
  include: typeof PhoneVerificationTokenInclude;
}>;
export type PhoneVerificationTokenCreateData = Prisma.PhoneVerificationTokenCreateInput;
export type PhoneVerificationTokenUpdateData = Prisma.PhoneVerificationTokenUpdateInput;

// --- Email Change Token ---
export const EmailChangeTokenInclude = {} as const;
export type EmailChangeTokenEntity = Prisma.EmailChangeTokenGetPayload<{
  include: typeof EmailChangeTokenInclude;
}>;
export type EmailChangeTokenCreateData = Prisma.EmailChangeTokenCreateInput;
export type EmailChangeTokenUpdateData = Prisma.EmailChangeTokenUpdateInput;

// --- Refresh Token ---
export const RefreshTokenInclude = {} as const;
export type RefreshTokenEntity = Prisma.RefreshTokenGetPayload<{
  include: typeof RefreshTokenInclude;
}>;
export type RefreshTokenCreateData = Prisma.RefreshTokenCreateInput;
export type RefreshTokenUpdateData = Prisma.RefreshTokenUpdateInput;

// --- Login Session ---
export const LoginSessionInclude = {} as const;
export type LoginSessionEntity = Prisma.LoginSessionGetPayload<{
  include: typeof LoginSessionInclude;
}>;
export type LoginSessionCreateData = Prisma.LoginSessionCreateInput;
export type LoginSessionUpdateData = Prisma.LoginSessionUpdateInput;

// --- Password History ---
export const PasswordHistoryInclude = {} as const;
export type PasswordHistoryEntity = Prisma.PasswordHistoryGetPayload<{
  include: typeof PasswordHistoryInclude;
}>;
export type PasswordHistoryCreateData = Prisma.PasswordHistoryCreateInput;

// ============================================================================
// AGGREGATE QUERY TYPES
// ============================================================================

/**
 * Common filter options for user queries
 */
export interface UserQueryFilters {
  where?: Prisma.UserWhereInput;
  include?: Prisma.UserInclude;
  orderBy?: Prisma.UserOrderByWithRelationInput;
}

/**
 * Common filter options for token queries
 */
export interface TokenQueryFilters {
  where?:
    | Prisma.PasswordResetTokenWhereInput
    | Prisma.EmailVerificationTokenWhereInput
    | Prisma.PhoneVerificationTokenWhereInput
    | Prisma.EmailChangeTokenWhereInput
    | Prisma.RefreshTokenWhereInput
    | Prisma.LoginSessionWhereInput;
  include?: any;
  orderBy?: any;
}

// ============================================================================
// GENERIC HELPER TYPES
// ============================================================================

/**
 * A generic type representing the 'where' clause for any Prisma model.
 * Example: `WhereClause<'User'>` resolves to `Prisma.UserWhereInput`.
 */
export type WhereClause<T extends keyof Prisma.TypeMap['model']> =
  Prisma.TypeMap['model'][T]['operations']['findMany']['args']['where'];

/**
 * A generic type representing the 'orderBy' clause for any Prisma model.
 * Example: `OrderByClause<'User'>` resolves to `Prisma.UserOrderByWithRelationInput`.
 */
export type OrderByClause<T extends keyof Prisma.TypeMap['model']> =
  Prisma.TypeMap['model'][T]['operations']['findMany']['args']['orderBy'];

/**
 * Generic type for pagination parameters
 */
export interface PaginationParams {
  skip?: number;
  take?: number;
  cursor?: any;
}

/**
 * Generic type for repository operations that return multiple results
 */
export type FindManyResult<T> = {
  data: T[];
  total: number;
  hasNext: boolean;
};

// ============================================================================
// ENTITY VALIDATION TYPES
// ============================================================================

/**
 * Validation result for entity operations
 */
export interface EntityValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Type guard to check if an object is a valid UserEntity
 */
export function isValidUserEntity(entity: unknown): entity is UserEntity {
  // First, ensure the entity is an object and not null
  if (typeof entity !== 'object' || entity === null) {
    return false;
  }

  // Now that we know it's an object, we can safely check its properties
  const user = entity as UserEntity; // Cast for easier access
  return (
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.password === 'string' &&
    typeof user.firstName === 'string' &&
    typeof user.lastName === 'string' &&
    typeof user.role === 'string' &&
    typeof user.isActive === 'boolean' &&
    user.createdAt instanceof Date &&
    user.updatedAt instanceof Date &&
    user.profile !== undefined // This check is also now safe
  );
}

/**
 * Type guard to check if an object is a valid UserProfileEntity
 */
export function isValidUserProfileEntity(entity: unknown): entity is UserProfileEntity {
  // First, ensure the entity is an object and not null
  if (typeof entity !== 'object' || entity === null) {
    return false;
  }

  const profile = entity as UserProfileEntity;
  return (
    typeof profile.id === 'string' &&
    typeof profile.userId === 'string' &&
    profile.createdAt instanceof Date &&
    profile.updatedAt instanceof Date
  );
}
