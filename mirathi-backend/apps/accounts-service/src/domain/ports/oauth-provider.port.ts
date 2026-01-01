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
 */
export interface OAuthProviderPort {
  /**
   * Get authorization URL for OAuth flow
   */
  getAuthorizationUrl(state: string, redirectUri: string): string;

  /**
   * Exchange authorization code for tokens
   */
  exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResponse>;

  /**
   * Get user profile from access token
   */
  getUserProfile(accessToken: string): Promise<OAuthUserProfile>;

  /**
   * Validate ID token
   */
  validateIdToken(idToken: string): Promise<OAuthUserProfile>;

  /**
   * Refresh access token
   */
  refreshToken(refreshToken: string): Promise<OAuthTokenResponse>;

  /**
   * Revoke token
   */
  revokeToken(token: string): Promise<void>;
}
