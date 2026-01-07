import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IsStrongPassword } from 'class-validator';

import { BaseResponseDto } from '@shamba/common';
import { IsSecurePassword, Match } from '@shamba/common';

// ============================================================================
// CUSTOM VALIDATORS
// ============================================================================

/**
 * Enhanced strong password validator with configurable requirements
 */
export function IsEnhancedPassword() {
  return function (object: object, propertyName: string) {
    IsStrongPassword(
      {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      },
      {
        message:
          'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      },
    )(object, propertyName);
  };
}

// ============================================================================
// REQUEST DTOs (Input Validation)
// ============================================================================

export class LoginRequestDto {
  @ApiProperty({
    description: 'User email address (case-insensitive).',
    example: 'john.mwangi@example.com',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }
    return undefined;
  })
  email!: string;

  @ApiProperty({
    description: 'User password.',
    example: 'SecurePassword123!',
    minLength: 1,
  })
  @IsString()
  @MinLength(1, { message: 'Password is required.' })
  password!: string;

  @ApiPropertyOptional({
    description: 'Device identifier for session management and security tracking.',
    example: 'device-abc123-xyz789',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Device ID cannot exceed 100 characters.' })
  deviceId?: string;

  @ApiPropertyOptional({
    description: 'IP address for security logging (auto-detected if not provided).',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsString()
  @MaxLength(45, { message: 'IP address cannot exceed 45 characters.' })
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User agent string for browser/device identification.',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'User agent cannot exceed 500 characters.' })
  userAgent?: string;
}

export class RegisterRequestDto {
  @ApiProperty({
    description: 'User first name.',
    example: 'John',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long.' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return undefined;
  })
  firstName!: string;

  @ApiProperty({
    description: 'User last name.',
    example: 'Mwangi',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long.' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return undefined;
  })
  lastName!: string;

  @ApiProperty({
    description: 'User email address (will be normalized to lowercase).',
    example: 'john.mwangi@example.com',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }
    return undefined;
  })
  email!: string;

  @ApiProperty({
    description:
      'User password. Must be at least 8 characters with uppercase, lowercase, number, and special character.',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsEnhancedPassword()
  @IsSecurePassword()
  password!: string;

  @ApiProperty({
    description: 'Confirm the user password. Must exactly match the password field.',
    example: 'SecurePassword123!',
  })
  @IsString()
  @Match('password', { message: 'Password confirmation must match password.' })
  passwordConfirmation!: string;

  @ApiProperty({
    description: 'Must accept terms and conditions to register.',
    example: true,
  })
  @IsBoolean({ message: 'Accepted terms must be a boolean value.' })
  @Equals(true, { message: 'You must accept the terms and conditions to proceed.' })
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  acceptedTerms!: boolean;

  @ApiPropertyOptional({
    description: 'Opt-in to receive marketing communications.',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  marketingOptIn?: boolean;

  @ApiPropertyOptional({
    description: 'Device identifier for initial session.',
    example: 'device-abc123',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Device ID cannot exceed 100 characters.' })
  deviceId?: string;

  @ApiPropertyOptional({
    description: 'IP address for security logging.',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsString()
  @MaxLength(45, { message: 'IP address cannot exceed 45 characters.' })
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User agent string for browser/device identification.',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'User agent cannot exceed 500 characters.' })
  userAgent?: string;
}

// REMOVED: VerifyEmailRequestDto
// REMOVED: ResendVerificationRequestDto

export class ForgotPasswordRequestDto {
  @ApiProperty({
    description: 'The email address to send password reset instructions to.',
    example: 'john.mwangi@example.com',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }
    return undefined;
  })
  email!: string;
}

export class ResetPasswordRequestDto {
  @ApiProperty({
    description: 'The password reset token received via email.',
    example: 'reset-token-abc123xyz789',
    minLength: 10,
  })
  @IsString({ message: 'Reset token is required.' })
  @MinLength(10, { message: 'Token must be at least 10 characters long.' })
  token!: string;

  @ApiProperty({ description: 'The desired new password.' })
  @IsEnhancedPassword()
  password!: string;

  @ApiProperty({ description: 'Confirm the new password.' })
  @Match('password', { message: 'Password confirmation must match password.' })
  passwordConfirmation!: string;

  @ApiPropertyOptional({
    description: 'Device identifier for automatic login after reset.',
    example: 'device-abc123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Device ID cannot exceed 100 characters.' })
  deviceId?: string;
}

export class ValidateResetTokenRequestDto {
  @ApiProperty({
    description: 'The password reset token to validate.',
    example: 'reset-token-abc123',
    minLength: 10,
  })
  @IsString({ message: 'Token is required.' })
  @MinLength(10, { message: 'Token must be at least 10 characters long.' })
  token!: string;
}

export class ChangePasswordRequestDto {
  @ApiProperty({
    description: "The user's current password.",
    example: 'OldPassword123!',
  })
  @IsString()
  @MinLength(1, { message: 'Current password is required.' })
  currentPassword!: string;

  @ApiProperty({ description: 'The desired new password.' })
  @IsEnhancedPassword()
  password!: string;

  @ApiProperty({ description: 'Confirm the new password.' })
  @Match('password', { message: 'Password confirmation must match password.' })
  passwordConfirmation!: string;

  @ApiPropertyOptional({
    description: 'Terminate all other active sessions for security (default: true).',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false && value !== 0)
  terminateOtherSessions?: boolean;
}

export class RefreshTokenRequestDto {
  @ApiProperty({
    description: 'The refresh token to exchange for a new access token.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'Refresh token is required.' })
  refreshToken!: string;

  @ApiPropertyOptional({
    description: 'Device ID for token rotation security.',
    example: 'device-abc123',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Device ID cannot exceed 100 characters.' })
  deviceId?: string;
}

export class LogoutRequestDto {
  @ApiProperty({
    description: 'The refresh token to invalidate on logout.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'Refresh token is required.' })
  refreshToken!: string;

  @ApiPropertyOptional({
    description: 'Logout from all devices (default: false).',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  allDevices?: boolean;
}

export class RequestEmailChangeRequestDto {
  @ApiProperty({
    description: 'The new email address.',
    example: 'newemail@example.com',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }
    return undefined;
  })
  newEmail!: string;

  @ApiProperty({
    description: 'Current password for security verification.',
    example: 'CurrentPassword123!',
  })
  @IsString()
  @MinLength(1, { message: 'Password is required.' })
  password!: string;
}

export class ConfirmEmailChangeRequestDto {
  @ApiProperty({
    description: 'Email change verification token.',
    example: 'email-change-token-abc123',
    minLength: 10,
  })
  @IsString({ message: 'Token is required.' })
  @MinLength(10, { message: 'Token must be at least 10 characters long.' })
  token!: string;

  @ApiPropertyOptional({
    description: 'Device identifier for automatic login after email change.',
    example: 'device-abc123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Device ID cannot exceed 100 characters.' })
  deviceId?: string;
}

// ============================================================================
// RESPONSE DTOs (API Output)
// ============================================================================

export class AuthUserResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'john.mwangi@example.com' })
  email!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Mwangi' })
  lastName!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role: UserRole = UserRole.USER;

  @ApiProperty({ example: true })
  isActive!: boolean;

  // REMOVED: emailVerified field (no longer needed)

  @ApiPropertyOptional({ example: '2024-10-25T10:30:00.000Z' })
  lastLoginAt?: Date;

  @ApiProperty({ example: '2024-01-15T08:20:00.000Z' })
  override createdAt: Date = new Date();

  @ApiPropertyOptional({
    description: 'User profile completion percentage',
    example: 75,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  profileCompletion?: number;
}

export class TokenMetadataDto {
  @ApiProperty({
    description: 'Access token expiry time in seconds.',
    example: 900,
  })
  @IsNumber()
  @IsPositive()
  accessTokenExpiresIn!: number;

  @ApiProperty({
    description: 'Refresh token expiry time in seconds.',
    example: 604800,
  })
  @IsNumber()
  @IsPositive()
  refreshTokenExpiresIn!: number;

  @ApiProperty({
    description: 'Access token expiry timestamp.',
    example: '2024-10-25T11:45:00.000Z',
  })
  @IsDateString()
  accessTokenExpiresAt!: Date;

  @ApiProperty({
    description: 'Refresh token expiry timestamp.',
    example: '2024-11-01T10:30:00.000Z',
  })
  @IsDateString()
  refreshTokenExpiresAt!: Date;

  @ApiProperty({
    description: 'Token type.',
    example: 'Bearer',
  })
  @IsString()
  tokenType: string = 'Bearer';

  @ApiProperty({
    description: 'When the tokens were issued.',
    example: '2024-10-25T10:30:00.000Z',
  })
  @IsDateString()
  issuedAt!: Date;

  @ApiPropertyOptional({
    description: 'Session ID for tracking and revocation.',
    example: 'session-abc123',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'A short-lived JSON Web Token for API access.' })
  @IsString()
  accessToken!: string;

  @ApiProperty({
    description: 'A long-lived token used to obtain a new access token.',
  })
  @IsString()
  refreshToken!: string;

  @ApiProperty({ type: () => AuthUserResponseDto })
  @ValidateNested()
  @Type(() => AuthUserResponseDto)
  user!: AuthUserResponseDto;

  @ApiProperty({ type: () => TokenMetadataDto })
  @ValidateNested()
  @Type(() => TokenMetadataDto)
  tokenMetadata!: TokenMetadataDto;

  // REMOVED: requiresEmailVerification field

  @ApiPropertyOptional({
    description: 'Security recommendations for the user.',
    example: ['Enable two-factor authentication', 'Update your recovery email'],
  })
  @IsOptional()
  @IsString({ each: true })
  securityRecommendations?: string[];
}

export class RefreshTokenResponseDto {
  @ApiProperty({ description: 'New short-lived JSON Web Token for API access.' })
  @IsString()
  accessToken!: string;

  @ApiProperty({
    description: 'New refresh token (token rotation for enhanced security).',
  })
  @IsString()
  refreshToken!: string;

  @ApiProperty({ type: () => TokenMetadataDto })
  @ValidateNested()
  @Type(() => TokenMetadataDto)
  tokenMetadata!: TokenMetadataDto;

  @ApiPropertyOptional({
    description: 'Previous refresh token (if rotation occurred).',
    example: 'old-refresh-token-xyz',
  })
  @IsOptional()
  @IsString()
  previousRefreshToken?: string;
}

// REMOVED: VerifyEmailResponseDto
// REMOVED: ResendVerificationResponseDto

export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Success message (intentionally vague for security).',
    example: 'If an account with that email exists, password reset instructions have been sent.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Token expiry time in minutes (for user information).',
    example: 15,
  })
  @IsNumber()
  @IsPositive()
  expiresInMinutes!: number;

  @ApiProperty({
    description: 'When the next password reset email can be requested.',
    example: '2024-10-25T10:45:00.000Z',
  })
  @IsDateString()
  nextResetAllowedAt!: Date;
}

export class ValidateResetTokenResponseDto {
  @ApiProperty({
    description: 'Whether the token is valid and not expired.',
    example: true,
  })
  @IsBoolean()
  valid!: boolean;

  @ApiPropertyOptional({
    description: 'Error message if token is invalid.',
    example: 'Token has expired or is invalid.',
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    description: 'Token expiry time if valid.',
    example: '2024-10-25T11:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Email associated with the token (if valid).',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Success message.',
    example: 'Password reset successfully. You can now log in with your new password.',
  })
  @IsString()
  message!: string;

  @ApiPropertyOptional({
    description: 'Auto-login tokens after successful reset (optional).',
    type: () => AuthResponseDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AuthResponseDto)
  authData?: AuthResponseDto;

  @ApiProperty({
    description: 'Whether all other sessions were terminated for security.',
    example: true,
  })
  @IsBoolean()
  sessionsTerminated!: boolean;

  @ApiProperty({
    description: 'Number of sessions terminated.',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  sessionCount!: number;
}

export class ChangePasswordResponseDto {
  @ApiProperty({
    description: 'Success message.',
    example: 'Password changed successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Whether all other sessions were terminated for security.',
    example: true,
  })
  @IsBoolean()
  sessionsTerminated!: boolean;

  @ApiProperty({
    description: 'Number of sessions terminated.',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  sessionCount!: number;

  @ApiPropertyOptional({
    description: 'Security recommendations after password change.',
    example: ['Review your active sessions', 'Enable two-factor authentication'],
  })
  @IsOptional()
  @IsString({ each: true })
  securityRecommendations?: string[];
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Success message.',
    example: 'Successfully logged out.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Number of sessions terminated.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  sessionsTerminated!: number;

  @ApiPropertyOptional({
    description: 'Session IDs that were terminated.',
    example: ['session-abc123', 'session-xyz789'],
  })
  @IsOptional()
  @IsString({ each: true })
  terminatedSessionIds?: string[];
}

export class RequestEmailChangeResponseDto {
  @ApiProperty({
    example: 'Email change verification sent to your new email address.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'The new email address (for confirmation).',
    example: 'newemail@example.com',
  })
  @IsString()
  newEmail!: string;

  @ApiProperty({
    description: 'Token expiry time.',
    example: '2024-10-26T10:30:00.000Z',
  })
  @IsDateString()
  expiresAt!: Date;

  @ApiProperty({
    description: 'Minutes until token expires.',
    example: 1440,
  })
  @IsNumber()
  @IsPositive()
  expiresInMinutes!: number;

  @ApiProperty({
    description: 'Current email address (for confirmation).',
    example: 'current@example.com',
  })
  @IsString()
  currentEmail!: string;
}

export class ConfirmEmailChangeResponseDto {
  @ApiProperty({
    example: 'Email address changed successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'The previous email address.',
    example: 'old@example.com',
  })
  @IsString()
  previousEmail!: string;

  @ApiProperty({
    description: 'The new email address.',
    example: 'new@example.com',
  })
  @IsString()
  newEmail!: string;

  @ApiPropertyOptional({
    description: 'Auto-login tokens with new email.',
    type: () => AuthResponseDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AuthResponseDto)
  authData?: AuthResponseDto;

  // REMOVED: requiresEmailVerification field
}

export class AccountLockedResponseDto {
  @ApiProperty({
    example: 'Account temporarily locked due to multiple failed login attempts.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'When the account will be automatically unlocked.',
    example: '2024-10-25T11:00:00.000Z',
  })
  @IsDateString()
  lockedUntil!: Date;

  @ApiProperty({
    description: 'Number of minutes until unlock.',
    example: 15,
  })
  @IsNumber()
  @IsPositive()
  minutesRemaining!: number;

  @ApiProperty({
    description: 'Number of failed login attempts that caused the lock.',
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  failedAttempts!: number;

  @ApiProperty({
    description: 'Maximum allowed login attempts before lock.',
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  maxAttempts!: number;

  @ApiPropertyOptional({
    description: 'Support contact information.',
    example: 'support@shambasure.com',
  })
  @IsOptional()
  @IsString()
  supportContact?: string;
}

export class RateLimitResponseDto {
  @ApiProperty({
    example: 'Too many requests. Please try again later.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'When the rate limit resets.',
    example: '2024-10-25T10:31:00.000Z',
  })
  @IsDateString()
  retryAfter!: Date;

  @ApiProperty({
    description: 'Seconds until rate limit resets.',
    example: 60,
  })
  @IsNumber()
  @IsPositive()
  retryAfterSeconds!: number;

  @ApiProperty({
    description: 'Rate limit identifier for the user.',
    example: 'login_attempts',
  })
  @IsString()
  limitType!: string;

  @ApiProperty({
    description: 'Maximum number of requests allowed.',
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  limit!: number;

  @ApiProperty({
    description: 'Time window for the rate limit in seconds.',
    example: 900,
  })
  @IsNumber()
  @IsPositive()
  windowSeconds!: number;
}

export class SecurityEventResponseDto {
  @ApiProperty({
    description: 'Security event description.',
    example: 'Suspicious login attempt detected',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Type of security event.',
    example: 'suspicious_login',
    enum: [
      'suspicious_login',
      'password_change',
      'email_change',
      'device_change',
      'session_revoked',
      'account_locked',
    ],
  })
  @IsString()
  eventType!: string;

  @ApiProperty({
    description: 'Severity level of the event.',
    example: 'medium',
    enum: ['low', 'medium', 'high', 'critical'],
  })
  @IsString()
  severity!: string;

  @ApiProperty({
    description: 'When the event occurred.',
    example: '2024-10-25T10:30:00.000Z',
  })
  @IsDateString()
  occurredAt!: Date;

  @ApiPropertyOptional({
    description: 'Recommended actions for the user.',
    example: ['Review your account activity', 'Change your password if suspicious'],
  })
  @IsOptional()
  @IsString({ each: true })
  recommendedActions?: string[];

  @ApiPropertyOptional({
    description: 'IP address associated with the event.',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'Device information associated with the event.',
    example: 'Chrome on Windows',
  })
  @IsOptional()
  @IsString()
  deviceInfo?: string;
}
