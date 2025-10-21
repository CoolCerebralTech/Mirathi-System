// ============================================================================
// auth.schemas.ts - Authentication Validation Schemas
// ============================================================================
// Production-ready Zod schemas for authentication with type-level security,
// comprehensive validation, and role-based access control.
// ============================================================================

import { z } from 'zod';
import { UserSchema } from './user.schemas';

// ============================================================================
// ROLE SCHEMAS - Type-Level Security
// ============================================================================

/**
 * Roles available for user registration.
 * ADMIN role is intentionally excluded for security - only assignable by admins.
 * 
 * @security Type-level protection prevents ADMIN from being selected during registration
 */
export const RegisterableRoleSchema = z.enum(['LAND_OWNER', 'HEIR'], {
  message: 'Please select a valid user role',
});

/**
 * Type-safe registerable role type.
 * Ensures ADMIN cannot be assigned during registration at compile-time.
 */
export type RegisterableRole = z.infer<typeof RegisterableRoleSchema>;

/**
 * Human-readable labels for registerable roles.
 * Used in UI dropdowns and radio buttons.
 */
export const REGISTERABLE_ROLE_LABELS: Record<RegisterableRole, string> = {
  LAND_OWNER: 'Land Owner',
  HEIR: 'Heir',
} as const;

/**
 * Detailed descriptions for each registerable role.
 * Used in tooltips, help text, and role selection UI.
 */
export const REGISTERABLE_ROLE_DESCRIPTIONS: Record<RegisterableRole, string> = {
  LAND_OWNER: 'Primary land owner with full management rights',
  HEIR: 'Designated heir with limited access and inheritance rights',
} as const;

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

/**
 * Strong password policy enforcing security best practices.
 * 
 * REQUIREMENTS:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*, etc.)
 * 
 * @example
 * Valid: "MyPass123!", "Secure@2024", "Admin#Pass1"
 * Invalid: "password", "12345678", "NoSpecial1"
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character (!@#$%^&*)',
  );

/**
 * Password strength indicator helper.
 * Returns strength level based on password characteristics.
 * 
 * @param password - Password string to evaluate
 * @returns Strength level: 'weak' | 'medium' | 'strong' | 'very-strong'
 */
export const calculatePasswordStrength = (password: string): string => {
  if (!password) return 'weak';
  
  let strength = 0;
  
  // Length check
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;
  
  // Character diversity
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  // Pattern complexity
  if (password.length >= 12 && /[^A-Za-z0-9].*[^A-Za-z0-9]/.test(password)) strength++;
  
  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  if (strength <= 6) return 'strong';
  return 'very-strong';
};

// ============================================================================
// AUTHENTICATION REQUEST SCHEMAS
// ============================================================================

/**
 * Login request schema.
 * Simple email and password validation for authentication.
 * 
 * @example
 * ```ts
 * const loginData: LoginInput = {
 *   email: 'user@example.com',
 *   password: 'MySecurePass123!'
 * };
 * ```
 */
export const LoginRequestSchema = z.object({
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
    .max(128, 'Password must not exceed 128 characters'),
});

/**
 * Registration request schema with role-based type safety.
 * 
 * FEATURES:
 * - Password confirmation validation
 * - Type-safe role selection (excludes ADMIN)
 * - Comprehensive field validation
 * - Default role assignment
 * 
 * SECURITY:
 * - ADMIN role cannot be selected (type-level + runtime)
 * - Password confirmation ensures user intent
 * - Email normalization (trim + lowercase)
 * 
 * @example
 * ```ts
 * const registrationData: RegisterInput = {
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: 'john@example.com',
 *   password: 'Secure123!',
 *   confirmPassword: 'Secure123!',
 *   role: 'LAND_OWNER'
 * };
 * ```
 */
export const RegisterRequestSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
    lastName: z
      .string()
      .trim()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must not exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .trim()
      .toLowerCase()
      .max(255, 'Email must not exceed 255 characters'),
    password: PasswordSchema,
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
    role: RegisterableRoleSchema.default('LAND_OWNER'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Forgot password request schema.
 * Only requires email for password reset initiation.
 * 
 * @security Generic response prevents user enumeration
 * 
 * @example
 * ```ts
 * const resetRequest: ForgotPasswordInput = {
 *   email: 'user@example.com'
 * };
 * ```
 */
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase()
    .max(255, 'Email must not exceed 255 characters'),
});

/**
 * Reset password request schema.
 * Requires token from email and new password with confirmation.
 * 
 * SECURITY:
 * - Token is single-use and time-limited
 * - Password confirmation prevents typos
 * - Strong password policy enforced
 * 
 * @example
 * ```ts
 * const resetData: ResetPasswordInput = {
 *   token: 'reset-token-from-email',
 *   newPassword: 'NewSecure123!',
 *   confirmNewPassword: 'NewSecure123!'
 * };
 * ```
 */
