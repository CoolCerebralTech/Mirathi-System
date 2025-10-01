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
import { UserEntity } from '../entities/user.entity';

@ApiTags('Auth & Profile')
@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly profileService: ProfileService,
  ) {}

  // --- Authentication Endpoints ---

  @Public()
  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(@Body() registerDto: RegisterRequestDto): Promise<AuthResponseDto> {
    const result: AuthResult = await this.authService.register(registerDto);

    return {
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      user: new UserEntity(result.user),
    };
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login with email and password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(@Req() req: any): Promise<AuthResponseDto> {
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

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtain a new access token using a refresh token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refreshTokens(@Req() req: any): Promise<AuthResponseDto> {
    const userId = req.user.sub;
    const tokens = await this.authService.refreshTokens(userId);
    const user = await this.profileService.getProfile(userId);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: new UserEntity(user),
    };
  }

  @Public()
  @Post('auth/forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Initiate the password reset process' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordRequestDto,
  ): Promise<{ message: string }> {
    await this.authService.initiatePasswordReset(forgotPasswordDto.email);
    return { message: 'If a matching account was found, a password reset link has been sent.' };
  }

  @Public()
  @Post('auth/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalize the password reset process with a token' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordRequestDto,
  ): Promise<{ message: string }> {
    await this.authService.finalizePasswordReset(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    return { message: 'Your password has been successfully reset.' };
  }

  // --- Authenticated User Profile Endpoints ---

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the profile of the currently authenticated user' })
  @ApiResponse({ status: 200, type: UserEntity })
  async getProfile(@CurrentUser('sub') userId: string): Promise<UserEntity> {
    const userWithProfile = await this.profileService.getProfile(userId);
    return new UserEntity(userWithProfile);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the profile of the currently authenticated user' })
  @ApiResponse({ status: 200, type: UserEntity })
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() profileData: UpdateUserProfileRequestDto,
  ): Promise<UserEntity> {
    const updated = await this.profileService.updateProfile(userId, profileData);
    return new UserEntity(updated);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the password for the currently authenticated user' })
  @ApiResponse({ status: 204 })
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
