/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================================================
// auth.service.ts - Authentication Service
// ============================================================================
// Production-ready authentication service with comprehensive security,
// error handling, logging, and token management.
// ============================================================================

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcrypt';
import { randomUUID } from 'crypto';

import { ConfigService } from '@shamba/config';
import { PrismaService, User, PasswordResetToken } from '@shamba/database';
import { RegisterRequestDto } from '@shamba/common';
import {
  AuthResult,
  JwtPayload,
  RefreshTokenPayload,
  TokenPair,
} from '../interfaces/auth.interface';

/**
 * Password reset initiation result
 */
interface PasswordResetInitResult {
  token: string;
  user: {
    firstName: string;
    email: string;
  };
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

/**
 * AuthService handles all authentication-related operations.
 *
 * RESPONSIBILITIES:
 * - User registration with email uniqueness validation
 * - User authentication with credential validation
 * - JWT token generation and refresh
 * - Password management (change, reset)
 * - Security token management
 *
 * SECURITY FEATURES:
 * - Password hashing with bcrypt
 * - Token-based password reset
 * - Rate limiting ready (implement at controller level)
 * - Audit logging for security events
 * - Generic responses to prevent user enumeration
 *
 * ERROR HANDLING:
 * - Comprehensive exception throwing
 * - Detailed logging for debugging
 * - User-friendly error messages
 * - Security-conscious error responses
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.logger.log('AuthService initialized');
    this.validateConfiguration();
  }

  // ========================================================================
  // CONFIGURATION VALIDATION
  // ========================================================================

  /**
   * Validates required configuration on service initialization.
   * Throws error if critical config is missing.
   */
  private validateConfiguration(): void {
    const requiredConfigs = [
      'JWT_SECRET',
      'JWT_EXPIRATION',
      'REFRESH_TOKEN_SECRET',
      'REFRESH_TOKEN_EXPIRATION',
      'BCRYPT_ROUNDS',
    ];

    const missing = requiredConfigs.filter((key) => !this.configService.get(key));

    if (missing.length > 0) {
      const errorMsg = `Missing required configuration: ${missing.join(', ')}`;
      this.logger.error(errorMsg);
      throw new InternalServerErrorException('Authentication service is not properly configured');
    }

    this.logger.log('Configuration validated successfully');
  }

  // ========================================================================
  // CORE AUTHENTICATION FLOW
  // ========================================================================

