import { Injectable } from '@nestjs/common';
import {
  PasswordResetToken,
  EmailVerificationToken,
  PhoneVerificationToken,
  EmailChangeToken,
  RefreshToken,
  LoginSession,
} from '../../../3_domain/models/token.model';
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
  LoginSessionEntity,
  LoginSessionCreateData,
  LoginSessionUpdateData,
  PasswordHistoryEntity,
  PasswordHistoryCreateData,
} from '../entities/user.entity';

// Note: Each mapper is decorated as @Injectable for consistency and to allow
// them to be injected into their respective repositories.

@Injectable()
export class PasswordResetTokenMapper {
  toDomain(entity: PasswordResetTokenEntity): PasswordResetToken {
    return PasswordResetToken.fromPersistence({
      id: entity.id,
      tokenHash: entity.tokenHash,
      userId: entity.userId,
      expiresAt: entity.expiresAt,
      isUsed: entity.used,
      createdAt: entity.createdAt,
    });
  }

  toCreatePersistence(token: PasswordResetToken): PasswordResetTokenCreateData {
    return {
      id: token.id,
      tokenHash: token.tokenHash,
      user: { connect: { id: token.userId } },
      expiresAt: token.expiresAt,
      used: token.isUsed,
      createdAt: token.createdAt,
    };
  }

  toUpdatePersistence(token: PasswordResetToken): PasswordResetTokenUpdateData {
    return {
      used: token.isUsed,
    };
  }
}

@Injectable()
export class EmailVerificationTokenMapper {
  toDomain(entity: EmailVerificationTokenEntity): EmailVerificationToken {
    return EmailVerificationToken.fromPersistence({
      id: entity.id,
      tokenHash: entity.tokenHash,
      userId: entity.userId,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
    });
  }

  toCreatePersistence(token: EmailVerificationToken): EmailVerificationTokenCreateData {
    return {
      id: token.id,
      tokenHash: token.tokenHash,
      user: { connect: { id: token.userId } },
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
    };
  }
}

@Injectable()
export class PhoneVerificationTokenMapper {
  toDomain(entity: PhoneVerificationTokenEntity): PhoneVerificationToken {
    return PhoneVerificationToken.fromPersistence({
      id: entity.id,
      tokenHash: entity.tokenHash,
      userId: entity.userId,
      expiresAt: entity.expiresAt,
      isUsed: entity.used,
      attempts: entity.attempts,
      createdAt: entity.createdAt,
    });
  }

  toCreatePersistence(token: PhoneVerificationToken): PhoneVerificationTokenCreateData {
    return {
      id: token.id,
      tokenHash: token.tokenHash,
      user: { connect: { id: token.userId } },
      expiresAt: token.expiresAt,
      used: token.isUsed,
      attempts: token.attempts,
      createdAt: token.createdAt,
    };
  }

  toUpdatePersistence(token: PhoneVerificationToken): PhoneVerificationTokenUpdateData {
    return {
      used: token.isUsed,
      attempts: token.attempts,
    };
  }
}

@Injectable()
export class EmailChangeTokenMapper {
  toDomain(entity: EmailChangeTokenEntity): EmailChangeToken {
    return EmailChangeToken.fromPersistence({
      id: entity.id,
      tokenHash: entity.tokenHash,
      userId: entity.userId,
      newEmail: entity.newEmail,
      expiresAt: entity.expiresAt,
      isUsed: entity.used,
      createdAt: entity.createdAt,
    });
  }

  toCreatePersistence(token: EmailChangeToken): EmailChangeTokenCreateData {
    return {
      id: token.id,
      tokenHash: token.tokenHash,
      user: { connect: { id: token.userId } },
      newEmail: token.newEmail,
      expiresAt: token.expiresAt,
      used: token.isUsed,
      createdAt: token.createdAt,
    };
  }

  toUpdatePersistence(token: EmailChangeToken): EmailChangeTokenUpdateData {
    return {
      used: token.isUsed,
    };
  }
}

@Injectable()
export class RefreshTokenMapper {
  toDomain(entity: RefreshTokenEntity): RefreshToken {
    return RefreshToken.fromPersistence({
      id: entity.id,
      tokenHash: entity.tokenHash,
      userId: entity.userId,
      expiresAt: entity.expiresAt,
      isRevoked: false, // The state of being revoked is handled by the token's absence in the DB
      deviceId: entity.deviceId,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      createdAt: entity.createdAt,
    });
  }

  toCreatePersistence(token: RefreshToken): RefreshTokenCreateData {
    return {
      id: token.id,
      tokenHash: token.tokenHash,
      user: { connect: { id: token.userId } },
      expiresAt: token.expiresAt,
      deviceId: token.deviceId,
      ipAddress: token.ipAddress,
      userAgent: token.userAgent,
      createdAt: token.createdAt,
    };
  }
}

@Injectable()
export class LoginSessionMapper {
  toDomain(entity: LoginSessionEntity): LoginSession {
    return LoginSession.fromPersistence({
      id: entity.id,
      tokenHash: entity.tokenHash as string,
      userId: entity.userId,
      expiresAt: entity.expiresAt,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      deviceId: entity.deviceId,
      lastActivity: entity.lastActivity,
      isRevoked: entity.revokedAt !== null, // Correctly derived from the DB state
      createdAt: entity.createdAt,
    });
  }

  toCreatePersistence(session: LoginSession): LoginSessionCreateData {
    return {
      id: session.id,
      tokenHash: session.tokenHash,
      user: { connect: { id: session.userId } },
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      deviceId: session.deviceId,
      lastActivity: session.lastActivity,
      revokedAt: session.isRevoked ? new Date() : null,
      createdAt: session.createdAt,
    };
  }

  toUpdatePersistence(session: LoginSession): LoginSessionUpdateData {
    return {
      lastActivity: session.lastActivity,
      revokedAt: session.isRevoked ? new Date() : null,
    };
  }
}

@Injectable()
export class PasswordHistoryMapper {
  toDomain(entity: PasswordHistoryEntity) {
    // This is a simple data structure, not a rich domain model, so a plain object is fine.
    return {
      id: entity.id,
      userId: entity.userId,
      passwordHash: entity.passwordHash,
      createdAt: entity.createdAt,
    };
  }

  toCreatePersistence(userId: string, passwordHash: string): PasswordHistoryCreateData {
    return {
      user: { connect: { id: userId } },
      passwordHash,
      createdAt: new Date(),
    };
  }
}
