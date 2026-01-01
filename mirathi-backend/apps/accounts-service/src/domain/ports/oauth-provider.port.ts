// src/domain/ports/oauth-provider.port.ts

/**
 * OAuth token response
 */
export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
}

/**
 * OAuth user profile from provider
 */
export interface OAuthUserProfile {
  provider: string;
  providerUserId: string;
  email?: string;
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  picture?: string;
  locale?: string;
}

/**
 * OAuth provider port for external authentication
 * Abstract class for NestJS dependency injection (can be used as token)
 */
export abstract class OAuthProviderPort {
  /**
   * Get authorization URL for OAuth flow
   */
  abstract getAuthorizationUrl(state: string, redirectUri: string): string;

  /**
   * Exchange authorization code for tokens
   */
  abstract exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResponse>;

  /**
   * Get user profile from access token
   */
  abstract getUserProfile(accessToken: string): Promise<OAuthUserProfile>;

  /**
   * Validate ID token
   */
  abstract validateIdToken(idToken: string): Promise<OAuthUserProfile>;

  /**
   * Refresh access token
   */
  abstract refreshToken(refreshToken: string): Promise<OAuthTokenResponse>;

  /**
   * Revoke token
   */
  abstract revokeToken(token: string): Promise<void>;
}

/**
 * Injection token for OAuthProviderPort (for constructor injection)
 */
export const OAUTH_PROVIDER_PORT = 'OAUTH_PROVIDER_PORT';