  /**
   * Registers a new user account.
   *
   * FLOW:
   * 1. Validate email uniqueness
   * 2. Hash password with bcrypt
   * 3. Create user in database with profile
   * 4. Generate JWT token pair
   * 5. Return user data and tokens
   *
   * @param registerDto - Registration data (email, password, name, role)
   * @returns AuthResult with user data and tokens
   *
   * @throws {ConflictException} Email already exists
   * @throws {InternalServerErrorException} Database or hashing error
   */
  async register(registerDto: RegisterRequestDto): Promise<AuthResult> {
    const { email, password, firstName, lastName, role } = registerDto;

    try {
      this.logger.log(`Registration attempt for email: ${email}`);

      // Check for existing user
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        this.logger.warn(`Registration failed: Email already exists - ${email}`);
        throw new ConflictException(
          'A user with this email already exists. Please use a different email or try logging in.',
        );
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user with profile in a transaction
      const user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role,
            profile: {
              create: {
                bio: undefined,
                phoneNumber: undefined,
                address: undefined,
                nextOfKin: undefined,
              },
            },
          },
          include: {
            profile: true,
          },
        });

        return newUser;
      });

      // Generate JWT tokens
      const tokens = await this.generateTokenPair({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      this.logger.log(`User registered successfully: ${user.id} (${email})`);

      // Return sanitized user data (exclude password)
      const { password: passwordField, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        tokens,
      };
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }

      // Log and throw generic error for unknown issues
      this.logger.error(
        `Registration error for ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException(
        'An error occurred during registration. Please try again later.',
      );
    }
  }

  /**
   * Validates user credentials for authentication.
   *
   * FLOW:
   * 1. Find user by email
   * 2. Compare provided password with stored hash
   * 3. Return user data (without password) if valid
   *
   * @param email - User email address
   * @param password - Plain text password
   * @returns User object without password
   *
   * @throws {UnauthorizedException} Invalid credentials
   *
   * SECURITY: Generic error message prevents user enumeration
   */
  async validateUser(email: string, password: string): Promise<Omit<User, 'password'>> {
    try {
      this.logger.debug(`Authentication attempt for email: ${email}`);

      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      if (!user) {
        this.logger.warn(`Authentication failed: User not found - ${email}`);
        // Generic error message to prevent user enumeration
        throw new UnauthorizedException(
          'Invalid email or password. Please check your credentials and try again.',
        );
      }

      const isPasswordValid = await this.comparePassword(password, user.password);

      if (!isPasswordValid) {
        this.logger.warn(`Authentication failed: Invalid password - ${email}`);
        // Same generic error message
        throw new UnauthorizedException(
          'Invalid email or password. Please check your credentials and try again.',
        );
      }

      this.logger.log(`Authentication successful: ${user.id} (${email})`);

      // Return user without password
      const { password: passwordField, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(
        `Validation error for ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException(
        'An error occurred during authentication. Please try again later.',
      );
    }
  }

  /**
   * Refreshes access and refresh tokens.
   *
   * FLOW:
   * 1. Validate user exists
   * 2. Generate new token pair
   * 3. Return new tokens
   *
   * @param userId - User ID from refresh token
   * @returns New token pair
   *
   * @throws {UnauthorizedException} User not found
   *
   * SECURITY: Implements token rotation for enhanced security
   */
  async refreshTokens(userId: string): Promise<TokenPair> {
    try {
      this.logger.debug(`Token refresh requested for user: ${userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        this.logger.warn(`Token refresh failed: User not found - ${userId}`);
        throw new UnauthorizedException('Invalid refresh token. Please log in again.');
      }

      const tokens = await this.generateTokenPair({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      this.logger.log(`Token refresh successful for user: ${userId}`);

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(
        `Token refresh error for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException(
        'An error occurred during token refresh. Please try again later.',
      );
    }
  }

  // ========================================================================
  // PASSWORD MANAGEMENT
  // ========================================================================

  /**
   * Changes user password (requires current password verification).
   *
   * FLOW:
   * 1. Find user by ID
   * 2. Verify current password
   * 3. Hash new password
   * 4. Update password in database
   *
   * @param userId - User ID
   * @param currentPassword - Current password for verification
   * @param newPassword - New password
   *
   * @throws {NotFoundException} User not found
   * @throws {UnauthorizedException} Current password incorrect
   *
   * SECURITY: Requires current password to prevent unauthorized changes
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      this.logger.log(`Password change requested for user: ${userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(`Password change failed: User not found - ${userId}`);
        throw new NotFoundException('User not found.');
      }

      // Verify current password
      const isPasswordValid = await this.comparePassword(currentPassword, user.password);

      if (!isPasswordValid) {
        this.logger.warn(`Password change failed: Incorrect current password - ${userId}`);
        throw new UnauthorizedException('Current password is incorrect. Please try again.');
      }

      // Hash and update new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      this.logger.log(`Password changed successfully for user: ${userId}`);

      // OPTIONAL: Invalidate all refresh tokens here
      // await this.invalidateUserRefreshTokens(userId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(
        `Password change error for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException(
        'An error occurred while changing your password. Please try again later.',
      );
    }
  }

  /**
   * Initiates password reset process by creating a reset token.
   *
   * FLOW:
   * 1. Find user by email
   * 2. Generate secure random token
   * 3. Hash token and store in database with expiry
   * 4. Return raw token (to be sent via email)
   *
   * @param email - User email address
   * @returns Token and user info (or null values if user doesn't exist)
   *
   * SECURITY:
   * - Returns generic response to prevent user enumeration
   * - Token expires in 1 hour
   * - Token is hashed before storage
   * - Single-use tokens (deleted after use)
   */
  async initiatePasswordReset(email: string): Promise<PasswordResetInitResult | null> {
    try {
      this.logger.log(`Password reset requested for email: ${email}`);

      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      // Return empty result if user doesn't exist (security: prevent enumeration)
      if (!user) {
        this.logger.debug(`Password reset: User not found - ${email} (returning generic response)`);
        return {
          token: '',
          user: {
            firstName: '',
            email: email,
          },
        };
      }

      // Generate secure token
      const token = randomUUID();
      const tokenHash = await this.hashPassword(token);
      const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now

      // Delete any existing reset tokens for this user
      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Store the hashed token
      await this.prisma.passwordResetToken.create({
        data: {
          tokenHash,
          expiresAt,
          userId: user.id,
        },
      });

      this.logger.log(`Password reset token created for user: ${user.id} (${email})`);

      // Return raw token to be sent to user via email
      return {
        token,
        user: {
          firstName: user.firstName,
          email: user.email,
        },
      };
    } catch (error) {
      this.logger.error(
        `Password reset initiation error for ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Return generic response on error (security)
      return {
        token: '',
        user: {
          firstName: '',
          email: email,
        },
      };
    }
  }

  /**
   * Completes password reset with token validation.
   *
   * FLOW:
   * 1. Find all non-expired reset tokens
   * 2. Compare provided token with stored hashes
   * 3. If valid, hash new password
   * 4. Update user password
   * 5. Delete all reset tokens for user
   *
   * @param token - Reset token from email
   * @param newPassword - New password
   *
   * @throws {BadRequestException} Invalid or expired token
   *
   * SECURITY:
   * - Tokens expire in 1 hour
   * - Tokens are single-use (deleted after success)
   * - All user tokens invalidated after reset
   */
  async finalizePasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      this.logger.log('Password reset finalization attempted');

      // Find all non-expired tokens
      const allTokens = await this.prisma.passwordResetToken.findMany({
        where: { expiresAt: { gt: new Date() } },
      });

      // Find matching token by comparing hashes
      let validTokenRecord: PasswordResetToken | null = null;
      for (const record of allTokens) {
        const isMatch = await this.comparePassword(token, record.tokenHash);
        if (isMatch) {
          validTokenRecord = record;
          break;
        }
      }

      if (!validTokenRecord) {
        this.logger.warn('Password reset failed: Invalid or expired token');
        throw new BadRequestException(
          'Invalid or expired password reset token. Please request a new reset link.',
        );
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password in transaction
      await this.prisma.$transaction(async (tx) => {
        // Update user password
        await tx.user.update({
          where: { id: validTokenRecord.userId },
          data: { password: hashedPassword },
        });

        // Delete all reset tokens for this user
        await tx.passwordResetToken.deleteMany({
          where: { userId: validTokenRecord.userId },
        });
      });

      this.logger.log(`Password reset completed for user: ${validTokenRecord.userId}`);

      // OPTIONAL: Invalidate all refresh tokens here to force re-login
      // await this.invalidateUserRefreshTokens(validTokenRecord.userId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Password reset finalization error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException(
        'An error occurred while resetting your password. Please try again later.',
      );
    }
  }

  // ========================================================================
  // TOKEN AND HASHING UTILITIES
  // ========================================================================

  /**
   * Generates JWT access and refresh token pair.
   *
   * @param payload - JWT payload with user info
   * @returns Token pair (access + refresh)
   *
   * SECURITY:
   * - Access token: Short-lived (15 minutes default)
   * - Refresh token: Long-lived (7 days default)
   * - Separate secrets for each token type
   */
  async generateTokenPair(payload: JwtPayload): Promise<TokenPair> {
    try {
      const refreshTokenPayload: RefreshTokenPayload = { sub: payload.sub };

      const jwtSecret = this.configService.get('JWT_SECRET');
      const jwtExpiration = this.configService.get('JWT_EXPIRATION');
      const refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
      const refreshTokenExpiration = this.configService.get('REFRESH_TOKEN_EXPIRATION');

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {
          secret: jwtSecret,
          expiresIn: jwtExpiration || '15m',
        }),
        this.jwtService.signAsync(refreshTokenPayload, {
          secret: refreshTokenSecret,
          expiresIn: refreshTokenExpiration || '7d',
        }),
      ]);

      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error(
        `Token generation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException('Failed to generate authentication tokens.');
    }
  }

  /**
   * Hashes password using bcrypt.
   *
   * @param password - Plain text password
   * @returns Hashed password
   *
   * SECURITY: Uses configurable bcrypt rounds (default: 10)
   */
  private async hashPassword(password: string): Promise<string> {
    try {
      const rounds = this.configService.get('BCRYPT_ROUNDS');
      const bcryptRounds = typeof rounds === 'number' ? rounds : 10;
      return await hash(password, bcryptRounds);
    } catch (error) {
      this.logger.error(
        `Password hashing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new InternalServerErrorException('Failed to process password.');
    }
  }

  /**
   * Compares plain text password with hash.
   *
   * @param password - Plain text password
   * @param hash - Stored password hash
   * @returns True if password matches
   */
  private async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      return await compare(password, hash);
    } catch (error) {
      this.logger.error(
        `Password comparison error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  // ========================================================================
  // OPTIONAL: SESSION MANAGEMENT
  // ========================================================================

  /**
   * FUTURE: Invalidate all refresh tokens for a user.
   * Useful for "logout from all devices" or after password change.
   *
   * Requires refresh token storage in database.
   */
  // private async invalidateUserRefreshTokens(userId: string): Promise<void> {
  //   // Implementation depends on your refresh token storage strategy
  //   // Example: Delete all refresh tokens from database
  //   // await this.prisma.refreshToken.deleteMany({ where: { userId } });
  //   this.logger.log(`Refresh tokens invalidated for user: ${userId}`);
  // }
}