export const ResetPasswordSchema = z
  .object({
    token: z
      .string()
      .min(1, 'Reset token is missing or invalid')
      .max(500, 'Invalid reset token format'),
    newPassword: PasswordSchema,
    confirmNewPassword: z
      .string()
      .min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

/**
 * Change password request schema for authenticated users.
 * Requires current password verification for security.
 * 
 * SECURITY:
 * - Current password verification prevents unauthorized changes
 * - New password must differ from current (optional - add if needed)
 * - Password confirmation ensures user intent
 * 
 * @example
 * ```ts
 * const changeData: ChangePasswordInput = {
 *   currentPassword: 'OldPass123!',
 *   newPassword: 'NewSecure456!',
 *   confirmNewPassword: 'NewSecure456!'
 * };
 * ```
 */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .max(128, 'Invalid current password format'),
    newPassword: PasswordSchema,
    confirmNewPassword: z
      .string()
      .min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

/**
 * Email verification schema.
 * FUTURE: Will be used when email verification is implemented.
 * 
 * @example
 * ```ts
 * const verifyData: VerifyEmailInput = {
 *   token: 'verification-token-from-email'
 * };
 * ```
 */
export const VerifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, 'Verification token is required')
    .max(500, 'Invalid verification token format'),
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

/**
 * Authentication response schema.
 * Returned after successful login or registration.
 * 
 * CONTAINS:
 * - accessToken: Short-lived JWT for API requests
 * - refreshToken: Long-lived token for obtaining new access tokens
 * - user: Complete user object with profile data
 * 
 * @example
 * ```ts
 * const authResponse: AuthResponse = {
 *   accessToken: 'eyJhbGc...',
 *   refreshToken: 'eyJhbGc...',
 *   user: { id: '123', email: 'user@example.com', ... }
 * };
 * ```
 */
export const AuthResponseSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
  user: UserSchema,
});

// ============================================================================
// BACKEND API PAYLOAD TYPES
// ============================================================================

/**
 * Registration payload sent to backend API.
 * Excludes confirmPassword (frontend-only validation).
 * 
 * @example
 * ```ts
 * const apiPayload: RegisterApiPayload = {
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: 'john@example.com',
 *   password: 'Secure123!',
 *   role: 'LAND_OWNER'
 * };
 * ```
 */
export type RegisterApiPayload = Omit<RegisterInput, 'confirmPassword'>;

/**
 * Reset password payload sent to backend API.
 * Excludes confirmNewPassword (frontend-only validation).
 */
export type ResetPasswordApiPayload = Omit<ResetPasswordInput, 'confirmNewPassword'>;

/**
 * Change password payload sent to backend API.
 * Excludes confirmNewPassword (frontend-only validation).
 */
export type ChangePasswordApiPayload = Omit<ChangePasswordInput, 'confirmNewPassword'>;

// ============================================================================
// INFERRED TYPES
// ============================================================================

/**
 * Login form input type
 */
export type LoginInput = z.infer<typeof LoginRequestSchema>;

/**
 * Registration form input type (includes confirmPassword)
 */
export type RegisterFormInput = z.input<typeof RegisterRequestSchema>;

/**
 * Registration validated type (after Zod parsing)
 */
export type RegisterInput = z.infer<typeof RegisterRequestSchema>;

/**
 * Forgot password form input type
 */
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

/**
 * Reset password form input type (includes confirmNewPassword)
 */
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

/**
 * Change password form input type (includes confirmNewPassword)
 */
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

/**
 * Email verification input type
 */
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

/**
 * Authentication response type
 */
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validates if a role is registerable (not ADMIN).
 * Useful for runtime checks and UI logic.
 * 
 * @param role - Role to validate
 * @returns true if role is LAND_OWNER or HEIR
 */
export const isRegisterableRole = (role: string): role is RegisterableRole => {
  return role === 'LAND_OWNER' || role === 'HEIR';
};

/**
 * Gets all registerable roles as an array.
 * Useful for dropdowns, radio buttons, and role selection UI.
 * 
 * @returns Array of registerable roles
 */
export const getRegisterableRoles = (): RegisterableRole[] => {
  return ['LAND_OWNER', 'HEIR'];
};

/**
 * Gets role label for display purposes.
 * 
 * @param role - Role to get label for
 * @returns Human-readable role label
 */
export const getRoleLabel = (role: RegisterableRole): string => {
  return REGISTERABLE_ROLE_LABELS[role];
};

/**
 * Gets role description for help text.
 * 
 * @param role - Role to get description for
 * @returns Role description text
 */
export const getRoleDescription = (role: RegisterableRole): string => {
  return REGISTERABLE_ROLE_DESCRIPTIONS[role];
};
