import { Prisma } from '@prisma/client';

// ============================================================================
// USER ENTITY
// ============================================================================

/**
 * Defines the relations to always include when fetching a User.
 * This ensures the User aggregate's data (including its profile) is always consistent.
 */
export const UserInclude = {
  profile: true,
} as const; // 'as const' is crucial for type inference

/**
 * UserEntity: The full User object from Prisma, including the profile relation.
 * This is the primary data transfer object within the infrastructure layer for a user.
 */
export type UserEntity = Prisma.UserGetPayload<{ include: typeof UserInclude }>;

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

/** Prisma type for creating a new UserProfile record. */
export type ProfileCreateData = Prisma.UserProfileCreateInput;

/** Prisma type for updating an existing UserProfile record. */
export type ProfileUpdateData = Prisma.UserProfileUpdateInput;

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
