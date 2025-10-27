import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@shamba/config';
import { MessagingService } from '@shamba/messaging';
import { v4 as uuidv4 } from 'uuid';

// Domain
import { User } from '../../3_domain/models/user.model';
import { UserProfile } from '../../3_domain/models/user-profile.model';
import { Email, Password } from '../../3_domain/value-objects';
import {
  UserCreatedEvent,
  EmailVerifiedEvent,
  PasswordResetRequestedEvent,
} from '../../3_domain/events';

// Infrastructure
import {
  UserRepository,
  ProfileRepository,
  TokenRepository,
} from '../../4_infrastructure/persistence/repositories';

// Application
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
  AuthResponseDto,
  VerifyEmailResponseDto,
  ResendVerificationResponseDto,
  ForgotPasswordResponseDto,
  ValidateResetTokenResponseDto,
  ResetPasswordResponseDto,
  ChangePasswordResponseDto,
  RefreshTokenResponseDto,
  LogoutResponseDto,
} from '../dtos/auth.dto';
import { UserMapper, TokenMapper } from '../mappers';

/**
 * AuthService
 *
 * Handles all authentication-related use cases:
 * - Registration & Login
 * - Email verification
 * - Password management (change, reset, forgot)
 * - Token management (JWT, refresh tokens)
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Configuration
  private readonly ACCESS_TOKEN_EXPIRY: string;
  private readonly REFRESH_TOKEN_EXPIRY: string;
  private readonly EMAIL_VERIFICATION_EXPIRY_MINUTES = 60; // 1 hour
  private readonly PASSWORD_RESET_EXPIRY_MINUTES = 15;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly messagingService: MessagingService,
    private readonly userMapper: UserMapper,
    private readonly tokenMapper: TokenMapper,
  ) {
    this.ACCESS_TOKEN_EXPIRY = this.configService.get('JWT_EXPIRATION') ?? '15m';
    this.REFRESH_TOKEN_EXPIRY = this.configService.get('REFRESH_TOKEN_EXPIRATION') ?? '7d';

    this.logger.log('AuthService initialized');
  }

  // ============================================================================
  // REGISTRATION & LOGIN
  // ============================================================================

  /**
   * Registers a new user
   */
  async register(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    this.logger.log(`Registration attempt: ${dto.email}`);

    // Validate email
    const email = Email.create(dto.email);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      this.logger.warn(`Registration failed: Email exists - ${dto.email}`);
      throw new ConflictException('A user with this email already exists.');
    }

    // Create password value object (validates strength and hashes)
    const password = await Password.create(dto.password);

    // Create user domain model
    const user = await User.create({
      id: uuidv4(),
      email,
      password,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    // Create profile
    const profile = UserProfile.create({
      id: uuidv4(),
      userId: user.getId(),
      marketingOptIn: dto.marketingOptIn ?? false,
    });

    // Persist to database
    const [createdUser, createdProfile] = await Promise.all([
      this.userRepository.create(user),
      this.profileRepository.create(profile),
    ]);

    // Generate email verification token
    await this.generateAndSendEmailVerification(createdUser);

    // Publish domain event
    const event = new UserCreatedEvent(
      createdUser.getId(),
      createdUser.getEmail().getValue(),
      createdUser.getFirstName(),
      createdUser.getLastName(),
      createdUser.getRole(),
      dto.marketingOptIn ?? false,
    );
    this.messagingService.emit(event.eventName, event.toJSON());

    // Generate tokens
    const tokens = await this.generateAndStoreTokens(createdUser, createdProfile, dto.deviceId);
    const tokenMetadata = this.tokenMapper.generateTokenMetadata(
      this.ACCESS_TOKEN_EXPIRY,
      this.REFRESH_TOKEN_EXPIRY,
    );

    this.logger.log(`User registered: ${createdUser.getId()}`);

    return this.userMapper.toAuthResponse(createdUser, createdProfile, tokens, tokenMetadata);
  }

  /**
   * Authenticates a user and generates tokens
   */
  async login(dto: LoginRequestDto): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt: ${dto.email}`);

    // Validate email
    const email = Email.create(dto.email);

    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockedUntil = user.getLockedUntil();
      const minutesLeft = lockedUntil ? Math.ceil((lockedUntil.getTime() - Date.now()) / 60000) : 0;
      throw new ForbiddenException(
        `Account temporarily locked. Try again in ${minutesLeft} minutes.`,
      );
    }

    // Check if account is active
    if (!user.getIsActive()) {
      throw new ForbiddenException('Your account has been deactivated.');
    }

    // Validate password (handles login attempts internally)
    const isValidLogin = await user.login(dto.password);
    if (!isValidLogin) {
      // Save updated login attempts
      await this.userRepository.update(user);
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Save successful login
    await this.userRepository.update(user);

    // Get profile
    const profile = await this.profileRepository.findByUserId(user.getId());

    // Generate tokens
    const tokens = await this.generateAndStoreTokens(user, profile, dto.deviceId);
    const tokenMetadata = this.tokenMapper.generateTokenMetadata(
      this.ACCESS_TOKEN_EXPIRY,
      this.REFRESH_TOKEN_EXPIRY,
    );

    this.logger.log(`Login successful: ${user.getId()}`);

    return this.userMapper.toAuthResponse(user, profile, tokens, tokenMetadata);
  }

  /**
   * Refreshes access token using refresh token
   */
  async refreshTokens(dto: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto> {
    const { refreshToken } = dto;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing.');
    }

    // Verify JWT
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // Find user
    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.getIsActive()) {
      throw new UnauthorizedException('User not found or deactivated.');
    }

    // Verify token in database (token rotation)
    const tokenHash = this.tokenMapper.hashToken(refreshToken);
    const storedToken = await this.tokenRepository.findRefreshToken(tokenHash);

    if (!storedToken) {
      this.logger.warn(`Invalid refresh token used: ${user.getId()}`);
      throw new UnauthorizedException('Invalid refresh token.');
    }

    // Delete old token (rotation)
    await this.tokenRepository.deleteRefreshToken(tokenHash);

    // Get profile
    const profile = await this.profileRepository.findByUserId(user.getId());

    // Generate new tokens
    const tokens = await this.generateAndStoreTokens(user, profile, dto.deviceId);
    const tokenMetadata = this.tokenMapper.generateTokenMetadata(
      this.ACCESS_TOKEN_EXPIRY,
      this.REFRESH_TOKEN_EXPIRY,
    );

    this.logger.log(`Tokens refreshed: ${user.getId()}`);

    return this.userMapper.toRefreshTokenResponse(tokens, tokenMetadata);
  }

  /**
   * Logs out user by invalidating refresh token
   */
  async logout(dto: LogoutRequestDto, userId: string): Promise<LogoutResponseDto> {
    const { refreshToken, allDevices } = dto;

    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required.');
    }

    let sessionsTerminated = 0;

    if (allDevices) {
      // Logout from all devices
      await this.tokenRepository.deleteRefreshTokensByUserId(userId);
      const tokenCount = await this.tokenRepository.countActiveRefreshTokens(userId);
      sessionsTerminated = tokenCount;
    } else {
      // Logout from current device only
      const tokenHash = this.tokenMapper.hashToken(refreshToken);
      await this.tokenRepository.deleteRefreshToken(tokenHash);
      sessionsTerminated = 1;
    }

    this.logger.log(`User logged out: ${userId}`);

    return {
      message: 'Successfully logged out.',
      sessionsTerminated,
    };
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  /**
   * Verifies user email with token
   */
  async verifyEmail(dto: VerifyEmailRequestDto): Promise<VerifyEmailResponseDto> {
    const { token } = dto;

    const tokenHash = this.tokenMapper.hashToken(token);
    const verificationToken = await this.tokenRepository.findEmailVerificationToken(tokenHash);

    if (!verificationToken) {
      throw new BadRequestException('Invalid verification token.');
    }

    if (verificationToken.expiresAt < new Date()) {
      await this.tokenRepository.deleteEmailVerificationToken(tokenHash);
      throw new BadRequestException('Verification token has expired.');
    }

    // Get user and profile
    const user = await this.userRepository.findById(verificationToken.userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const profile = await this.profileRepository.findByUserId(user.getId());
    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    // Verify email
    profile.verifyEmail();
    await this.profileRepository.update(profile);

    // Delete token
    await this.tokenRepository.deleteEmailVerificationToken(tokenHash);

    // Publish event
    const event = new EmailVerifiedEvent(
      user.getId(),
      user.getEmail().getValue(),
      user.getFirstName(),
      user.getLastName(),
    );
    this.messagingService.emit(event.eventName, event.toJSON());

    this.logger.log(`Email verified: ${user.getId()}`);

    return {
      message: 'Email verified successfully. Your account is now fully activated.',
      success: true,
    };
  }

  /**
   * Resends email verification
   */
  async resendVerification(
    dto: ResendVerificationRequestDto,
  ): Promise<ResendVerificationResponseDto> {
    const { email: emailStr } = dto;

    const email = Email.create(emailStr);
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Security: Don't reveal if user exists
      const nextRetryAt = new Date(Date.now() + 60000); // 1 minute
      return {
        message: 'If an account with that email exists, a verification email has been sent.',
        nextRetryAt,
        retryAfterSeconds: 60,
      };
    }

    const profile = await this.profileRepository.findByUserId(user.getId());
    if (profile?.getEmailVerified()) {
      throw new BadRequestException('Email is already verified.');
    }

    await this.generateAndSendEmailVerification(user);

    const nextRetryAt = new Date(Date.now() + 60000); // 1 minute rate limit

    return {
      message: 'Verification email sent. Please check your inbox.',
      nextRetryAt,
      retryAfterSeconds: 60,
    };
  }

  // ============================================================================
  // PASSWORD MANAGEMENT
  // ============================================================================

  /**
   * Changes user password (authenticated)
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordRequestDto,
  ): Promise<ChangePasswordResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Create new password value object
    const newPassword = await Password.create(dto.newPassword);

    // Change password (validates current password internally)
    await user.changePassword(dto.currentPassword, newPassword);

    // Save user
    await this.userRepository.update(user);

    // Invalidate all sessions for security
    await this.tokenRepository.deleteRefreshTokensByUserId(userId);

    this.logger.log(`Password changed: ${userId}`);

    return {
      message: 'Password changed successfully. Please log in with your new password.',
      sessionsTerminated: true,
    };
  }

  /**
   * Initiates forgot password flow
   */
  async forgotPassword(dto: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto> {
    const { email: emailStr } = dto;

    this.logger.log(`Password reset requested: ${emailStr}`);

    const email = Email.create(emailStr);
    const user = await this.userRepository.findByEmail(email);

    // Security: Always return success
    if (!user || !user.getIsActive()) {
      this.logger.warn(`Password reset requested for non-existent/inactive email: ${emailStr}`);
      return {
        message:
          'If an account with that email exists, password reset instructions have been sent.',
        expiresInMinutes: this.PASSWORD_RESET_EXPIRY_MINUTES,
      };
    }

    // Generate reset token
    const resetToken = this.tokenMapper.generateSecureToken();
    const tokenHash = this.tokenMapper.hashToken(resetToken);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.PASSWORD_RESET_EXPIRY_MINUTES);

    await this.tokenRepository.createPasswordResetToken(user.getId(), tokenHash, expiresAt);

    // Publish event for notifications
    const event = new PasswordResetRequestedEvent(
      user.getId(),
      user.getEmail().getValue(),
      user.getFirstName(),
      resetToken, // Raw token for email
      expiresAt,
    );
    this.messagingService.emit(event.eventName, event.toJSON());

    this.logger.log(`Password reset token generated: ${user.getId()}`);

    return {
      message: 'If an account with that email exists, password reset instructions have been sent.',
      expiresInMinutes: this.PASSWORD_RESET_EXPIRY_MINUTES,
    };
  }

  /**
   * Validates reset token
   */
  async validateResetToken(
    dto: ValidateResetTokenRequestDto,
  ): Promise<ValidateResetTokenResponseDto> {
    const tokenHash = this.tokenMapper.hashToken(dto.token);
    const resetToken = await this.tokenRepository.findPasswordResetToken(tokenHash);

    if (!resetToken) {
      return {
        valid: false,
        message: 'Invalid reset token.',
      };
    }

    if (resetToken.expiresAt < new Date()) {
      await this.tokenRepository.deletePasswordResetTokensByUserId(resetToken.userId);
      return {
        valid: false,
        message: 'Reset token has expired.',
      };
    }

    if (resetToken.used) {
      return {
        valid: false,
        message: 'Reset token has already been used.',
      };
    }

    return {
      valid: true,
      expiresAt: resetToken.expiresAt,
    };
  }

  /**
   * Resets password with token
   */
  async resetPassword(dto: ResetPasswordRequestDto): Promise<ResetPasswordResponseDto> {
    const tokenHash = this.tokenMapper.hashToken(dto.token);
    const resetToken = await this.tokenRepository.findPasswordResetToken(tokenHash);

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    if (resetToken.expiresAt < new Date()) {
      await this.tokenRepository.deletePasswordResetTokensByUserId(resetToken.userId);
      throw new BadRequestException('Reset token has expired.');
    }

    if (resetToken.used) {
      throw new BadRequestException('Reset token has already been used.');
    }

    // Get user
    const user = await this.userRepository.findById(resetToken.userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Create new password
    const newPassword = await Password.create(dto.newPassword);

    // Reset password (clears login attempts and unlocks account)
    user.resetPassword(newPassword);

    // Save user and mark token as used
    await Promise.all([
      this.userRepository.update(user),
      this.tokenRepository.markPasswordResetTokenAsUsed(tokenHash),
    ]);

    // Invalidate all sessions for security
    await this.tokenRepository.deleteRefreshTokensByUserId(user.getId());

    this.logger.log(`Password reset successful: ${user.getId()}`);

    return {
      message: 'Password reset successfully. You can now log in with your new password.',
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Generates JWT tokens and stores refresh token
   */
  private async generateAndStoreTokens(
    user: User,
    profile: UserProfile | null,
    deviceId?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Access token payload
    const accessTokenPayload = {
      sub: user.getId(),
      email: user.getEmail().getValue(),
      role: user.getRole(),
      emailVerified: profile?.getEmailVerified() ?? false,
    };

    // Refresh token payload (minimal data)
    const refreshTokenPayload = {
      sub: user.getId(),
    };

    // Generate tokens
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
        expiresIn: this.tokenMapper.parseExpiryToSeconds(this.ACCESS_TOKEN_EXPIRY),
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.configService.getOrThrow('REFRESH_TOKEN_SECRET'),
        expiresIn: this.tokenMapper.parseExpiryToSeconds(this.REFRESH_TOKEN_EXPIRY),
      }),
    ]);

    // Store refresh token in database
    const tokenHash = this.tokenMapper.hashToken(refreshToken);
    const expiresAt = this.tokenMapper.calculateExpiryDate(
      this.tokenMapper.parseExpiryToSeconds(this.REFRESH_TOKEN_EXPIRY),
    );

    await this.tokenRepository.createRefreshToken(user.getId(), tokenHash, expiresAt, deviceId);

    return { accessToken, refreshToken };
  }

  /**
   * Generates and sends email verification token
   */
  private async generateAndSendEmailVerification(user: User): Promise<void> {
    const verificationToken = this.tokenMapper.generateSecureToken();
    const tokenHash = this.tokenMapper.hashToken(verificationToken);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.EMAIL_VERIFICATION_EXPIRY_MINUTES);

    // Delete any existing verification tokens
    await this.tokenRepository.deleteEmailVerificationTokensByUserId(user.getId());

    // Create new token
    await this.tokenRepository.createEmailVerificationToken(user.getId(), tokenHash, expiresAt);

    // Publish event for notifications service
    // Note: We'll define EmailVerificationRequestedEvent if needed
    // For now, we can emit a simple event
    this.messagingService.emit('email.verification_requested', {
      userId: user.getId(),
      email: user.getEmail().getValue(),
      firstName: user.getFirstName(),
      verificationToken, // Raw token for email
      expiresAt: expiresAt.toISOString(),
    });

    this.logger.log(`Email verification token generated: ${user.getId()}`);
  }
}
