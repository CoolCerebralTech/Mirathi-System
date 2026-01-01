// src/domain/ports/token-generator.port.ts

/**
 * Token payload for JWT
 */
export interface TokenPayload {
  sub: string; // user id
  email: string;
  role: string;
  permissions?: string[];
}

/**
 * Token generator port for JWT and refresh tokens
 */
export abstract class TokenGeneratorPort {
  /**
   * Generate access token
   */
  abstract generateAccessToken(payload: TokenPayload): Promise<string>;

  /**
   * Generate refresh token
   */
  abstract generateRefreshToken(payload: TokenPayload): Promise<string>;

  /**
   * Verify access token
   */
  abstract verifyAccessToken(token: string): Promise<TokenPayload>;

  /**
   * Verify refresh token
   */
  abstract verifyRefreshToken(token: string): Promise<TokenPayload>;

  /**
   * Decode token without verification (for inspection)
   */
  abstract decodeToken(token: string): Promise<TokenPayload | null>;
}

/**
 * Injection token for TokenGeneratorPort
 */
export const TOKEN_GENERATOR_PORT = 'TOKEN_GENERATOR_PORT';
