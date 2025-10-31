import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from '../../2_application/services/auth.service';
import { JwtAuthGuard, CurrentUser, type JwtPayload } from '@shamba/auth';
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
  AccountLockedResponseDto,
  RateLimitResponseDto,
} from '../../2_application/dtos/auth.dto';

/**
 * AuthController
 *
 * Handles all authentication and authorization HTTP endpoints:
 * - Registration & Login
 * - Email verification
 * - Password management
 * - Token refresh
 * - Email change
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==========================================================================
  // REGISTRATION & LOGIN
  // ==========================================================================

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user account',
    description: 'Creates a new user account and sends email verification link.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully. Email verification required.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or password requirements not met.',
  })
  async register(@Body() dto: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login to user account',
    description: 'Authenticate user and return access tokens.',
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
    description: 'Account is locked.',
    type: AccountLockedResponseDto,
  })
  @ApiHeader({
    name: 'X-Forwarded-For',
    description: 'Client IP address (for security logging)',
    required: false,
  })
  @ApiHeader({
    name: 'User-Agent',
    description: 'Client user agent (for device tracking)',
    required: false,
  })
  async login(@Body() dto: LoginRequestDto, @Req() req: Request): Promise<AuthResponseDto> {
    const ipAddress = this.extractIpAddress(req);
    const userAgent = req.headers['user-agent'];

    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from current or all sessions',
    description: 'Revokes refresh token(s) and terminates session(s).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful.',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  async logout(
    @Body() dto: LogoutRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<LogoutResponseDto> {
    return this.authService.logout(dto, user.sub);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Exchange refresh token for new access and refresh tokens (token rotation).',
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
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Rate limit exceeded.',
    type: RateLimitResponseDto,
  })
  async refreshToken(@Body() dto: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshToken(dto);
  }

  // ==========================================================================
  // EMAIL VERIFICATION
  // ==========================================================================

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Confirms email ownership and activates account.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully.',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired verification token.',
  })
  async verifyEmail(@Body() dto: VerifyEmailRequestDto): Promise<VerifyEmailResponseDto> {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend email verification link',
    description: 'Sends a new verification email to the user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent.',
    type: ResendVerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Email is already verified.',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many requests. Please wait before trying again.',
    type: RateLimitResponseDto,
  })
  async resendVerification(
    @Body() dto: ResendVerificationRequestDto,
  ): Promise<ResendVerificationResponseDto> {
    return this.authService.resendEmailVerification(dto);
  }

  // ==========================================================================
  // PASSWORD RESET
  // ==========================================================================

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Sends password reset link to user email (if account exists).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent (if account exists).',
    type: ForgotPasswordResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Rate limit exceeded.',
    type: RateLimitResponseDto,
  })
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto> {
    return this.authService.forgotPassword(dto);
  }

  @Get('validate-reset-token')
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
    @Query() dto: ValidateResetTokenRequestDto,
  ): Promise<ValidateResetTokenResponseDto> {
    return this.authService.validateResetToken(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Completes password reset using token from email.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully.',
    type: ResetPasswordResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired reset token, or password validation failed.',
  })
  async resetPassword(@Body() dto: ResetPasswordRequestDto): Promise<ResetPasswordResponseDto> {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password (authenticated)',
    description: 'Changes user password while logged in. Requires current password.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully.',
    type: ChangePasswordResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid access token or incorrect current password.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'New password does not meet requirements or was used recently.',
  })
  async changePassword(
    @Body() dto: ChangePasswordRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ChangePasswordResponseDto> {
    return this.authService.changePassword(dto, user.sub);
  }

  // ==========================================================================
  // EMAIL CHANGE
  // ==========================================================================

  @Post('request-email-change')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Request email address change',
    description: 'Initiates email change process. Sends verification to new email.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email change verification sent.',
    type: RequestEmailChangeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid access token or incorrect password.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'New email address is already in use.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Pending email change request already exists.',
  })
  async requestEmailChange(
    @Body() dto: RequestEmailChangeRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<RequestEmailChangeResponseDto> {
    return this.authService.requestEmailChange(dto, user.sub);
  }

  @Post('confirm-email-change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm email address change',
    description: 'Completes email change using verification token.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email address changed successfully.',
    type: ConfirmEmailChangeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired email change token.',
  })
  async confirmEmailChange(
    @Body() dto: ConfirmEmailChangeRequestDto,
  ): Promise<ConfirmEmailChangeResponseDto> {
    return this.authService.confirmEmailChange(dto);
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Extract client IP address from request
   * Handles X-Forwarded-For header for proxied requests
   */
  private extractIpAddress(req: Request): string | undefined {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress;
  }
}
