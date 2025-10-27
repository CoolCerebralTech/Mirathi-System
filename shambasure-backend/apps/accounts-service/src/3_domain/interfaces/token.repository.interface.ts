import { PasswordResetToken, RefreshTokenProps } from '../models/token.model';

/**
 * ITokenRepository (Port)
 *
 * Defines the contract for all token persistence operations, covering password
 * resets, email verifications, and session refresh tokens.
 */
export interface ITokenRepository {
  /**
   * Persists a new or updated password reset token.
   * @param token The PasswordResetToken domain object.
   */
  savePasswordResetToken(token: PasswordResetToken): Promise<void>;

  /**
   * Finds a password reset token by its un-hashed value's hash.
   * @param tokenHash The hashed version of the token.
   */
  findPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetToken | null>;

  /**
   * Persists a new refresh token.
   * @param token The RefreshToken data.
   */
  saveRefreshToken(token: RefreshTokenProps): Promise<void>;

  /**
   * Finds a refresh token by its un-hashed value's hash.
   * @param tokenHash The hashed version of the token.
   */
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenProps | null>;

  /**
   * Deletes a refresh token by its hash.
   * @param tokenHash The hashed version of the token.
   */
  deleteRefreshTokenByHash(tokenHash: string): Promise<void>;

  /**
   * Deletes all refresh tokens for a specific user.
   * Used for "logout from all devices".
   * @param userId The ID of the user.
   */
  deleteRefreshTokensByUserId(userId: string): Promise<void>;

  // A generic cleanup method is better than many specific ones.
  // The implementation can decide how to clean up different token types.
  /**
   * Deletes all expired tokens from the persistence layer.
   * This is a maintenance task that should be run periodically.
   * @returns The total number of tokens removed.
   */
  cleanupExpiredTokens(): Promise<number>;
}
