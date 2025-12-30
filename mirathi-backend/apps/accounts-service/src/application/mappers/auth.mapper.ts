import { Injectable } from '@nestjs/common';

import { User } from '../../domain/models';
import { UserProfile } from '../../domain/models';
import {
  AccountLockedResponseDto,
  AuthResponseDto,
  AuthUserResponseDto,
  ChangePasswordResponseDto,
  ConfirmEmailChangeResponseDto,
  ForgotPasswordResponseDto,
  LogoutResponseDto,
  RefreshTokenResponseDto,
  RequestEmailChangeResponseDto,
  ResendVerificationResponseDto,
  ResetPasswordResponseDto,
  TokenMetadataDto,
  ValidateResetTokenResponseDto,
  VerifyEmailResponseDto,
} from '../dtos';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthMapper {
  // ============================================================================
  // AUTHENTICATION RESPONSE MAPPING
  // ============================================================================

  toAuthUserResponse(user: User, profile: UserProfile): AuthUserResponseDto {
    return {
      id: user.id,
      email: user.email.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      emailVerified: profile.isEmailVerified,
      phoneVerified: profile.isPhoneVerified,
      lastLoginAt: user.lastLoginAt ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profileCompletion: profile.completionPercentage,
    };
  }

  toAuthResponse(
    user: User,
    profile: UserProfile,
    tokens: TokenPair,
    tokenMetadata: TokenMetadataDto,
    context: {
      // Context object passed from the service
      requiresEmailVerification: boolean;
      securityRecommendations?: string[];
    },
  ): AuthResponseDto {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toAuthUserResponse(user, profile),
      tokenMetadata,
      requiresEmailVerification: context.requiresEmailVerification,
      // This logic belongs in the service, but can be passed in via context.
      requiresPhoneVerification: !profile.isPhoneVerified && !!profile.phoneNumber,
      securityRecommendations: context.securityRecommendations,
    };
  }

  toRefreshTokenResponse(
    tokens: TokenPair,
    tokenMetadata: TokenMetadataDto,
    previousRefreshToken?: string,
  ): RefreshTokenResponseDto {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenMetadata,
      previousRefreshToken,
    };
  }

  // ============================================================================
  // TOKEN METADATA MAPPING
  // ============================================================================

  toTokenMetadataDto(data: {
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
    issuedAt: Date;
    sessionId?: string;
  }): TokenMetadataDto {
    return {
      ...data,
      tokenType: 'Bearer',
    };
  }

  // ============================================================================
  // EMAIL VERIFICATION MAPPING
  // ============================================================================

  toVerifyEmailResponse(
    message: string,
    context: {
      authData?: AuthResponseDto;
      nextSteps?: string[];
    },
  ): VerifyEmailResponseDto {
    return {
      message,
      success: true,
      authData: context.authData,
      nextSteps: context.nextSteps,
    };
  }

  toResendVerificationResponse(context: {
    nextRetryAt: Date;
    retryAfterSeconds: number;
    attemptsMade: number;
    maxAttempts: number;
  }): ResendVerificationResponseDto {
    return {
      message: 'Verification email sent. Please check your inbox.',
      ...context,
    };
  }

  // ============================================================================
  // PASSWORD MANAGEMENT MAPPING
  // ============================================================================

  toForgotPasswordResponse(context: {
    expiresInMinutes: number;
    nextResetAllowedAt: Date;
  }): ForgotPasswordResponseDto {
    return {
      message: 'If an account with that email exists, password reset instructions have been sent.',
      ...context,
    };
  }

  toValidateResetTokenResponse(context: {
    valid: boolean;
    message: string;
    expiresAt?: Date;
    email?: string;
  }): ValidateResetTokenResponseDto {
    // Email masking is a presentation logic that can live here
    const maskedEmail = context.email ? this.maskEmail(context.email) : undefined;

    return {
      valid: context.valid,
      message: context.message,
      expiresAt: context.valid ? context.expiresAt : undefined,
      email: context.valid ? maskedEmail : undefined,
    };
  }

  toResetPasswordResponse(context: {
    sessionsTerminated: number;
    authData?: AuthResponseDto;
  }): ResetPasswordResponseDto {
    return {
      message: 'Password reset successfully. You can now log in with your new password.',
      authData: context.authData,
      sessionsTerminated: context.sessionsTerminated > 0,
      sessionCount: context.sessionsTerminated,
    };
  }

  toChangePasswordResponse(context: {
    sessionsTerminated: number;
    securityRecommendations?: string[];
  }): ChangePasswordResponseDto {
    return {
      message: 'Password changed successfully.',
      sessionsTerminated: context.sessionsTerminated > 0,
      sessionCount: context.sessionsTerminated,
      securityRecommendations: context.securityRecommendations,
    };
  }

  // ============================================================================
  // SESSION & LOGOUT MAPPING
  // ============================================================================

  toLogoutResponse(context: {
    sessionsTerminated: number;
    terminatedSessionIds?: string[];
  }): LogoutResponseDto {
    return {
      message:
        context.sessionsTerminated > 1
          ? `Successfully logged out from ${context.sessionsTerminated} devices.`
          : 'Successfully logged out.',
      sessionsTerminated: context.sessionsTerminated,
      terminatedSessionIds: context.terminatedSessionIds,
    };
  }

  // ============================================================================
  // EMAIL CHANGE MAPPING
  // ============================================================================

  toRequestEmailChangeResponse(context: {
    newEmail: string;
    currentEmail: string;
    expiresAt: Date;
    expiresInMinutes: number;
  }): RequestEmailChangeResponseDto {
    return {
      message: 'Email change verification sent to your new email address.',
      newEmail: this.maskEmail(context.newEmail),
      currentEmail: this.maskEmail(context.currentEmail),
      expiresAt: context.expiresAt,
      expiresInMinutes: context.expiresInMinutes,
    };
  }

  toConfirmEmailChangeResponse(context: {
    previousEmail: string;
    newEmail: string;
    authData?: AuthResponseDto;
    requiresEmailVerification: boolean;
  }): ConfirmEmailChangeResponseDto {
    return {
      message: 'Email address changed successfully.',
      previousEmail: this.maskEmail(context.previousEmail),
      newEmail: this.maskEmail(context.newEmail),
      authData: context.authData,
      requiresEmailVerification: context.requiresEmailVerification,
    };
  }

  // ============================================================================
  // SECURITY & ACCOUNT LOCK MAPPING
  // ============================================================================

  toAccountLockedResponse(context: {
    lockedUntil: Date;
    failedAttempts: number;
    maxAttempts: number;
    minutesRemaining: number;
  }): AccountLockedResponseDto {
    return {
      message: 'Account temporarily locked due to multiple failed login attempts.',
      lockedUntil: context.lockedUntil,
      minutesRemaining: context.minutesRemaining,
      failedAttempts: context.failedAttempts,
      maxAttempts: context.maxAttempts,
      supportContact: 'support@shambasure.com', // This should come from a config file
    };
  }

  private maskEmail(email: string): string {
    if (!email || email.length < 5) return email;

    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;

    const maskedLocal =
      localPart.length <= 2
        ? localPart.charAt(0) + '*'.repeat(3)
        : localPart.charAt(0) + '*'.repeat(3) + localPart.slice(-1);

    return `${maskedLocal}@${domain}`;
  }
}
