import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  EmailChangeToken,
  LoginSession,
  PasswordResetToken,
  PhoneVerificationToken,
  RefreshToken,
} from '../../domain/models';
import {
  EmailChangeTokenEntity,
  LoginSessionEntity,
  PasswordHistoryEntity,
  PasswordResetTokenEntity,
  PhoneVerificationTokenEntity,
  RefreshTokenEntity,
} from '../../infrastructure/persistence/entities/account.entity';

export interface IPasswordHistory {
  id: string;
  userId: string;
  passwordHash: string;
  createdAt: Date;
}

@Injectable()
export class TokenMapper {
  // ============================================================================
  // PASSWORD RESET TOKEN MAPPING
  // ============================================================================

  passwordResetToPersistence(token: PasswordResetToken): {
    create: Prisma.PasswordResetTokenCreateInput;
    update: Prisma.PasswordResetTokenUpdateInput;
  } {
    return {
      create: {
        id: token.id,
        user: { connect: { id: token.userId } },
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        used: token.isUsed,
        createdAt: token.createdAt,
      },
      update: {
        used: token.isUsed,
      },
    };
  }

  passwordResetToDomain(entity: PasswordResetTokenEntity): PasswordResetToken {
    return PasswordResetToken.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      isUsed: entity.used,
      createdAt: entity.createdAt,
    });
  }

  // ============================================================================
  // PHONE VERIFICATION TOKEN MAPPING
  // ============================================================================

  phoneVerificationToPersistence(token: PhoneVerificationToken): {
    create: Prisma.PhoneVerificationTokenCreateInput;
    update: Prisma.PhoneVerificationTokenUpdateInput;
  } {
    return {
      create: {
        id: token.id,
        user: { connect: { id: token.userId } },
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        used: token.isUsed,
        attempts: token.attempts,
        createdAt: token.createdAt,
      },
      update: {
        used: token.isUsed,
        attempts: token.attempts,
      },
    };
  }

  phoneVerificationToDomain(entity: PhoneVerificationTokenEntity): PhoneVerificationToken {
    return PhoneVerificationToken.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      isUsed: entity.used,
      attempts: entity.attempts,
      createdAt: entity.createdAt,
    });
  }

  // ============================================================================
  // REFRESH TOKEN MAPPING
  // ============================================================================

  refreshTokenToPersistence(token: RefreshToken): {
    create: Prisma.RefreshTokenCreateInput;
    update: Prisma.RefreshTokenUpdateInput;
  } {
    return {
      create: {
        id: token.id,
        user: { connect: { id: token.userId } },
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        deviceId: token.deviceId,
        ipAddress: token.ipAddress,
        userAgent: token.userAgent,
        revokedAt: token.revokedAt,
        createdAt: token.createdAt,
      },
      update: {
        revokedAt: token.revokedAt,
      },
    };
  }

  refreshTokenToDomain(entity: RefreshTokenEntity): RefreshToken {
    return RefreshToken.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      deviceId: entity.deviceId,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      revokedAt: entity.revokedAt,
      createdAt: entity.createdAt,
    });
  }

  // ============================================================================
  // LOGIN SESSION MAPPING
  // ============================================================================

  loginSessionToPersistence(session: LoginSession): {
    create: Prisma.LoginSessionCreateInput;
    update: Prisma.LoginSessionUpdateInput;
  } {
    return {
      create: {
        id: session.id,
        user: { connect: { id: session.userId } },
        tokenHash: session.tokenHash,
        expiresAt: session.expiresAt,
        deviceId: session.deviceId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        lastActivity: session.lastActivity,
        revokedAt: session.revokedAt,
        createdAt: session.createdAt,
      },
      update: {
        lastActivity: session.lastActivity,
        revokedAt: session.revokedAt,
      },
    };
  }

  loginSessionToDomain(entity: LoginSessionEntity): LoginSession {
    return LoginSession.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      deviceId: entity.deviceId,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      lastActivity: entity.lastActivity,
      revokedAt: entity.revokedAt,
      createdAt: entity.createdAt,
    });
  }

  // ============================================================================
  // EMAIL CHANGE TOKEN MAPPING
  // ============================================================================

  emailChangeToPersistence(token: EmailChangeToken): {
    create: Prisma.EmailChangeTokenCreateInput;
    update: Prisma.EmailChangeTokenUpdateInput;
  } {
    return {
      create: {
        id: token.id,
        user: { connect: { id: token.userId } },
        newEmail: token.newEmail,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        used: token.isUsed,
        createdAt: token.createdAt,
      },
      update: {
        used: token.isUsed,
      },
    };
  }

  emailChangeToDomain(entity: EmailChangeTokenEntity): EmailChangeToken {
    return EmailChangeToken.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      newEmail: entity.newEmail,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      isUsed: entity.used,
      createdAt: entity.createdAt,
    });
  }

  // ============================================================================
  // PASSWORD HISTORY MAPPING
  // ============================================================================

  passwordHistoryToPersistence(history: IPasswordHistory): {
    create: Prisma.PasswordHistoryCreateInput;
  } {
    return {
      create: {
        id: history.id,
        user: { connect: { id: history.userId } },
        passwordHash: history.passwordHash,
        createdAt: history.createdAt,
      },
    };
  }

  passwordHistoryToDomain(entity: PasswordHistoryEntity): IPasswordHistory {
    return {
      id: entity.id,
      userId: entity.userId,
      passwordHash: entity.passwordHash,
      createdAt: entity.createdAt,
    };
  }
}
