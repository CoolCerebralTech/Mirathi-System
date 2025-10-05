// ============================================================================
// auth.controller.ts - Authentication & Profile Management
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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
} from '@shamba/auth';
import { ProfileService } from '../services/profile.service';
import { UsersService } from '../services/users.service';
import { UserEntity, ProfileEntity } from '../entities/user.entity';

/**
 * AuthController - Public authentication endpoints and authenticated profile management
 * 
 * ENDPOINTS:
 * - POST /auth/register - User registration
 * - POST /auth/login - Email/password login
 * - POST /auth/refresh - Token refresh
 * - POST /auth/forgot-password - Initiate password reset
 * - POST /auth/reset-password - Complete password reset
 * - GET /profile - Get current user profile (authenticated)
 * - PATCH /profile - Update current user profile (authenticated)
 * - PATCH /profile/change-password - Change password (authenticated)
 */
@ApiTags('Auth & Profile')
@Controller()
@UseInterceptors(ClassSerializerInterceptor) // Apply globally to all endpoints
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly profileService: ProfileService,
    private readonly usersService: UsersService,
  ) {}

  // ========================================================================
  // AUTHENTICATION ENDPOINTS (Public)
  // ========================================================================

  /**
   * Register a new user account
   * Creates user + generates JWT tokens
   */
  @Public()
  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Creates a new user account and returns authentication tokens'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Email already registered' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid registration data' 
  })
  async register(@Body() registerDto: RegisterRequestDto): Promise<AuthResponseDto> {
    // AuthService.register internally calls UsersService.createUserForRegistration
    const result: AuthResult = await this.authService.register(registerDto);

    return {
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      user: new UserEntity(result.user),
    };
  }

  /**
   * Login with email and password
   * LocalAuthGuard validates credentials via Passport strategy
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticate with email and password to receive JWT tokens'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials' 
  })
  async login(@Req() req: any): Promise<AuthResponseDto> {
    // LocalAuthGuard populates req.user with validated user
    const user = req.user;

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
  }

  /**
   * Refresh access token using refresh token
   * RefreshTokenGuard validates refresh token
   */
  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: 'Obtain new access token using valid refresh token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid or expired refresh token' 
  })
  async refreshTokens(@Req() req: any): Promise<AuthResponseDto> {
    const userId = req.user.sub;

    // Generate new token pair
    const tokens = await this.authService.refreshTokens(userId);

    // Fetch fresh user data
    const user = await this.profileService.getProfile(userId);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: new UserEntity(user),
    };
  }

  /**
   * Initiate password reset flow
   * Sends reset email if user exists (security: same response for existing/non-existing)
   */
  @Public()
  @Post('auth/forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ 
    summary: 'Request password reset',
    description: 'Initiates password reset process by sending email with reset token'
  })
  @ApiResponse({ 
    status: 202, 
    description: 'Password reset email sent (if account exists)' 
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordRequestDto,
  ): Promise<{ message: string }> {
    await this.authService.initiatePasswordReset(forgotPasswordDto.email);

    // Generic response for security (don't reveal if email exists)
    return { 
      message: 'If a matching account was found, a password reset link has been sent to your email.' 
    };
  }

  /**
   * Complete password reset with token
   * Validates token and updates password
   */
  @Public()
  @Post('auth/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Reset password with token',
    description: 'Completes password reset using the token from email'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset successful' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid or expired token' 
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordRequestDto,
  ): Promise<{ message: string }> {
    await this.authService.finalizePasswordReset(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );

    return { 
      message: 'Your password has been successfully reset. You can now log in with your new password.' 
    };
  }

  // ========================================================================
  // AUTHENTICATED USER PROFILE ENDPOINTS
  // ========================================================================

  /**
   * Get current authenticated user's profile
   * Includes user details and profile data
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Retrieve profile information for the authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile retrieved successfully',
    type: UserEntity 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid or missing token' 
  })
  async getProfile(@CurrentUser('sub') userId: string): Promise<UserEntity> {
    const userWithProfile = await this.profileService.getProfile(userId);
    return new UserEntity(userWithProfile);
  }

  /**
   * Update current authenticated user's profile
   * Only updates profile fields (bio, phone, address, nextOfKin)
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Update current user profile',
    description: 'Update profile information (bio, phone number, address, next of kin)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile updated successfully',
    type: ProfileEntity 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid profile data' 
  })
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() profileData: UpdateUserProfileRequestDto,
  ): Promise<ProfileEntity> {
    const updatedProfile = await this.profileService.updateProfile(userId, profileData);
    return new ProfileEntity(updatedProfile);
  }

  /**
   * Change password for authenticated user
   * Requires current password for security
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Change password',
    description: 'Change password for the authenticated user (requires current password)'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Password changed successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized or incorrect current password' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid password format' 
  })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() changePasswordDto: ChangePasswordRequestDto,
  ): Promise<void> {
    await this.authService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }
}

