// ============================================================================
// auth.schemas.ts - Authentication Validation Schemas
// ============================================================================
// Updated to match new backend auth.dto with enhanced security and session management
// ============================================================================

import { z } from 'zod';

// ============================================================================
// SHARED VALIDATION SCHEMAS
// ============================================================================

/**
 * Enhanced strong password validation matching backend IsEnhancedPassword
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter  
 * - At least one number
 * - At least one special character
 */
export const EnhancedPasswordSchema = z
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


// ============================================================================
// REQUEST SCHEMAS (Input Validation)
// ============================================================================

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
  deviceId: z
    .string()
    .max(100, 'Device ID cannot exceed 100 characters')
    .optional(),
  ipAddress: z
    .string()
    .max(45, 'IP address cannot exceed 45 characters')
    .optional(),
  userAgent: z
    .string()
    .max(500, 'User agent cannot exceed 500 characters')
    .optional(),
});

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
    password: EnhancedPasswordSchema,
    passwordConfirmation: z
      .string()
      .min(1, 'Please confirm your password'),
    acceptedTerms: z
      .boolean()
      .refine(val => val === true, 'You must accept the terms and conditions to proceed'),
    marketingOptIn: z
      .boolean()
      .default(false)
      .optional(),
    deviceId: z
      .string()
      .max(100, 'Device ID cannot exceed 100 characters')
      .optional(),
    ipAddress: z
      .string()
      .max(45, 'IP address cannot exceed 45 characters')
      .optional(),
    userAgent: z
      .string()
      .max(500, 'User agent cannot exceed 500 characters')
      .optional(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Password confirmation must match password',
    path: ['passwordConfirmation'],
  });

export const VerifyEmailRequestSchema = z.object({
  token: z
    .string()
    .min(10, 'Token must be at least 10 characters long')
    .max(500, 'Invalid token format'),
  deviceId: z
    .string()
    .max(100, 'Device ID cannot exceed 100 characters')
    .optional(),
});

export const ResendVerificationRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase()
    .max(255, 'Email must not exceed 255 characters'),
});

export const ForgotPasswordRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase()
    .max(255, 'Email must not exceed 255 characters'),
});

export const ResetPasswordRequestSchema = z
  .object({
    token: z
      .string()
      .min(10, 'Token must be at least 10 characters long')
      .max(500, 'Invalid token format'),
    password: EnhancedPasswordSchema,
    passwordConfirmation: z
      .string()
      .min(1, 'Please confirm your password'),
    deviceId: z
      .string()
      .max(100, 'Device ID cannot exceed 100 characters')
      .optional(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Password confirmation must match password',
    path: ['passwordConfirmation'],
  });

export const ValidateResetTokenRequestSchema = z.object({
  token: z
    .string()
    .min(10, 'Token must be at least 10 characters long')
    .max(500, 'Invalid token format'),
});

export const ChangePasswordRequestSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .max(128, 'Invalid current password format'),
    password: EnhancedPasswordSchema,
    passwordConfirmation: z
      .string()
      .min(1, 'Please confirm your password'),
    terminateOtherSessions: z
      .boolean()
      .default(true)
      .optional(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Password confirmation must match password',
    path: ['passwordConfirmation'],
  })
  .refine((data) => data.currentPassword !== data.password, {
    message: 'New password must be different from current password',
    path: ['password'],
  });

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required'),
  deviceId: z
    .string()
    .max(100, 'Device ID cannot exceed 100 characters')
    .optional(),
});

export const LogoutRequestSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required'),
  allDevices: z
    .boolean()
    .default(false)
    .optional(),
});

export const RequestEmailChangeRequestSchema = z.object({
  newEmail: z
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

export const ConfirmEmailChangeRequestSchema = z.object({
  token: z
    .string()
    .min(10, 'Token must be at least 10 characters long')
    .max(500, 'Invalid token format'),
  deviceId: z
    .string()
    .max(100, 'Device ID cannot exceed 100 characters')
    .optional(),
});

// ============================================================================
// RESPONSE SCHEMAS (API Output)
// ============================================================================

export const TokenMetadataSchema = z.object({
  accessTokenExpiresIn: z.number().positive(),
  refreshTokenExpiresIn: z.number().positive(),
  accessTokenExpiresAt: z.string().datetime().transform((val) => new Date(val)),
  refreshTokenExpiresAt: z.string().datetime().transform((val) => new Date(val)),
  tokenType: z.string().default('Bearer'),
  issuedAt: z.string().datetime().transform((val) => new Date(val)),
  sessionId: z.string().optional(),
});

export const AuthUserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['LAND_OWNER', 'HEIR', 'ADMIN']),
  isActive: z.boolean(),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  lastLoginAt: z.string().datetime().transform((val) => new Date(val)).optional(),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
  profileCompletion: z.number().min(0).max(100).optional(),
});

export const AuthResponseSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
  user: AuthUserResponseSchema,
  tokenMetadata: TokenMetadataSchema,
  requiresEmailVerification: z.boolean().optional(),
  requiresPhoneVerification: z.boolean().optional(),
  securityRecommendations: z.array(z.string()).optional(),
});

export const RefreshTokenResponseSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
  tokenMetadata: TokenMetadataSchema,
  previousRefreshToken: z.string().optional(),
});

export const VerifyEmailResponseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
  authData: AuthResponseSchema.optional(),
  nextSteps: z.array(z.string()).optional(),
});

