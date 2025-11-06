// ============================================================================
// user.schemas.ts - User Management Validation Schemas
// ============================================================================
// Updated to match Prisma schema with correct enums and relationships
// ============================================================================

import { z } from 'zod';

// ============================================================================
// ENUMS (From Prisma Schema)
// ============================================================================

/**
 * User roles in the system - FROM PRISMA SCHEMA
 */
export const UserRoleSchema = z.enum(['USER', 'ADMIN', 'VERIFIER', 'AUDITOR']);

/**
 * Relationship types for family members - FROM PRISMA SCHEMA
 */
export const RelationshipTypeSchema = z.enum([
  'SPOUSE',
  'CHILD', 
  'PARENT',
  'SIBLING',
  'OTHER'
]);

// ============================================================================
// CORE USER SCHEMAS (Matching Prisma Models)
// ============================================================================

/**
 * Address structure from UserProfile
 */
export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  postalCode: z.string().optional(),
});

/**
 * Next of kin structure from UserProfile
 */
export const NextOfKinSchema = z.object({
  name: z.string().optional(),
  relationship: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

/**
 * User Profile schema matching Prisma model
 */
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  bio: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  phoneVerified: z.boolean().default(false),
  emailVerified: z.boolean().default(false),
  marketingOptIn: z.boolean().default(false),
  address: AddressSchema.nullable(),
  nextOfKin: NextOfKinSchema.nullable(),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
});

/**
 * Complete User schema matching Prisma model
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password: z.string(), // Hashed password, should not be exposed in responses
  firstName: z.string(),
  lastName: z.string(),
  role: UserRoleSchema.default('USER'),
  isActive: z.boolean().default(true),
  lastLoginAt: z.string().datetime().transform((val) => new Date(val)).nullable(),
  loginAttempts: z.number().int().default(0),
  lockedUntil: z.string().datetime().transform((val) => new Date(val)).nullable(),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
  deletedAt: z.string().datetime().transform((val) => new Date(val)).nullable(),
  
  // Optional relations (not always included in responses)
  profile: UserProfileSchema.optional(),
});

/**
 * User response without sensitive fields (for API responses)
 */
export const UserResponseSchema = UserSchema.omit({
  password: true,
}).extend({
  // Computed fields
  isLocked: z.boolean().default(false),
  isDeleted: z.boolean().default(false),
});

/**
 * Extended user response for "me" endpoint
 */
export const GetMyUserResponseSchema = UserResponseSchema.extend({
  profileCompletion: z.number().min(0).max(100).optional(),
  activeSessions: z.number().int().positive().optional(),
  securityRecommendations: z.array(z.string()).optional(),
});

// ============================================================================
// TOKEN AND SESSION SCHEMAS
// ============================================================================

/**
 * User session information
 */
export const UserSessionInfoSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  tokenHash: z.string(), // Not exposed to frontend
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  deviceId: z.string().nullable(),
  lastActivity: z.string().datetime().transform((val) => new Date(val)),
  expiresAt: z.string().datetime().transform((val) => new Date(val)),
  revokedAt: z.string().datetime().transform((val) => new Date(val)).nullable(),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  isCurrent: z.boolean().default(false),
});

// ============================================================================
// REQUEST SCHEMAS (Input Validation)
// ============================================================================

/**
 * Base user update schema
 */
const BaseUserUpdateRequestSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  lastName: z
    .string()
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
});

/**
 * Update current user's information
 */
export const UpdateMyUserRequestSchema = BaseUserUpdateRequestSchema;

/**
 * Get current user request (empty for type safety)
 */
export const GetMyUserRequestSchema = z.object({});

/**
 * Deactivate account request
 */
export const DeactivateMyAccountRequestSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Invalid password format'),
  reason: z
    .string()
    .max(500, 'Reason cannot exceed 500 characters')
    .optional(),
});

/**
 * Reactivate account request
 */
export const ReactivateMyAccountRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase()
    .max(255, 'Email must not exceed 255 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Invalid password format'),
});

// ============================================================================
// RESPONSE SCHEMAS (API Output)
// ============================================================================

/**
 * Update user response
 */
export const UpdateMyUserResponseSchema = z.object({
  message: z.string(),
  user: UserResponseSchema,
});

/**
 * Deactivate account response
 */
export const DeactivateMyAccountResponseSchema = z.object({
  message: z.string(),
  deactivatedAt: z.string().datetime().transform((val) => new Date(val)),
  sessionsTerminated: z.number().positive(),
  reactivationAvailableAt: z.string().datetime().transform((val) => new Date(val)),
});

/**
 * Create user response (admin function)
 */
export const CreateUserResponseSchema = z.object({
  message: z.string(),
  user: UserResponseSchema,
  temporaryPassword: z.string().optional(),
  welcomeEmailSent: z.boolean(),
});

/**
 * Update user response (admin function)
 */
export const UpdateUserResponseSchema = z.object({
  message: z.string(),
  user: UserResponseSchema,
});

/**
 * Change user role response (admin function)
 */
export const ChangeUserRoleResponseSchema = z.object({
  message: z.string(),
  user: UserResponseSchema,
  previousRole: UserRoleSchema,
  newRole: UserRoleSchema,
  changedBy: z.string(),
});

/**
 * Bulk update users response
 */
export const BulkUpdateUsersResponseSchema = z.object({
  message: z.string(),
  updatedCount: z.number().positive(),
  failedCount: z.number(),
  failures: z.array(z.object({
    userId: z.string(),
    error: z.string(),
  })).optional(),
});

/**
 * User list response with pagination
 */
