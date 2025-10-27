import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { ITokenRepository } from '../../../3_domain/interfaces/token.repository.interface';
import {
  PasswordResetToken,
  RefreshToken,
  RefreshTokenProps,
} from '../../../3_domain/models/token.model';
import { TokenPersistenceMapper } from '../mappers/token.mapper';

@Injectable()
export class PrismaTokenRepository implements ITokenRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: TokenPersistenceMapper,
  ) {}

  // ============================================================================
  // PASSWORD RESET TOKENS
  // ============================================================================

  async savePasswordResetToken(token: PasswordResetToken): Promise<void> {
    const persistenceData = this.mapper.toPasswordResetTokenPersistence(token);
    await this.prisma.passwordResetToken.upsert({
      where: { id: token.id },
      create: persistenceData,
      update: { used: token.isUsed },
    });
  }

  async findPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const entity = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    return entity ? this.mapper.toPasswordResetTokenDomain(entity) : null;
  }

  // ============================================================================
  // REFRESH TOKENS
  // ============================================================================

  async saveRefreshToken(token: RefreshToken | RefreshTokenProps): Promise<void> {
    const persistenceData = this.mapper.toRefreshTokenPersistence(token);
    // Since RefreshToken rotation involves revoking (deleting) and creating,
    // we don't use upsert. A simple create is sufficient.
    await this.prisma.refreshToken.create({
      data: persistenceData,
    });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    const entity = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    // Note: If the token is found, it is considered NOT revoked.
    // Revoked tokens are deleted in this implementation.
    return entity ? this.mapper.toRefreshTokenDomain(entity) : null;
  }

  async deleteRefreshTokenByHash(tokenHash: string): Promise<void> {
    // Using deleteMany because tokenHash is unique, but this prevents "not found" errors.
    await this.prisma.refreshToken.deleteMany({
      where: { tokenHash },
    });
  }

  async deleteRefreshTokensByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  // ============================================================================
  // MAINTENANCE
  // ============================================================================

  async cleanupExpiredTokens(): Promise<number> {
    const now = new Date();
    const [passwordResets, refreshTokens] = await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } }),
      this.prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
      // Add other token types here (e.g., EmailVerificationToken)
    ]);
    return passwordResets.count + refreshTokens.count;
  }
}
