// FILE: src/types/auth.schemas.ts

import { z } from 'zod';
import { UserRoleSchema, UserSchema } from './user.schemas';

// ============================================================================
// REUSABLE AUTHENTICATION SCHEMAS
// ============================================================================

/**
 * Defines a strong password policy for the application.
 * This is used for registration, password resets, and password changes.
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  );

// ============================================================================
// AUTHENTICATION FORM/REQUEST SCHEMAS
// ============================================================================

/**
 * Schema for the user login form.
 */
export const LoginRequestSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Schema for the user registration form.
 * Includes password confirmation to ensure the user enters their intended password.
 */
export const RegisterRequestSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, 'First name must be at least 2 characters')
      .max(50),
    lastName: z
      .string()
      .trim()
      .min(2, 'Last name must be at least 2 characters')
      .max(50),
    email: z
      .string()
      .email('Please enter a valid email address')
      .trim()
      .toLowerCase(),
    password: PasswordSchema,
    confirmPassword: z.string(),
    role: UserRoleSchema.default('LAND_OWNER'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'], // a `path` is required for form libraries like react-hook-form
  });

/**
 * Schema for the "forgot password" form, which only requires an email.
 */
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
});

/**
 * Schema for the "reset password" form.
 * Requires a token (from email/link) and a new password with confirmation.
 */
export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is missing or invalid'),
    newPassword: PasswordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

/**
 * Schema for the "change password" form for an authenticated user.
 */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: PasswordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

/**
 * Schema for verifying a user's email with a token.
 */
export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

/**
 * Defines the expected data structure after a successful authentication event.
 */
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
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

export type AuthResponse = z.infer<typeof AuthResponseSchema>;