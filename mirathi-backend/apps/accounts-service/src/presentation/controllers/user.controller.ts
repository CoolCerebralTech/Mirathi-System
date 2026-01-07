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
  UpdateMarketingPreferencesRequestDto,
  UpdateMarketingPreferencesResponseDto,
  UpdateMyProfileRequestDto,
  UpdateMyProfileResponseDto,
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
    description: "Returns authenticated user's profile information (phone, address, etc.).",
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
    description: "Updates authenticated user's profile (phone number, address).",
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
}
