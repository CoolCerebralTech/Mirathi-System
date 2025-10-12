// FILE: src/types/auth.schemas.ts

import { z } from 'zod';
import { UserRoleSchema, UserSchema } from './user.schemas';

// ============================================================================
// SHARED AUTH PRIMITIVES
// ============================================================================

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.');

// ============================================================================
// AUTH REQUEST SCHEMAS (for UI Forms)
// ============================================================================

export const LoginRequestSchema = z.object({
  email: z.string().email('A valid email address is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export const RegisterRequestSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters.').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters.').max(50),
  email: z.string().email('A valid email address is required.'),
  password: PasswordSchema,
  role: UserRoleSchema.optional(),
});

// We keep these for completeness of the auth domain, for future forms
export const ForgotPasswordSchema = z.object({
  email: z.string().email('A valid email is required.'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required.'),
  newPassword: PasswordSchema,
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: PasswordSchema,
});

// ============================================================================
// AUTH RESPONSE SCHEMA (for API Client & State)
// ============================================================================

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: UserSchema,
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type LoginInput = z.infer<typeof LoginRequestSchema>;
export type RegisterInput = z.infer<typeof RegisterRequestSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export type AuthResponse = z.infer<typeof AuthResponseSchema>;