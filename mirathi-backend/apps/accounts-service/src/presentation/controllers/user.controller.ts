import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser, JwtAuthGuard, type JwtPayload } from '@shamba/auth';

import {
  GetMyProfileResponseDto,
  RemoveAddressResponseDto,
  RemoveNextOfKinResponseDto,
  RemovePhoneNumberResponseDto,
  ResendPhoneVerificationResponseDto,
  SendPhoneVerificationRequestDto,
  SendPhoneVerificationResponseDto,
  UpdateMarketingPreferencesRequestDto,
  UpdateMarketingPreferencesResponseDto,
  UpdateMyProfileRequestDto,
  UpdateMyProfileResponseDto,
  VerifyPhoneRequestDto,
  VerifyPhoneResponseDto,
} from '../../application/dtos/profile.dto';
import {
  DeactivateMyAccountRequestDto,
  DeactivateMyAccountResponseDto,
  GetMyUserResponseDto,
  UpdateMyUserRequestDto,
  UpdateMyUserResponseDto,
} from '../../application/dtos/user.dto';
import { UserService } from '../../application/services/user.service';

/**
 * UserController
 *
 * Handles all user self-management HTTP endpoints:
 * - User information management
 * - Profile management
 * - Phone verification
 * - Marketing preferences
 * - Account deactivation
 *
 * All endpoints require JWT authentication.
 */
@ApiTags('Self Management')
@Controller('me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ==========================================================================
  // USER INFORMATION ENDPOINTS
  // ==========================================================================

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user information',
    description: "Returns authenticated user's account details.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User information retrieved successfully.',
    type: GetMyUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  async getMe(@CurrentUser() user: JwtPayload): Promise<GetMyUserResponseDto> {
    return this.userService.getMe(user.sub);
  }

  @Patch('/')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update current user information',
    description: "Updates authenticated user's first name and/or last name.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User information updated successfully.',
    type: UpdateMyUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async updateMe(
    @Body() dto: UpdateMyUserRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<UpdateMyUserResponseDto> {
    return this.userService.updateMe(user.sub, dto);
  }

  @Post('/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate own account',
    description: "Deactivates the authenticated user's account. Requires password verification.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account deactivated successfully.',
    type: DeactivateMyAccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid access token or incorrect password.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async deactivateMyAccount(
    @Body() dto: DeactivateMyAccountRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DeactivateMyAccountResponseDto> {
    return this.userService.deactivateMyAccount(user.sub, dto);
  }

  // ==========================================================================
  // PROFILE ENDPOINTS
  // ==========================================================================

  @Get('/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user profile',
    description: "Returns authenticated user's profile information (bio, phone, address, etc.).",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully.',
    type: GetMyProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User profile not found.',
  })
  async getMyProfile(@CurrentUser() user: JwtPayload): Promise<GetMyProfileResponseDto> {
    return this.userService.getMyProfile(user.sub);
  }

  @Patch('/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update current user profile',
    description: "Updates authenticated user's profile (bio, phone number, address, next of kin).",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully.',
    type: UpdateMyProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or phone number already in use.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User profile not found.',
  })
  async updateMyProfile(
    @Body() dto: UpdateMyProfileRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<UpdateMyProfileResponseDto> {
    return this.userService.updateMyProfile(user.sub, dto);
  }

  // ==========================================================================
  // PHONE VERIFICATION ENDPOINTS
  // ==========================================================================

  @Post('/phone/send-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send phone verification code',
    description: "Sends a 6-digit OTP to the user's phone number via SMS.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification code sent successfully.',
    type: SendPhoneVerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No phone number found or phone number already in use.',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'OTP was recently sent. Please wait before requesting a new one.',
  })
  async sendPhoneVerification(
    @Body() dto: SendPhoneVerificationRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SendPhoneVerificationResponseDto> {
    return this.userService.sendPhoneVerification(user.sub, dto);
  }

  @Post('/phone/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify phone number with OTP',
    description: 'Verifies phone number using the 6-digit code sent via SMS.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Phone number verified successfully.',
    type: VerifyPhoneResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid OTP code, expired OTP, or maximum attempts exceeded.',
  })
  async verifyPhone(
    @Body() dto: VerifyPhoneRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<VerifyPhoneResponseDto> {
    return this.userService.verifyPhone(user.sub, dto);
  }

  @Post('/phone/resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend phone verification code',
    description: "Resends the 6-digit OTP to the user's phone number.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification code resent successfully.',
    type: ResendPhoneVerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No phone number found or phone already verified.',
  })
  async resendPhoneVerification(
    @CurrentUser() user: JwtPayload,
  ): Promise<ResendPhoneVerificationResponseDto> {
    return this.userService.resendPhoneVerification(user.sub);
  }

  @Delete('/phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove phone number from profile',
    description: 'Removes the phone number and resets verification status.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Phone number removed successfully.',
    type: RemovePhoneNumberResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No phone number to remove.',
  })
  async removePhoneNumber(@CurrentUser() user: JwtPayload): Promise<RemovePhoneNumberResponseDto> {
    return this.userService.removePhoneNumber(user.sub);
  }

  // ==========================================================================
  // MARKETING PREFERENCES ENDPOINTS
  // ==========================================================================

  @Patch('/marketing-preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update marketing preferences',
    description: 'Opt-in or opt-out of marketing communications (GDPR compliant).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Marketing preferences updated successfully.',
    type: UpdateMarketingPreferencesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User profile not found.',
  })
  async updateMarketingPreferences(
    @Body() dto: UpdateMarketingPreferencesRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<UpdateMarketingPreferencesResponseDto> {
    return this.userService.updateMarketingPreferences(user.sub, dto);
  }

  // ==========================================================================
  // PROFILE DATA REMOVAL ENDPOINTS
  // ==========================================================================

  @Delete('/address')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove address from profile',
    description: 'Removes the residential address from user profile.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Address removed successfully.',
    type: RemoveAddressResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No address to remove.',
  })
  async removeAddress(@CurrentUser() user: JwtPayload): Promise<RemoveAddressResponseDto> {
    return this.userService.removeAddress(user.sub);
  }

  @Delete('/next-of-kin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove next of kin from profile',
    description: 'Removes the next of kin information from user profile.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Next of kin information removed successfully.',
    type: RemoveNextOfKinResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No next of kin information to remove.',
  })
  async removeNextOfKin(@CurrentUser() user: JwtPayload): Promise<RemoveNextOfKinResponseDto> {
    return this.userService.removeNextOfKin(user.sub);
  }
}
