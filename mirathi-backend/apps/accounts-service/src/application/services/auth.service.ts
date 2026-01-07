import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as crypto from 'crypto';

import { JwtPayload } from '@shamba/auth';

import type {
  IEmailChangeTokenRepository,
  IEventPublisher,
  IHashingService,
  INotificationService,
  IPasswordHistoryRepository,
  IPasswordResetTokenRepository,
  IRefreshTokenRepository,
  ITokenService,
  IUserRepository,
} from '../../domain/interfaces';
import { TokenFactory } from '../../domain/models';
import { User } from '../../domain/models/user.model';
import { Email, Password } from '../../domain/value-objects';
import {
  AuthResponseDto,
  ChangePasswordRequestDto,
  ChangePasswordResponseDto,
  ConfirmEmailChangeRequestDto,
  ConfirmEmailChangeResponseDto,
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  LoginRequestDto,
  LogoutRequestDto,
  LogoutResponseDto,
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
  RegisterRequestDto,
  RequestEmailChangeRequestDto,
  RequestEmailChangeResponseDto,
  ResetPasswordRequestDto,
  ResetPasswordResponseDto,
  ValidateResetTokenRequestDto,
  ValidateResetTokenResponseDto,
} from '../dtos/auth.dto';
import { AuthMapper } from '../mappers';

export interface ValidatableToken {
  validate(): void;
}

// Custom exceptions for better error handling
export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

export class TokenValidationError extends AuthServiceError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TOKEN_VALIDATION_ERROR', context);
    this.name = 'TokenValidationError';
  }
}

export class PasswordPolicyError extends AuthServiceError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'PASSWORD_POLICY_ERROR', context);
    this.name = 'PasswordPolicyError';
  }
}

export class AccountStatusError extends AuthServiceError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'ACCOUNT_STATUS_ERROR', context);
    this.name = 'AccountStatusError';
  }
}

