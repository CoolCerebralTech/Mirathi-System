import { z } from 'zod';
import { UserRoleSchema, type UserRole } from './shared.types'; // <-- Import from shared file

// ============================================================================
// CORE USER RESPONSE SCHEMAS (Matching Backend DTOs)
// ============================================================================

/**
 * User response schema, MUST MATCH backend UserResponseDto
 * This schema is for data coming FROM the API.
 */
export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: UserRoleSchema,
  isActive: z.boolean(),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  lastLoginAt: z.string().datetime().transform((val) => new Date(val)).optional().nullable(),
  lockedUntil: z.string().datetime().transform((val) => new Date(val)).optional().nullable(),
  loginAttempts: z.number().int().default(0),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
  deletedAt: z.string().datetime().transform((val) => new Date(val)).optional().nullable(),
  isLocked: z.boolean(),
  isDeleted: z.boolean(),
});

/**
 * Extended user response, MUST MATCH backend GetMyUserResponseDto
 */
export const GetMyUserResponseSchema = UserResponseSchema.extend({
  profileCompletion: z.number().min(0).max(100).optional(),
  activeSessions: z.number().int().positive().optional(),
  securityRecommendations: z.array(z.string()).optional(),
});

/**
 * User session information, MUST MATCH backend UserSessionInfoDto
 */
export const UserSessionInfoSchema = z.object({
  sessionId: z.string(),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  lastActivity: z.string().datetime().transform((val) => new Date(val)),
  expiresAt: z.string().datetime().transform((val) => new Date(val)),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  deviceId: z.string().optional(),
  isCurrent: z.boolean(),
});


// ============================================================================
// REQUEST SCHEMAS (Input Validation for Forms)
// ============================================================================

/**
 * For updating the current user's first/last name. Matches UpdateMyUserRequestDto.
 */
export const UpdateMyUserRequestSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .optional(),
  lastName: z
    .string()
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .optional(),
});

/**
 * For deactivating the current user's account. Matches DeactivateMyAccountRequestDto.
 */
export const DeactivateMyAccountRequestSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
});

/**
 * For reactivating a deactivated account. Matches ReactivateMyAccountRequestDto.
 */
export const ReactivateMyAccountRequestSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .trim()
    .toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});


// ============================================================================
// API RESPONSE SCHEMAS (Matching Backend DTOs)
// ============================================================================

export const UpdateMyUserResponseSchema = z.object({
  message: z.string(),
  user: UserResponseSchema,
});

export const DeactivateMyAccountResponseSchema = z.object({
  message: z.string(),
  deactivatedAt: z.string().datetime().transform((val) => new Date(val)),
  sessionsTerminated: z.number().positive(),
  reactivationAvailableAt: z.string().datetime().transform((val) => new Date(val)),
});

export const UserSessionsResponseSchema = z.object({
  sessions: z.array(UserSessionInfoSchema),
  totalSessions: z.number().positive(),
  activeSessions: z.number().positive(),
});


// ============================================================================
// INFERRED TYPES
// ============================================================================

export type UserResponse = z.infer<typeof UserResponseSchema>;
export type GetMyUserResponse = z.infer<typeof GetMyUserResponseSchema>;
export type UserSessionInfo = z.infer<typeof UserSessionInfoSchema>;
export type UpdateMyUserInput = z.infer<typeof UpdateMyUserRequestSchema>;
export type DeactivateMyAccountInput = z.infer<typeof DeactivateMyAccountRequestSchema>;
export type ReactivateMyAccountInput = z.infer<typeof ReactivateMyAccountRequestSchema>;
export type UpdateMyUserResponse = z.infer<typeof UpdateMyUserResponseSchema>;
export type DeactivateMyAccountResponse = z.infer<typeof DeactivateMyAccountResponseSchema>;

// ============================================================================
// UTILITY FUNCTIONS (Relevant to User only)
// ============================================================================

/**
 * Check if user account is accessible (not locked, deleted, or inactive)
 */
export const isUserAccessible = (user: UserResponse): boolean => {
  const now = new Date();
  const lockedUntil = user.lockedUntil ? new Date(user.lockedUntil) : null;
  const isLocked = lockedUntil && lockedUntil > now;
  return user.isActive && !isLocked && !user.deletedAt;
};

/**
 * Get user's full display name
 */
export const getUserDisplayName = (user: { firstName: string; lastName: string }): string => {
  return `${user.firstName} ${user.lastName}`.trim();
};

/**
 * Get user's initials for avatar
 */
export const getUserInitials = (user: { firstName: string; lastName: string }): string => {
  return `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
};

/**
 * Check if user has admin role
 */
export const isAdmin = (user: { role: UserRole }): boolean => {
  return user.role === 'ADMIN';
};

/**
 * Check if user has verifier role
 */
export const isVerifier = (user: { role: UserRole }): boolean => {
  return user.role === 'VERIFIER';
};

/**
 * Check if user has auditor role
 */
export const isAuditor = (user: { role: UserRole }): boolean => {
  return user.role === 'AUDITOR';
};

/**
 * Check if user account is currently locked
 */
export const isAccountLocked = (user: UserResponse): boolean => {
  if (!user.lockedUntil) return false;
  const now = new Date();
  const lockedUntil = new Date(user.lockedUntil);
  return lockedUntil > now;
};

/**
 * Get time remaining until account unlock (in minutes)
 */
export const getUnlockTimeRemaining = (user: UserResponse): number | null => {
  if (!user.lockedUntil || !isAccountLocked(user)) return null;
  const now = new Date();
  const lockedUntil = new Date(user.lockedUntil);
  const diffMs = lockedUntil.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60)); // Convert to minutes
};

/**
 * Format last login time for display
 */
export const formatLastLogin = (lastLoginAt: Date | null | undefined): string => {
  if (!lastLoginAt) return 'Never';
  
  const now = new Date();
  const diff = now.getTime() - new Date(lastLoginAt).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  return new Date(lastLoginAt).toLocaleDateString();
};