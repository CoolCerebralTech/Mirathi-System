import { Injectable } from '@nestjs/common';
import {
  PasswordResetToken as PasswordResetTokenEntity,
  RefreshToken as RefreshTokenEntity,
} from '@prisma/client';
import {
  PasswordResetToken,
  RefreshToken,
  RefreshTokenProps,
} from '../../../3_domain/models/token.model';

/**
 * Persistence Mapper for Token entities.
 */
@Injectable()
export class TokenPersistenceMapper {
  // --- Password Reset Token Mappers ---

  toPasswordResetTokenDomain(entity: PasswordResetTokenEntity): PasswordResetToken {
    return PasswordResetToken.fromPersistence({
      id: entity.id,
      tokenHash: entity.tokenHash,
      userId: entity.userId,
      expiresAt: entity.expiresAt,
      isUsed: entity.used, // Note the name difference: `isUsed` vs `used`
      createdAt: entity.createdAt,
    });
  }

  toPasswordResetTokenPersistence(
    token: PasswordResetToken,
  ): Omit<PasswordResetTokenEntity, 'createdAt'> {
    return {
      id: token.id,
      tokenHash: token.tokenHash,
      userId: token.userId,
      expiresAt: token.expiresAt,
      used: token.isUsed,
    };
  }

  // --- Refresh Token Mappers ---

  toRefreshTokenDomain(entity: RefreshTokenEntity): RefreshToken {
    return RefreshToken.fromPersistence({
      id: entity.id,
      tokenHash: entity.tokenHash,
      userId: entity.userId,
      expiresAt: entity.expiresAt,
      isRevoked: false, // Prisma schema doesn't have `isRevoked`, so we assume false on load
      deviceId: entity.deviceId,
      createdAt: entity.createdAt,
    });
  }

  toRefreshTokenPersistence(
    token: RefreshToken | RefreshTokenProps,
  ): Omit<RefreshTokenEntity, 'createdAt'> {
    // Narrow the union: check if `id` exists
    if ('id' in token) {
      // Full RefreshToken case
      return {
        id: token.id,
        tokenHash: token.tokenHash,
        userId: token.userId,
        expiresAt: token.expiresAt,
        deviceId: token.deviceId ?? null,
      };
    }

    // Props case (no id yet, DB will generate it)
    return {
      // Prisma will auto-generate the id, so we don't provide one
      id: undefined as unknown as string,
      tokenHash: token.tokenHash,
      userId: token.userId,
      expiresAt: token.expiresAt,
      deviceId: token.deviceId ?? null,
    };
  }
}
