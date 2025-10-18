// ============================================================================
// auth.controller.ts - Authentication & Profile Management Controller
// ============================================================================
// Production-ready authentication endpoints with comprehensive error handling,
// request validation, security measures, and observability features.
// ============================================================================

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Patch,
  Req,
  UseInterceptors,
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import {
  RegisterRequestDto,
  ChangePasswordRequestDto,
  ResetPasswordRequestDto,
  ForgotPasswordRequestDto,
  AuthResponseDto,
  UpdateUserProfileRequestDto,
} from '@shamba/common';
import {
  AuthService,
  Public,
  CurrentUser,
  JwtAuthGuard,
  LocalAuthGuard,
  RefreshTokenGuard,
  AuthResult,
  JwtPayload,
} from '@shamba/auth';
import { ProfileService } from '../services/profile.service';
import { UserEntity, ProfileEntity } from '../entities/user.entity';
import { Request } from 'express';

/**
 * Extended Express Request with authenticated user
 */
interface AuthRequest extends Request {
  user: UserEntity;
}

/**
 * Extended Express Request with JWT payload
 */
interface JwtRequest extends Request {
  user: JwtPayload;
}

/**
 * AuthController handles all authentication and user profile operations.
 *
 * RESPONSIBILITY MATRIX:
 * ┌─────────────────────┬──────────────────────────────────────────┐
 * │ Endpoint            │ Purpose                                  │
 * ├─────────────────────┼──────────────────────────────────────────┤
 * │ POST /auth/register │ New user account creation                │
 * │ POST /auth/login    │ Email/password authentication            │
 * │ POST /auth/refresh  │ Access token renewal via refresh token   │
 * │ POST /auth/forgot   │ Password reset request (email trigger)   │
 * │ POST /auth/reset    │ Password reset completion with token     │
 * │ GET /profile        │ Retrieve authenticated user profile      │
 * │ PATCH /profile      │ Update authenticated user profile        │
 * │ PATCH /profile/pwd  │ Change password (authenticated)          │
 * └─────────────────────┴──────────────────────────────────────────┘
 *
 * SECURITY FEATURES:
 * - JWT-based authentication with access + refresh tokens
 * - Password reset flow with secure token validation
 * - Rate limiting ready (implement at gateway/service level)
 * - Audit logging for security-sensitive operations
 * - Generic responses to prevent user enumeration attacks
 */
