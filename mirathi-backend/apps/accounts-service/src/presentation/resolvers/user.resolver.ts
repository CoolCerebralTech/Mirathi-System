// src/presentation/resolvers/user.resolver.ts
import { Logger, UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';

import { UserService } from '../../application/services';
import { CurrentUser } from '../decorators';
import type { JwtPayload } from '../decorators';
import { UpdatePhoneInput, UpdateProfileInput, UpdateSettingsInput } from '../dtos/inputs';
import {
  NotificationCapabilitiesOutput,
  OnboardingStatusOutput,
  UserOutput,
} from '../dtos/outputs';
import { GqlAuthGuard } from '../guards';
import { UserPresenterMapper } from '../mappers';

/**
 * User Resolver
 *
 * Handles user-related operations:
 * - Profile management
 * - Settings management
 * - User queries
 */
@Resolver(() => UserOutput)
export class UserResolver {
  private readonly logger = new Logger(UserResolver.name);

  constructor(
    private readonly userService: UserService,
    private readonly userMapper: UserPresenterMapper,
  ) {}

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  /**
   * Get current authenticated user
   */
  @Query(() => UserOutput, {
    description: 'Get current authenticated user',
  })
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() currentUser: JwtPayload): Promise<UserOutput> {
    const user = await this.userService.getCurrentUser(currentUser.sub);
    return this.userMapper.toOutput(user);
  }

  /**
   * Get user by ID
   */
  @Query(() => UserOutput, {
    description: 'Get user by ID',
  })
  @UseGuards(GqlAuthGuard)
  async user(@Args('id', { type: () => ID }) id: string): Promise<UserOutput> {
    const user = await this.userService.getUserById(id);
    return this.userMapper.toOutput(user);
  }

  /**
   * Get user by email
   */
  @Query(() => UserOutput, {
    description: 'Get user by email',
  })
  @UseGuards(GqlAuthGuard)
  async userByEmail(@Args('email') email: string): Promise<UserOutput> {
    const user = await this.userService.getUserByEmail(email);
    return this.userMapper.toOutput(user);
  }

  /**
   * Get user by phone number
   */
  @Query(() => UserOutput, {
    description: 'Get user by phone number',
  })
  @UseGuards(GqlAuthGuard)
  async userByPhone(@Args('phoneNumber') phoneNumber: string): Promise<UserOutput> {
    const user = await this.userService.getUserByPhone(phoneNumber);
    return this.userMapper.toOutput(user);
  }

  /**
   * Check onboarding status
   */
  @Query(() => OnboardingStatusOutput, {
    description: 'Check onboarding status for current user',
  })
  @UseGuards(GqlAuthGuard)
  async onboardingStatus(@CurrentUser() currentUser: JwtPayload): Promise<OnboardingStatusOutput> {
    return await this.userService.checkOnboardingStatus(currentUser.sub);
  }

  /**
   * Check notification capabilities
   */
  @Query(() => NotificationCapabilitiesOutput, {
    description: 'Check what notification channels are available for current user',
  })
  @UseGuards(GqlAuthGuard)
  async notificationCapabilities(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<NotificationCapabilitiesOutput> {
    return await this.userService.canReceiveNotifications(currentUser.sub);
  }

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  /**
   * Update user profile
   */
  @Mutation(() => UserOutput, {
    description: 'Update user profile',
  })
  @UseGuards(GqlAuthGuard)
  async updateProfile(
    @Args('input') input: UpdateProfileInput,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<UserOutput> {
    this.logger.log(`Updating profile for user: ${currentUser.sub}`);

    const user = await this.userService.updateProfile({
      userId: currentUser.sub,
      ...input,
    });

    return this.userMapper.toOutput(user);
  }

  /**
   * Update phone number
   */
  @Mutation(() => UserOutput, {
    description: 'Update user phone number',
  })
  @UseGuards(GqlAuthGuard)
  async updatePhoneNumber(
    @Args('input') input: UpdatePhoneInput,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<UserOutput> {
    this.logger.log(`Updating phone number for user: ${currentUser.sub}`);

    const user = await this.userService.updatePhoneNumber(currentUser.sub, input.phoneNumber);
    return this.userMapper.toOutput(user);
  }

  /**
   * Update user settings
   */
  @Mutation(() => UserOutput, {
    description: 'Update user settings',
  })
  @UseGuards(GqlAuthGuard)
  async updateSettings(
    @Args('input') input: UpdateSettingsInput,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<UserOutput> {
    this.logger.log(`Updating settings for user: ${currentUser.sub}`);

    const user = await this.userService.updateSettings({
      userId: currentUser.sub,
      ...input,
    });

    return this.userMapper.toOutput(user);
  }
}
