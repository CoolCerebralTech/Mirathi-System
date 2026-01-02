// src/application/services/oauth-auth.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';

import { User } from '../../domain/aggregates/user.aggregate';
import {
  OAUTH_PROVIDER_PORT,
  OAuthProviderPort,
  OAuthUserProfile,
} from '../../domain/ports/oauth-provider.port';
import { OAuthProviderException } from '../exceptions/user.exception';
import { UserService } from './user.service';

/**
 * OAuth Authentication Service
 *
 * Orchestrates OAuth flows with external providers (Google, Apple).
 * Handles token exchange, profile fetching, and user registration/login.
 */
@Injectable()
export class OAuthAuthService {
  private readonly logger = new Logger(OAuthAuthService.name);

  constructor(
    @Inject(OAUTH_PROVIDER_PORT)
    private readonly oauthProvider: OAuthProviderPort,
    private readonly userService: UserService,
  ) {}

  /**
   * Get OAuth authorization URL for frontend to redirect to
   */
  getAuthorizationUrl(provider: string, redirectUri: string): string {
    const state = this.generateState();

    try {
      return this.oauthProvider.getAuthorizationUrl(state, redirectUri);
    } catch (error) {
      this.logger.error(`Failed to get authorization URL for ${provider}`, error);
      throw new OAuthProviderException(provider, 'Failed to generate authorization URL');
    }
  }

  /**
   * Handle OAuth callback - exchange code for tokens and get user profile
   *
   * This is the main entry point after user returns from OAuth provider.
   * Flow:
   * 1. Exchange authorization code for access token
   * 2. Fetch user profile from provider
   * 3. Check if user exists
   * 4. Register new user OR link identity to existing user
   */
  async handleOAuthCallback(data: {
    code: string;
    redirectUri: string;
    provider: string;
  }): Promise<{ user: User; isNewUser: boolean }> {
    // 1. Exchange code for tokens
    let tokens;
    try {
      tokens = await this.oauthProvider.exchangeCodeForToken(data.code, data.redirectUri);
    } catch (error) {
      this.logger.error(`Failed to exchange OAuth code for ${data.provider}`, error);
      throw new OAuthProviderException(data.provider, 'Failed to exchange authorization code');
    }

    // 2. Get user profile from provider
    let profile: OAuthUserProfile;
    try {
      profile = await this.oauthProvider.getUserProfile(tokens.access_token);
    } catch (error) {
      this.logger.error(`Failed to get user profile from ${data.provider}`, error);
      throw new OAuthProviderException(data.provider, 'Failed to fetch user profile');
    }

    // 3. Check if user exists by email
    let user: User;
    let isNewUser = false;

    try {
      user = await this.userService.getUserByEmail(profile.email!);

      // User exists - link this identity if not already linked
      user = await this.userService.linkIdentity({
        userId: user.id,
        provider: profile.provider,
        providerUserId: profile.providerUserId,
        email: profile.email!,
      });
    } catch {
      // User doesn't exist - register new user
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
   * Validate ID token from OAuth provider
   * Used for mobile apps that get ID tokens directly
   */
  async validateIdToken(idToken: string, provider: string): Promise<OAuthUserProfile> {
    try {
      return await this.oauthProvider.validateIdToken(idToken);
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
      return await this.oauthProvider.refreshToken(refreshToken);
    } catch (error) {
      this.logger.error(`Failed to refresh token for ${provider}`, error);
      throw new OAuthProviderException(provider, 'Failed to refresh access token');
    }
  }

  /**
   * Revoke OAuth token (logout)
   */
  async revokeToken(token: string, provider: string): Promise<void> {
    try {
      await this.oauthProvider.revokeToken(token);
      this.logger.log(`Token revoked for ${provider}`);
    } catch (error) {
      this.logger.error(`Failed to revoke token for ${provider}`, error);
      // Don't throw - revocation failure shouldn't break logout
    }
  }

  /**
   * Generate random state for CSRF protection
   */
  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }
}
