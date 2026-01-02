// src/application/services/oauth-auth.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';

import { User } from '../../domain/aggregates/user.aggregate';
import { OAUTH_FACTORY_PORT, OAuthFactoryPort } from '../../domain/ports/oauth-factory.port';
import { OAuthUserProfile } from '../../domain/ports/oauth-provider.port';
import { OAuthProviderException } from '../exceptions/user.exception';
import { UserService } from './user.service';

@Injectable()
export class OAuthAuthService {
  private readonly logger = new Logger(OAuthAuthService.name);

  constructor(
    @Inject(OAUTH_FACTORY_PORT)
    private readonly oauthFactory: OAuthFactoryPort,
    private readonly userService: UserService,
  ) {}

  getAuthorizationUrl(provider: string, redirectUri: string): string {
    const state = this.generateState();

    try {
      const adapter = this.oauthFactory.getAdapter(provider);
      return adapter.getAuthorizationUrl(state, redirectUri);
    } catch (error) {
      this.logger.error(`Failed to get authorization URL for ${provider}`, error);
      throw new OAuthProviderException(provider, 'Failed to generate authorization URL');
    }
  }

  /**
   * 🔥 FIXED: Handle both LOGIN and REGISTRATION
   */
  async handleOAuthCallback(data: {
    code: string;
    redirectUri: string;
    provider: string;
  }): Promise<{ user: User; isNewUser: boolean }> {
    const adapter = this.oauthFactory.getAdapter(data.provider);

    // 1. Exchange code for tokens
    let tokens;
    try {
      tokens = await adapter.exchangeCodeForToken(data.code, data.redirectUri);
    } catch (error) {
      this.logger.error(`Failed to exchange OAuth code for ${data.provider}`, error);
      throw new OAuthProviderException(data.provider, 'Failed to exchange authorization code');
    }

    // 2. Get user profile
    let profile: OAuthUserProfile;
    try {
      profile = await adapter.getUserProfile(tokens.access_token);
    } catch (error) {
      this.logger.error(`Failed to get user profile from ${data.provider}`, error);
      throw new OAuthProviderException(data.provider, 'Failed to fetch user profile');
    }

    // 3. ✅ FIX: Handle missing last name gracefully
    if (!profile.email) {
      throw new OAuthProviderException(data.provider, 'Email is required from OAuth provider');
    }

    // ✅ FIX: Provide fallback for missing last name
    const lastName = profile.lastName || profile.firstName || 'User';

    // 4. ✅ FIX: Check if user EXISTS first (LOGIN scenario)
    let existingUser: User | null = null;

    try {
      existingUser = await this.userService.getUserByEmail(profile.email);
    } catch {
      // User doesn't exist - will register below
      this.logger.debug(`User not found by email: ${profile.email}`);
    }

    // 5. ✅ FIX: If user exists, LOG THEM IN
    if (existingUser) {
      this.logger.log(`Existing user logging in via ${data.provider}: ${existingUser.id}`);

      // ✅ Update last used timestamp for this identity
      try {
        await this.userService.linkIdentity({
          userId: existingUser.id,
          provider: profile.provider,
          providerUserId: profile.providerUserId,
          email: profile.email,
        });
      } catch (error) {
        // Identity might already be linked - that's okay
        this.logger.debug(`Identity already linked or update failed: ${error.message}`);
      }

      return { user: existingUser, isNewUser: false };
    }

    // 6. ✅ FIX: User doesn't exist - REGISTER them
    let newUser: User;
    try {
      newUser = await this.userService.registerViaOAuth({
        provider: profile.provider,
        providerUserId: profile.providerUserId,
        email: profile.email,
        firstName: profile.firstName,
        lastName: lastName, // ✅ With fallback
      });

      this.logger.log(`New user registered via ${data.provider}: ${newUser.id}`);
      return { user: newUser, isNewUser: true };
    } catch (error) {
      this.logger.error(`Failed to register user via ${data.provider}`, error);
      throw error;
    }
  }

  async validateIdToken(idToken: string, provider: string): Promise<OAuthUserProfile> {
    try {
      const adapter = this.oauthFactory.getAdapter(provider);
      return await adapter.validateIdToken(idToken);
    } catch (error) {
      this.logger.error(`Failed to validate ID token for ${provider}`, error);
      throw new OAuthProviderException(provider, 'Invalid ID token');
    }
  }

  async refreshAccessToken(refreshToken: string, provider: string) {
    try {
      const adapter = this.oauthFactory.getAdapter(provider);
      return await adapter.refreshToken(refreshToken);
    } catch (error) {
      this.logger.error(`Failed to refresh token for ${provider}`, error);
      throw new OAuthProviderException(provider, 'Failed to refresh access token');
    }
  }

  async revokeToken(token: string, provider: string): Promise<void> {
    try {
      const adapter = this.oauthFactory.getAdapter(provider);
      await adapter.revokeToken(token);
      this.logger.log(`Token revoked for ${provider}`);
    } catch (error) {
      this.logger.warn(`Failed to revoke token for ${provider}: ${error.message}`);
    }
  }

  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }
}
