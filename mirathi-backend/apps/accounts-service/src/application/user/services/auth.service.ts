// src/application/user/services/auth.service.ts
import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { OAuthProviderPort } from '../../../domain/ports/oauth-provider.port';
import { UserRepositoryPort } from '../../../domain/ports/user.repository.port';
import { LinkIdentityCommand } from '../commands/link-identity.command';
import { RegisterUserCommand } from '../commands/register-user.command';

export interface OAuthCallbackResult {
  user: any; // Will be replaced with proper DTO in presentation layer
  isNewUser: boolean;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly userRepository: UserRepositoryPort,
    private readonly oauthProvider: OAuthProviderPort,
  ) {}

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(provider: string, redirectUri: string): string {
    const state = this.generateState();
    return this.oauthProvider.getAuthorizationUrl(state, redirectUri);
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(
    provider: string,
    code: string,
    redirectUri: string,
  ): Promise<OAuthCallbackResult> {
    // 1. Exchange code for tokens
    const tokens = await this.oauthProvider.exchangeCodeForToken(code, redirectUri);

    // 2. Get user profile from provider
    const userProfile = await this.oauthProvider.getUserProfile(tokens.access_token);

    // 3. Check if user exists
    let user = await this.userRepository.findByProviderIdentity(
      provider,
      userProfile.providerUserId,
    );

    let isNewUser = false;

    if (!user) {
      // 4. Register new user
      user = await this.commandBus.execute(
        new RegisterUserCommand({
          provider,
          providerUserId: userProfile.providerUserId,
          email: userProfile.email,
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
        }),
      );
      isNewUser = true;
    } else {
      // 5. Link identity if not already linked
      await this.commandBus.execute(
        new LinkIdentityCommand({
          userId: user.id,
          provider,
          providerUserId: userProfile.providerUserId,
          email: userProfile.email,
        }),
      );
    }

    // 6. Generate application tokens (JWT)
    const { accessToken, refreshToken } = this.generateTokens(user.id);

    return {
      user: this.mapUserToResponse(user),
      isNewUser,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Validate refresh token
    const userId = this.validateRefreshToken(refreshToken);

    // Generate new tokens
    return this.generateTokens(userId);
  }

  /**
   * Revoke tokens
   */
  async revokeTokens(userId: string, tokenIds: string[]): Promise<void> {
    // Implementation would revoke specific tokens
    // This is handled by infrastructure layer
  }

  // Private helper methods
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private generateTokens(userId: string): { accessToken: string; refreshToken: string } {
    // Implementation uses auth library
    // This is just a placeholder
    return {
      accessToken: `access_token_${userId}_${Date.now()}`,
      refreshToken: `refresh_token_${userId}_${Date.now()}`,
    };
  }

  private validateRefreshToken(refreshToken: string): string {
    // Implementation uses auth library
    // Extract userId from token
    return refreshToken.split('_')[2]; // Simplified
  }

  private mapUserToResponse(user: any): any {
    // Simple mapping for now
    // Will be replaced with proper mapper in presentation layer
    return {
      id: user.id,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
    };
  }
}