/**
 * AuthService
 *
 * Production-ready authentication service with comprehensive error handling,
 * security measures, and domain event coordination.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Configuration - should ideally come from config service
  private readonly ACCESS_TOKEN_EXPIRY = 900; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY = 604800; // 7 days
  private readonly PASSWORD_RESET_EXPIRY_HOURS = 1;
  private readonly EMAIL_CHANGE_EXPIRY_HOURS = 24;
  private readonly PASSWORD_HISTORY_COUNT = 5;

  constructor(
    @Inject('IUserRepository')
    private readonly userRepo: IUserRepository,

    @Inject('IPasswordResetTokenRepository')
    private readonly passwordResetTokenRepo: IPasswordResetTokenRepository,

    @Inject('IEmailChangeTokenRepository')
    private readonly emailChangeTokenRepo: IEmailChangeTokenRepository,

    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepo: IRefreshTokenRepository,

    @Inject('IPasswordHistoryRepository')
    private readonly passwordHistoryRepo: IPasswordHistoryRepository,

    @Inject('IHashingService')
    private readonly hashingService: IHashingService,

    @Inject('ITokenService')
    private readonly tokenService: ITokenService,

    @Inject('IEventPublisher')
    private readonly eventPublisher: IEventPublisher,

    @Inject('INotificationService')
    private readonly notificationService: INotificationService,

    private readonly authMapper: AuthMapper,
  ) {}

  // ==========================================================================
  // REGISTRATION & LOGIN
  // ==========================================================================

  async register(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    try {
      this.logger.log(`Starting registration for email: ${dto.email}`);

      const email = Email.create(dto.email);

      // Check if email already exists
      const existingUser = await this.userRepo.findByEmail(email);
      if (existingUser) {
        this.logger.warn(`Registration attempt with existing email: ${dto.email}`);
        throw new ConflictException('An account with this email already exists.');
      }

      const password = await Password.create(dto.password);

      // Create user and profile
      const userId = randomUUID();
      const user = User.create({
        id: userId,
        email,
        password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        marketingOptIn: dto.marketingOptIn ?? false,
      });

      // User is already active immediately (no email verification required)
      // This matches the User.create() factory method which sets isActive: true

      // Save user and profile in transaction
      await this.userRepo.save(user);

      // Store password in history
      await this.passwordHistoryRepo.save(userId, password.getValue());

      // Publish domain events
      await this.publishDomainEvents(user);

      // Generate auth tokens
      const tokens = await this.generateTokens(user, {
        deviceId: dto.deviceId,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      });

      // Calculate expiry dates for response
      const issuedAt = new Date();
      const accessTokenExpiresAt = new Date(issuedAt.getTime() + this.ACCESS_TOKEN_EXPIRY * 1000);
      const refreshTokenExpiresAt = new Date(issuedAt.getTime() + this.REFRESH_TOKEN_EXPIRY * 1000);

      const tokenMetadata = this.authMapper.toTokenMetadataDto({
        accessTokenExpiresIn: this.ACCESS_TOKEN_EXPIRY,
        refreshTokenExpiresIn: this.REFRESH_TOKEN_EXPIRY,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        issuedAt,
      });

      this.logger.log(`Successfully registered user: ${userId}`);

      return this.authMapper.toAuthResponse(user, user.profile, tokens, tokenMetadata, {
        // No security recommendations needed for registration
      });
    } catch (error) {
      this.logger.error(`Registration failed for email: ${dto.email}`, error);
      throw this.handleServiceError(error);
    }
  }

  async login(
    dto: LoginRequestDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    try {
      this.logger.log(`Login attempt for email: ${dto.email} from IP: ${ipAddress}`);

      const email = Email.create(dto.email);
      // Fetch the user *with* their profile.
      const user = await this.userRepo.findByEmailWithProfile(email);

      if (!user) {
        this.logger.warn(`Login attempt with non-existent email: ${dto.email}`);
        throw new UnauthorizedException('Invalid email or password.');
      }

      // Check account status before attempting login
      this.validateAccountStatus(user);

      const loginMetadata = {
        ipAddress: ipAddress || dto.ipAddress,
        userAgent: userAgent || dto.userAgent,
        deviceId: dto.deviceId,
      };

      const loginSuccessful = await user.login(dto.password, loginMetadata);

      if (!loginSuccessful) {
        await this.userRepo.save(user); // Save the user to record the failed attempt
        await this.publishDomainEvents(user);

        this.logger.warn(`Failed login attempt for user: ${user.id} from IP: ${ipAddress}`);
        throw new UnauthorizedException('Invalid email or password.');
      }

      // Save updated user state (e.g., lastLoginAt, reset attempts)
      await this.userRepo.save(user);

      if (!user.profile) {
        this.logger.error(`Profile is missing for user: ${user.id} during login.`);
        throw new InternalServerErrorException('User data is inconsistent.');
      }

      // Publish login events
      await this.publishDomainEvents(user);

      // Generate tokens
      const tokens = await this.generateTokens(user, {
        deviceId: dto.deviceId,
        ipAddress: ipAddress || dto.ipAddress,
        userAgent: userAgent || dto.userAgent,
      });

      const issuedAt = new Date();
      const accessTokenExpiresAt = new Date(issuedAt.getTime() + this.ACCESS_TOKEN_EXPIRY * 1000);
      const refreshTokenExpiresAt = new Date(issuedAt.getTime() + this.REFRESH_TOKEN_EXPIRY * 1000);

      const tokenMetadata = this.authMapper.toTokenMetadataDto({
        accessTokenExpiresIn: this.ACCESS_TOKEN_EXPIRY,
        refreshTokenExpiresIn: this.REFRESH_TOKEN_EXPIRY,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        issuedAt,
      });

      this.logger.log(`Successful login for user: ${user.id}`);

      return this.authMapper.toAuthResponse(user, user.profile, tokens, tokenMetadata, {
        // No email verification required
      });
    } catch (error) {
      this.logger.error(`Login failed for email: ${dto.email}`, error);
      throw this.handleServiceError(error);
    }
  }

  async logout(dto: LogoutRequestDto, userId: string): Promise<LogoutResponseDto> {
    try {
      this.logger.log(`Logout request for user: ${userId}, all devices: ${dto.allDevices}`);

      let sessionsTerminated = 0;
      const terminatedSessionIds: string[] = [];

      if (dto.allDevices) {
        sessionsTerminated = await this.refreshTokenRepo.revokeAllByUserId(userId);
      } else {
        try {
          const tokenHash = await this.hashingService.hash(dto.refreshToken);
          const token = await this.refreshTokenRepo.findByTokenHash(tokenHash);

          if (token && token.userId === userId) {
            token.revoke();
            await this.refreshTokenRepo.save(token);
            sessionsTerminated = 1;
            terminatedSessionIds.push(token.id);
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            this.logger.debug(
              `Could not find or revoke refresh token during logout: ${error.message}`,
            );
          } else {
            this.logger.debug(
              'Could not find or revoke refresh token during logout: Unknown error',
            );
          }
        }
      }

      const user = await this.userRepo.findById(userId);
      if (user) {
        const sessionId = terminatedSessionIds.length > 0 ? terminatedSessionIds[0] : undefined;
        user.logout(sessionId);
        await this.publishDomainEvents(user);
      }

      this.logger.log(
        `Logout completed for user: ${userId}, sessions terminated: ${sessionsTerminated}`,
      );

      return this.authMapper.toLogoutResponse({
        sessionsTerminated,
        terminatedSessionIds: terminatedSessionIds.length > 0 ? terminatedSessionIds : undefined,
      });
    } catch (error) {
      this.logger.error(`Logout failed for user: ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  async refreshToken(dto: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto> {
    try {
      this.logger.debug('Refresh token request received');

      const tokenHash = await this.hashingService.hash(dto.refreshToken);
      const storedToken = await this.refreshTokenRepo.findByTokenHash(tokenHash);

      if (!storedToken || !storedToken.canBeUsed()) {
        this.logger.warn(`Refresh token not found or has been revoked/expired.`);
        throw new UnauthorizedException('Invalid or expired refresh token.');
      }

      if (dto.deviceId && storedToken.deviceId !== dto.deviceId) {
        this.logger.warn(`Device ID mismatch for refresh token, user: ${storedToken.userId}`);
        throw new UnauthorizedException('Invalid refresh token for this device.');
      }

      const user = await this.userRepo.findById(storedToken.userId);
      if (!user || !user.isActive || user.isDeleted) {
        this.logger.warn(`User not active or deleted during token refresh: ${storedToken.userId}`);
        throw new UnauthorizedException('User account is not active.');
      }

      // --- FIXED: Use crypto for random token generation ---
      const newRefreshTokenString = crypto.randomBytes(64).toString('hex');

      const newRefreshTokenHash = await this.hashingService.hash(newRefreshTokenString);
      const newExpiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY * 1000);

      const newToken = storedToken.rotate(newRefreshTokenHash, newExpiresAt);

      await this.refreshTokenRepo.save(storedToken);
      await this.refreshTokenRepo.save(newToken);

      const newAccessToken = await this.tokenService.generateAccessToken({
        sub: user.id,
        email: user.email.getValue(),
        role: user.role,
      });

      const issuedAt = new Date();
      const accessTokenExpiresAt = new Date(issuedAt.getTime() + this.ACCESS_TOKEN_EXPIRY * 1000);
      const refreshTokenExpiresAt = newExpiresAt;

      const tokenMetadata = this.authMapper.toTokenMetadataDto({
        accessTokenExpiresIn: this.ACCESS_TOKEN_EXPIRY,
        refreshTokenExpiresIn: this.REFRESH_TOKEN_EXPIRY,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        issuedAt,
      });

      this.logger.debug(`Token refresh successful for user: ${user.id}`);

      return this.authMapper.toRefreshTokenResponse(
        { accessToken: newAccessToken, refreshToken: newRefreshTokenString },
        tokenMetadata,
        dto.refreshToken,
      );
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      throw this.handleServiceError(error);
    }
  }

  // ==========================================================================
  // PASSWORD RESET
  // ==========================================================================

  async forgotPassword(dto: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto> {
    try {
      this.logger.log(`Forgot password request for: ${dto.email}`);

      const email = Email.create(dto.email);
      const user = await this.userRepo.findByEmail(email);

      if (!user) {
        this.logger.debug(`Password reset for non-existent email: ${dto.email}`);
        return this.authMapper.toForgotPasswordResponse({
          expiresInMinutes: this.PASSWORD_RESET_EXPIRY_HOURS * 60,
          nextResetAllowedAt: new Date(Date.now() + 15 * 60 * 1000),
        });
      }

      const existingToken = await this.passwordResetTokenRepo.findActiveByUserId(user.id);
      if (existingToken) {
        const remainingSeconds = existingToken.getRemainingTime() / 1000;
        this.logger.debug(
          `Active reset token exists for user: ${user.id}, remaining: ${remainingSeconds}s`,
        );

        return this.authMapper.toForgotPasswordResponse({
          expiresInMinutes: Math.ceil(remainingSeconds / 60),
          nextResetAllowedAt: new Date(Date.now() + 60 * 1000),
        });
      }

      await this.passwordResetTokenRepo.deleteByUserId(user.id);

      // --- FIXED: Use crypto for random token generation ---
      const tokenString = crypto.randomBytes(32).toString('hex');

      const resetToken = TokenFactory.createPasswordResetToken(
        user.id,
        await this.hashingService.hash(tokenString),
        this.PASSWORD_RESET_EXPIRY_HOURS,
      );
      await this.passwordResetTokenRepo.save(resetToken);

      await this.sendPasswordResetEmail(user, tokenString);

      this.logger.log(`Password reset email sent for user: ${user.id}`);

      return this.authMapper.toForgotPasswordResponse({
        expiresInMinutes: this.PASSWORD_RESET_EXPIRY_HOURS * 60,
        nextResetAllowedAt: new Date(Date.now() + 60 * 1000),
      });
    } catch (error) {
      this.logger.error('Forgot password request failed', error);
      throw this.handleServiceError(error);
    }
  }

  async validateResetToken(
    dto: ValidateResetTokenRequestDto,
  ): Promise<ValidateResetTokenResponseDto> {
    try {
      this.logger.debug('Validating reset token');

      const tokenHash = await this.hashingService.hash(dto.token);
      const token = await this.passwordResetTokenRepo.findByTokenHash(tokenHash);

      if (!token || !token.canBeUsed()) {
        const message = token
          ? 'Token has expired or has already been used.'
          : 'Token has expired or is invalid.';
        return this.authMapper.toValidateResetTokenResponse({
          valid: false,
          message: message,
        });
      }

      const user = await this.userRepo.findById(token.userId);
      const email = user ? user.email.getValue() : undefined;

      return this.authMapper.toValidateResetTokenResponse({
        valid: true,
        message: 'Token is valid.',
        expiresAt: token.expiresAt,
        email: email,
      });
    } catch (error) {
      this.logger.error('Reset token validation failed', error);
      throw this.handleServiceError(error);
    }
  }

  async resetPassword(dto: ResetPasswordRequestDto): Promise<ResetPasswordResponseDto> {
    try {
      this.logger.log('Password reset attempt');

      const tokenHash = await this.hashingService.hash(dto.token);
      const token = await this.passwordResetTokenRepo.findByTokenHash(tokenHash);

      if (!token) {
        throw new TokenValidationError('Invalid or expired reset token.');
      }
      this.validateToken(token, 'password reset');

      const user = await this.userRepo.findByIdWithProfile(token.userId);
      if (!user) {
        throw new BadRequestException('User not found.');
      }

      const recentPasswords = await this.passwordHistoryRepo.findByUserId(
        user.id,
        this.PASSWORD_HISTORY_COUNT,
      );
      const recentPasswordHashes = recentPasswords.map((p) => p.passwordHash);

      const newPassword = await Password.create(dto.password);

      await user.resetPassword(newPassword, recentPasswordHashes);

      await this.userRepo.save(user);

      token.use();
      await this.passwordResetTokenRepo.save(token);

      await this.passwordHistoryRepo.save(user.id, newPassword.getValue());
      await this.passwordHistoryRepo.deleteOldestByUserId(user.id, this.PASSWORD_HISTORY_COUNT);
      const sessionsTerminated = await this.refreshTokenRepo.revokeAllByUserId(user.id);
      await this.publishDomainEvents(user);

      this.logger.log(`Password reset successful for user: ${user.id}`);

      let authData: AuthResponseDto | undefined;
      if (dto.deviceId && user.profile) {
        const tokens = await this.generateTokens(user, { deviceId: dto.deviceId });

        const issuedAt = new Date();
        const accessTokenExpiresAt = new Date(issuedAt.getTime() + this.ACCESS_TOKEN_EXPIRY * 1000);
        const refreshTokenExpiresAt = new Date(
          issuedAt.getTime() + this.REFRESH_TOKEN_EXPIRY * 1000,
        );

        const tokenMetadata = this.authMapper.toTokenMetadataDto({
          accessTokenExpiresIn: this.ACCESS_TOKEN_EXPIRY,
          refreshTokenExpiresIn: this.REFRESH_TOKEN_EXPIRY,
          accessTokenExpiresAt,
          refreshTokenExpiresAt,
          issuedAt,
        });
        authData = this.authMapper.toAuthResponse(user, user.profile, tokens, tokenMetadata, {
          // No email verification required
        });
      }

      return this.authMapper.toResetPasswordResponse({ sessionsTerminated, authData });
    } catch (error) {
      this.logger.error('Password reset failed', error);
      throw this.handleServiceError(error);
    }
  }

  async changePassword(
    dto: ChangePasswordRequestDto,
    userId: string,
  ): Promise<ChangePasswordResponseDto> {
    try {
      this.logger.log(`Password change request for user: ${userId}`);

      const user = await this.userRepo.findById(userId);
      if (!user) {
        throw new BadRequestException('User not found.');
      }

      const recentPasswords = await this.passwordHistoryRepo.findByUserId(
        userId,
        this.PASSWORD_HISTORY_COUNT,
      );
      const recentPasswordHashes = recentPasswords.map((p) => p.passwordHash);

      const newPassword = await Password.create(dto.password);

      await user.changePassword(dto.currentPassword, newPassword, recentPasswordHashes);

      await this.userRepo.save(user);
      await this.passwordHistoryRepo.save(userId, newPassword.getValue());
      await this.passwordHistoryRepo.deleteOldestByUserId(userId, this.PASSWORD_HISTORY_COUNT);

      let sessionsTerminated = 0;
      if (dto.terminateOtherSessions !== false) {
        sessionsTerminated = await this.refreshTokenRepo.revokeAllByUserId(userId);
      }

      await this.publishDomainEvents(user);

      this.logger.log(`Password changed successfully for user: ${userId}`);

      const securityRecommendations = [
        'Review your active sessions to ensure all are recognized.',
        "Consider enabling two-factor authentication if you haven't already.",
      ];

      return this.authMapper.toChangePasswordResponse({
        sessionsTerminated,
        securityRecommendations,
      });
    } catch (error) {
      this.logger.error(`Password change failed for user: ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  // ==========================================================================
  // EMAIL CHANGE
  // ==========================================================================

  async requestEmailChange(
    dto: RequestEmailChangeRequestDto,
    userId: string,
  ): Promise<RequestEmailChangeResponseDto> {
    try {
      this.logger.log(`Email change request for user: ${userId} to: ${dto.newEmail}`);

      const user = await this.userRepo.findById(userId);
      if (!user) {
        throw new BadRequestException('User not found.');
      }

      const isPasswordValid = await user.password.compare(dto.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect.');
      }

      const newEmail = Email.create(dto.newEmail);

      const existingUser = await this.userRepo.findByEmail(newEmail);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('This email address is already in use by another account.');
      }

      if (await this.emailChangeTokenRepo.existsByNewEmail(dto.newEmail)) {
        throw new BadRequestException(
          'There is already a pending email change request for this address.',
        );
      }

      await this.emailChangeTokenRepo.deleteByUserId(userId);

      // --- FIXED: Use crypto for random token generation ---
      const tokenString = crypto.randomBytes(32).toString('hex');

      const tokenHash = await this.hashingService.hash(tokenString);

      const changeToken = TokenFactory.createEmailChangeToken(
        userId,
        dto.newEmail,
        tokenHash,
        this.EMAIL_CHANGE_EXPIRY_HOURS,
      );
      await this.emailChangeTokenRepo.save(changeToken);

      user.requestEmailChange(newEmail, tokenHash);

      await this.sendEmailChangeVerification(user, tokenString, changeToken.newEmail);
      await this.publishDomainEvents(user);

      this.logger.log(`Email change verification sent for user: ${userId}`);

      return this.authMapper.toRequestEmailChangeResponse({
        newEmail: dto.newEmail,
        currentEmail: user.email.getValue(),
        expiresAt: changeToken.expiresAt,
        expiresInMinutes: this.EMAIL_CHANGE_EXPIRY_HOURS * 60,
      });
    } catch (error) {
      this.logger.error(`Email change request failed for user: ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  async confirmEmailChange(
    dto: ConfirmEmailChangeRequestDto,
  ): Promise<ConfirmEmailChangeResponseDto> {
    try {
      this.logger.log('Confirming email change');

      const tokenHash = await this.hashingService.hash(dto.token);
      const token = await this.emailChangeTokenRepo.findByTokenHash(tokenHash);

      if (!token) {
        throw new TokenValidationError('Invalid or expired email change token.');
      }
      this.validateToken(token, 'email change');

      const user = await this.userRepo.findByIdWithProfile(token.userId);
      if (!user || !user.profile) {
        throw new BadRequestException('User associated with this token no longer exists.');
      }

      const previousEmail = user.email.getValue();
      const newEmail = Email.create(token.newEmail);

      user.confirmEmailChange(newEmail);
      await this.userRepo.save(user);

      token.use();
      await this.emailChangeTokenRepo.save(token);

      await this.publishDomainEvents(user);
      await this.sendEmailChangeNotification(user, previousEmail, token.newEmail);

      this.logger.log(`Email change confirmed for user: ${user.id}`);

      let authData: AuthResponseDto | undefined;
      if (dto.deviceId) {
        const tokens = await this.generateTokens(user, { deviceId: dto.deviceId });

        const issuedAt = new Date();
        const accessTokenExpiresAt = new Date(issuedAt.getTime() + this.ACCESS_TOKEN_EXPIRY * 1000);
        const refreshTokenExpiresAt = new Date(
          issuedAt.getTime() + this.REFRESH_TOKEN_EXPIRY * 1000,
        );

        const tokenMetadata = this.authMapper.toTokenMetadataDto({
          accessTokenExpiresIn: this.ACCESS_TOKEN_EXPIRY,
          refreshTokenExpiresIn: this.REFRESH_TOKEN_EXPIRY,
          accessTokenExpiresAt,
          refreshTokenExpiresAt,
          issuedAt,
        });

        authData = this.authMapper.toAuthResponse(user, user.profile, tokens, tokenMetadata, {
          // No email verification required for the new email
        });
      }

      return this.authMapper.toConfirmEmailChangeResponse({
        previousEmail,
        newEmail: token.newEmail,
        authData,
      });
    } catch (error) {
      this.logger.error('Email change confirmation failed', error);
      throw this.handleServiceError(error);
    }
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  private async generateTokens(
    user: User,
    sessionInfo: {
      deviceId?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // ✅ Use JwtPayload from @shamba/auth (with 'sub')
    const payload: JwtPayload = {
      sub: user.id, // This matches your JWT Strategy
      email: user.email.getValue(),
      role: user.role,
    };

    const [accessToken, refreshTokenString] = await Promise.all([
      this.tokenService.generateAccessToken(payload),
      Promise.resolve(crypto.randomBytes(64).toString('hex')),
    ]);

    // Store refresh token
    const refreshTokenHash = await this.hashingService.hash(refreshTokenString);
    const refreshToken = TokenFactory.createRefreshToken(
      user.id,
      refreshTokenHash,
      this.REFRESH_TOKEN_EXPIRY / (24 * 60 * 60),
      sessionInfo,
    );
    await this.refreshTokenRepo.save(refreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  private async sendPasswordResetEmail(user: User, tokenString: string): Promise<void> {
    try {
      await this.notificationService.sendEmail({
        to: user.email.getValue(),
        subject: 'Reset your password',
        template: 'password-reset',
        data: {
          firstName: user.firstName,
          resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${tokenString}`,
          expiresInMinutes: this.PASSWORD_RESET_EXPIRY_HOURS * 60,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send password reset email to user: ${user.id}`, error);
    }
  }

  private async sendEmailChangeVerification(
    user: User,
    tokenString: string,
    newEmail: string,
  ): Promise<void> {
    try {
      await this.notificationService.sendEmail({
        to: newEmail,
        subject: 'Confirm your new email address',
        template: 'email-change-verification',
        data: {
          firstName: user.firstName,
          verificationLink: `${process.env.FRONTEND_URL}/confirm-email-change?token=${tokenString}`,
          expiresInHours: this.EMAIL_CHANGE_EXPIRY_HOURS,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send email change verification to: ${newEmail}`, error);
      throw new InternalServerErrorException('Failed to send verification email.');
    }
  }

  private async sendEmailChangeNotification(
    user: User,
    previousEmail: string,
    newEmail: string,
  ): Promise<void> {
    try {
      await this.notificationService.sendEmail({
        to: previousEmail,
        subject: 'Your email address has been changed',
        template: 'email-changed-notification',
        data: {
          firstName: user.firstName,
          newEmail,
          changeDate: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send email change notification to: ${previousEmail}`, error);
    }
  }

  private validateAccountStatus(user: User): void {
    if (user.isDeleted) {
      throw new AccountStatusError('Account has been deleted.');
    }

    if (!user.isActive) {
      throw new AccountStatusError('Account is inactive.');
    }

    if (user.isLocked()) {
      if (user.lockedUntil) {
        throw new AccountStatusError(
          `Account is temporarily locked. Please try again after ${user.lockedUntil.toISOString()}.`,
          { lockedUntil: user.lockedUntil },
        );
      }
      throw new AccountStatusError('Account is temporarily locked.');
    }
  }

  private validateToken(token: ValidatableToken, tokenType: string): void {
    try {
      token.validate();
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.warn(`Invalid ${tokenType} token: ${error.message}`);
      } else {
        this.logger.warn(`Invalid ${tokenType} token: ${String(error)}`);
      }
      throw new TokenValidationError(`Invalid or expired ${tokenType} token.`);
    }
  }

  private async publishDomainEvents(user: User): Promise<void> {
    if (user.domainEvents.length > 0) {
      try {
        await this.eventPublisher.publishBatch(user.domainEvents);
        user.clearDomainEvents();
      } catch (error) {
        this.logger.error('Failed to publish domain events', error);
      }
    }
  }

  private handleServiceError(error: unknown): Error {
    if (
      error instanceof UnauthorizedException ||
      error instanceof BadRequestException ||
      error instanceof ConflictException
    ) {
      return error;
    }

    if (error instanceof AuthServiceError) {
      switch (error.constructor) {
        case TokenValidationError:
          return new BadRequestException(error.message);
        case PasswordPolicyError:
          return new BadRequestException(error.message);
        case AccountStatusError:
          return new BadRequestException(error.message);
        default:
          return new BadRequestException(error.message);
      }
    }

    this.logger.error('Unexpected error in AuthService', error);

    return new InternalServerErrorException(
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.message
        : 'An unexpected error occurred. Please try again.',
    );
  }
}
