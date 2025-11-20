import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import {
  IPasswordResetTokenRepository,
  IEmailVerificationTokenRepository,
  IPhoneVerificationTokenRepository,
  IEmailChangeTokenRepository,
  IRefreshTokenRepository,
  ILoginSessionRepository,
  IPasswordHistoryRepository,
  SessionStats,
  PasswordHistory,
} from '../../../domain/interfaces';
import {
  PasswordResetToken,
  EmailVerificationToken,
  PhoneVerificationToken,
  EmailChangeToken,
  RefreshToken,
  LoginSession,
} from '../../../domain/models/token.model';
import {
  PasswordResetTokenMapper,
  EmailVerificationTokenMapper,
  PhoneVerificationTokenMapper,
  EmailChangeTokenMapper,
  RefreshTokenMapper,
  LoginSessionMapper,
  PasswordHistoryMapper,
} from '../mappers';

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

export class TokenRepositoryError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'TokenRepositoryError';
  }
}

export class TokenNotFoundError extends TokenRepositoryError {
  constructor(tokenId: string, tokenType: string) {
    super(`${tokenType} not found: ${tokenId}`);
    this.name = 'TokenNotFoundError';
  }
}

export class TokenAlreadyExistsError extends TokenRepositoryError {
  constructor(tokenId: string, tokenType: string) {
    super(`${tokenType} already exists: ${tokenId}`);
    this.name = 'TokenAlreadyExistsError';
  }
}

// ============================================================================
// PASSWORD RESET TOKEN REPOSITORY
// ============================================================================

