import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  BaseEvent,
  EventPattern,
  EmailVerifiedData,
  PasswordResetRequestedData,
  EmailVerificationRequestedData,
} from '@shamba/common';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcrypt';
import { createHash } from 'crypto';
import { randomBytes } from 'crypto';
import { ConfigService } from '@shamba/config';
import { UserWithProfile } from '../types/types';
import { PrismaService, UserRole } from '@shamba/database';
import { MessagingService } from '@shamba/messaging';
import {
  RegisterRequestDto,
  ChangePasswordRequestDto,
  ResetPasswordRequestDto,
  ForgotPasswordRequestDto,
  AuthResponseDto,
  RefreshTokenResponseDto,
  LogoutResponseDto,
  ChangePasswordResponseDto,
  ResetPasswordResponseDto,
  ForgotPasswordResponseDto,
  ValidateResetTokenResponseDto,
  VerifyEmailRequestDto,
  ResendVerificationRequestDto,
  VerifyEmailResponseDto,
  ResendVerificationResponseDto,
} from '@shamba/common';

interface RefreshTokenPayload {
  sub: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface TokenMetadata {
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  tokenType: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly ACCESS_TOKEN_EXPIRY: string;
  private readonly REFRESH_TOKEN_EXPIRY: string;
  private readonly BCRYPT_ROUNDS: number;
  private readonly PASSWORD_RESET_EXPIRY_MINUTES = 15;
  private readonly EMAIL_VERIFICATION_EXPIRY_MINUTES = 60;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly messagingService: MessagingService,
  ) {
    this.ACCESS_TOKEN_EXPIRY = this.configService.get('JWT_EXPIRATION') ?? '15m';
    this.REFRESH_TOKEN_EXPIRY = this.configService.get('REFRESH_TOKEN_EXPIRATION') ?? '7d';
    this.BCRYPT_ROUNDS = Number(this.configService.get('BCRYPT_ROUNDS') ?? 12);

    this.logger.log('AuthService initialized');
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async register(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, acceptedTerms, marketingOptIn } = dto;

    this.logger.log(`Registration attempt: ${email}`);

    if (!acceptedTerms) {
      throw new BadRequestException('You must accept the terms and conditions.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      this.logger.warn(`Registration failed: Email exists - ${email}`);
      throw new ConflictException('A user with this email already exists.');
    }

    const hashedPassword = await this.hashPassword(password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: UserRole.USER,
          isActive: true,
          profile: {
            create: {
              emailVerified: false,
              marketingOptIn: marketingOptIn ?? false,
            },
          },
        },
        include: { profile: true },
      });

      // Generate email verification token
      await this.generateEmailVerificationToken(user.id, user.email);

