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

  /**
   * Get OAuth authorization URL for frontend to redirect to
   */
  getAuthorizationUrl(provider: string, redirectUri: string): string {
    const state = this.generateState();

    try {
      // FIX: Resolve adapter dynamically
      const adapter = this.oauthFactory.getAdapter(provider);
      return adapter.getAuthorizationUrl(state, redirectUri);
    } catch (error) {
      this.logger.error(`Failed to get authorization URL for ${provider}`, error);
      throw new OAuthProviderException(provider, 'Failed to generate authorization URL');
    }
  }

  /**
   * Handle OAuth callback
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
      // UPDATE: Removed Apple-specific ID Token check.
      // Google standard flow uses the access token to fetch the profile.
      profile = await adapter.getUserProfile(tokens.access_token);
    } catch (error) {
      this.logger.error(`Failed to get user profile from ${data.provider}`, error);
      throw new OAuthProviderException(data.provider, 'Failed to fetch user profile');
    }

    // 3. Orchestrate User Registration/Linking via UserService
    let user: User;
    let isNewUser = false;

    try {
      if (!profile.email) throw new Error('Email required');

      user = await this.userService.getUserByEmail(profile.email);

      // User exists - link identity
      user = await this.userService.linkIdentity({
        userId: user.id,
        provider: profile.provider,
        providerUserId: profile.providerUserId,
        email: profile.email,
      });
    } catch {
      // Register new user
      user = await this.userService.registerViaOAuth({
        provider: profile.provider,
        providerUserId: profile.providerUserId,
        email: profile.email!,
        firstName: profile.firstName,
        lastName: profile.lastName,
      });
      isNewUser = true;
    }

    this.logger.log(
      `OAuth callback processed for ${data.provider}: ${user.id} (new: ${isNewUser})`,
    );

    return { user, isNewUser };
  }

  /**
   * Validate ID token (Mobile Apps)
   */
  async validateIdToken(idToken: string, provider: string): Promise<OAuthUserProfile> {
    try {
      const adapter = this.oauthFactory.getAdapter(provider);
      return await adapter.validateIdToken(idToken);
    } catch (error) {
      this.logger.error(`Failed to validate ID token for ${provider}`, error);
      throw new OAuthProviderException(provider, 'Invalid ID token');
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string, provider: string) {
    try {
      const adapter = this.oauthFactory.getAdapter(provider);
      return await adapter.refreshToken(refreshToken);
    } catch (error) {
      this.logger.error(`Failed to refresh token for ${provider}`, error);
      throw new OAuthProviderException(provider, 'Failed to refresh access token');
    }
  }

  /**
   * Revoke OAuth token
   */
  async revokeToken(token: string, provider: string): Promise<void> {
    try {
      const adapter = this.oauthFactory.getAdapter(provider);
      await adapter.revokeToken(token);
      this.logger.log(`Token revoked for ${provider}`);
    } catch (error) {
      // Log only, don't throw
      this.logger.warn(`Failed to revoke token for ${provider}: ${error.message}`);
    }
  }

  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }
}