@Injectable()
export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  private readonly logger = new Logger(PrismaPasswordResetTokenRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: PasswordResetTokenMapper,
  ) {}

  async save(token: PasswordResetToken): Promise<void> {
    try {
      const createData = this.mapper.toCreatePersistence(token);
      const updateData = this.mapper.toUpdatePersistence(token);

      await this.prisma.passwordResetToken.upsert({
        where: { id: token.id },
        create: createData,
        update: updateData,
      });

      this.logger.debug(`Successfully saved password reset token: ${token.id}`);
    } catch (error) {
      this.logger.error(`Failed to save password reset token: ${token.id}`, error);
      throw new TokenRepositoryError(`Failed to save password reset token: ${token.id}`, error);
    }
  }

  async findById(id: string): Promise<PasswordResetToken | null> {
    try {
      const entity = await this.prisma.passwordResetToken.findUnique({ where: { id } });

      if (!entity) {
        this.logger.debug(`Password reset token not found by ID: ${id}`);
        return null;
      }

      const token = this.mapper.toDomain(entity);
      this.logger.debug(`Successfully found password reset token by ID: ${id}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to find password reset token by ID: ${id}`, error);
      throw new TokenRepositoryError(`Failed to find password reset token by ID: ${id}`, error);
    }
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    try {
      const entity = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

      if (!entity) {
        this.logger.debug(
          `Password reset token not found by hash: ${tokenHash.substring(0, 8)}...`,
        );
        return null;
      }

      const token = this.mapper.toDomain(entity);
      this.logger.debug(
        `Successfully found password reset token by hash: ${tokenHash.substring(0, 8)}...`,
      );
      return token;
    } catch (error) {
      this.logger.error(
        `Failed to find password reset token by hash: ${tokenHash.substring(0, 8)}...`,
        error,
      );
      throw new TokenRepositoryError(`Failed to find password reset token by hash`, error);
    }
  }

  async findByUserId(userId: string): Promise<PasswordResetToken[]> {
    try {
      const entities = await this.prisma.passwordResetToken.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const tokens = entities.map((e) => this.mapper.toDomain(e));
      this.logger.debug(`Found ${tokens.length} password reset tokens for user: ${userId}`);
      return tokens;
    } catch (error) {
      this.logger.error(`Failed to find password reset tokens by user ID: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to find password reset tokens by user ID: ${userId}`,
        error,
      );
    }
  }

  async findActiveByUserId(userId: string): Promise<PasswordResetToken | null> {
    try {
      const now = new Date();
      const entity = await this.prisma.passwordResetToken.findFirst({
        where: {
          userId,
          used: false,
          expiresAt: { gte: now },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!entity) {
        this.logger.debug(`No active password reset token found for user: ${userId}`);
        return null;
      }

      const token = this.mapper.toDomain(entity);
      this.logger.debug(`Found active password reset token for user: ${userId}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to find active password reset token for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to find active password reset token for user: ${userId}`,
        error,
      );
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    try {
      const result = await this.prisma.passwordResetToken.deleteMany({ where: { userId } });
      this.logger.debug(`Deleted ${result.count} password reset tokens for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete password reset tokens for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to delete password reset tokens for user: ${userId}`,
        error,
      );
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const result = await this.prisma.passwordResetToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      this.logger.debug(`Deleted ${result.count} expired password reset tokens`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to delete expired password reset tokens', error);
      throw new TokenRepositoryError('Failed to delete expired password reset tokens', error);
    }
  }

  async deleteUsed(): Promise<number> {
    try {
      const result = await this.prisma.passwordResetToken.deleteMany({
        where: { used: true },
      });
      this.logger.debug(`Deleted ${result.count} used password reset tokens`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to delete used password reset tokens', error);
      throw new TokenRepositoryError('Failed to delete used password reset tokens', error);
    }
  }

  async countByUserId(userId: string): Promise<number> {
    try {
      const count = await this.prisma.passwordResetToken.count({ where: { userId } });
      this.logger.debug(`Counted ${count} password reset tokens for user: ${userId}`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to count password reset tokens for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to count password reset tokens for user: ${userId}`,
        error,
      );
    }
  }

  async cleanupUserTokens(userId: string, keepCount: number = 5): Promise<number> {
    try {
      const tokens = await this.prisma.passwordResetToken.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: keepCount,
      });

      const idsToDelete = tokens.map((token) => token.id);

      if (idsToDelete.length > 0) {
        const result = await this.prisma.passwordResetToken.deleteMany({
          where: { id: { in: idsToDelete } },
        });
        this.logger.debug(
          `Cleaned up ${result.count} old password reset tokens for user: ${userId}`,
        );
        return result.count;
      }

      this.logger.debug(`No password reset tokens to clean up for user: ${userId}`);
      return 0;
    } catch (error) {
      this.logger.error(`Failed to clean up password reset tokens for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to clean up password reset tokens for user: ${userId}`,
        error,
      );
    }
  }
}

// ============================================================================
// EMAIL VERIFICATION TOKEN REPOSITORY
// ============================================================================

@Injectable()
export class PrismaEmailVerificationTokenRepository implements IEmailVerificationTokenRepository {
  private readonly logger = new Logger(PrismaEmailVerificationTokenRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: EmailVerificationTokenMapper,
  ) {}

  async save(token: EmailVerificationToken): Promise<void> {
    try {
      const createData = this.mapper.toCreatePersistence(token);

      await this.prisma.emailVerificationToken.upsert({
        where: { id: token.id },
        create: createData,
        update: { expiresAt: token.expiresAt },
      });

      this.logger.debug(`Successfully saved email verification token: ${token.id}`);
    } catch (error) {
      this.logger.error(`Failed to save email verification token: ${token.id}`, error);
      throw new TokenRepositoryError(`Failed to save email verification token: ${token.id}`, error);
    }
  }

  async findById(id: string): Promise<EmailVerificationToken | null> {
    try {
      const entity = await this.prisma.emailVerificationToken.findUnique({ where: { id } });

      if (!entity) {
        this.logger.debug(`Email verification token not found by ID: ${id}`);
        return null;
      }

      const token = this.mapper.toDomain(entity);
      this.logger.debug(`Successfully found email verification token by ID: ${id}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to find email verification token by ID: ${id}`, error);
      throw new TokenRepositoryError(`Failed to find email verification token by ID: ${id}`, error);
    }
  }

  async findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    try {
      const entity = await this.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

      if (!entity) {
        this.logger.debug(
          `Email verification token not found by hash: ${tokenHash.substring(0, 8)}...`,
        );
        return null;
      }

      const token = this.mapper.toDomain(entity);
      this.logger.debug(
        `Successfully found email verification token by hash: ${tokenHash.substring(0, 8)}...`,
      );
      return token;
    } catch (error) {
      this.logger.error(
        `Failed to find email verification token by hash: ${tokenHash.substring(0, 8)}...`,
        error,
      );
      throw new TokenRepositoryError(`Failed to find email verification token by hash`, error);
    }
  }

  async findByUserId(userId: string): Promise<EmailVerificationToken | null> {
    try {
      const entity = await this.prisma.emailVerificationToken.findUnique({ where: { userId } });

      if (!entity) {
        this.logger.debug(`Email verification token not found for user: ${userId}`);
        return null;
      }

      const token = this.mapper.toDomain(entity);
      this.logger.debug(`Successfully found email verification token for user: ${userId}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to find email verification token for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to find email verification token for user: ${userId}`,
        error,
      );
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    try {
      const result = await this.prisma.emailVerificationToken.deleteMany({ where: { userId } });
      this.logger.debug(`Deleted ${result.count} email verification tokens for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete email verification tokens for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to delete email verification tokens for user: ${userId}`,
        error,
      );
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const result = await this.prisma.emailVerificationToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      this.logger.debug(`Deleted ${result.count} expired email verification tokens`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to delete expired email verification tokens', error);
      throw new TokenRepositoryError('Failed to delete expired email verification tokens', error);
    }
  }

  async existsByUserId(userId: string): Promise<boolean> {
    try {
      const count = await this.prisma.emailVerificationToken.count({ where: { userId } });
      const exists = count > 0;
      this.logger.debug(`Email verification token exists for user ${userId}: ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(
        `Failed to check email verification token existence for user: ${userId}`,
        error,
      );
      throw new TokenRepositoryError(
        `Failed to check email verification token existence for user: ${userId}`,
        error,
      );
    }
  }

  async findActiveByUserId(userId: string): Promise<EmailVerificationToken | null> {
    try {
      const now = new Date();
      const entity = await this.prisma.emailVerificationToken.findFirst({
        where: {
          userId,
          expiresAt: { gte: now },
        },
      });

      if (!entity) {
        this.logger.debug(`No active email verification token found for user: ${userId}`);
        return null;
      }

      const token = this.mapper.toDomain(entity);
      this.logger.debug(`Found active email verification token for user: ${userId}`);
      return token;
    } catch (error) {
      this.logger.error(
        `Failed to find active email verification token for user: ${userId}`,
        error,
      );
      throw new TokenRepositoryError(
        `Failed to find active email verification token for user: ${userId}`,
        error,
      );
    }
  }
}

// ============================================================================
// PHONE VERIFICATION TOKEN REPOSITORY
// ============================================================================

@Injectable()
export class PrismaPhoneVerificationTokenRepository implements IPhoneVerificationTokenRepository {
  private readonly logger = new Logger(PrismaPhoneVerificationTokenRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: PhoneVerificationTokenMapper,
  ) {}

  async save(token: PhoneVerificationToken): Promise<void> {
    try {
      const createData = this.mapper.toCreatePersistence(token);
      const updateData = this.mapper.toUpdatePersistence(token);

      await this.prisma.phoneVerificationToken.upsert({
        where: { id: token.id },
        create: createData,
        update: updateData,
      });

      this.logger.debug(`Successfully saved phone verification token: ${token.id}`);
    } catch (error) {
      this.logger.error(`Failed to save phone verification token: ${token.id}`, error);
      throw new TokenRepositoryError(`Failed to save phone verification token: ${token.id}`, error);
    }
  }

  async findById(id: string): Promise<PhoneVerificationToken | null> {
    try {
      const entity = await this.prisma.phoneVerificationToken.findUnique({ where: { id } });

      if (!entity) {
        this.logger.debug(`Phone verification token not found by ID: ${id}`);
        return null;
      }

      const token = this.mapper.toDomain(entity);
      this.logger.debug(`Successfully found phone verification token by ID: ${id}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to find phone verification token by ID: ${id}`, error);
      throw new TokenRepositoryError(`Failed to find phone verification token by ID: ${id}`, error);
    }
  }

  async findByTokenHash(tokenHash: string): Promise<PhoneVerificationToken | null> {
    try {
      const entity = await this.prisma.phoneVerificationToken.findUnique({ where: { tokenHash } });

      if (!entity) {
        this.logger.debug(
          `Phone verification token not found by hash: ${tokenHash.substring(0, 8)}...`,
        );
        return null;
      }

      const token = this.mapper.toDomain(entity);
      this.logger.debug(
        `Successfully found phone verification token by hash: ${tokenHash.substring(0, 8)}...`,
      );
      return token;
    } catch (error) {
      this.logger.error(
        `Failed to find phone verification token by hash: ${tokenHash.substring(0, 8)}...`,
        error,
      );
      throw new TokenRepositoryError(`Failed to find phone verification token by hash`, error);
    }
  }

  async findActiveByUserId(userId: string): Promise<PhoneVerificationToken | null> {
    try {
      const now = new Date();
      const entity = await this.prisma.phoneVerificationToken.findFirst({
        where: {
          userId,
          used: false,
          expiresAt: { gte: now },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!entity) {
        this.logger.debug(`No active phone verification token found for user: ${userId}`);
        return null;
      }

      const token = this.mapper.toDomain(entity);
      this.logger.debug(`Found active phone verification token for user: ${userId}`);
      return token;
    } catch (error) {
      this.logger.error(
        `Failed to find active phone verification token for user: ${userId}`,
        error,
      );
      throw new TokenRepositoryError(
        `Failed to find active phone verification token for user: ${userId}`,
        error,
      );
    }
  }

  async findByUserId(userId: string): Promise<PhoneVerificationToken[]> {
    try {
      const entities = await this.prisma.phoneVerificationToken.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const tokens = entities.map((e) => this.mapper.toDomain(e));
      this.logger.debug(`Found ${tokens.length} phone verification tokens for user: ${userId}`);
      return tokens;
    } catch (error) {
      this.logger.error(`Failed to find phone verification tokens by user ID: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to find phone verification tokens by user ID: ${userId}`,
        error,
      );
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    try {
      const result = await this.prisma.phoneVerificationToken.deleteMany({ where: { userId } });
      this.logger.debug(`Deleted ${result.count} phone verification tokens for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete phone verification tokens for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to delete phone verification tokens for user: ${userId}`,
        error,
      );
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const result = await this.prisma.phoneVerificationToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      this.logger.debug(`Deleted ${result.count} expired phone verification tokens`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to delete expired phone verification tokens', error);
      throw new TokenRepositoryError('Failed to delete expired phone verification tokens', error);
    }
  }

  async deleteUsed(): Promise<number> {
    try {
      const result = await this.prisma.phoneVerificationToken.deleteMany({
        where: { used: true },
      });
      this.logger.debug(`Deleted ${result.count} used phone verification tokens`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to delete used phone verification tokens', error);
      throw new TokenRepositoryError('Failed to delete used phone verification tokens', error);
    }
  }

  async countActiveByUserId(userId: string): Promise<number> {
    try {
      const now = new Date();
      const count = await this.prisma.phoneVerificationToken.count({
        where: {
          userId,
          used: false,
          expiresAt: { gte: now },
        },
      });
      this.logger.debug(`Counted ${count} active phone verification tokens for user: ${userId}`);
      return count;
    } catch (error) {
      this.logger.error(
        `Failed to count active phone verification tokens for user: ${userId}`,
        error,
      );
      throw new TokenRepositoryError(
        `Failed to count active phone verification tokens for user: ${userId}`,
        error,
      );
    }
  }

  async cleanupUserTokens(userId: string, keepCount: number = 3): Promise<number> {
    try {
      const tokens = await this.prisma.phoneVerificationToken.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: keepCount,
      });

      const idsToDelete = tokens.map((token) => token.id);

      if (idsToDelete.length > 0) {
        const result = await this.prisma.phoneVerificationToken.deleteMany({
          where: { id: { in: idsToDelete } },
        });
        this.logger.debug(
          `Cleaned up ${result.count} old phone verification tokens for user: ${userId}`,
        );
        return result.count;
      }

      this.logger.debug(`No phone verification tokens to clean up for user: ${userId}`);
      return 0;
    } catch (error) {
      this.logger.error(`Failed to clean up phone verification tokens for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to clean up phone verification tokens for user: ${userId}`,
        error,
      );
    }
  }
  async countByUserId(userId: string): Promise<number> {
    try {
      const count = await this.prisma.phoneVerificationToken.count({
        where: { userId },
      });
      return count;
    } catch (error) {
      this.logger.error(`Failed to count phone verification tokens for user: ${userId}`, error);
      // Depending on your error handling strategy, you might throw a custom repo error
      // or return 0. Throwing is generally safer.
      throw new Error(`Failed to count phone tokens for user: ${userId}`);
    }
  }
}

// ============================================================================
// EMAIL CHANGE TOKEN REPOSITORY
// ============================================================================

@Injectable()
export class PrismaEmailChangeTokenRepository implements IEmailChangeTokenRepository {
  private readonly logger = new Logger(PrismaEmailChangeTokenRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: EmailChangeTokenMapper,
  ) {}

  async save(token: EmailChangeToken): Promise<void> {
    try {
      const createData = this.mapper.toCreatePersistence(token);
      const updateData = this.mapper.toUpdatePersistence(token);

      await this.prisma.emailChangeToken.upsert({
        where: { id: token.id },
        create: createData,
        update: updateData,
      });

      this.logger.debug(`Successfully saved email change token: ${token.id}`);
    } catch (error) {
      this.logger.error(`Failed to save email change token: ${token.id}`, error);
      throw new TokenRepositoryError(`Failed to save email change token: ${token.id}`, error);
    }
  }

  async findById(id: string): Promise<EmailChangeToken | null> {
    try {
      const entity = await this.prisma.emailChangeToken.findUnique({ where: { id } });

      if (!entity) {
        this.logger.debug(`Email change token not found by ID: ${id}`);
        return null;
      }

      const token = this.mapper.toDomain(entity);
      this.logger.debug(`Successfully found email change token by ID: ${id}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to find email change token by ID: ${id}`, error);
      throw new TokenRepositoryError(`Failed to find email change token by ID: ${id}`, error);
    }
  }

  async findByTokenHash(tokenHash: string): Promise<EmailChangeToken | null> {
    try {
      const entity = await this.prisma.emailChangeToken.findUnique({ where: { tokenHash } });

      if (!entity) {
        this.logger.debug(`Email change token not found by hash: ${tokenHash.substring(0, 8)}...`);
        return null;
      }

      const token = this.mapper.toDomain(entity);
      this.logger.debug(
        `Successfully found email change token by hash: ${tokenHash.substring(0, 8)}...`,
      );
      return token;
    } catch (error) {
      this.logger.error(
        `Failed to find email change token by hash: ${tokenHash.substring(0, 8)}...`,
        error,
      );
      throw new TokenRepositoryError(`Failed to find email change token by hash`, error);
    }
  }

  async findActiveByUserId(userId: string): Promise<EmailChangeToken | null> {
    try {
      const now = new Date();
      const entity = await this.prisma.emailChangeToken.findFirst({
        where: {
          userId,
          used: false,
          expiresAt: { gte: now },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!entity) {
        this.logger.debug(`No active email change token found for user: ${userId}`);
        return null;
      }

      const token = this.mapper.toDomain(entity);
      this.logger.debug(`Found active email change token for user: ${userId}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to find active email change token for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to find active email change token for user: ${userId}`,
        error,
      );
    }
  }

  async findByUserId(userId: string): Promise<EmailChangeToken[]> {
    try {
      const entities = await this.prisma.emailChangeToken.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const tokens = entities.map((e) => this.mapper.toDomain(e));
      this.logger.debug(`Found ${tokens.length} email change tokens for user: ${userId}`);
      return tokens;
    } catch (error) {
      this.logger.error(`Failed to find email change tokens by user ID: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to find email change tokens by user ID: ${userId}`,
        error,
      );
    }
  }

  async findByNewEmail(newEmail: string): Promise<EmailChangeToken[]> {
    try {
      const entities = await this.prisma.emailChangeToken.findMany({
        where: { newEmail },
        orderBy: { createdAt: 'desc' },
      });

      const tokens = entities.map((e) => this.mapper.toDomain(e));
      this.logger.debug(`Found ${tokens.length} email change tokens for new email: ${newEmail}`);
      return tokens;
    } catch (error) {
      this.logger.error(`Failed to find email change tokens by new email: ${newEmail}`, error);
      throw new TokenRepositoryError(
        `Failed to find email change tokens by new email: ${newEmail}`,
        error,
      );
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    try {
      const result = await this.prisma.emailChangeToken.deleteMany({ where: { userId } });
      this.logger.debug(`Deleted ${result.count} email change tokens for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete email change tokens for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to delete email change tokens for user: ${userId}`,
        error,
      );
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const result = await this.prisma.emailChangeToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      this.logger.debug(`Deleted ${result.count} expired email change tokens`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to delete expired email change tokens', error);
      throw new TokenRepositoryError('Failed to delete expired email change tokens', error);
    }
  }

  async deleteUsed(): Promise<number> {
    try {
      const result = await this.prisma.emailChangeToken.deleteMany({
        where: { used: true },
      });
      this.logger.debug(`Deleted ${result.count} used email change tokens`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to delete used email change tokens', error);
      throw new TokenRepositoryError('Failed to delete used email change tokens', error);
    }
  }

  async existsByNewEmail(newEmail: string): Promise<boolean> {
    try {
      const now = new Date();
      const count = await this.prisma.emailChangeToken.count({
        where: {
          newEmail,
          used: false,
          expiresAt: { gte: now },
        },
      });
      const exists = count > 0;
      this.logger.debug(`Active email change token exists for new email ${newEmail}: ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(
        `Failed to check email change token existence for new email: ${newEmail}`,
        error,
      );
      throw new TokenRepositoryError(
        `Failed to check email change token existence for new email: ${newEmail}`,
        error,
      );
    }
  }
}

// ============================================================================
// REFRESH TOKEN REPOSITORY
// ============================================================================

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  private readonly logger = new Logger(PrismaRefreshTokenRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: RefreshTokenMapper,
  ) {}

  async save(token: RefreshToken): Promise<void> {
    try {
      const createData = this.mapper.toCreatePersistence(token);

      await this.prisma.refreshToken.upsert({
        where: { id: token.id },
        create: createData,
        update: { expiresAt: token.expiresAt },
      });

      this.logger.debug(`Successfully saved refresh token: ${token.id}`);
    } catch (error) {
      this.logger.error(`Failed to save refresh token: ${token.id}`, error);
      throw new TokenRepositoryError(`Failed to save refresh token: ${token.id}`, error);
    }
  }

  async findById(id: string): Promise<RefreshToken | null> {
    try {
      const entity = await this.prisma.refreshToken.findUnique({ where: { id } });

      if (!entity) {
        this.logger.debug(`Refresh token not found by ID: ${id}`);
        return null;
      }

      const token = this.mapper.toDomain(entity);
      this.logger.debug(`Successfully found refresh token by ID: ${id}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to find refresh token by ID: ${id}`, error);
      throw new TokenRepositoryError(`Failed to find refresh token by ID: ${id}`, error);
    }
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    try {
      const entity = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

      if (!entity) {
        this.logger.debug(`Refresh token not found by hash: ${tokenHash.substring(0, 8)}...`);
        return null;
      }

      const token = this.mapper.toDomain(entity);
      this.logger.debug(
        `Successfully found refresh token by hash: ${tokenHash.substring(0, 8)}...`,
      );
      return token;
    } catch (error) {
      this.logger.error(
        `Failed to find refresh token by hash: ${tokenHash.substring(0, 8)}...`,
        error,
      );
      throw new TokenRepositoryError(`Failed to find refresh token by hash`, error);
    }
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    try {
      const entities = await this.prisma.refreshToken.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const tokens = entities.map((e) => this.mapper.toDomain(e));
      this.logger.debug(`Found ${tokens.length} refresh tokens for user: ${userId}`);
      return tokens;
    } catch (error) {
      this.logger.error(`Failed to find refresh tokens by user ID: ${userId}`, error);
      throw new TokenRepositoryError(`Failed to find refresh tokens by user ID: ${userId}`, error);
    }
  }

  async findActiveByUserId(userId: string): Promise<RefreshToken[]> {
    try {
      const now = new Date();
      const entities = await this.prisma.refreshToken.findMany({
        where: {
          userId,
          expiresAt: { gte: now },
        },
        orderBy: { createdAt: 'desc' },
      });

      const tokens = entities.map((e) => this.mapper.toDomain(e));
      this.logger.debug(`Found ${tokens.length} active refresh tokens for user: ${userId}`);
      return tokens;
    } catch (error) {
      this.logger.error(`Failed to find active refresh tokens for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to find active refresh tokens for user: ${userId}`,
        error,
      );
    }
  }

  async findByUserIdAndDeviceId(userId: string, deviceId: string): Promise<RefreshToken[]> {
    try {
      const entities = await this.prisma.refreshToken.findMany({
        where: { userId, deviceId },
        orderBy: { createdAt: 'desc' },
      });

      const tokens = entities.map((e) => this.mapper.toDomain(e));
      this.logger.debug(
        `Found ${tokens.length} refresh tokens for user ${userId} and device ${deviceId}`,
      );
      return tokens;
    } catch (error) {
      this.logger.error(
        `Failed to find refresh tokens for user ${userId} and device ${deviceId}`,
        error,
      );
      throw new TokenRepositoryError(
        `Failed to find refresh tokens for user ${userId} and device ${deviceId}`,
        error,
      );
    }
  }

  async revokeAllByUserId(userId: string): Promise<number> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({ where: { userId } });
      this.logger.debug(`Revoked (deleted) ${result.count} refresh tokens for user: ${userId}`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to revoke refresh tokens for user: ${userId}`, error);
      throw new TokenRepositoryError(`Failed to revoke refresh tokens for user: ${userId}`, error);
    }
  }

  async revokeByDeviceId(userId: string, deviceId: string): Promise<number> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: { userId, deviceId },
      });
      this.logger.debug(
        `Revoked (deleted) ${result.count} refresh tokens for user ${userId} and device ${deviceId}`,
      );
      return result.count;
    } catch (error) {
      this.logger.error(
        `Failed to revoke refresh tokens for user ${userId} and device ${deviceId}`,
        error,
      );
      throw new TokenRepositoryError(
        `Failed to revoke refresh tokens for user ${userId} and device ${deviceId}`,
        error,
      );
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({ where: { userId } });
      this.logger.debug(`Deleted ${result.count} refresh tokens for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete refresh tokens for user: ${userId}`, error);
      throw new TokenRepositoryError(`Failed to delete refresh tokens for user: ${userId}`, error);
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      this.logger.debug(`Deleted ${result.count} expired refresh tokens`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to delete expired refresh tokens', error);
      throw new TokenRepositoryError('Failed to delete expired refresh tokens', error);
    }
  }

  async deleteRevoked(): Promise<number> {
    try {
      // Note: Refresh tokens don't have a revoked flag in schema, so we delete expired ones
      return await this.deleteExpired();
    } catch (error) {
      this.logger.error('Failed to delete revoked refresh tokens', error);
      throw new TokenRepositoryError('Failed to delete revoked refresh tokens', error);
    }
  }

  async countActiveByUserId(userId: string): Promise<number> {
    try {
      const now = new Date();
      const count = await this.prisma.refreshToken.count({
        where: {
          userId,
          expiresAt: { gte: now },
        },
      });
      this.logger.debug(`Counted ${count} active refresh tokens for user: ${userId}`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to count active refresh tokens for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to count active refresh tokens for user: ${userId}`,
        error,
      );
    }
  }

  async cleanupUserTokens(userId: string, keepCount: number = 10): Promise<number> {
    try {
      const tokens = await this.prisma.refreshToken.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: keepCount,
      });

      const idsToDelete = tokens.map((token) => token.id);

      if (idsToDelete.length > 0) {
        const result = await this.prisma.refreshToken.deleteMany({
          where: { id: { in: idsToDelete } },
        });
        this.logger.debug(`Cleaned up ${result.count} old refresh tokens for user: ${userId}`);
        return result.count;
      }

      this.logger.debug(`No refresh tokens to clean up for user: ${userId}`);
      return 0;
    } catch (error) {
      this.logger.error(`Failed to clean up refresh tokens for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to clean up refresh tokens for user: ${userId}`,
        error,
      );
    }
  }
}

// ============================================================================
// LOGIN SESSION REPOSITORY
// ============================================================================

@Injectable()
export class PrismaLoginSessionRepository implements ILoginSessionRepository {
  private readonly logger = new Logger(PrismaLoginSessionRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: LoginSessionMapper,
  ) {}

  async save(session: LoginSession): Promise<void> {
    try {
      const createData = this.mapper.toCreatePersistence(session);
      const updateData = this.mapper.toUpdatePersistence(session);

      await this.prisma.loginSession.upsert({
        where: { id: session.id },
        create: createData,
        update: updateData,
      });

      this.logger.debug(`Successfully saved login session: ${session.id}`);
    } catch (error) {
      this.logger.error(`Failed to save login session: ${session.id}`, error);
      throw new TokenRepositoryError(`Failed to save login session: ${session.id}`, error);
    }
  }

  async findById(id: string): Promise<LoginSession | null> {
    try {
      const entity = await this.prisma.loginSession.findUnique({ where: { id } });

      if (!entity) {
        this.logger.debug(`Login session not found by ID: ${id}`);
        return null;
      }

      const session = this.mapper.toDomain(entity);
      this.logger.debug(`Successfully found login session by ID: ${id}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to find login session by ID: ${id}`, error);
      throw new TokenRepositoryError(`Failed to find login session by ID: ${id}`, error);
    }
  }

  async findByTokenHash(tokenHash: string): Promise<LoginSession | null> {
    try {
      const entity = await this.prisma.loginSession.findFirst({ where: { tokenHash } });

      if (!entity) {
        this.logger.debug(`Login session not found by hash: ${tokenHash.substring(0, 8)}...`);
        return null;
      }

      const session = this.mapper.toDomain(entity);
      this.logger.debug(
        `Successfully found login session by hash: ${tokenHash.substring(0, 8)}...`,
      );
      return session;
    } catch (error) {
      this.logger.error(
        `Failed to find login session by hash: ${tokenHash.substring(0, 8)}...`,
        error,
      );
      throw new TokenRepositoryError(`Failed to find login session by hash`, error);
    }
  }

  async findByUserId(userId: string): Promise<LoginSession[]> {
    try {
      const entities = await this.prisma.loginSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const sessions = entities.map((e) => this.mapper.toDomain(e));
      this.logger.debug(`Found ${sessions.length} login sessions for user: ${userId}`);
      return sessions;
    } catch (error) {
      this.logger.error(`Failed to find login sessions by user ID: ${userId}`, error);
      throw new TokenRepositoryError(`Failed to find login sessions by user ID: ${userId}`, error);
    }
  }

  async findActiveByUserId(userId: string): Promise<LoginSession[]> {
    try {
      const now = new Date();
      const entities = await this.prisma.loginSession.findMany({
        where: {
          userId,
          expiresAt: { gte: now },
          revokedAt: null,
        },
        orderBy: { lastActivity: 'desc' },
      });

      const sessions = entities.map((e) => this.mapper.toDomain(e));
      this.logger.debug(`Found ${sessions.length} active login sessions for user: ${userId}`);
      return sessions;
    } catch (error) {
      this.logger.error(`Failed to find active login sessions for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to find active login sessions for user: ${userId}`,
        error,
      );
    }
  }

  async findByUserIdAndDeviceId(userId: string, deviceId: string): Promise<LoginSession[]> {
    try {
      const entities = await this.prisma.loginSession.findMany({
        where: { userId, deviceId },
        orderBy: { createdAt: 'desc' },
      });

      const sessions = entities.map((e) => this.mapper.toDomain(e));
      this.logger.debug(
        `Found ${sessions.length} login sessions for user ${userId} and device ${deviceId}`,
      );
      return sessions;
    } catch (error) {
      this.logger.error(
        `Failed to find login sessions for user ${userId} and device ${deviceId}`,
        error,
      );
      throw new TokenRepositoryError(
        `Failed to find login sessions for user ${userId} and device ${deviceId}`,
        error,
      );
    }
  }

  async revokeAllByUserId(userId: string): Promise<number> {
    try {
      const now = new Date();
      const result = await this.prisma.loginSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      });
      this.logger.debug(`Revoked ${result.count} login sessions for user: ${userId}`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to revoke login sessions for user: ${userId}`, error);
      throw new TokenRepositoryError(`Failed to revoke login sessions for user: ${userId}`, error);
    }
  }

  async revokeByDeviceId(userId: string, deviceId: string): Promise<number> {
    try {
      const now = new Date();
      const result = await this.prisma.loginSession.updateMany({
        where: { userId, deviceId, revokedAt: null },
        data: { revokedAt: now },
      });
      this.logger.debug(
        `Revoked ${result.count} login sessions for user ${userId} and device ${deviceId}`,
      );
      return result.count;
    } catch (error) {
      this.logger.error(
        `Failed to revoke login sessions for user ${userId} and device ${deviceId}`,
        error,
      );
      throw new TokenRepositoryError(
        `Failed to revoke login sessions for user ${userId} and device ${deviceId}`,
        error,
      );
    }
  }

  async revokeById(sessionId: string): Promise<void> {
    try {
      await this.prisma.loginSession.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });
      this.logger.debug(`Revoked login session: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to revoke login session: ${sessionId}`, error);
      throw new TokenRepositoryError(`Failed to revoke login session: ${sessionId}`, error);
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    try {
      const result = await this.prisma.loginSession.deleteMany({ where: { userId } });
      this.logger.debug(`Deleted ${result.count} login sessions for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete login sessions for user: ${userId}`, error);
      throw new TokenRepositoryError(`Failed to delete login sessions for user: ${userId}`, error);
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const result = await this.prisma.loginSession.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      this.logger.debug(`Deleted ${result.count} expired login sessions`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to delete expired login sessions', error);
      throw new TokenRepositoryError('Failed to delete expired login sessions', error);
    }
  }

  async deleteRevoked(): Promise<number> {
    try {
      const result = await this.prisma.loginSession.deleteMany({
        where: { revokedAt: { not: null } },
      });
      this.logger.debug(`Deleted ${result.count} revoked login sessions`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to delete revoked login sessions', error);
      throw new TokenRepositoryError('Failed to delete revoked login sessions', error);
    }
  }

  async deleteInactive(): Promise<number> {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const result = await this.prisma.loginSession.deleteMany({
        where: {
          lastActivity: { lt: thirtyMinutesAgo },
          revokedAt: null,
        },
      });
      this.logger.debug(`Deleted ${result.count} inactive login sessions`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to delete inactive login sessions', error);
      throw new TokenRepositoryError('Failed to delete inactive login sessions', error);
    }
  }

  async getStats(): Promise<SessionStats> {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [total, active, revoked, expired, activeUsersLast24Hours] =
        await this.prisma.$transaction([
          this.prisma.loginSession.count(),
          this.prisma.loginSession.count({
            where: {
              expiresAt: { gte: now },
              revokedAt: null,
            },
          }),
          this.prisma.loginSession.count({
            where: { revokedAt: { not: null } },
          }),
          this.prisma.loginSession.count({
            where: { expiresAt: { lt: now } },
          }),
          this.prisma.loginSession.findMany({
            where: {
              lastActivity: { gte: twentyFourHoursAgo },
            },
            select: { userId: true },
            distinct: ['userId'],
          }),
        ]);

      const stats: SessionStats = {
        total,
        active,
        revoked,
        expired,
        activeUsersLast24Hours: activeUsersLast24Hours.length,
      };

      this.logger.debug('Successfully calculated session statistics');
      return stats;
    } catch (error) {
      this.logger.error('Failed to calculate session statistics', error);
      throw new TokenRepositoryError('Failed to calculate session statistics', error);
    }
  }

  async countActiveByUserId(userId: string): Promise<number> {
    try {
      const now = new Date();
      const count = await this.prisma.loginSession.count({
        where: {
          userId,
          expiresAt: { gte: now },
          revokedAt: null,
        },
      });
      this.logger.debug(`Counted ${count} active login sessions for user: ${userId}`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to count active login sessions for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to count active login sessions for user: ${userId}`,
        error,
      );
    }
  }

  async findRecentlyActive(limit: number): Promise<LoginSession[]> {
    try {
      const entities = await this.prisma.loginSession.findMany({
        where: { revokedAt: null },
        orderBy: { lastActivity: 'desc' },
        take: limit,
      });

      const sessions = entities.map((e) => this.mapper.toDomain(e));
      this.logger.debug(`Found ${sessions.length} recently active login sessions`);
      return sessions;
    } catch (error) {
      this.logger.error('Failed to find recently active login sessions', error);
      throw new TokenRepositoryError('Failed to find recently active login sessions', error);
    }
  }

  async updateActivity(sessionId: string): Promise<void> {
    try {
      await this.prisma.loginSession.update({
        where: { id: sessionId },
        data: { lastActivity: new Date() },
      });
      this.logger.debug(`Updated activity for login session: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to update activity for login session: ${sessionId}`, error);
      throw new TokenRepositoryError(
        `Failed to update activity for login session: ${sessionId}`,
        error,
      );
    }
  }
}

// ============================================================================
// PASSWORD HISTORY REPOSITORY
// ============================================================================

@Injectable()
export class PrismaPasswordHistoryRepository implements IPasswordHistoryRepository {
  private readonly logger = new Logger(PrismaPasswordHistoryRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: PasswordHistoryMapper,
  ) {}

  async save(userId: string, passwordHash: string): Promise<void> {
    try {
      const createData = this.mapper.toCreatePersistence(userId, passwordHash);
      await this.prisma.passwordHistory.create({ data: createData });
      this.logger.debug(`Saved password history for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to save password history for user: ${userId}`, error);
      throw new TokenRepositoryError(`Failed to save password history for user: ${userId}`, error);
    }
  }

  async findByUserId(userId: string, limit: number): Promise<PasswordHistory[]> {
    try {
      const entities = await this.prisma.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const history = entities.map((e) => this.mapper.toDomain(e));
      this.logger.debug(`Found ${history.length} password history entries for user: ${userId}`);
      return history;
    } catch (error) {
      this.logger.error(`Failed to find password history for user: ${userId}`, error);
      throw new TokenRepositoryError(`Failed to find password history for user: ${userId}`, error);
    }
  }

  async deleteOldestByUserId(userId: string, keepCount: number): Promise<void> {
    try {
      const entities = await this.prisma.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: keepCount,
      });

      const idsToDelete = entities.map((e) => e.id);

      if (idsToDelete.length > 0) {
        await this.prisma.passwordHistory.deleteMany({
          where: { id: { in: idsToDelete } },
        });
        this.logger.debug(
          `Deleted ${idsToDelete.length} oldest password history entries for user: ${userId}`,
        );
      } else {
        this.logger.debug(`No password history entries to delete for user: ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete oldest password history for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to delete oldest password history for user: ${userId}`,
        error,
      );
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    try {
      const result = await this.prisma.passwordHistory.deleteMany({ where: { userId } });
      this.logger.debug(`Deleted ${result.count} password history entries for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete password history for user: ${userId}`, error);
      throw new TokenRepositoryError(
        `Failed to delete password history for user: ${userId}`,
        error,
      );
    }
  }

  async countByUserId(userId: string): Promise<number> {
    try {
      const count = await this.prisma.passwordHistory.count({ where: { userId } });
      this.logger.debug(`Counted ${count} password history entries for user: ${userId}`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to count password history for user: ${userId}`, error);
      throw new TokenRepositoryError(`Failed to count password history for user: ${userId}`, error);
    }
  }

  async cleanupOldEntries(daysToKeep: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.prisma.passwordHistory.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      });

      this.logger.debug(
        `Cleaned up ${result.count} old password history entries older than ${daysToKeep} days`,
      );
      return result.count;
    } catch (error) {
      this.logger.error('Failed to clean up old password history entries', error);
      throw new TokenRepositoryError('Failed to clean up old password history entries', error);
    }
  }
}