@ApiTags('Authentication & Profile')
@Controller()
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly profileService: ProfileService,
  ) {
    this.logger.log('AuthController initialized');
  }

  // ========================================================================
  // PUBLIC AUTHENTICATION ENDPOINTS
  // ========================================================================

  /**
   * Register a new user account.
   *
   * FLOW:
   * 1. Validate registration data (email format, password strength)
   * 2. Check for existing user (duplicate email)
   * 3. Hash password and create user record
   * 4. Generate JWT access + refresh tokens
   * 5. Return tokens and sanitized user object
   *
   * SECURITY: Email validation, password hashing (bcrypt), duplicate prevention
   */
  @Public()
  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user account',
    description: `Creates a new user account with email verification and secure password storage.
    Returns JWT tokens for immediate authentication post-registration.`,
  })
  @ApiBody({ type: RegisterRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully. Authentication tokens provided.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email address already registered in the system.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid registration data (e.g., weak password, invalid email format).',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Validation failed for one or more fields.',
  })
  async register(@Body() registerDto: RegisterRequestDto): Promise<AuthResponseDto> {
    try {
      this.logger.log(`Registration attempt for email: ${registerDto.email}`);

      const result: AuthResult = await this.authService.register(registerDto);

      this.logger.log(`User registered successfully: ${result.user.id}`);

      return {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        user: new UserEntity(result.user),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Registration failed for ${registerDto.email}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * Authenticate user with email and password.
   *
   * FLOW:
   * 1. LocalAuthGuard validates credentials via Passport strategy
   * 2. Password verified using bcrypt comparison
   * 3. Generate new JWT token pair
   * 4. Return tokens and user data
   *
   * SECURITY: Rate limiting recommended, account lockout after failed attempts,
   * secure password comparison, audit logging
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login with email and password',
    description: `Authenticates user credentials and returns JWT access and refresh tokens.
    The LocalAuthGuard validates credentials before this handler executes.`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: { type: 'string', format: 'password', example: 'SecurePass123!' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful. Authentication tokens provided.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid email or password. Credentials do not match.',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many login attempts. Account temporarily locked.',
  })
  async login(@Req() req: AuthRequest): Promise<AuthResponseDto> {
    try {
      const user = req.user;

      this.logger.log(`Login successful for user: ${user.id} (${user.email})`);

      const tokens = await this.authService.generateTokenPair({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: new UserEntity(user),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Login failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Refresh access token using valid refresh token.
   *
   * FLOW:
   * 1. RefreshTokenGuard validates refresh token JWT signature
   * 2. Extract user ID from token payload
   * 3. Verify refresh token hasn't been revoked
   * 4. Generate new access + refresh token pair
   * 5. Fetch current user data
   * 6. Return new tokens with updated user info
   *
   * SECURITY: Refresh token rotation, token revocation support,
   * blacklist checking for compromised tokens
   */
  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: `Exchanges a valid refresh token for new access and refresh tokens.
    Implements token rotation for enhanced security. Old refresh token is invalidated.`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: {
          type: 'string',
          description: 'Valid JWT refresh token',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully. New token pair provided.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid, expired, or revoked refresh token.',
  })
  async refreshTokens(@Req() req: JwtRequest): Promise<AuthResponseDto> {
    try {
      const userId: string = req.user.sub;

      this.logger.log(`Token refresh requested for user: ${userId}`);

      const tokens = await this.authService.refreshTokens(userId);
      const user = await this.profileService.getProfile(userId);

      this.logger.log(`Token refresh successful for user: ${userId}`);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: new UserEntity(user),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Token refresh failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Initiate password reset flow.
   *
   * FLOW:
   * 1. Receive email address from request
   * 2. Check if user exists (internal only)
   * 3. Generate secure reset token (UUID + expiry)
   * 4. Store token with 1-hour expiration
   * 5. Send password reset email with token link
   * 6. Return generic success message (security measure)
   *
   * SECURITY: Generic response prevents user enumeration,
   * rate limiting prevents abuse, token expires quickly,
   * one-time use tokens
   */
  @Public()
  @Post('auth/forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Request password reset',
    description: `Initiates password reset process. Sends email with reset link if account exists.
    Returns generic response regardless of account existence to prevent user enumeration attacks.`,
  })
  @ApiBody({ type: ForgotPasswordRequestDto })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Request processed. Reset email sent if account exists.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'If a matching account was found, a password reset link has been sent to your email.',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many reset requests. Please try again later.',
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordRequestDto,
  ): Promise<{ message: string }> {
    try {
      this.logger.log(`Password reset requested for email: ${forgotPasswordDto.email}`);

      await this.authService.initiatePasswordReset(forgotPasswordDto.email);

      // Generic response for security - prevents user enumeration
      return {
        message:
          'If a matching account was found, a password reset link has been sent to your email.',
      };
    } catch {
      // Log error but still return generic message
      this.logger.warn(`Password reset request processing: ${forgotPasswordDto.email}`);

      // Return same message even on error to prevent timing attacks
      return {
        message:
          'If a matching account was found, a password reset link has been sent to your email.',
      };
    }
  }

  /**
   * Complete password reset with token.
   *
   * FLOW:
   * 1. Validate reset token format and signature
   * 2. Check token expiration (1-hour window)
   * 3. Verify token hasn't been used already
   * 4. Validate new password strength
   * 5. Hash new password
   * 6. Update user password in database
   * 7. Invalidate all existing refresh tokens (force re-login)
   * 8. Mark reset token as used
   *
   * SECURITY: Token expiration, one-time use, password strength validation,
   * session invalidation, audit logging
   */
  @Public()
  @Post('auth/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description: `Completes password reset using token from email. Token is single-use and expires in 1 hour.
    All existing sessions are invalidated after successful reset.`,
  })
  @ApiBody({ type: ResetPasswordRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successful. User can login with new password.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Your password has been successfully reset. You can now log in with your new password.',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid, expired, or already-used reset token.',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'New password does not meet security requirements.',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordRequestDto,
  ): Promise<{ message: string }> {
    try {
      this.logger.log('Password reset completion attempted');

      await this.authService.finalizePasswordReset(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );

      this.logger.log('Password reset completed successfully');

      return {
        message:
          'Your password has been successfully reset. You can now log in with your new password.',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Password reset failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  // ========================================================================
  // AUTHENTICATED USER PROFILE ENDPOINTS
  // ========================================================================

  /**
   * Get current authenticated user's profile.
   *
   * FLOW:
   * 1. JwtAuthGuard validates access token
   * 2. Extract user ID from token payload
   * 3. Fetch user + profile data from database
   * 4. Serialize and return data (exclude sensitive fields)
   *
   * SECURITY: JWT validation, data sanitization via UserEntity,
   * excludes password and internal fields
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: `Retrieves complete profile information for the authenticated user.
    Includes personal details, contact information, and next of kin data.`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully.',
    type: UserEntity,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid, expired, or missing authentication token.',
  })
  async getProfile(@CurrentUser('sub') userId: string): Promise<UserEntity> {
    try {
      this.logger.debug(`Profile fetch requested for user: ${userId}`);

      const userWithProfile = await this.profileService.getProfile(userId);

      return new UserEntity(userWithProfile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Profile fetch failed for user ${userId}: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Update current authenticated user's profile.
   *
   * FLOW:
   * 1. JwtAuthGuard validates access token
   * 2. Extract user ID from token
   * 3. Validate profile update data
   * 4. Update profile fields (bio, phone, address, nextOfKin)
   * 5. Return updated profile
   *
   * SECURITY: Authenticated only, validates user ownership,
   * input sanitization, audit logging for profile changes
   *
   * NOTE: Email and password changes use separate dedicated endpoints
   * for additional security measures
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update current user profile',
    description: `Updates profile information for authenticated user.
    Supports updating: bio, phone number, physical address, next of kin details.
    Email and password changes require separate dedicated endpoints.`,
  })
  @ApiBody({ type: UpdateUserProfileRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully.',
    type: ProfileEntity,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing authentication token.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid profile data format or validation failed.',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Profile data failed validation rules.',
  })
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() profileData: UpdateUserProfileRequestDto,
  ): Promise<ProfileEntity> {
    try {
      this.logger.log(`Profile update requested for user: ${userId}`);

      const updatedProfile = await this.profileService.updateProfile(userId, profileData);

      this.logger.log(`Profile updated successfully for user: ${userId}`);

      return new ProfileEntity(updatedProfile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Profile update failed for user ${userId}: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Change password for authenticated user.
   *
   * FLOW:
   * 1. JwtAuthGuard validates access token
   * 2. Extract user ID from token
   * 3. Verify current password is correct
   * 4. Validate new password meets requirements
   * 5. Hash new password
   * 6. Update password in database
   * 7. Optionally invalidate other sessions (force re-login)
   *
   * SECURITY: Requires current password verification,
   * password strength validation, session management,
   * audit logging, rate limiting recommended
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change user password',
    description: `Updates password for authenticated user. Requires current password for verification.
    Consider invalidating other active sessions after password change for security.`,
  })
  @ApiBody({ type: ChangePasswordRequestDto })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Password changed successfully. No content returned.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid authentication token or incorrect current password.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid password format or validation failed.',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'New password does not meet security requirements.',
  })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() changePasswordDto: ChangePasswordRequestDto,
  ): Promise<void> {
    try {
      this.logger.log(`Password change requested for user: ${userId}`);

      await this.authService.changePassword(
        userId,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );

      this.logger.log(`Password changed successfully for user: ${userId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Password change failed for user ${userId}: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
