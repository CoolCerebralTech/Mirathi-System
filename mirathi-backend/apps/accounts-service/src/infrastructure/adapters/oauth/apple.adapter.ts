// src/infrastructure/adapters/oauth/apple.adapter.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';

import {
  OAuthProviderPort,
  OAuthTokenResponse,
  OAuthUserProfile,
} from '../../../domain/ports/oauth-provider.port';

interface AppleKeysResponse {
  keys: Array<{
    kty: string;
    kid: string;
    use: string;
    alg: string;
    n: string;
    e: string;
  }>;
}

@Injectable()
export class AppleOAuthAdapter implements OAuthProviderPort {
  private readonly teamId: string;
  private readonly clientId: string;
  private readonly keyId: string;
  private readonly privateKey: string;
  private readonly redirectUri: string;

  constructor() {
    this.teamId = process.env.APPLE_TEAM_ID!;
    this.clientId = process.env.APPLE_CLIENT_ID!;
    this.keyId = process.env.APPLE_KEY_ID!;
    this.privateKey = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n');
    this.redirectUri = process.env.APPLE_REDIRECT_URI!;
  }

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      response_mode: 'form_post',
      client_id: this.clientId,
      redirect_uri: redirectUri || this.redirectUri,
      state,
      scope: 'name email',
    });

    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    const clientSecret = await this.generateClientSecret();

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri || this.redirectUri,
    });

    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Apple token exchange failed: ${error}`);
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      id_token: data.id_token,
    };
  }

  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    // Apple doesn't provide a userinfo endpoint with access token
    // We need to decode the ID token instead
    throw new Error('Use validateIdToken method for Apple OAuth');
  }

  async validateIdToken(idToken: string): Promise<OAuthUserProfile> {
    // Get Apple's public keys
    const keysResponse = await fetch('https://appleid.apple.com/auth/keys');
    const { keys }: AppleKeysResponse = await keysResponse.json();

    // Decode header to get kid
    const header = JSON.parse(Buffer.from(idToken.split('.')[0], 'base64').toString());

    // Find the matching key
    const key = keys.find((k) => k.kid === header.kid);
    if (!key) {
      throw new Error('No matching key found for ID token');
    }

    // Convert JWK to PEM
    const publicKey = crypto.createPublicKey({
      key: {
        kty: key.kty,
        n: key.n,
        e: key.e,
      },
      format: 'jwk',
    });

    // Verify the token
    const { payload } = await jwtVerify(idToken, publicKey, {
      issuer: 'https://appleid.apple.com',
      audience: this.clientId,
    });

    // Apple provides email in the ID token, but name only in initial authorization
    // We need to store name from initial request
    return {
      provider: 'APPLE',
      providerUserId: payload.sub,
      email: payload.email as string,
      emailVerified: payload.email_verified === 'true',
      firstName: '', // Will be populated from initial request
      lastName: '', // Will be populated from initial request
      displayName: '', // Will be populated from initial request
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const clientSecret = await this.generateClientSecret();

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Apple token refresh failed: ${error}`);
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      id_token: data.id_token,
    };
  }

  async revokeToken(token: string): Promise<void> {
    const clientSecret = await this.generateClientSecret();

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: clientSecret,
      token,
      token_type_hint: 'refresh_token',
    });

    const response = await fetch('https://appleid.apple.com/auth/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      console.warn('Failed to revoke Apple token:', await response.text());
    }
  }

  private async generateClientSecret(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    const claims = {
      iss: this.teamId,
      iat: now,
      exp: now + 15777000, // 6 months in seconds
      aud: 'https://appleid.apple.com',
      sub: this.clientId,
    };

    const secret = await new SignJWT(claims)
      .setProtectedHeader({ alg: 'ES256', kid: this.keyId })
      .sign(crypto.createPrivateKey(this.privateKey));

    return secret;
  }

  /**
   * Apple-specific method to parse user name from initial authorization
   * Apple sends name only in the initial authorization response
   */
  parseNameFromAuthorization(user: any): { firstName: string; lastName: string } {
    if (!user || !user.name) {
      return { firstName: '', lastName: '' };
    }

    return {
      firstName: user.name.firstName || '',
      lastName: user.name.lastName || '',
    };
  }
}
