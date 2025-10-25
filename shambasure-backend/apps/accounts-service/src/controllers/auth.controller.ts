import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Patch,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import {
  RegisterRequestDto,
  LoginRequestDto,
  ChangePasswordRequestDto,
  ResetPasswordRequestDto,
  ForgotPasswordRequestDto,
  RefreshTokenRequestDto,
  LogoutRequestDto,
  ValidateResetTokenRequestDto,
  AuthResponseDto,
  RefreshTokenResponseDto,
  ForgotPasswordResponseDto,
  ValidateResetTokenResponseDto,
  LogoutResponseDto,
  ChangePasswordResponseDto,
  ResetPasswordResponseDto,
  UpdateMyUserDto,
  UpdateMyProfileDto,
  UpdateUserResponseDto,
  UpdateProfileResponseDto,
  VerifyEmailRequestDto,
  ResendVerificationRequestDto,
  VerifyEmailResponseDto,
  ResendVerificationResponseDto,
} from '@shamba/common';
import { Public, CurrentUser, JwtAuthGuard, LocalAuthGuard } from '@shamba/auth';
import { AuthService } from '../services/auth.service';
import { AccountsService } from '../services/accounts.service';
import { UserEntity } from '../entities/user.entity';
import type { UserWithProfile } from '@shamba/auth';

@ApiTags('Authentication')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accountsService: AccountsService,
  ) {}

  // ============================================================================
  // PUBLIC AUTHENTICATION ENDPOINTS
  // ============================================================================

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or terms not accepted',
  })
  async register(@Body() dto: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or account locked',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Account deactivated',
  })
  async login(
    @CurrentUser() user: UserWithProfile,
    @Body() dto: LoginRequestDto,
  ): Promise<AuthResponseDto> {
    // The user object is now trusted. We just need to log them in.
    return this.authService.login(user, dto.deviceId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshTokenRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
  })
  async refreshTokens(@Body() dto: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiBearerAuth()
  @ApiBody({ type: LogoutRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful',
    type: LogoutResponseDto,
  })
  async logout(@Body() dto: LogoutRequestDto): Promise<LogoutResponseDto> {
    return this.authService.logout(dto.refreshToken);
  }

  // ============================================================================
  // EMAIL VERIFICATION ENDPOINTS
  // ============================================================================

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address using verification token' })
  @ApiBody({ type: VerifyEmailRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired verification token',
  })
  async verifyEmail(@Body() dto: VerifyEmailRequestDto): Promise<VerifyEmailResponseDto> {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiBody({ type: ResendVerificationRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent if account exists and not verified',
    type: ResendVerificationResponseDto,
  })
  async resendVerification(
    @Body() dto: ResendVerificationRequestDto,
  ): Promise<ResendVerificationResponseDto> {
    return this.authService.resendVerification(dto);
  }

  // ============================================================================
  // PASSWORD MANAGEMENT
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiBearerAuth()
  @ApiBody({ type: ChangePasswordRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
    type: ChangePasswordResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Current password is incorrect',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordRequestDto,
  ): Promise<ChangePasswordResponseDto> {
    return this.authService.changePassword(userId, dto);
  }

  @Public()
  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiBody({ type: ForgotPasswordRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset link sent if account exists',
    type: ForgotPasswordResponseDto,
  })
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto> {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('password/validate-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate password reset token' })
  @ApiBody({ type: ValidateResetTokenRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token validation result',
    type: ValidateResetTokenResponseDto,
  })
  async validateResetToken(
    @Body() dto: ValidateResetTokenRequestDto,
  ): Promise<ValidateResetTokenResponseDto> {
    return this.authService.validateResetToken(dto.token);
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using reset token' })
  @ApiBody({ type: ResetPasswordRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
    type: ResetPasswordResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid, expired, or used reset token',
  })
  async resetPassword(@Body() dto: ResetPasswordRequestDto): Promise<ResetPasswordResponseDto> {
    return this.authService.resetPassword(dto);
  }

  // ============================================================================
  // AUTHENTICATED USER PROFILE
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get current authenticated user profile',
    description: 'Returns complete user profile with sensitive fields excluded',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found or account deactivated',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired access token',
  })
  @ApiResponse({ status: HttpStatus.OK, type: UserEntity }) // Swagger should return the Entity
  async getMyProfile(@CurrentUser('sub') userId: string): Promise<UserEntity> {
    // 1. Get the raw data from the service.
    const userWithProfile = await this.accountsService.findActiveUserWithProfile(userId);
    // 2. Wrap it in the entity to be serialized correctly.
    return new UserEntity(userWithProfile);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({
    summary: 'Update current user basic information',
    description: 'Update firstName, lastName, or email. Email changes may require re-verification.',
  })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateMyUserDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User information updated successfully',
    type: UpdateUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already in use by another account',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async updateMyUser(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateMyUserDto,
  ): Promise<UpdateUserResponseDto> {
    return this.accountsService.updateMyUser(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  @ApiOperation({
    summary: 'Update current user profile details',
    description: 'Update bio, phone number, address, or next of kin information',
  })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateMyProfileDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
    type: UpdateProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async updateMyProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateMyProfileDto,
  ): Promise<UpdateProfileResponseDto> {
    return this.accountsService.updateMyProfile(userId, dto);
  }

  // ============================================================================
  // ACCOUNT STATUS ENDPOINTS
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Get('me/status')
  @ApiOperation({
    summary: 'Get current user account status',
    description: 'Returns account status including verification status and active state',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account status retrieved',
    type: Object,
  })
  async getAccountStatus(@CurrentUser('sub') userId: string): Promise<{
    isActive: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    lastLoginAt?: Date | null;
    loginAttempts: number;
  }> {
    const userWithProfile = await this.accountsService.findActiveUserWithProfile(userId);
    return {
      isActive: userWithProfile.isActive,
      emailVerified: userWithProfile.profile?.emailVerified ?? false,
      phoneVerified: userWithProfile.profile?.phoneVerified ?? false,
      lastLoginAt: userWithProfile.lastLoginAt,
      loginAttempts: userWithProfile.loginAttempts,
    };
  }
}