export const ResendVerificationResponseSchema = z.object({
  message: z.string(),
  nextRetryAt: z.string().datetime().transform((val) => new Date(val)),
  retryAfterSeconds: z.number().positive(),
  attemptsMade: z.number().positive(),
  maxAttempts: z.number().positive(),
});

export const ForgotPasswordResponseSchema = z.object({
  message: z.string(),
  expiresInMinutes: z.number().positive(),
  nextResetAllowedAt: z.string().datetime().transform((val) => new Date(val)),
});

export const ValidateResetTokenResponseSchema = z.object({
  valid: z.boolean(),
  message: z.string().optional(),
  expiresAt: z.string().datetime().transform((val) => new Date(val)).optional(),
  email: z.string().email().optional(),
});

export const ResetPasswordResponseSchema = z.object({
  message: z.string(),
  authData: AuthResponseSchema.optional(),
  sessionsTerminated: z.boolean(),
  sessionCount: z.number().positive(),
});

export const ChangePasswordResponseSchema = z.object({
  message: z.string(),
  sessionsTerminated: z.boolean(),
  sessionCount: z.number().positive(),
  securityRecommendations: z.array(z.string()).optional(),
});

export const LogoutResponseSchema = z.object({
  message: z.string(),
  sessionsTerminated: z.number().positive(),
  terminatedSessionIds: z.array(z.string()).optional(),
});

export const RequestEmailChangeResponseSchema = z.object({
  message: z.string(),
  newEmail: z.string().email(),
  expiresAt: z.string().datetime().transform((val) => new Date(val)),
  expiresInMinutes: z.number().positive(),
  currentEmail: z.string().email(),
});

export const ConfirmEmailChangeResponseSchema = z.object({
  message: z.string(),
  previousEmail: z.string().email(),
  newEmail: z.string().email(),
  authData: AuthResponseSchema.optional(),
  requiresEmailVerification: z.boolean(),
});

export const AccountLockedResponseSchema = z.object({
  message: z.string(),
  lockedUntil: z.string().datetime().transform((val) => new Date(val)),
  minutesRemaining: z.number().positive(),
  failedAttempts: z.number().positive(),
  maxAttempts: z.number().positive(),
  supportContact: z.string().optional(),
});

export const RateLimitResponseSchema = z.object({
  message: z.string(),
  retryAfter: z.string().datetime().transform((val) => new Date(val)),
  retryAfterSeconds: z.number().positive(),
  limitType: z.string(),
  limit: z.number().positive(),
  windowSeconds: z.number().positive(),
});

export const SecurityEventResponseSchema = z.object({
  message: z.string(),
  eventType: z.enum([
    'suspicious_login',
    'password_change',
    'email_change',
    'device_change',
    'session_revoked',
    'account_locked',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  occurredAt: z.string().datetime().transform((val) => new Date(val)),
  recommendedActions: z.array(z.string()).optional(),
  ipAddress: z.string().optional(),
  deviceInfo: z.string().optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type LoginInput = z.infer<typeof LoginRequestSchema>;
export type RegisterInput = z.infer<typeof RegisterRequestSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailRequestSchema>;
export type ResendVerificationInput = z.infer<typeof ResendVerificationRequestSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordRequestSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordRequestSchema>;
export type ValidateResetTokenInput = z.infer<typeof ValidateResetTokenRequestSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordRequestSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenRequestSchema>;
export type LogoutInput = z.infer<typeof LogoutRequestSchema>;
export type RequestEmailChangeInput = z.infer<typeof RequestEmailChangeRequestSchema>;
export type ConfirmEmailChangeInput = z.infer<typeof ConfirmEmailChangeRequestSchema>;

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type AuthUserResponse = z.infer<typeof AuthUserResponseSchema>;
export type TokenMetadata = z.infer<typeof TokenMetadataSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type VerifyEmailResponse = z.infer<typeof VerifyEmailResponseSchema>;
export type ResendVerificationResponse = z.infer<typeof ResendVerificationResponseSchema>;
export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponseSchema>;
export type ValidateResetTokenResponse = z.infer<typeof ValidateResetTokenResponseSchema>;
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;
export type ChangePasswordResponse = z.infer<typeof ChangePasswordResponseSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
export type RequestEmailChangeResponse = z.infer<typeof RequestEmailChangeResponseSchema>;
export type ConfirmEmailChangeResponse = z.infer<typeof ConfirmEmailChangeResponseSchema>;
export type AccountLockedResponse = z.infer<typeof AccountLockedResponseSchema>;
export type RateLimitResponse = z.infer<typeof RateLimitResponseSchema>;
export type SecurityEventResponse = z.infer<typeof SecurityEventResponseSchema>;

// ============================================================================
// API PAYLOAD TYPES (Backend-specific, exclude frontend-only fields)
// ============================================================================

export type RegisterApiPayload = Omit<RegisterInput, 'passwordConfirmation'>;
export type ResetPasswordApiPayload = Omit<ResetPasswordInput, 'passwordConfirmation'>;
export type ChangePasswordApiPayload = Omit<ChangePasswordInput, 'passwordConfirmation'>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Password strength calculator (compatible with new backend requirements)
 */
export const calculatePasswordStrength = (password: string): string => {
  if (!password) return 'weak';
  
  let strength = 0;
  
  // Length check
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;
  
  // Character diversity (matches backend IsEnhancedPassword)
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