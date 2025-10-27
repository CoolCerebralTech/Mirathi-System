import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

/**
 * A custom error for parsing invalid time strings.
 */
export class InvalidExpiryFormatError extends Error {
  constructor(expiry: string) {
    super(`Invalid expiry format: "${expiry}". Expected format like "15m" or "7d".`);
    this.name = 'InvalidExpiryFormatError';
  }
}

/**
 * TokenService
 *
 * Provides centralized, secure methods for generating, hashing, and managing
 * lifecycles of various tokens (e.g., for password reset, email verification).
 * This is an application-level service.
 */
@Injectable()
export class TokenService {
  /**
   * Generates a secure random token and its corresponding SHA-256 hash.
   * @returns An object containing the plaintext token (to send to the user)
   *          and the hashed token (to store in the database).
   */
  public generateAndHashToken(): { token: string; hashedToken: string } {
    const token = randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(token);
    return { token, hashedToken };
  }

  /**
   * Hashes a token using SHA-256. This is a one-way, deterministic hash.
   * @param token The plaintext token to hash.
   */
  public hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Calculates an expiry date from a time string (e.g., "15m", "7d").
   * @param expiry A string representing the duration (e.g., "15m" for 15 minutes).
   * @throws InvalidExpiryFormatError if the format is invalid.
   */
  public calculateExpiryDate(expiry: string): Date {
    const seconds = this.parseExpiryToSeconds(expiry);
    return new Date(Date.now() + seconds * 1000);
  }

  /**
   * Generates token metadata for JWT authentication responses.
   */
  public generateTokenMetadata(
    accessTokenExpiry: string,
    refreshTokenExpiry: string,
  ): {
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
    issuedAt: Date;
  } {
    const accessSeconds = this.parseExpiryToSeconds(accessTokenExpiry);
    const refreshSeconds = this.parseExpiryToSeconds(refreshTokenExpiry);
    const issuedAt = new Date();

    return {
      accessTokenExpiresIn: accessSeconds,
      refreshTokenExpiresIn: refreshSeconds,
      accessTokenExpiresAt: new Date(issuedAt.getTime() + accessSeconds * 1000),
      refreshTokenExpiresAt: new Date(issuedAt.getTime() + refreshSeconds * 1000),
      issuedAt,
    };
  }

  /**
   * Parses a time string (e.g., "15m", "7d") into seconds.
   */
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new InvalidExpiryFormatError(expiry);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };

    return value * multipliers[unit];
  }
}
