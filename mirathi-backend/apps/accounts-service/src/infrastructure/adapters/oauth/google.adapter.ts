// src/infrastructure/adapters/oauth/google.adapter.ts
import { Injectable, Logger } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

import {
  OAuthProviderPort,
  OAuthTokenResponse,
  OAuthUserProfile,
} from '../../../domain/ports/oauth-provider.port';

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
  hd?: string; // Hosted domain for G Suite users
}

interface GoogleTokenInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  [key: string]: any;
}

@Injectable()
export class GoogleOAuthAdapter implements OAuthProviderPort {
  private readonly logger = new Logger(GoogleOAuthAdapter.name);
  private client: OAuth2Client;
  private readonly scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  constructor() {
    this.validateConfig();
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  private validateConfig(): void {
    const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'];

    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing Google OAuth configuration: ${missing.join(', ')}`);
    }
  }

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const targetRedirectUri = redirectUri || process.env.GOOGLE_REDIRECT_URI!;

    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      state,
      redirect_uri: targetRedirectUri,
      prompt: 'consent', // Force consent to get refresh token
      include_granted_scopes: true,
    });
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    try {
      const targetRedirectUri = redirectUri || process.env.GOOGLE_REDIRECT_URI!;

      const { tokens } = await this.client.getToken({
        code,
        redirect_uri: targetRedirectUri,
      });

      if (!tokens.access_token) {
        throw new Error('No access token received from Google');
      }

      return {
        access_token: tokens.access_token,
        // FIX: Handle null | undefined explicitly
        refresh_token: tokens.refresh_token || undefined,
        token_type: tokens.token_type || 'Bearer',
        expires_in: tokens.expiry_date
          ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
          : 3600,
        // FIX: Handle null | undefined explicitly
        id_token: tokens.id_token || undefined,
      };
    } catch (error) {
      this.logger.error('Failed to exchange Google code for token', error);
      throw new Error(`Google OAuth token exchange failed: ${error.message}`);
    }
  }

  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    try {
      // Use Google's People API for better user info
      const userInfoResponse = await fetch(
        'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos,locales',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();

        // Safely extract data from Google's complex nested structure
        const resourceName = userInfo.resourceName as string | undefined;
        const emailObj = userInfo.emailAddresses?.[0];
        const nameObj = userInfo.names?.[0];
        const photoObj = userInfo.photos?.[0];
        const localeObj = userInfo.locales?.[0];

        return {
          provider: 'GOOGLE',
          providerUserId: resourceName?.replace('people/', '') || '',
          email: emailObj?.value,
          emailVerified: emailObj?.metadata?.verified || false,
          firstName: nameObj?.givenName,
          lastName: nameObj?.familyName,
          displayName: nameObj?.displayName,
          picture: photoObj?.url,
          locale: localeObj?.value,
        };
      }

      // Fallback to basic userinfo endpoint
      return await this.getBasicUserInfo(accessToken);
    } catch (error) {
      this.logger.error('Failed to get Google user profile', error);
      throw new Error(`Failed to get Google user profile: ${error.message}`);
    }
  }

  private async getBasicUserInfo(accessToken: string): Promise<OAuthUserProfile> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error(`Google userinfo request failed: ${response.status}`);
      }

      const userInfo: GoogleUserInfo = await response.json();

      return {
        provider: 'GOOGLE',
        providerUserId: userInfo.id,
        email: userInfo.email,
        emailVerified: userInfo.verified_email,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        displayName: userInfo.name,
        picture: userInfo.picture,
        locale: userInfo.locale,
      };
    } catch (error) {
      this.logger.error('Failed to get basic Google user info', error);
      throw error;
    }
  }

  async validateIdToken(idToken: string): Promise<OAuthUserProfile> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error('Invalid ID token - no payload');
      }

      if (!payload.sub) {
        throw new Error('Invalid ID token - no subject');
      }

      return {
        provider: 'GOOGLE',
        providerUserId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified || false,
        firstName: payload.given_name,
        lastName: payload.family_name,
        displayName: payload.name,
        picture: payload.picture,
        locale: payload.locale,
      };
    } catch (error) {
      this.logger.error('Failed to validate Google ID token', error);
      throw new Error(`Google ID token validation failed: ${error.message}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    try {
      this.client.setCredentials({ refresh_token: refreshToken });

      const { credentials } = await this.client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('No access token received from refresh');
      }

      return {
        access_token: credentials.access_token,
        // FIX: Handle null | undefined
        refresh_token: credentials.refresh_token || refreshToken,
        token_type: credentials.token_type || 'Bearer',
        expires_in: credentials.expiry_date
          ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
          : 3600,
        // FIX: Handle null | undefined
        id_token: credentials.id_token || undefined,
      };
    } catch (error) {
      this.logger.error('Failed to refresh Google token', error);
      throw new Error(`Google token refresh failed: ${error.message}`);
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      await this.client.revokeToken(token);
      this.logger.debug(`Successfully revoked Google token`);
    } catch (error: any) {
      // Don't throw on revoke failure - token might already be revoked or expired
      this.logger.warn(`Failed to revoke Google token: ${error.message}`);
    }
  }

  /**
   * Verify access token validity
   */
  async verifyAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`,
      );

      if (!response.ok) {
        return false;
      }

      const tokenInfo: GoogleTokenInfo = await response.json();

      // Check if token is for our client
      if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
        return false;
      }

      // Check if token has expired
      if (tokenInfo.exp && tokenInfo.exp < Math.floor(Date.now() / 1000)) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.warn('Failed to verify Google access token', error);
      return false;
    }
  }

  /**
   * Get user profile with offline access (for background processing)
   */
  async getUserProfileWithRefreshToken(refreshToken: string): Promise<OAuthUserProfile> {
    const tokens = await this.refreshToken(refreshToken);
    return this.getUserProfile(tokens.access_token);
  }
}
