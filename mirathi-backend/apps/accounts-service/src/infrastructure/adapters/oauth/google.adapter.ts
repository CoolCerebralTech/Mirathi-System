// src/infrastructure/adapters/oauth/google.adapter.ts
import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

import {
  OAuthProviderPort,
  OAuthTokenResponse,
  OAuthUserProfile,
} from '../../../domain/ports/oauth-provider.port';

@Injectable()
export class GoogleOAuthAdapter implements OAuthProviderPort {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  async getAuthorizationUrl(state: string, redirectUri: string): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      state,
      redirect_uri: redirectUri,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    const { tokens } = await this.client.getToken({
      code,
      redirect_uri: redirectUri,
    });

    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type!,
      expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
      id_token: tokens.id_token,
    };
  }

  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    // Using Google's tokeninfo endpoint for simplicity
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`,
    );
    const data = await response.json();

    // Alternatively, use people API for more details
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userInfo = await userInfoResponse.json();

    return {
      provider: 'GOOGLE',
      providerUserId: data.sub || userInfo.id,
      email: data.email || userInfo.email,
      emailVerified: data.email_verified || userInfo.verified_email || false,
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      displayName: userInfo.name,
      picture: userInfo.picture,
      locale: userInfo.locale,
    };
  }

  async validateIdToken(idToken: string): Promise<OAuthUserProfile> {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Invalid ID token');
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
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    this.client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await this.client.refreshAccessToken();

    return {
      access_token: credentials.access_token!,
      refresh_token: credentials.refresh_token || refreshToken,
      token_type: credentials.token_type!,
      expires_in: credentials.expiry_date
        ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
        : 3600,
      id_token: credentials.id_token,
    };
  }

  async revokeToken(token: string): Promise<void> {
    try {
      await this.client.revokeToken(token);
    } catch (error) {
      // Log but don't throw - token might already be revoked
      console.warn('Failed to revoke token:', error.message);
    }
  }
}
