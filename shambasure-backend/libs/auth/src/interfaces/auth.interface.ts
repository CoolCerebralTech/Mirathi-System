import { UserRole } from '@prisma/client';

// ============================================================================
// ARCHITECTURAL NOTE:
// These interfaces define the core data contracts for the authentication and
// authorization domain. They are used in JWTs, service methods, and guards.
// ============================================================================

/**
 * Defines the shape of the data encoded within our JWT access tokens.
 * This is the "passport" that a user carries with each request.
 */
export interface JwtPayload {
  /** The subject of the token, which is the User's ID. (Standard JWT claim 'sub') */
  sub: string;
  /** The user's email address. */
  email: string;
  /** The user's role, used for authorization. */
  role: UserRole; // Correctly uses the new enum
  /** Issued At timestamp (Standard JWT claim 'iat'). */
  iat?: number;
  /** Expiration timestamp (Standard JWT claim 'exp'). */
  exp?: number;
}

/**
 * Defines the shape of the data encoded within our JWT refresh tokens.
 * It's simpler, only containing the user ID.
 */
export interface RefreshTokenPayload {
  /** The subject of the token, which is the User's ID. */
  sub: string;
}

/**
 * Represents the pair of tokens returned upon successful authentication.
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
