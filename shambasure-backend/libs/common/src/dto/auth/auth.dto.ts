import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsBoolean,
  Equals,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { UserRole } from '@shamba/common/enums';
import { BaseResponseDto } from '../shared/base.response.dto';
import { IsStrongPassword } from '../../decorators/is-password.decorator';
import { Match } from '../../decorators/match.decorator';

// ============================================================================
// REQUEST DTOs (Input Validation)
// ============================================================================

export class LoginRequestDto {
  @ApiProperty({
    description: 'User email address (case-insensitive).',
    example: 'john.mwangi@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email!: string;

  @ApiProperty({
    description: 'User password.',
    example: 'SecurePassword123!',
  })
  @IsString()
  @MinLength(1, { message: 'Password is required.' })
  password!: string;

  @ApiPropertyOptional({
    description: 'Device identifier for session management and security tracking.',
    example: 'device-abc123-xyz789',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceId?: string;
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
  @Transform(({ value }) => value?.trim())
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
  @Transform(({ value }) => value?.trim())
  lastName!: string;

  @ApiProperty({
    description: 'User email address (will be normalized to lowercase).',
    example: 'john.mwangi@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({
    description:
      'User password. Must be at least 8 characters with uppercase, lowercase, number, and special character.',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsStrongPassword()
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
  acceptedTerms!: boolean;

  @ApiPropertyOptional({
    description: 'Opt-in to receive marketing communications.',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;

  @ApiPropertyOptional({
    description: 'Device identifier for initial session.',
    example: 'device-abc123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceId?: string;
}

export class VerifyEmailRequestDto {
  @ApiProperty({
    description: 'Email verification token sent to user email.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'Verification token is required.' })
  @MinLength(10)
  token!: string;
}

export class ResendVerificationRequestDto {
  @ApiProperty({
    description: 'Email address to resend verification to.',
    example: 'john.mwangi@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;
}

export class ForgotPasswordRequestDto {
  @ApiProperty({
    description: 'The email address to send password reset instructions to.',
    example: 'john.mwangi@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;
}

export class ResetPasswordRequestDto {
  @ApiProperty({
    description: 'The password reset token received via email.',
    example: 'reset-token-abc123xyz789',
  })
  @IsString({ message: 'Reset token is required.' })
  @MinLength(10)
  token!: string;

  @ApiProperty({
    description: 'The desired new password.',
    example: 'ResetPassword123!',
  })
  @IsStrongPassword()
  newPassword!: string;

  @ApiProperty({
    description: 'Confirm the new password.',
    example: 'ResetPassword123!',
  })
  @IsString()
  @Match('newPassword', { message: 'Password confirmation must match new password.' })
  newPasswordConfirmation!: string;
}

export class ValidateResetTokenRequestDto {
  @ApiProperty({
    description: 'The password reset token to validate.',
    example: 'reset-token-abc123',
  })
  @IsString({ message: 'Token is required.' })
  @MinLength(10)
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

  @ApiProperty({
    description: 'The desired new password.',
    example: 'NewSecurePassword123!',
  })
  @IsStrongPassword()
  newPassword!: string;

  @ApiProperty({
    description: 'Confirm the new password.',
    example: 'NewSecurePassword123!',
  })
  @IsString()
  @Match('newPassword', { message: 'New password confirmation must match new password.' })
  newPasswordConfirmation!: string;
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
  })
  @IsOptional()
  @IsString()
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
  allDevices?: boolean;
}

// ============================================================================
// RESPONSE DTOs (API Output)
// ============================================================================

class AuthUserResponseDto extends BaseResponseDto {
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

  @ApiProperty({ example: false, description: 'Whether email is verified' })
  emailVerified!: boolean;

  @ApiPropertyOptional({ example: '2024-10-25T10:30:00.000Z' })
  lastLoginAt?: Date;

  @ApiProperty({ example: '2024-01-15T08:20:00.000Z' })
  declare createdAt: Date;
}

class TokenMetadataDto {
  @ApiProperty({
    description: 'Access token expiry time in seconds.',
    example: 900,
  })
  accessTokenExpiresIn!: number;

  @ApiProperty({
    description: 'Refresh token expiry time in seconds.',
    example: 604800,
  })
  refreshTokenExpiresIn!: number;

  @ApiProperty({
    description: 'Access token expiry timestamp.',
    example: '2024-10-25T11:45:00.000Z',
  })
  accessTokenExpiresAt!: Date;

  @ApiProperty({
    description: 'Refresh token expiry timestamp.',
    example: '2024-11-01T10:30:00.000Z',
  })
  refreshTokenExpiresAt!: Date;

  @ApiProperty({
    description: 'Token type.',
    example: 'Bearer',
  })
  tokenType: string = 'Bearer';

  @ApiProperty({
    description: 'When the tokens were issued.',
    example: '2024-10-25T10:30:00.000Z',
  })
  issuedAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'A short-lived JSON Web Token for API access.' })
  accessToken!: string;

  @ApiProperty({
    description: 'A long-lived token used to obtain a new access token.',
  })
  refreshToken!: string;

  @ApiProperty({ type: () => AuthUserResponseDto })
  user!: AuthUserResponseDto;

  @ApiProperty({ type: () => TokenMetadataDto })
  tokenMetadata!: TokenMetadataDto;

  @ApiPropertyOptional({
    description: 'Whether email verification is required before full access.',
    example: true,
  })
  requiresEmailVerification?: boolean;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ description: 'New short-lived JSON Web Token for API access.' })
  accessToken!: string;

  @ApiProperty({
    description: 'New refresh token (token rotation for enhanced security).',
  })
  refreshToken!: string;

  @ApiProperty({ type: () => TokenMetadataDto })
  tokenMetadata!: TokenMetadataDto;
}

export class VerifyEmailResponseDto {
  @ApiProperty({
    example: 'Email verified successfully. Your account is now fully activated.',
  })
  message!: string;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiPropertyOptional({
    description: 'Auto-login tokens after successful verification.',
    type: () => AuthResponseDto,
  })
  authData?: AuthResponseDto;
}

export class ResendVerificationResponseDto {
  @ApiProperty({
    example: 'Verification email sent. Please check your inbox.',
  })
  message!: string;

  @ApiProperty({
    description: 'When the next verification email can be sent.',
    example: '2024-10-25T11:00:00.000Z',
  })
  nextRetryAt!: Date;

  @ApiProperty({
    description: 'Time to wait before next attempt in seconds.',
    example: 60,
  })
  retryAfterSeconds!: number;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Success message (intentionally vague for security).',
    example: 'If an account with that email exists, password reset instructions have been sent.',
  })
  message!: string;

  @ApiProperty({
    description: 'Token expiry time in minutes (for user information).',
    example: 15,
  })
  expiresInMinutes!: number;
}

export class ValidateResetTokenResponseDto {
  @ApiProperty({
    description: 'Whether the token is valid and not expired.',
    example: true,
  })
  valid!: boolean;

  @ApiPropertyOptional({
    description: 'Error message if token is invalid.',
    example: 'Token has expired or is invalid.',
  })
  message?: string;

  @ApiPropertyOptional({
    description: 'Token expiry time if valid.',
    example: '2024-10-25T11:00:00.000Z',
  })
  expiresAt?: Date;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Success message.',
    example: 'Password reset successfully. You can now log in with your new password.',
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'Auto-login tokens after successful reset (optional).',
    type: () => AuthResponseDto,
  })
  authData?: AuthResponseDto;
}

export class ChangePasswordResponseDto {
  @ApiProperty({
    description: 'Success message.',
    example: 'Password changed successfully. Please log in with your new password.',
  })
  message!: string;

  @ApiProperty({
    description: 'Whether all other sessions were terminated for security.',
    example: true,
  })
  sessionsTerminated!: boolean;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Success message.',
    example: 'Successfully logged out.',
  })
  message!: string;

  @ApiProperty({
    description: 'Number of sessions terminated.',
    example: 1,
  })
  sessionsTerminated!: number;
}

export class AccountLockedResponseDto {
  @ApiProperty({
    example: 'Account temporarily locked due to multiple failed login attempts.',
  })
  message!: string;

  @ApiProperty({
    description: 'When the account will be automatically unlocked.',
    example: '2024-10-25T11:00:00.000Z',
  })
  lockedUntil!: Date;

  @ApiProperty({
    description: 'Number of minutes until unlock.',
    example: 15,
  })
  minutesRemaining!: number;

  @ApiProperty({
    description: 'Number of failed login attempts that caused the lock.',
    example: 5,
  })
  failedAttempts!: number;
}

export class RateLimitResponseDto {
  @ApiProperty({
    example: 'Too many requests. Please try again later.',
  })
  message!: string;

  @ApiProperty({
    description: 'When the rate limit resets.',
    example: '2024-10-25T10:31:00.000Z',
  })
  retryAfter!: Date;

  @ApiProperty({
    description: 'Seconds until rate limit resets.',
    example: 60,
  })
  retryAfterSeconds!: number;
}
