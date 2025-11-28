import { Injectable, Logger } from '@nestjs/common';
import {
  PasswordResetToken,
  EmailVerificationToken,
  PhoneVerificationToken,
  EmailChangeToken,
  RefreshToken,
  LoginSession,
} from '../../../domain/models/token.model';
import {
  PasswordResetTokenEntity,
  PasswordResetTokenCreateData,
  PasswordResetTokenUpdateData,
  EmailVerificationTokenEntity,
  EmailVerificationTokenCreateData,
  PhoneVerificationTokenEntity,
  PhoneVerificationTokenCreateData,
  PhoneVerificationTokenUpdateData,
  EmailChangeTokenEntity,
  EmailChangeTokenCreateData,
  EmailChangeTokenUpdateData,
  RefreshTokenEntity,
  RefreshTokenCreateData,
  RefreshTokenUpdateData,
  LoginSessionEntity,
  LoginSessionCreateData,
  LoginSessionUpdateData,
  PasswordHistoryEntity,
  PasswordHistoryCreateData,
} from '../entities/account.entity';

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

export class TokenMappingError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'TokenMappingError';
  }
}

export class InvalidTokenEntityError extends TokenMappingError {
  constructor(tokenId: string, tokenType: string, reason: string) {
    super(`Invalid ${tokenType} entity ${tokenId}: ${reason}`);
    this.name = 'InvalidTokenEntityError';
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function validateTokenEntity(entity: unknown, requiredFields: string[]): boolean {
  // First, prove to TypeScript that entity is a non-null object.
  if (typeof entity !== 'object' || entity === null) {
    return false;
  }

  const e = entity as Record<string, unknown>;

  if (typeof e.id !== 'string' || !e.id) return false;
  if (typeof e.tokenHash !== 'string' || !e.tokenHash) return false;
  if (typeof e.userId !== 'string' || !e.userId) return false;
  if (!(e.expiresAt instanceof Date)) return false;
  if (!(e.createdAt instanceof Date)) return false;

  // This check is now also type-safe.
  for (const field of requiredFields) {
    if (!(field in e)) return false;
  }

  return true;
}

// ============================================================================
// PASSWORD RESET TOKEN MAPPER
// ============================================================================

@Injectable()
export class PasswordResetTokenMapper {
  private readonly logger = new Logger(PasswordResetTokenMapper.name);

  toDomain(entity: PasswordResetTokenEntity): PasswordResetToken {
    try {
      if (!validateTokenEntity(entity, ['used'])) {
        throw new InvalidTokenEntityError(
          entity?.id || 'unknown',
          'PasswordResetToken',
          'Entity validation failed',
        );
      }

      const token = PasswordResetToken.fromPersistence({
        id: entity.id,
        tokenHash: entity.tokenHash,
        userId: entity.userId,
        expiresAt: entity.expiresAt,
        isUsed: entity.used,
        createdAt: entity.createdAt,
      });

      this.logger.debug(`Successfully mapped password reset token to domain: ${entity.id}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to map password reset token to domain: ${entity?.id}`, error);
      if (error instanceof TokenMappingError) {
        throw error;
      }
      throw new TokenMappingError(
        `Failed to map password reset token ${entity?.id} to domain model`,
        error,
      );
    }
  }

  toCreatePersistence(token: PasswordResetToken): PasswordResetTokenCreateData {
    try {
      return {
        id: token.id,
        tokenHash: token.tokenHash,
        user: { connect: { id: token.userId } },
        expiresAt: token.expiresAt,
        used: token.isUsed,
        createdAt: token.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to create password reset token persistence data', error);
      throw new TokenMappingError('Failed to create password reset token persistence data', error);
    }
  }

  toUpdatePersistence(token: PasswordResetToken): PasswordResetTokenUpdateData {
    try {
      return {
        used: token.isUsed,
        expiresAt: token.expiresAt,
      };
    } catch (error) {
      this.logger.error('Failed to create password reset token update data', error);
      throw new TokenMappingError('Failed to create password reset token update data', error);
    }
  }
}

// ============================================================================
// EMAIL VERIFICATION TOKEN MAPPER
// ============================================================================

@Injectable()
export class EmailVerificationTokenMapper {
  private readonly logger = new Logger(EmailVerificationTokenMapper.name);

  toDomain(entity: EmailVerificationTokenEntity): EmailVerificationToken {
    try {
      if (!validateTokenEntity(entity, [])) {
        throw new InvalidTokenEntityError(
          entity?.id || 'unknown',
          'EmailVerificationToken',
          'Entity validation failed',
        );
      }

      const token = EmailVerificationToken.fromPersistence({
        id: entity.id,
        tokenHash: entity.tokenHash,
        userId: entity.userId,
        expiresAt: entity.expiresAt,
        createdAt: entity.createdAt,
      });

      this.logger.debug(`Successfully mapped email verification token to domain: ${entity.id}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to map email verification token to domain: ${entity?.id}`, error);
      if (error instanceof TokenMappingError) {
        throw error;
      }
      throw new TokenMappingError(
        `Failed to map email verification token ${entity?.id} to domain model`,
        error,
      );
    }
  }

  toCreatePersistence(token: EmailVerificationToken): EmailVerificationTokenCreateData {
    try {
      return {
        id: token.id,
        tokenHash: token.tokenHash,
        user: { connect: { id: token.userId } },
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to create email verification token persistence data', error);
      throw new TokenMappingError(
        'Failed to create email verification token persistence data',
        error,
      );
    }
  }

  toUpdatePersistence(token: EmailVerificationToken): EmailVerificationTokenCreateData {
    try {
      // Email verification tokens are typically single-use, so we don't update them
      // But we provide this method for consistency
      return this.toCreatePersistence(token);
    } catch (error) {
      this.logger.error('Failed to create email verification token update data', error);
      throw new TokenMappingError('Failed to create email verification token update data', error);
    }
  }
}

// ============================================================================
// PHONE VERIFICATION TOKEN MAPPER
// ============================================================================

@Injectable()
export class PhoneVerificationTokenMapper {
  private readonly logger = new Logger(PhoneVerificationTokenMapper.name);

  toDomain(entity: PhoneVerificationTokenEntity): PhoneVerificationToken {
    try {
      if (!validateTokenEntity(entity, ['used', 'attempts'])) {
        throw new InvalidTokenEntityError(
          entity?.id || 'unknown',
          'PhoneVerificationToken',
          'Entity validation failed',
        );
      }

      const token = PhoneVerificationToken.fromPersistence({
        id: entity.id,
        tokenHash: entity.tokenHash,
        userId: entity.userId,
        expiresAt: entity.expiresAt,
        isUsed: entity.used,
        attempts: entity.attempts,
        createdAt: entity.createdAt,
      });

      this.logger.debug(`Successfully mapped phone verification token to domain: ${entity.id}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to map phone verification token to domain: ${entity?.id}`, error);
      if (error instanceof TokenMappingError) {
        throw error;
      }
      throw new TokenMappingError(
        `Failed to map phone verification token ${entity?.id} to domain model`,
        error,
      );
    }
  }

  toCreatePersistence(token: PhoneVerificationToken): PhoneVerificationTokenCreateData {
    try {
      return {
        id: token.id,
        tokenHash: token.tokenHash,
        user: { connect: { id: token.userId } },
        expiresAt: token.expiresAt,
        used: token.isUsed,
        attempts: token.attempts,
        createdAt: token.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to create phone verification token persistence data', error);
      throw new TokenMappingError(
        'Failed to create phone verification token persistence data',
        error,
      );
    }
  }

  toUpdatePersistence(token: PhoneVerificationToken): PhoneVerificationTokenUpdateData {
    try {
      return {
        used: token.isUsed,
        attempts: token.attempts,
        expiresAt: token.expiresAt,
      };
    } catch (error) {
      this.logger.error('Failed to create phone verification token update data', error);
      throw new TokenMappingError('Failed to create phone verification token update data', error);
    }
  }
}

// ============================================================================
// EMAIL CHANGE TOKEN MAPPER
// ============================================================================

@Injectable()
export class EmailChangeTokenMapper {
  private readonly logger = new Logger(EmailChangeTokenMapper.name);

  toDomain(entity: EmailChangeTokenEntity): EmailChangeToken {
    try {
      if (!validateTokenEntity(entity, ['newEmail', 'used'])) {
        throw new InvalidTokenEntityError(
          entity?.id || 'unknown',
          'EmailChangeToken',
          'Entity validation failed',
        );
      }

      if (typeof entity.newEmail !== 'string' || !entity.newEmail) {
        throw new InvalidTokenEntityError(entity.id, 'EmailChangeToken', 'Invalid newEmail');
      }

      const token = EmailChangeToken.fromPersistence({
        id: entity.id,
        tokenHash: entity.tokenHash,
        userId: entity.userId,
        newEmail: entity.newEmail,
        expiresAt: entity.expiresAt,
        isUsed: entity.used,
        createdAt: entity.createdAt,
      });

      this.logger.debug(`Successfully mapped email change token to domain: ${entity.id}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to map email change token to domain: ${entity?.id}`, error);
      if (error instanceof TokenMappingError) {
        throw error;
      }
      throw new TokenMappingError(
        `Failed to map email change token ${entity?.id} to domain model`,
        error,
      );
    }
  }

  toCreatePersistence(token: EmailChangeToken): EmailChangeTokenCreateData {
    try {
      return {
        id: token.id,
        tokenHash: token.tokenHash,
        user: { connect: { id: token.userId } },
        newEmail: token.newEmail,
        expiresAt: token.expiresAt,
        used: token.isUsed,
        createdAt: token.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to create email change token persistence data', error);
      throw new TokenMappingError('Failed to create email change token persistence data', error);
    }
  }

  toUpdatePersistence(token: EmailChangeToken): EmailChangeTokenUpdateData {
    try {
      return {
        used: token.isUsed,
        expiresAt: token.expiresAt,
      };
    } catch (error) {
      this.logger.error('Failed to create email change token update data', error);
      throw new TokenMappingError('Failed to create email change token update data', error);
    }
  }
}

// ============================================================================
// REFRESH TOKEN MAPPER
// ============================================================================

@Injectable()
export class RefreshTokenMapper {
  private readonly logger = new Logger(RefreshTokenMapper.name);

  toDomain(entity: RefreshTokenEntity): RefreshToken {
    try {
      if (!validateTokenEntity(entity, ['deviceId', 'ipAddress', 'userAgent'])) {
        throw new InvalidTokenEntityError(
          entity?.id || 'unknown',
          'RefreshToken',
          'Entity validation failed',
        );
      }

      const token = RefreshToken.fromPersistence({
        id: entity.id,
        tokenHash: entity.tokenHash,
        userId: entity.userId,
        expiresAt: entity.expiresAt,
        revokedAt: entity.revokedAt,
        deviceId: entity.deviceId,
        ipAddress: entity.ipAddress,
        userAgent: entity.userAgent,
        createdAt: entity.createdAt,
      });

      this.logger.debug(`Successfully mapped refresh token to domain: ${entity.id}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to map refresh token to domain: ${entity?.id}`, error);
      if (error instanceof TokenMappingError) {
        throw error;
      }
      throw new TokenMappingError(
        `Failed to map refresh token ${entity?.id} to domain model`,
        error,
      );
    }
  }

  toCreatePersistence(token: RefreshToken): RefreshTokenCreateData {
    try {
      return {
        id: token.id,
        tokenHash: token.tokenHash,
        user: { connect: { id: token.userId } },
        expiresAt: token.expiresAt,
        deviceId: token.deviceId,
        ipAddress: token.ipAddress,
        userAgent: token.userAgent,
        revokedAt: token.revokedAt ? new Date() : null,
        createdAt: token.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to create refresh token persistence data', error);
      throw new TokenMappingError('Failed to create refresh token persistence data', error);
    }
  }

  toUpdatePersistence(token: RefreshToken): RefreshTokenUpdateData {
    try {
      return {
        expiresAt: token.expiresAt,
        revokedAt: token.revokedAt ? new Date() : null,
        lastUsedAt: new Date(), // Track when token was last used
      };
    } catch (error) {
      this.logger.error('Failed to create refresh token update data', error);
      throw new TokenMappingError('Failed to create refresh token update data', error);
    }
  }
}

// ============================================================================
// LOGIN SESSION MAPPER
// ============================================================================

@Injectable()
export class LoginSessionMapper {
  private readonly logger = new Logger(LoginSessionMapper.name);

  toDomain(entity: LoginSessionEntity): LoginSession {
    try {
      if (!validateTokenEntity(entity, ['lastActivity', 'deviceId', 'ipAddress', 'userAgent'])) {
        throw new InvalidTokenEntityError(
          entity?.id || 'unknown',
          'LoginSession',
          'Entity validation failed',
        );
      }

      if (!(entity.lastActivity instanceof Date)) {
        throw new InvalidTokenEntityError(entity.id, 'LoginSession', 'Invalid lastActivity');
      }

      const token = LoginSession.fromPersistence({
        id: entity.id,
        tokenHash: entity.tokenHash,
        userId: entity.userId,
        expiresAt: entity.expiresAt,
        ipAddress: entity.ipAddress,
        userAgent: entity.userAgent,
        deviceId: entity.deviceId,
        lastActivity: entity.lastActivity,
        revokedAt: entity.revokedAt,
        createdAt: entity.createdAt,
      });

      this.logger.debug(`Successfully mapped login session to domain: ${entity.id}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to map login session to domain: ${entity?.id}`, error);
      if (error instanceof TokenMappingError) {
        throw error;
      }
      throw new TokenMappingError(
        `Failed to map login session ${entity?.id} to domain model`,
        error,
      );
    }
  }

  toCreatePersistence(session: LoginSession): LoginSessionCreateData {
    try {
      return {
        id: session.id,
        tokenHash: session.tokenHash,
        user: { connect: { id: session.userId } },
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        deviceId: session.deviceId,
        lastActivity: session.lastActivity,
        revokedAt: session.revokedAt,
        createdAt: session.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to create login session persistence data', error);
      throw new TokenMappingError('Failed to create login session persistence data', error);
    }
  }

  toUpdatePersistence(session: LoginSession): LoginSessionUpdateData {
    try {
      return {
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt ? new Date() : null,
      };
    } catch (error) {
      this.logger.error('Failed to create login session update data', error);
      throw new TokenMappingError('Failed to create login session update data', error);
    }
  }
}

// ============================================================================
// PASSWORD HISTORY MAPPER
// ============================================================================

@Injectable()
export class PasswordHistoryMapper {
  private readonly logger = new Logger(PasswordHistoryMapper.name);

  toDomain(entity: PasswordHistoryEntity) {
    try {
      if (!entity || typeof entity.id !== 'string' || !entity.id) {
        throw new InvalidTokenEntityError(
          entity?.id || 'unknown',
          'PasswordHistory',
          'Entity validation failed',
        );
      }

      const history = {
        id: entity.id,
        userId: entity.userId,
        passwordHash: entity.passwordHash,
        createdAt: entity.createdAt,
      };

      this.logger.debug(`Successfully mapped password history to domain: ${entity.id}`);
      return history;
    } catch (error) {
      this.logger.error(`Failed to map password history to domain: ${entity?.id}`, error);
      if (error instanceof TokenMappingError) {
        throw error;
      }
      throw new TokenMappingError(
        `Failed to map password history ${entity?.id} to domain model`,
        error,
      );
    }
  }

  toCreatePersistence(userId: string, passwordHash: string): PasswordHistoryCreateData {
    try {
      if (!userId || !passwordHash) {
        throw new TokenMappingError('UserId and passwordHash are required for password history');
      }

      return {
        user: { connect: { id: userId } },
        passwordHash,
        createdAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to create password history persistence data', error);
      throw new TokenMappingError('Failed to create password history persistence data', error);
    }
  }

  toCreatePersistenceWithId(
    id: string,
    userId: string,
    passwordHash: string,
    createdAt: Date,
  ): PasswordHistoryCreateData {
    try {
      if (!id || !userId || !passwordHash || !createdAt) {
        throw new TokenMappingError('All fields are required for password history with ID');
      }

      return {
        id,
        user: { connect: { id: userId } },
        passwordHash,
        createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to create password history persistence data with ID', error);
      throw new TokenMappingError(
        'Failed to create password history persistence data with ID',
        error,
      );
    }
  }
}

// ============================================================================
// TOKEN MAPPER FACTORY (Optional Helper)
// ============================================================================

@Injectable()
export class TokenMapperFactory {
  constructor(
    private readonly passwordResetTokenMapper: PasswordResetTokenMapper,
    private readonly emailVerificationTokenMapper: EmailVerificationTokenMapper,
    private readonly phoneVerificationTokenMapper: PhoneVerificationTokenMapper,
    private readonly emailChangeTokenMapper: EmailChangeTokenMapper,
    private readonly refreshTokenMapper: RefreshTokenMapper,
    private readonly loginSessionMapper: LoginSessionMapper,
    private readonly passwordHistoryMapper: PasswordHistoryMapper,
  ) {}

  getPasswordResetTokenMapper(): PasswordResetTokenMapper {
    return this.passwordResetTokenMapper;
  }

  getEmailVerificationTokenMapper(): EmailVerificationTokenMapper {
    return this.emailVerificationTokenMapper;
  }

  getPhoneVerificationTokenMapper(): PhoneVerificationTokenMapper {
    return this.phoneVerificationTokenMapper;
  }

  getEmailChangeTokenMapper(): EmailChangeTokenMapper {
    return this.emailChangeTokenMapper;
  }

  getRefreshTokenMapper(): RefreshTokenMapper {
    return this.refreshTokenMapper;
  }

  getLoginSessionMapper(): LoginSessionMapper {
    return this.loginSessionMapper;
  }

  getPasswordHistoryMapper(): PasswordHistoryMapper {
    return this.passwordHistoryMapper;
  }
}
