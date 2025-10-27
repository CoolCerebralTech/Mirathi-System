import {
  Controller,
  Get,
  Patch,
  Body,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@shamba/auth';
import { Throttle } from '@nestjs/throttler';

// Application Layer
import { UserService } from '../../2_application/services/user.service';
import {
  UpdateMyUserDto,
  UpdateMyProfileDto,
  UpdateMarketingPreferencesDto,
  SendPhoneVerificationRequestDto,
  VerifyPhoneRequestDto,
  UserResponseDto,
  UpdateUserResponseDto,
  UpdateProfileResponseDto,
  UpdateMarketingPreferencesResponseDto,
  SendPhoneVerificationResponseDto,
  VerifyPhoneResponseDto,
  ChangeEmailRequestDto,
  ChangeEmailResponseDto,
} from '../../2_application/dtos/user.dto';

/**
 * UserController
 *
 * Handles user profile management endpoints for authenticated users.
 * All endpoints require JWT authentication.
 */
@ApiTags('User Profile')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ============================================================================
  // USER PROFILE
  // ============================================================================

  @Get('me')
  @ApiOperation({
    summary: 'Get my profile',
    description: 'Returns the current user profile with all details.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully.',
    type: UserResponseDto,
  })
  async getMyProfile(@CurrentUser('sub') userId: string): Promise<UserResponseDto> {
    return this.userService.getMyProfile(userId);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update my basic information',
    description: 'Updates first name and last name.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User information updated successfully.',
    type: UpdateUserResponseDto,
  })
  async updateMyUser(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateMyUserDto,
  ): Promise<UpdateUserResponseDto> {
    return this.userService.updateMyUser(userId, dto);
  }

  @Post('me/change-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes
  @ApiOperation({
    summary: 'Change email address',
    description:
      'Initiates email change. Requires password verification and new email verification.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent to new address.',
    type: ChangeEmailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Current password is incorrect.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already in use.',
  })
  async changeEmail(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangeEmailRequestDto,
  ): Promise<ChangeEmailResponseDto> {
    return this.userService.changeEmail(userId, dto);
  }

  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================

  @Patch('me/profile')
  @ApiOperation({
    summary: 'Update my profile',
    description: 'Updates bio, phone, address, and next of kin information.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully.',
    type: UpdateProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Phone number already in use.',
  })
  async updateMyProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateMyProfileDto,
  ): Promise<UpdateProfileResponseDto> {
    return this.userService.updateMyProfile(userId, dto);
  }

  @Patch('me/marketing-preferences')
  @ApiOperation({
    summary: 'Update marketing preferences',
    description: 'Opt in or out of marketing communications.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Marketing preferences updated successfully.',
    type: UpdateMarketingPreferencesResponseDto,
  })
  async updateMarketingPreferences(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateMarketingPreferencesDto,
  ): Promise<UpdateMarketingPreferencesResponseDto> {
    return this.userService.updateMarketingPreferences(userId, dto);
  }

  // ============================================================================
  // PHONE VERIFICATION
  // ============================================================================

  @Post('me/phone/send-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes
  @ApiOperation({
    summary: 'Send phone verification code',
    description: 'Sends a 6-digit verification code to the user phone via SMS.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification code sent successfully.',
    type: SendPhoneVerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Phone number not set or already verified.',
  })
  async sendPhoneVerification(
    @CurrentUser('sub') userId: string,
    @Body() dto: SendPhoneVerificationRequestDto,
  ): Promise<SendPhoneVerificationResponseDto> {
    return this.userService.sendPhoneVerification(userId, dto);
  }

  @Post('me/phone/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 requests per 5 minutes
  @ApiOperation({
    summary: 'Verify phone number',
    description: 'Verifies phone number with the 6-digit code sent via SMS.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Phone verified successfully.',
    type: VerifyPhoneResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid verification code or phone number.',
  })
  async verifyPhone(
    @CurrentUser('sub') userId: string,
    @Body() dto: VerifyPhoneRequestDto,
  ): Promise<VerifyPhoneResponseDto> {
    return this.userService.verifyPhone(userId, dto);
  }
}
