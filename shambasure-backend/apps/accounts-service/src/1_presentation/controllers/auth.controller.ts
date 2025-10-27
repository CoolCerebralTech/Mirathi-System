import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@shamba/auth';
import { Throttle } from '@nestjs/throttler';

// Application Layer
import { AuthService } from '../../2_application/services/auth.service';
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
} from '../../2_application/dtos/auth.dto';

/**
 * AuthController
 *
 * Handles all authentication-related HTTP endpoints:
 * - Registration & Login
 * - Email verification
 * - Password management
 * - Token management
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ============================================================================
  // REGISTRATION & LOGIN
  // ============================================================================

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account and sends email verification.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully. Email verification sent.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed.',
  })
  async register(@Body() dto: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates user and returns JWT tokens.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Account locked or inactive.',
  })
  async login(@Body() dto: LoginRequestDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Exchanges refresh token for new access token (token rotation).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens refreshed successfully.',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token.',
  })
  async refreshTokens(@Body() dto: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshTokens(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
    description: 'Invalidates refresh token and ends session.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logged out successfully.',
    type: LogoutResponseDto,
  })
  async logout(
    @CurrentUser('sub') userId: string,
    @Body() dto: LogoutRequestDto,
  ): Promise<LogoutResponseDto> {
    return this.authService.logout(dto, userId);
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verifies user email with token sent via email.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully.',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token.',
  })
  async verifyEmail(@Body() dto: VerifyEmailRequestDto): Promise<VerifyEmailResponseDto> {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes
  @ApiOperation({
    summary: 'Resend email verification',
    description: 'Sends a new email verification link.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent.',
    type: ResendVerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Email already verified.',
  })
  async resendVerification(
    @Body() dto: ResendVerificationRequestDto,
  ): Promise<ResendVerificationResponseDto> {
    return this.authService.resendVerification(dto);
  }

  // ============================================================================
  // PASSWORD MANAGEMENT
  // ============================================================================

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes
  @ApiOperation({
    summary: 'Change password',
    description: 'Changes password for authenticated user. Requires current password.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully.',
    type: ChangePasswordResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Current password is incorrect.',
  })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordRequestDto,
  ): Promise<ChangePasswordResponseDto> {
    return this.authService.changePassword(userId, dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes
  @ApiOperation({
    summary: 'Forgot password',
    description: 'Initiates password reset flow. Sends reset link via email.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent (if account exists).',
    type: ForgotPasswordResponseDto,
  })
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto> {
    return this.authService.forgotPassword(dto);
  }

  @Post('validate-reset-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate password reset token',
    description: 'Checks if a password reset token is valid and not expired.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token validation result.',
    type: ValidateResetTokenResponseDto,
  })
  async validateResetToken(
    @Body() dto: ValidateResetTokenRequestDto,
  ): Promise<ValidateResetTokenResponseDto> {
    return this.authService.validateResetToken(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 requests per 5 minutes
  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets password using token from forgot password email.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully.',
    type: ResetPasswordResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token.',
  })
  async resetPassword(@Body() dto: ResetPasswordRequestDto): Promise<ResetPasswordResponseDto> {
    return this.authService.resetPassword(dto);
  }

  // ============================================================================
  // USER INFO (AUTHENTICATED)
  // ============================================================================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user info',
    description: 'Returns information about the currently authenticated user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user information.',
  })
  async getCurrentUser(@CurrentUser() user: any) {
    // Return user payload from JWT
    return user;
  }
}
