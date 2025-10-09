// FILE: src/types/schemas/auth.schemas.ts

import { z } from 'zod';
import { UserSchema } from './user.schemas';

// ============================================================================
// ENUMS
// ============================================================================

export const UserRoleSchema = z.enum(['LAND_OWNER', 'HEIR', 'ADMIN']);

// ============================================================================
// AUTH REQUEST SCHEMAS
// ============================================================================

/**
 * Schema for user login
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Strong password validation rule (reusable)
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
    'Password must contain uppercase, lowercase, number, and special character'
  );

/**
 * Schema for user registration
 */
export const RegisterSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: PasswordSchema,
  role: UserRoleSchema.optional().default('LAND_OWNER'),
});

/**
 * Schema for forgot password request
 */
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
});

/**
 * Schema for password reset with token
 */
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: PasswordSchema,
});

/**
 * Schema for changing password (authenticated user)
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: PasswordSchema,
});

/**
 * Schema for refreshing access token
 */
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============================================================================
// AUTH RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for authentication response (login/register)
 */
export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: UserSchema,
});

/**
 * Schema for token refresh response
 */
export const RefreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

// Request types
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

// Response types
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;

// Enum types
export type UserRole = z.infer<typeof UserRoleSchema>;