export const UserListResponseSchema = z.object({
  data: z.array(UserResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
  }),
});

/**
 * User sessions response
 */
export const UserSessionsResponseSchema = z.object({
  sessions: z.array(UserSessionInfoSchema),
  totalSessions: z.number().positive(),
  activeSessions: z.number().positive(),
});

// ============================================================================
// API QUERY SCHEMAS
// ============================================================================

/**
 * User query schema for listing users
 */
export const UserQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  role: UserRoleSchema.optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  emailVerified: z.coerce.boolean().optional(),
  phoneVerified: z.coerce.boolean().optional(),
  sortBy: z.enum(['firstName', 'lastName', 'email', 'createdAt', 'lastLoginAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type UserRole = z.infer<typeof UserRoleSchema>;
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type NextOfKin = z.infer<typeof NextOfKinSchema>;
export type GetMyUserResponse = z.infer<typeof GetMyUserResponseSchema>;
export type UserSessionInfo = z.infer<typeof UserSessionInfoSchema>;

export type UpdateMyUserInput = z.infer<typeof UpdateMyUserRequestSchema>;
export type GetMyUserInput = z.infer<typeof GetMyUserRequestSchema>;
export type DeactivateMyAccountInput = z.infer<typeof DeactivateMyAccountRequestSchema>;
export type ReactivateMyAccountInput = z.infer<typeof ReactivateMyAccountRequestSchema>;

export type UpdateMyUserResponse = z.infer<typeof UpdateMyUserResponseSchema>;
export type DeactivateMyAccountResponse = z.infer<typeof DeactivateMyAccountResponseSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type UpdateUserResponse = z.infer<typeof UpdateUserResponseSchema>;
export type ChangeUserRoleResponse = z.infer<typeof ChangeUserRoleResponseSchema>;
export type BulkUpdateUsersResponse = z.infer<typeof BulkUpdateUsersResponseSchema>;
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
export type UserSessionsResponse = z.infer<typeof UserSessionsResponseSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;

// ============================================================================
// UTILITY FUNCTIONS AND CONSTANTS
// ============================================================================

/**
 * Human-readable labels for user roles
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  USER: 'User',
  ADMIN: 'Administrator',
  VERIFIER: 'Verifier',
  AUDITOR: 'Auditor',
} as const;

/**
 * Role descriptions for UI tooltips
 */
export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  USER: 'Regular user with basic access to personal features',
  ADMIN: 'System administrator with full access to all features and user management',
  VERIFIER: 'User responsible for verifying documents and user identities',
  AUDITOR: 'User with read-only access for auditing system activities',
} as const;

/**
 * Human-readable labels for relationship types
 */
export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  SPOUSE: 'Spouse',
  CHILD: 'Child',
  PARENT: 'Parent',
  SIBLING: 'Sibling',
  OTHER: 'Other',
} as const;

/**
 * Gets role label for display purposes
 */
export const getUserRoleLabel = (role: UserRole): string => {
  return USER_ROLE_LABELS[role];
};

/**
 * Gets relationship type label for display purposes
 */
export const getRelationshipTypeLabel = (relationship: RelationshipType): string => {
  return RELATIONSHIP_TYPE_LABELS[relationship];
};

/**
 * Validates if a string is a valid user role
 */
export const isValidUserRole = (role: string): role is UserRole => {
  return UserRoleSchema.safeParse(role).success;
};

/**
 * Gets all available user roles as an array
 */
export const getAllUserRoles = (): UserRole[] => {
  return UserRoleSchema.options;
};

/**
 * Gets all available relationship types as an array
 */
export const getAllRelationshipTypes = (): RelationshipType[] => {
  return RelationshipTypeSchema.options;
};

/**
 * Calculates user profile completion percentage based on Prisma UserProfile model
 */
export const calculateProfileCompletion = (user: UserResponse): number => {
  let completedFields = 0;
  const totalFields = 7; // email, firstName, lastName, role, phoneNumber, address, nextOfKin

  // Required fields that are always present
  if (user.email) completedFields++;
  if (user.firstName) completedFields++;
  if (user.lastName) completedFields++;
  if (user.role) completedFields++;

  // Optional profile fields
  if (user.profile?.phoneNumber) completedFields++;
  if (user.profile?.address && Object.keys(user.profile.address).length > 0) completedFields++;
  if (user.profile?.nextOfKin && Object.keys(user.profile.nextOfKin).length > 0) completedFields++;

  return Math.round((completedFields / totalFields) * 100);
};

/**
 * Checks if a user account is currently accessible
 */
export const isUserAccessible = (user: UserResponse): boolean => {
  const now = new Date();
  const isLocked = user.lockedUntil && user.lockedUntil > now;
  return user.isActive && !isLocked && !user.deletedAt;
};

/**
 * Gets user display name
 */
export const getUserDisplayName = (user: { firstName: string; lastName: string }): string => {
  return `${user.firstName} ${user.lastName}`.trim();
};

/**
 * Gets user initials for avatars
 */
export const getUserInitials = (user: { firstName: string; lastName: string }): string => {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
};

/**
 * Checks if user has admin privileges
 */
export const isAdmin = (user: { role: UserRole }): boolean => {
  return user.role === 'ADMIN';
};

/**
 * Checks if user has verifier privileges
 */
export const isVerifier = (user: { role: UserRole }): boolean => {
  return user.role === 'VERIFIER' || user.role === 'ADMIN';
};

/**
 * Checks if user has auditor privileges
 */
export const isAuditor = (user: { role: UserRole }): boolean => {
  return user.role === 'AUDITOR' || user.role === 'ADMIN';
};