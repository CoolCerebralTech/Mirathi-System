// src/presentation/resolvers/auth.resolver.ts
import { Logger, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { OAuthAuthService, UserService } from '../../application/services';
import { CurrentUser, Public } from '../decorators';
import type { JwtPayload } from '../decorators';
import { OAuthCallbackInput } from '../dtos/inputs';
import { AuthResponseOutput, UserOutput } from '../dtos/outputs';
import { GqlAuthGuard } from '../guards';
import { UserPresenterMapper } from '../mappers';

/**
 * Auth Resolver
 *
 * Handles authentication-related operations:
 * - OAuth callbacks
 * - User registration
 * - Onboarding
 */
@Resolver()
export class AuthResolver {
  private readonly logger = new Logger(AuthResolver.name);

  constructor(
    private readonly oauthAuthService: OAuthAuthService,
    private readonly userService: UserService,
    private readonly userMapper: UserPresenterMapper,
  ) {}

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  /**
   * Handle OAuth callback (Google, Apple)
   * Public endpoint - no authentication required
   */
  @Mutation(() => AuthResponseOutput, {
    description: 'Handle OAuth callback from provider (Google, Apple)',
  })
  @Public()
  async handleOAuthCallback(@Args('input') input: OAuthCallbackInput): Promise<AuthResponseOutput> {
    this.logger.log(`OAuth callback received: ${input.provider}`);

    const { user, isNewUser } = await this.oauthAuthService.handleOAuthCallback({
      code: input.code,
      redirectUri: input.redirectUri,
      provider: input.provider,
    });

    const message = isNewUser
      ? 'Account created successfully. Please complete your profile.'
      : 'Welcome back!';

    return {
      user: this.userMapper.toOutput(user),
      isNewUser,
      message,
    };
  }

  /**
   * Complete user onboarding
   * Requires authentication
   */
  @Mutation(() => UserOutput, {
    description: 'Complete user onboarding process',
  })
  @UseGuards(GqlAuthGuard)
  async completeOnboarding(@CurrentUser() currentUser: JwtPayload): Promise<UserOutput> {
    this.logger.log(`Completing onboarding for user: ${currentUser.sub}`);

    const user = await this.userService.completeOnboarding(currentUser.sub);
    return this.userMapper.toOutput(user);
  }
}
