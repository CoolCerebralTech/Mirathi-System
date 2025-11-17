import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  Inject,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  IUserRepository,
  IPasswordResetTokenRepository,
  IEmailVerificationTokenRepository,
  IEmailChangeTokenRepository,
  IRefreshTokenRepository,
  IPasswordHistoryRepository,
  IHashingService,
  ITokenService,
  IEventPublisher,
  INotificationService,
  JWTPayload,
} from '../../3_domain/interfaces';
import { User } from '../../3_domain/models/user.model';
import { TokenFactory } from '../../3_domain/models';
import { Email, Password } from '../../3_domain/value-objects';
import { AuthMapper } from '../mappers';
import {
  RegisterRequestDto,
  LoginRequestDto,
  VerifyEmailRequestDto,
  ResendVerificationRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  ValidateResetTokenRequestDto,
  ChangePasswordRequestDto,
  RefreshTokenRequestDto,
  LogoutRequestDto,
  RequestEmailChangeRequestDto,
  ConfirmEmailChangeRequestDto,
  AuthResponseDto,
  RefreshTokenResponseDto,
  VerifyEmailResponseDto,
  ResendVerificationResponseDto,
  ForgotPasswordResponseDto,
  ValidateResetTokenResponseDto,
  ResetPasswordResponseDto,
  ChangePasswordResponseDto,
  LogoutResponseDto,
  RequestEmailChangeResponseDto,
  ConfirmEmailChangeResponseDto,
} from '../dtos/auth.dto';

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
  private readonly EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
  private readonly EMAIL_CHANGE_EXPIRY_HOURS = 24;
  private readonly PASSWORD_HISTORY_COUNT = 5;

  constructor(
    @Inject('IUserRepository')
    private readonly userRepo: IUserRepository,

    @Inject('IPasswordResetTokenRepository')
    private readonly passwordResetTokenRepo: IPasswordResetTokenRepository,

    @Inject('IEmailVerificationTokenRepository')
    private readonly emailVerificationTokenRepo: IEmailVerificationTokenRepository,

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

    private readonly authMapper: AuthMapper, // this one is a class, so no @Inject needed
  ) {}

  // ==========================================================================
  // REGISTRATION & LOGIN
  // ==========================================================================

  async register(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    try {
      this.logger.log(`Starting registration for email: ${dto.email}`);

      const email = Email.create(dto.email);

      // Check if email already exists (this part is correct and stays)
      const existingUser = await this.userRepo.findByEmail(email);
      if (existingUser) {
        this.logger.warn(`Registration attempt with existing email: ${dto.email}`);
        throw new ConflictException('An account with this email already exists.');
      }

      const password = await Password.create(dto.password);

      // 2. --- UPDATED ---
      // The User.create method is now simpler and creates the profile internally.
      const userId = randomUUID();
      const user = User.create({
        id: userId,
        email,
        password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        marketingOptIn: dto.marketingOptIn ?? false,
      });

      // 3. --- UPDATED ---
      // The userRepo.save() method is now responsible for saving the User AND its related Profile in a transaction.
      await this.userRepo.save(user);

      // Store password in history (this is correct and stays)
      await this.passwordHistoryRepo.save(userId, password.getValue());

      // Publish domain events (this is correct and stays)
      await this.publishDomainEvents(user);

      // Generate email verification token (this is correct and stays)
      const verificationTokenString = this.hashingService.generateToken(32);
      const verificationToken = TokenFactory.createEmailVerificationToken(
        userId,
        await this.hashingService.hash(verificationTokenString), // Pass the hash
        this.EMAIL_VERIFICATION_EXPIRY_HOURS,
      );
      await this.emailVerificationTokenRepo.save(verificationToken);

      // 4. --- UPDATED ---
      // The `sendVerificationEmail` method now takes the token string, not the whole object.
      // It also accesses the profile directly from the user object.
      this.sendVerificationEmail(user, verificationTokenString).catch((error) => {
        this.logger.error('Failed to send verification email', error);
      });

      // Generate auth tokens (this is correct and stays)
      const tokens = await this.generateTokens(user, {
        deviceId: dto.deviceId,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      });

      // 5. --- UPDATED ---
      // The authMapper now uses the refactored, simpler methods.
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

      // The authMapper now gets the profile directly from user.profile
      return this.authMapper.toAuthResponse(user, user.profile, tokens, tokenMetadata, {
        requiresEmailVerification: true,
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
      // 1. --- UPDATED ---
      // We now fetch the user *with* their profile. Your repository method should support this.
      // This is typically done with `include: { profile: true }` in Prisma.
      const user = await this.userRepo.findByEmailWithProfile(email);

      if (!user) {
        this.logger.warn(`Login attempt with non-existent email: ${dto.email}`);
        throw new UnauthorizedException('Invalid email or password.');
      }

      // Check account status before attempting login (this is correct and stays)
      this.validateAccountStatus(user);

      // Attempt login (domain handles lockout logic) (this is correct and stays)
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

      // 2. --- REMOVED ---
      // We no longer need to fetch the profile separately.
      // It's already attached to the `user` object.
      // const profile = await this.profileRepo.findByUserId(user.id);
      // if (!profile) { ... }
      if (!user.profile) {
        // We can add a safety check here instead.
        this.logger.error(`Profile is missing for user: ${user.id} during login.`);
        throw new InternalServerErrorException('User data is inconsistent.');
      }

      // Publish login events (this is correct and stays)
      await this.publishDomainEvents(user);

      // Generate tokens (this is correct and stays)
      const tokens = await this.generateTokens(user, {
        deviceId: dto.deviceId,
        ipAddress: ipAddress || dto.ipAddress,
        userAgent: userAgent || dto.userAgent,
      });

      // 3. --- UPDATED ---
      // Use the refactored mapper which now expects the service to prepare data.
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

      // The mapper now gets the profile directly from user.profile
      return this.authMapper.toAuthResponse(user, user.profile, tokens, tokenMetadata, {
        requiresEmailVerification: !user.profile.isEmailVerified,
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
        // Revoke all refresh tokens for the user. The repository method returns the count.
        sessionsTerminated = await this.refreshTokenRepo.revokeAllByUserId(userId);

        // We could also revoke LoginSession entities here if they are a separate concept.
        // For simplicity, we'll focus on the refresh tokens which control access.
      } else {
        // Revoke a specific refresh token
        try {
          // It's safer to hash the token first to find it in the DB, then verify it belongs to the user.
          const tokenHash = await this.hashingService.hash(dto.refreshToken);
          const token = await this.refreshTokenRepo.findByTokenHash(tokenHash);

          // Ensure the token exists and belongs to the user making the request.
          if (token && token.userId === userId) {
            token.revoke(); // Use the domain model to change state
            await this.refreshTokenRepo.save(token); // Persist the change
            sessionsTerminated = 1;
            terminatedSessionIds.push(token.id); // Assuming token.id is the session identifier
          }
        } catch (error: unknown) {
          // This can happen if the token is already invalid, which is fine for a logout.
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

      // Publish a generic logout event. The event handler can decide what to do.
      const user = await this.userRepo.findById(userId);
      if (user) {
        // The sessionId here could be the ID of the specific token being revoked.
        const sessionId = terminatedSessionIds.length > 0 ? terminatedSessionIds[0] : undefined;
        user.logout(sessionId); // Pass the session/token ID to the domain event
        await this.publishDomainEvents(user);
      }

      this.logger.log(
        `Logout completed for user: ${userId}, sessions terminated: ${sessionsTerminated}`,
      );

      // Use the refactored mapper with a context object
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

      // 1. --- UPDATED ---
      // We no longer verify the JWT first. Instead, we find the token in the DB
      // by its hash. This is safer against certain replay attacks and simplifies logic.
      const tokenHash = await this.hashingService.hash(dto.refreshToken);
      const storedToken = await this.refreshTokenRepo.findByTokenHash(tokenHash);

      // Verify the token exists and is valid using the domain model's logic.
      if (!storedToken || !storedToken.canBeUsed()) {
        this.logger.warn(`Refresh token not found or has been revoked/expired.`);
        // Note: For enhanced security, you could implement a mechanism here to revoke all tokens
        // for this user if an invalid token is used, as it might signify a token leak.
        throw new UnauthorizedException('Invalid or expired refresh token.');
      }

      // Validate device ID if provided (this is correct and stays)
      if (dto.deviceId && storedToken.deviceId !== dto.deviceId) {
        this.logger.warn(`Device ID mismatch for refresh token, user: ${storedToken.userId}`);
        throw new UnauthorizedException('Invalid refresh token for this device.');
      }

      // Get user
      const user = await this.userRepo.findById(storedToken.userId);
      if (!user || !user.isActive || user.isDeleted) {
        this.logger.warn(`User not active or deleted during token refresh: ${storedToken.userId}`);
        throw new UnauthorizedException('User account is not active.');
      }

      // Rotate refresh token (revoke old, create new) - this logic is excellent
      const newRefreshTokenString = this.hashingService.generateToken(64);
      const newRefreshTokenHash = await this.hashingService.hash(newRefreshTokenString);
      const newExpiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY * 1000);

      const newToken = storedToken.rotate(newRefreshTokenHash, newExpiresAt); // The domain model handles the rotation logic

      // 2. --- UPDATED ---
      // Use the repository's 'save' method which should handle transactions.
      // Assuming `save` performs an upsert, we can save both.
      // For true atomicity, the repo could expose a `rotate` method.
      await this.refreshTokenRepo.save(storedToken); // Save the old token (now revoked)
      await this.refreshTokenRepo.save(newToken); // Save the new token

      // Generate new access token (this is correct and stays)
      const newAccessToken = await this.tokenService.generateAccessToken({
        userId: user.id,
        email: user.email.getValue(),
        role: user.role,
      });

      // 3. --- UPDATED ---
      // Use the refactored mapper which expects the service to prepare the data.
      const issuedAt = new Date();
      const accessTokenExpiresAt = new Date(issuedAt.getTime() + this.ACCESS_TOKEN_EXPIRY * 1000);
      const refreshTokenExpiresAt = newExpiresAt; // Use the same expiry as the new token

      const tokenMetadata = this.authMapper.toTokenMetadataDto({
        accessTokenExpiresIn: this.ACCESS_TOKEN_EXPIRY,
        refreshTokenExpiresIn: this.REFRESH_TOKEN_EXPIRY,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        issuedAt,
      });

      this.logger.debug(`Token refresh successful for user: ${user.id}`);

      // Call the refactored mapper
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
  // EMAIL VERIFICATION
  // ==========================================================================

  async verifyEmail(dto: VerifyEmailRequestDto): Promise<VerifyEmailResponseDto> {
    try {
      this.logger.log(`Email verification attempt with token: ${dto.token}`);

      // We hash the raw token string from the DTO to find the stored hash
      const tokenHash = await this.hashingService.hash(dto.token);
      const token = await this.emailVerificationTokenRepo.findByTokenHash(tokenHash);

      if (!token) {
        throw new TokenValidationError('Invalid or expired verification token.');
      }

      // Use the helper to validate the token's domain state (e.g., isExpired)
      this.validateToken(token, 'email verification');

      // 1. --- UPDATED ---
      // Fetch the user WITH their profile, using a new repository method.
      const user = await this.userRepo.findByIdWithProfile(token.userId);
      if (!user) {
        // This case is unlikely if a valid token exists, but it is a good safeguard.
        throw new BadRequestException('User associated with this token no longer exists.');
      }

      // 2. --- UPDATED & SIMPLIFIED ---
      // The service now only calls one method on the aggregate root.
      // The activate() method handles its own state AND the profile's state.
      user.activate();

      // 3. --- SIMPLIFIED ---
      // We only need to save the aggregate root. The repository handles the transaction.
      await this.userRepo.save(user);

      // Delete the now-used verification token (this is correct and stays)
      await this.emailVerificationTokenRepo.deleteByUserId(user.id);

      // Publish events (this is correct and stays)
      await this.publishDomainEvents(user);

      this.logger.log(`Email verified successfully for user: ${user.id}`);

      // 4. --- UPDATED ---
      // Generate auto-login tokens (logic is fine, but mapper calls are updated)
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
          requiresEmailVerification: false, // It's now verified
        });
      }

      // Use the refactored mapper with a context object
      return this.authMapper.toVerifyEmailResponse(
        'Email verified successfully. Your account is now fully activated.',
        { authData, nextSteps: ['Complete your profile'] }, // Service decides the next steps
      );
    } catch (error) {
      this.logger.error('Email verification failed', error);
      throw this.handleServiceError(error);
    }
  }

  async resendEmailVerification(
    dto: ResendVerificationRequestDto,
  ): Promise<ResendVerificationResponseDto> {
    try {
      this.logger.log(`Resend email verification request for: ${dto.email}`);
      const minRetrySeconds = 60;

      const email = Email.create(dto.email);
      // 1. --- UPDATED ---
      // Fetch the user with their profile to get all necessary info at once.
      const user = await this.userRepo.findByEmailWithProfile(email);

      if (!user || !user.profile) {
        // Security: Don't reveal if email exists.
        // Return a standard response as if the email was sent successfully.
        this.logger.debug(`Resend verification for non-existent email or profile: ${dto.email}`);
        const nextRetryAt = new Date(Date.now() + minRetrySeconds * 1000);
        return this.authMapper.toResendVerificationResponse({
          nextRetryAt,
          retryAfterSeconds: minRetrySeconds,
          attemptsMade: 1,
          maxAttempts: 5,
        });
      }

      // Check if email is already verified.
      if (user.profile.isEmailVerified) {
        throw new BadRequestException('This email address has already been verified.');
      }

      // Check rate limiting for resend attempts
      const existingToken = await this.emailVerificationTokenRepo.findByUserId(user.id);
      if (existingToken) {
        const timeSinceLastAttempt = Date.now() - existingToken.createdAt.getTime();
        const minRetryMs = minRetrySeconds * 1000;

        if (timeSinceLastAttempt < minRetryMs) {
          const nextRetryAt = new Date(existingToken.createdAt.getTime() + minRetryMs);
          const retryAfterSeconds = Math.ceil((nextRetryAt.getTime() - Date.now()) / 1000);

          this.logger.warn(`Resend verification rate limited for user: ${user.id}`);
          // 2. --- UPDATED ---
          // Use the refactored mapper with a context object.
          return this.authMapper.toResendVerificationResponse({
            nextRetryAt,
            retryAfterSeconds,
            attemptsMade: 1, // This could be tracked more accurately if needed
            maxAttempts: 5,
          });
        }
      }

      // Delete the old token to ensure a fresh one is used.
      await this.emailVerificationTokenRepo.deleteByUserId(user.id);

      // Generate a new raw token string for the URL and its hash for the DB.
      const verificationTokenString = this.hashingService.generateToken(32);
      const verificationToken = TokenFactory.createEmailVerificationToken(
        user.id,
        await this.hashingService.hash(verificationTokenString),
        this.EMAIL_VERIFICATION_EXPIRY_HOURS,
      );
      await this.emailVerificationTokenRepo.save(verificationToken);

      // 3. --- UPDATED ---
      // Send verification email using the new, simpler signature.
      await this.sendVerificationEmail(user, verificationTokenString);

      const nextRetryAt = new Date(Date.now() + minRetrySeconds * 1000);
      this.logger.log(`Verification email resent for user: ${user.id}`);

      // Use the refactored mapper for the success response.
      return this.authMapper.toResendVerificationResponse({
        nextRetryAt,
        retryAfterSeconds: minRetrySeconds,
        attemptsMade: 1, // Or track this more accurately if needed
        maxAttempts: 5,
      });
    } catch (error) {
      this.logger.error('Resend email verification failed', error);
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
      // We don't need the profile here, so a simple findByEmail is efficient.
      const user = await this.userRepo.findByEmail(email);

      if (!user) {
        // Security: Don't reveal if email exists.
        this.logger.debug(`Password reset for non-existent email: ${dto.email}`);

        // --- UPDATED ---
        // Use the refactored mapper with a context object.
        return this.authMapper.toForgotPasswordResponse({
          expiresInMinutes: this.PASSWORD_RESET_EXPIRY_HOURS * 60,
          nextResetAllowedAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min cooldown
        });
      }

      // Check for existing active reset tokens
      const existingToken = await this.passwordResetTokenRepo.findActiveByUserId(user.id);
      if (existingToken) {
        // --- UPDATED ---
        // Call the method on the domain object, not the mapper.
        const remainingSeconds = existingToken.getRemainingTime() / 1000;
        this.logger.debug(
          `Active reset token exists for user: ${user.id}, remaining: ${remainingSeconds}s`,
        );

        return this.authMapper.toForgotPasswordResponse({
          expiresInMinutes: Math.ceil(remainingSeconds / 60),
          nextResetAllowedAt: new Date(Date.now() + 60 * 1000), // 1 min cooldown
        });
      }

      // Delete any expired/used reset tokens for the user
      await this.passwordResetTokenRepo.deleteByUserId(user.id);

      // Generate a new raw token string for the URL and its hash for the DB
      const tokenString = this.hashingService.generateToken(32);
      const resetToken = TokenFactory.createPasswordResetToken(
        user.id,
        await this.hashingService.hash(tokenString),
        this.PASSWORD_RESET_EXPIRY_HOURS,
      );
      await this.passwordResetTokenRepo.save(resetToken);

      // --- UPDATED ---
      // Send the reset email using the raw token string
      await this.sendPasswordResetEmail(user, tokenString);

      // The user object itself hasn't changed state, so no domain events needed here.
      // If you wanted to emit an event like "PasswordResetRequested", you could add a method
      // on the user model to do so. For now, this is fine.

      this.logger.log(`Password reset email sent for user: ${user.id}`);

      return this.authMapper.toForgotPasswordResponse({
        expiresInMinutes: this.PASSWORD_RESET_EXPIRY_HOURS * 60,
        nextResetAllowedAt: new Date(Date.now() + 60 * 1000), // 1 min cooldown
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

      // --- UPDATED ---
      // If token is not found or is invalid, use the refactored mapper.
      if (!token || !token.canBeUsed()) {
        const message = token
          ? 'Token has expired or has already been used.'
          : 'Token has expired or is invalid.';
        return this.authMapper.toValidateResetTokenResponse({
          valid: false,
          message: message,
        });
      }

      // Get user email for response (this is correct and stays)
      const user = await this.userRepo.findById(token.userId);
      const email = user ? user.email.getValue() : undefined;

      // --- UPDATED ---
      // Use the refactored mapper for the success response.
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

      // 1. --- UPDATED ---
      // Fetch user with profile in case we need it for auto-login later.
      const user = await this.userRepo.findByIdWithProfile(token.userId);
      if (!user) {
        throw new BadRequestException('User not found.');
      }

      // Fetch password history
      const recentPasswords = await this.passwordHistoryRepo.findByUserId(
        user.id,
        this.PASSWORD_HISTORY_COUNT,
      );
      const recentPasswordHashes = recentPasswords.map((p) => p.passwordHash);

      // 2. --- REMOVED ---
      // DTO decorator `@IsSecurePassword` handles this.
      // await this.validatePasswordStrength(dto.newPassword);

      // Create new password
      const newPassword = await Password.create(dto.password);

      // 3. --- UPDATED ---
      // Call the corrected domain method, which does not need the current password.
      await user.resetPassword(newPassword, recentPasswordHashes);

      // Save user (this will save the new password and unlocked status)
      await this.userRepo.save(user);

      // Mark token as used
      token.use();
      await this.passwordResetTokenRepo.save(token);

      // Store new password in history
      await this.passwordHistoryRepo.save(user.id, newPassword.getValue());

      // Clean up old password history
      await this.passwordHistoryRepo.deleteOldestByUserId(user.id, this.PASSWORD_HISTORY_COUNT);

      // Revoke all sessions for security (this logic is correct)
      const sessionsTerminated = await this.refreshTokenRepo.revokeAllByUserId(user.id);

      // Publish events
      await this.publishDomainEvents(user);

      this.logger.log(`Password reset successful for user: ${user.id}`);

      // 4. --- UPDATED ---
      // Generate auto-login tokens with refactored mapper calls
      let authData: AuthResponseDto | undefined;
      if (dto.deviceId && user.profile) {
        // Check that profile exists
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
          requiresEmailVerification: !user.profile.isEmailVerified,
        });
      }

      // Use the refactored mapper with a context object
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

      // Fetch password history to pass to the domain model
      const recentPasswords = await this.passwordHistoryRepo.findByUserId(
        userId,
        this.PASSWORD_HISTORY_COUNT,
      );
      const recentPasswordHashes = recentPasswords.map((p) => p.passwordHash);

      // 1. --- REMOVED ---
      // DTO decorator `@IsSecurePassword` handles this.
      // await this.validatePasswordStrength(dto.newPassword);

      // Create new password value object
      const newPassword = await Password.create(dto.password);

      // 2. --- UPDATED ---
      // The domain method call is already correct, as it includes the password history check.
      await user.changePassword(dto.currentPassword, newPassword, recentPasswordHashes);

      // Save the user with the new password hash
      await this.userRepo.save(user);

      // Store the new password in the history
      await this.passwordHistoryRepo.save(userId, newPassword.getValue());

      // Clean up old password history entries
      await this.passwordHistoryRepo.deleteOldestByUserId(userId, this.PASSWORD_HISTORY_COUNT);

      // 3. --- UPDATED & SIMPLIFIED ---
      // Revoke all other sessions for security if requested
      let sessionsTerminated = 0;
      if (dto.terminateOtherSessions !== false) {
        // Revoking refresh tokens is the key action to force re-authentication.
        sessionsTerminated = await this.refreshTokenRepo.revokeAllByUserId(userId);

        // You could also add this if you have separate session management logic
        // await this.loginSessionRepo.revokeAllByUserId(userId);
      }

      // Publish events (e.g., PasswordChangedEvent)
      await this.publishDomainEvents(user);

      this.logger.log(`Password changed successfully for user: ${userId}`);

      // 4. --- UPDATED ---
      // Generate security recommendations to send back to the user
      const securityRecommendations = [
        'Review your active sessions to ensure all are recognized.',
        "Consider enabling two-factor authentication if you haven't already.",
      ];

      // Use the refactored mapper with a context object
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

      // Verify current password (this is correct and stays)
      const isPasswordValid = await user.password.compare(dto.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect.');
      }

      const newEmail = Email.create(dto.newEmail);

      // Check if new email is already in use (this is correct and stays)
      const existingUser = await this.userRepo.findByEmail(newEmail);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('This email address is already in use by another account.');
      }

      // Check for pending requests for this email (this is correct and stays)
      if (await this.emailChangeTokenRepo.existsByNewEmail(dto.newEmail)) {
        throw new BadRequestException(
          'There is already a pending email change request for this address.',
        );
      }

      // Delete any previous, unused email change tokens for this user
      await this.emailChangeTokenRepo.deleteByUserId(userId);

      // 1. --- UPDATED & SIMPLIFIED ---
      // Generate the raw token string first.
      const tokenString = this.hashingService.generateToken(32);
      const tokenHash = await this.hashingService.hash(tokenString);

      // Create the domain object for the token.
      const changeToken = TokenFactory.createEmailChangeToken(
        userId,
        dto.newEmail,
        tokenHash, // Pass the hash
        this.EMAIL_CHANGE_EXPIRY_HOURS,
      );
      await this.emailChangeTokenRepo.save(changeToken);

      // Request email change (domain method call is correct)
      user.requestEmailChange(newEmail, tokenHash);

      // 2. --- UPDATED ---
      // Send verification email to NEW email address using the raw token string.
      await this.sendEmailChangeVerification(user, tokenString, changeToken.newEmail);

      // Publish events (this is correct and stays)
      await this.publishDomainEvents(user);

      this.logger.log(`Email change verification sent for user: ${userId}`);

      // 3. --- UPDATED ---
      // Use the refactored mapper with a context object.
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

      // Hash the raw token from the DTO to find the stored token
      const tokenHash = await this.hashingService.hash(dto.token);
      const token = await this.emailChangeTokenRepo.findByTokenHash(tokenHash);

      if (!token) {
        throw new TokenValidationError('Invalid or expired email change token.');
      }
      this.validateToken(token, 'email change'); // Use domain model to validate state

      // 1. --- UPDATED ---
      // Fetch the user with their profile to ensure we have all necessary data.
      const user = await this.userRepo.findByIdWithProfile(token.userId);
      if (!user || !user.profile) {
        throw new BadRequestException('User associated with this token no longer exists.');
      }

      const previousEmail = user.email.getValue();
      const newEmail = Email.create(token.newEmail);

      // Confirm email change (the domain method handles the state change)
      user.confirmEmailChange(newEmail);

      // Save the aggregate root. The repository will handle saving both user and profile changes.
      await this.userRepo.save(user);

      // Mark the token as used and save it
      token.use();
      await this.emailChangeTokenRepo.save(token);

      // Publish domain events
      await this.publishDomainEvents(user);

      // Send a notification to the OLD email address about the change
      await this.sendEmailChangeNotification(user, previousEmail, token.newEmail);

      this.logger.log(`Email change confirmed for user: ${user.id}`);

      // 2. --- UPDATED ---
      // Generate auto-login tokens with the refactored mapper calls
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

        // Note: After an email change, the new email MUST be verified. The domain model handles this.
        authData = this.authMapper.toAuthResponse(user, user.profile, tokens, tokenMetadata, {
          requiresEmailVerification: !user.profile.isEmailVerified,
        });
      }

      // 3. --- UPDATED ---
      // Use the refactored mapper with a context object
      return this.authMapper.toConfirmEmailChangeResponse({
        previousEmail,
        newEmail: token.newEmail,
        authData,
        // The domain model sets the profile's emailVerified to false, so this is true.
        requiresEmailVerification: !user.profile.isEmailVerified,
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
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email.getValue(),
      role: user.role,
    };

    // Generate JWT tokens
    const [accessToken, refreshTokenString] = await Promise.all([
      this.tokenService.generateAccessToken(payload),
      Promise.resolve(this.hashingService.generateToken(64)),
    ]);

    // Store refresh token
    const refreshTokenHash = await this.hashingService.hash(refreshTokenString);
    const refreshToken = TokenFactory.createRefreshToken(
      user.id,
      refreshTokenHash,
      this.REFRESH_TOKEN_EXPIRY / (24 * 60 * 60), // Convert to days
      sessionInfo,
    );
    await this.refreshTokenRepo.save(refreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  private async sendVerificationEmail(user: User, tokenString: string): Promise<void> {
    try {
      await this.notificationService.sendEmail({
        to: user.email.getValue(),
        subject: 'Verify your email address',
        template: 'email-verification',
        data: {
          firstName: user.firstName,
          // The link now uses the raw token string
          verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${tokenString}`,
          expiresInHours: this.EMAIL_VERIFICATION_EXPIRY_HOURS,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send verification email to user: ${user.id}`, error);
    }
  }

  private async sendPasswordResetEmail(user: User, tokenString: string): Promise<void> {
    try {
      await this.notificationService.sendEmail({
        to: user.email.getValue(),
        subject: 'Reset your password',
        template: 'password-reset',
        data: {
          firstName: user.firstName,
          // Use the raw token string for the link, NOT the hash
          resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${tokenString}`,
          expiresInMinutes: this.PASSWORD_RESET_EXPIRY_HOURS * 60,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send password reset email to user: ${user.id}`, error);
      // Don't throw - email failure shouldn't break the reset flow
    }
  }

  private async sendEmailChangeVerification(
    user: User,
    tokenString: string,
    newEmail: string,
  ): Promise<void> {
    try {
      await this.notificationService.sendEmail({
        to: newEmail, // Send to the new email address
        subject: 'Confirm your new email address',
        template: 'email-change-verification',
        data: {
          firstName: user.firstName,
          // Use the raw token string in the verification link
          verificationLink: `${process.env.FRONTEND_URL}/confirm-email-change?token=${tokenString}`,
          expiresInHours: this.EMAIL_CHANGE_EXPIRY_HOURS,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send email change verification to: ${newEmail}`, error);
      // Re-throw here because this is a critical email; if it fails, the user can't proceed.
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
      // Don't throw - notification failure shouldn't break the flow
    }
  }

  private validateAccountStatus(user: User): void {
    if (user.isDeleted) {
      throw new AccountStatusError('Account has been deleted.');
    }

    if (!user.isActive) {
      throw new AccountStatusError('Account is inactive. Please verify your email.');
    }

    if (user.isLocked()) {
      if (user.lockedUntil) {
        throw new AccountStatusError(
          `Account is temporarily locked. Please try again after ${user.lockedUntil.toISOString()}.`,
          { lockedUntil: user.lockedUntil },
        );
      }

      // Fallback if locked but no timestamp
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
        // Don't throw - event publishing failure shouldn't break the main flow
      }
    }
  }

  private handleServiceError(error: unknown): Error {
    // If it's already an HTTP exception, rethrow it
    if (
      error instanceof UnauthorizedException ||
      error instanceof BadRequestException ||
      error instanceof ConflictException
    ) {
      return error;
    }

    // Handle custom service errors
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

    // Log unexpected errors
    this.logger.error('Unexpected error in AuthService', error);

    // Return a generic internal server error. In development include the original message.
    return new InternalServerErrorException(
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.message
        : 'An unexpected error occurred. Please try again.',
    );
  }
}