      this.logger.log(`User registered: ${user.id}`);
      return this.buildAuthResponse(user);
    } catch (error) {
      this.logger.error(`Registration error: ${email}`, error);
      throw new InternalServerErrorException('Registration failed.');
    }
  }

  async login(user: UserWithProfile, deviceId?: string): Promise<AuthResponseDto> {
    this.logger.log(`Login successful for user: ${user.id}`);

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(
        `Account temporarily locked. Try again in ${minutesLeft} minutes.`,
      );
    }

    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated.');
    }

    // Update last login and reset attempts in parallel with token generation.
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), loginAttempts: 0, lockedUntil: null },
    });

    return this.buildAuthResponse(user, deviceId);
  }

  async refreshTokens(refreshToken: string): Promise<RefreshTokenResponseDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing.');
    }

    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, isActive: true },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or deactivated.');
    }

    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { userId: user.id, tokenHash },
    });

    if (!storedToken) {
      this.logger.warn(`Invalid refresh token used: ${user.id}`);
      throw new UnauthorizedException('Invalid refresh token.');
    }

    // Token rotation: Invalidate old token
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const tokens = await this.generateAndStoreTokens(user);
    const metadata = this.getTokenMetadata();

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenMetadata: metadata,
    };
  }

  async logout(refreshToken: string): Promise<LogoutResponseDto> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required.');
    }

    const tokenHash = this.hashToken(refreshToken);

    await this.prisma.refreshToken.deleteMany({
      where: { tokenHash },
    });

    this.logger.log('User logged out');
    return { message: 'Successfully logged out.' };
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  async verifyEmail(dto: VerifyEmailRequestDto): Promise<VerifyEmailResponseDto> {
    const { token } = dto;

    const tokenHash = this.hashToken(token);
    const verificationToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid verification token.');
    }

    if (verificationToken.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({ where: { id: verificationToken.id } });
      throw new BadRequestException('Verification token has expired.');
    }

    // Mark email as verified
    await this.prisma.$transaction([
      this.prisma.userProfile.update({
        where: { userId: verificationToken.userId },
        data: { emailVerified: true },
      }),
      this.prisma.passwordResetToken.delete({ where: { id: verificationToken.id } }),
    ]);

    this.logger.log(`Email verified: ${verificationToken.userId}`);

    // Emit event for notifications/auditing
    const eventPayload: EmailVerifiedData = {
      userId: verificationToken.userId,
      email: verificationToken.user.email,
    };
    const event = this.createEvent(EventPattern.EMAIL_VERIFIED, eventPayload);
    this.messagingService.emit(event);

    return { message: 'Email verified successfully.' };
  }

  async resendVerification(
    dto: ResendVerificationRequestDto,
  ): Promise<ResendVerificationResponseDto> {
    const { email } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      // Security: Don't reveal if user exists
      return {
        message: 'If an account with that email exists, a verification email has been sent.',
      };
    }

    if (user.profile?.emailVerified) {
      throw new BadRequestException('Email is already verified.');
    }

    await this.generateEmailVerificationToken(user.id, user.email);

    return { message: 'Verification email sent.' };
  }

  // ============================================================================
  // PASSWORD MANAGEMENT
  // ============================================================================

  async changePassword(
    userId: string,
    dto: ChangePasswordRequestDto,
  ): Promise<ChangePasswordResponseDto> {
    const { currentPassword, newPassword } = dto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const isValidPassword = await compare(currentPassword, user.password);
    if (!isValidPassword) {
      this.logger.warn(`Password change failed: Invalid current password - ${userId}`);
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all sessions for security
    await this.invalidateAllUserSessions(userId);

    this.logger.log(`Password changed: ${userId}`);
    return { message: 'Password changed successfully.' };
  }

  async forgotPassword(dto: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto> {
    const { email } = dto;

    this.logger.log(`Password reset requested: ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email, isActive: true },
    });

    // Security: Always return success to prevent email enumeration
    if (!user) {
      this.logger.warn(`Password reset requested for non-existent/inactive email: ${email}`);
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
        expiresInMinutes: this.PASSWORD_RESET_EXPIRY_MINUTES,
      };
    }

    // Generate reset token
    const resetToken = this.generateSecureToken();
    const tokenHash = this.hashToken(resetToken);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.PASSWORD_RESET_EXPIRY_MINUTES);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Emit event for notifications service
    const eventPayload: PasswordResetRequestedData = {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      resetToken: resetToken, // The raw token sent to the user
      expiresAt: expiresAt.toISOString(),
    };
    const event = this.createEvent(EventPattern.PASSWORD_RESET_REQUESTED, eventPayload);
    this.messagingService.emit(event);

    this.logger.log(`Password reset token generated: ${user.id}`);

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
      expiresInMinutes: this.PASSWORD_RESET_EXPIRY_MINUTES,
    };
  }

  async validateResetToken(token: string): Promise<ValidateResetTokenResponseDto> {
    const tokenHash = this.hashToken(token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken) {
      return {
        valid: false,
        message: 'Invalid reset token.',
      };
    }

    if (resetToken.expiresAt < new Date()) {
      // Clean up expired token
      await this.prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

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

    return { valid: true };
  }

  async resetPassword(dto: ResetPasswordRequestDto): Promise<ResetPasswordResponseDto> {
    const { token, newPassword } = dto;

    const tokenHash = this.hashToken(token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    if (resetToken.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      throw new BadRequestException('Reset token has expired.');
    }

    if (resetToken.used) {
      throw new BadRequestException('Reset token has already been used.');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    // Invalidate all sessions for security
    await this.invalidateAllUserSessions(resetToken.userId);

    this.logger.log(`Password reset successful: ${resetToken.userId}`);

    return {
      message: 'Password reset successfully. You can now log in with your new password.',
    };
  }

  // ============================================================================
  // PRIVATE UTILITIES
  // ============================================================================

  async validateUser(email: string, password: string): Promise<UserWithProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await compare(password, user.password);

    if (!isValidPassword) {
      // Increment failed login attempts
      const updatedAttempts = user.loginAttempts + 1;
      let lockedUntil: Date | null = null;

      if (updatedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + this.LOCKOUT_DURATION_MINUTES);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: updatedAttempts,
          lockedUntil,
        },
      });

      return null;
    }

    return user;
  }

  private async buildAuthResponse(
    user: UserWithProfile,
    deviceId?: string,
  ): Promise<AuthResponseDto> {
    // This function's only job is to assemble the final response object.
    // It orchestrates token generation and data mapping.
    const tokens = await this.generateAndStoreTokens(user, deviceId);
    const metadata = this.getTokenMetadata();

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        // We get emailVerified directly from the profile object passed in. No DB call needed.
        emailVerified: user.profile?.emailVerified ?? false,
        lastLoginAt: user.lastLoginAt || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokenMetadata: metadata,
    };
  }

  private async generateAndStoreTokens(
    user: UserWithProfile,
    deviceId?: string,
  ): Promise<TokenPair> {
    const accessTokenPayload: object = {
      sub: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.profile?.emailVerified ?? false,
    };

    const refreshTokenPayload: object = {
      sub: user.id,
    };

    const accessTokenOptions = {
      secret: this.configService.getOrThrow('JWT_SECRET'),
      expiresIn: this.parseExpiryToSeconds(this.ACCESS_TOKEN_EXPIRY), // Converted to number
    };

    const refreshTokenOptions = {
      secret: this.configService.getOrThrow('REFRESH_TOKEN_SECRET'),
      expiresIn: this.parseExpiryToSeconds(this.REFRESH_TOKEN_EXPIRY), // Converted to number
    };

    // These calls will now succeed because the options object has the correct types.
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, accessTokenOptions),
      this.jwtService.signAsync(refreshTokenPayload, refreshTokenOptions),
    ]);

    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() + this.parseExpiryToSeconds(this.REFRESH_TOKEN_EXPIRY),
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt,
        deviceId,
      },
    });

    return { accessToken, refreshToken };
  }

  private async generateEmailVerificationToken(userId: string, email: string): Promise<void> {
    const verificationToken = this.generateSecureToken();
    const tokenHash = this.hashToken(verificationToken);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.EMAIL_VERIFICATION_EXPIRY_MINUTES);

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    // Emit event for notifications service
    const eventPayload: EmailVerificationRequestedData = {
      userId,
      email,
      firstName: 'User', // You may need to pass the user's first name into this function
      verificationToken, // The raw token
      expiresAt: expiresAt.toISOString(),
    };
    const event = this.createEvent(EventPattern.EMAIL_VERIFICATION_REQUESTED, eventPayload);
    this.messagingService.emit(event);
  }

  private async invalidateAllUserSessions(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    this.logger.log(`Sessions invalidated: ${userId}`);
  }

  private getTokenMetadata(): TokenMetadata {
    return {
      accessTokenExpiresIn: this.parseExpiryToSeconds(this.ACCESS_TOKEN_EXPIRY),
      refreshTokenExpiresIn: this.parseExpiryToSeconds(this.REFRESH_TOKEN_EXPIRY),
      tokenType: 'Bearer',
    };
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] || 60);
  }

  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashPassword(password: string): Promise<string> {
    return hash(password, this.BCRYPT_ROUNDS);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private createEvent<T extends EventPattern, D>(type: T, data: D): BaseEvent<T, D> {
    return {
      type,
      data,
      timestamp: new Date(),
      version: '1.0',
      source: 'accounts-service', // This service's identifier
      // correlationId could be added here if you implement request tracing
    };
  }
}
