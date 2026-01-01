// src/infrastructure/adapters/oauth/apple.adapter.ts
import { Injectable, Logger } from '@nestjs/common';
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

interface AppleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  error?: string;
}

@Injectable()
export class AppleOAuthAdapter implements OAuthProviderPort {
  private readonly logger = new Logger(AppleOAuthAdapter.name);
  private readonly teamId: string;
  private readonly clientId: string;
  private readonly keyId: string;
  private readonly privateKey: string;
  private readonly redirectUri: string;
  private readonly scopes = ['name', 'email'];

  constructor() {
    this.validateConfig();
    this.teamId = process.env.APPLE_TEAM_ID!;
    this.clientId = process.env.APPLE_CLIENT_ID!;
    this.keyId = process.env.APPLE_KEY_ID!;
    // Handle newlines in private key variable typically found in .env files
    this.privateKey = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n');
    this.redirectUri = process.env.APPLE_REDIRECT_URI!;
  }

  private validateConfig(): void {
    const required = [
      'APPLE_TEAM_ID',
      'APPLE_CLIENT_ID',
      'APPLE_KEY_ID',
      'APPLE_PRIVATE_KEY',
      'APPLE_REDIRECT_URI',
    ];

    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing Apple OAuth configuration: ${missing.join(', ')}`);
    }
  }

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      response_mode: 'form_post',
      client_id: this.clientId,
      redirect_uri: redirectUri || this.redirectUri,
      state,
      scope: this.scopes.join(' '),
    });

    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    try {
      const clientSecret = await this.generateClientSecret();
      const targetRedirectUri = redirectUri || this.redirectUri;

      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: targetRedirectUri,
      });

      this.logger.debug(`Exchanging Apple code for token at: ${targetRedirectUri}`);

      const response = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Apple token exchange failed: ${errorText}`);
        throw new Error(`Apple token exchange failed: ${response.status}`);
      }

      const data: AppleTokenResponse = await response.json();

      if (data.error) {
        throw new Error(`Apple OAuth error: ${data.error}`);
      }

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        id_token: data.id_token,
      };
    } catch (error) {
      this.logger.error('Failed to exchange Apple code for token', error);
      throw new Error(`Apple OAuth token exchange failed: ${error.message}`);
    }
  }

  // FIX: Removed async to resolve eslint "no await" error.
  // Returns a rejected promise to satisfy the interface contract.
  getUserProfile(_accessToken: string): Promise<OAuthUserProfile> {
    return Promise.reject(
      new Error(
        'Apple does not provide user info via access token. Use validateIdToken with ID token instead.',
      ),
    );
  }

  async validateIdToken(idToken: string): Promise<OAuthUserProfile> {
    try {
      // Get Apple's public keys
      const keysResponse = await fetch('https://appleid.apple.com/auth/keys');
      if (!keysResponse.ok) {
        throw new Error('Failed to fetch Apple public keys');
      }

      const { keys }: AppleKeysResponse = await keysResponse.json();

      // Decode header to get kid
      const tokenParts = idToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid ID token format');
      }

      const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString('utf-8'));

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

      // FIX: Runtime check for 'sub' to satisfy TypeScript (string | undefined -> string)
      if (!payload.sub) {
        throw new Error('ID token is missing the "sub" claim (providerUserId).');
      }

      // Apple provides email in the ID token, but name only in initial authorization
      return {
        provider: 'APPLE',
        providerUserId: payload.sub,
        email: payload.email as string | undefined,
        emailVerified: payload.email_verified === true,
        // Apple puts these in a custom claim sometimes, or usually just in the initial POST
        // We cast them safely, though often undefined in refresh flows
        firstName: payload.firstName as string | undefined,
        lastName: payload.lastName as string | undefined,
        displayName: payload.displayName as string | undefined,
      };
    } catch (error) {
      this.logger.error('Failed to validate Apple ID token', error);
      throw new Error(`Apple ID token validation failed: ${error.message}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    try {
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
        const errorText = await response.text();
        this.logger.error(`Apple token refresh failed: ${errorText}`);
        throw new Error(`Apple token refresh failed: ${response.status}`);
      }

      const data: AppleTokenResponse = await response.json();

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        id_token: data.id_token,
      };
    } catch (error) {
      this.logger.error('Failed to refresh Apple token', error);
      throw new Error(`Apple token refresh failed: ${error.message}`);
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
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
        this.logger.warn(`Failed to revoke Apple token: ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Failed to revoke Apple token', error);
      // Don't throw on revoke failure - it's not critical
    }
  }

  private async generateClientSecret(): Promise<string> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const expiration = now + 15777000; // 6 months in seconds

      const claims = {
        iss: this.teamId,
        iat: now,
        exp: expiration,
        aud: 'https://appleid.apple.com',
        sub: this.clientId,
      };

      const secret = await new SignJWT(claims)
        .setProtectedHeader({ alg: 'ES256', kid: this.keyId })
        .sign(crypto.createPrivateKey(this.privateKey));

      return secret;
    } catch (error) {
      this.logger.error('Failed to generate Apple client secret', error);
      throw new Error(`Failed to generate Apple client secret: ${error.message}`);
    }
  }

  /**
   * Parse user name from Apple's initial authorization response
   * Apple sends name only in the initial authorization response, not in ID token
   */
  parseNameFromAuthorization(user?: { name?: { firstName?: string; lastName?: string } }): {
    firstName?: string;
    lastName?: string;
  } {
    if (!user?.name) {
      return {};
    }

    return {
      firstName: user.name.firstName,
      lastName: user.name.lastName,
    };
  }

  /**
   * Extract user info from Apple's authorization response
   * This should be called when receiving the initial callback
   */
  extractUserInfoFromCallback(body: any): {
    user?: { name?: { firstName?: string; lastName?: string } };
    email?: string;
  } {
    return {
      user: body.user ? JSON.parse(body.user) : undefined,
      email: body.email,
    };
  }
}
