import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from '@prisma/client';

import { PaginatedResult, UserStats } from '../../domain/interfaces';
import { LoginSession, User } from '../../domain/models';
import { Address, UserProfile } from '../../domain/models';
import { Email, Password, PhoneNumber } from '../../domain/value-objects';
import {
  UserEntity,
  UserProfileEntity,
} from '../../infrastructure/persistence/entities/account.entity';
import {
  AdminBulkUpdateUsersResponseDto,
  AdminCreateUserResponseDto,
  DetailedUserResponseDto as AdminDetailedUserResponseDto,
  GetUserResponseDto as AdminGetUserResponseDto,
  AdminUpdateUserResponseDto,
  LockUserAccountResponseDto,
  PaginatedUsersResponseDto,
  RestoreUserResponseDto,
  SoftDeleteUserResponseDto,
  UnlockUserAccountResponseDto,
  UpdateUserRoleResponseDto,
  UserStatsResponseDto,
} from '../dtos/admin.dto';
import {
  DeactivateMyAccountResponseDto,
  GetMyUserResponseDto,
  UpdateMyUserResponseDto,
  UserResponseDto,
} from '../dtos/user.dto';

// Type definitions for strongly-typed persistence data.
export interface UserPersistenceData {
  create: Prisma.UserCreateInput;
  update: Prisma.UserUpdateInput;
}

// ============================================================================
// Standalone Helper Functions for Safe Data Parsing
// ============================================================================

function parseAddress(json: Prisma.JsonValue | null): Address | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;

  const obj = json as Record<string, unknown>;
  if (typeof obj.country !== 'string' || !obj.country.trim()) {
    Logger.warn('Malformed Address JSON: missing or invalid country', { json });
    return null;
  }

  const address: Address = { country: obj.country.trim() };
  if (typeof obj.street === 'string' && obj.street.trim()) address.street = obj.street.trim();
  if (typeof obj.city === 'string' && obj.city.trim()) address.city = obj.city.trim();
  if (typeof obj.county === 'string' && obj.county.trim()) address.county = obj.county.trim();
  if (typeof obj.postalCode === 'string' && obj.postalCode.trim())
    address.postalCode = obj.postalCode.trim();

  return address;
}

/**
 * @Injectable
 * @class UserMapper
 * @description Maps between the User domain model, persistence (Prisma) layer, and data transfer objects (DTOs).
 * This class is a crucial part of the application's architecture, ensuring a clean separation of concerns.
 */
@Injectable()
export class UserMapper {
  // ============================================================================
  // DOMAIN ↔ PERSISTENCE MAPPING
  // ============================================================================

  /**
   * Converts a User domain model to Prisma create/update inputs.
   * @param user The User domain object.
   * @returns An object containing `create` and `update` data for Prisma.
   */
  toPersistence(user: User): UserPersistenceData {
    if (!user.profile) {
      throw new Error(
        `User object (ID: ${user.id}) is missing its profile for persistence mapping.`,
      );
    }

    const userPrimitives = user.toPrimitives();
    const profilePrimitives = user.profile.toPrimitives();

    // Fields belonging to the User model
    const userData = {
      email: userPrimitives.email,
      password: userPrimitives.passwordHash,
      firstName: userPrimitives.firstName,
      lastName: userPrimitives.lastName,
      role: userPrimitives.role,
      isActive: userPrimitives.isActive,
      lastLoginAt: userPrimitives.lastLoginAt,
      loginAttempts: userPrimitives.loginAttempts,
      lockedUntil: userPrimitives.lockedUntil,
      deletedAt: userPrimitives.deletedAt,
      updatedAt: userPrimitives.updatedAt,
    };

    // Fields belonging to the UserProfile model
    const profileData = {
      phoneNumber: profilePrimitives.phoneNumber,
      marketingOptIn: profilePrimitives.marketingOptIn,
      address: (profilePrimitives.address as Prisma.JsonValue) ?? Prisma.JsonNull,
      updatedAt: profilePrimitives.updatedAt,
    };

    return {
      create: {
        id: userPrimitives.id,
        createdAt: userPrimitives.createdAt,
        ...userData,
        profile: {
          create: {
            id: profilePrimitives.id,
            createdAt: profilePrimitives.createdAt,
            ...profileData,
          },
        },
      },
      update: {
        ...userData,
        profile: {
          update: profileData,
        },
      },
    };
  }

  /**
   * Converts a Prisma UserEntity (with its profile) to a User domain model.
   * @param entity The complete UserEntity from Prisma, including the profile relation.
   * @returns A User domain object instance.
   */
  toDomain(entity: UserEntity): User {
    if (!entity?.profile) {
      throw new Error(
        `Invalid or incomplete UserEntity provided for domain mapping: ID ${entity?.id ?? 'unknown'}`,
      );
    }

    const email = Email.create(entity.email);
    const password = Password.fromStoredHash(entity.password);
    const profile = this.profileToDomain(entity.profile);

    return User.fromPersistence(
      {
        id: entity.id,
        email,
        password,
        firstName: entity.firstName,
        lastName: entity.lastName,
        role: entity.role,
        isActive: entity.isActive,
        lastLoginAt: entity.lastLoginAt,
        loginAttempts: entity.loginAttempts,
        lockedUntil: entity.lockedUntil,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        deletedAt: entity.deletedAt,
      },
      profile,
    );
  }

  /**
   * Converts a UserProfileEntity from Prisma to a UserProfile domain model.
   * @private
   * @param profileEntity The UserProfileEntity from Prisma.
   * @returns A UserProfile domain object instance.
   */
  private profileToDomain(profileEntity: UserProfileEntity): UserProfile {
    const phoneNumber = profileEntity.phoneNumber
      ? PhoneNumber.create(profileEntity.phoneNumber)
      : null;

    return UserProfile.fromPersistence({
      id: profileEntity.id,
      userId: profileEntity.userId,
      phoneNumber,
      marketingOptIn: profileEntity.marketingOptIn,
      address: parseAddress(profileEntity.address),
      createdAt: profileEntity.createdAt,
      updatedAt: profileEntity.updatedAt,
    });
  }

  // ============================================================================
  // DOMAIN ↔ DTO MAPPING
  // ============================================================================

  /**
   * Maps a User domain object to a standard UserResponseDto for general user-facing endpoints.
   * @param user The User domain object.
   * @returns A UserResponseDto.
   */
  toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      email: user.email.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ?? undefined,
      lockedUntil: user.lockedUntil ?? undefined,
      loginAttempts: user.loginAttempts,
      deletedAt: user.deletedAt ?? undefined,
      isLocked: user.isLocked(),
      isDeleted: user.isDeleted,
    };
  }

  /**
   * Maps a User domain object to a detailed DTO for admin-facing endpoints.
   * @param user The User domain object.
   * @param activeSessions The number of active sessions for the user (data from another service).
   * @returns An AdminDetailedUserResponseDto.
   */
  toAdminDetailedUserResponse(user: User, activeSessions = 0): AdminDetailedUserResponseDto {
    return {
      ...this.toUserResponse(user),
      marketingOptIn: user.profile.marketingOptIn,
      profileCompletion: user.profile.completionPercentage,
      activeSessions: activeSessions,
    };
  }

  /**
   * Maps a user and contextual data to the response for creating a user (Admin).
   * @param user The newly created User domain object.
   * @param tempPassword The temporary password generated for the user.
   * @param emailSent Whether the welcome email was successfully sent.
   * @returns An AdminCreateUserResponseDto.
   */
  toAdminCreateUserResponse(
    user: User,
    tempPassword: string,
    emailSent: boolean,
  ): AdminCreateUserResponseDto {
    return {
      message: 'User created successfully.',
      user: this.toAdminDetailedUserResponse(user),
      temporaryPassword: tempPassword,
      emailSent: emailSent,
      isActive: user.isActive,
    };
  }

  /**
   * Maps an updated user to the response for an admin update action.
   * @param user The updated User domain object.
   * @param updatedFields A list of fields that were modified.
   * @returns An AdminUpdateUserResponseDto.
   */
  toAdminUpdateUserResponse(user: User, updatedFields: string[]): AdminUpdateUserResponseDto {
    return {
      message: 'User updated successfully.',
      user: this.toAdminDetailedUserResponse(user),
      updatedFields,
    };
  }

  /**
   * Maps the result of a bulk update operation to the AdminBulkUpdateUsersResponseDto.
   * @param context An object containing the results of the bulk update.
   * @returns An AdminBulkUpdateUsersResponseDto.
   */
  toAdminBulkUpdateUsersResponse(context: {
    usersUpdated: number;
    updatedUserIds: string[];
    failures: Array<{ userId: string; error: string }>;
    reason?: string;
  }): AdminBulkUpdateUsersResponseDto {
    return {
      message: 'Bulk update completed.',
      usersUpdated: context.usersUpdated,
      updatedUserIds: context.updatedUserIds,
      failedUserIds: context.failures.map((f) => f.userId),
      failures: context.failures,
      reason: context.reason,
    };
  }

  /**
   * Maps an updated user to the response for a self-update action.
   * @param user The updated User domain object.
   * @returns An UpdateMyUserResponseDto.
   */
  toUpdateMyUserResponse(user: User): UpdateMyUserResponseDto {
    return {
      message: 'User information updated successfully.',
      user: this.toUserResponse(user),
    };
  }

  /**
   * Maps a User domain object and additional data to the GetMyUserResponseDto.
   * @param user The User domain object.
   * @param context Additional data not stored on the core user model.
   * @returns A GetMyUserResponseDto.
   */
  toGetMyUserResponse(
    user: User,
    context: { activeSessions?: number; securityRecommendations?: string[] },
  ): GetMyUserResponseDto {
    const profile = user.profile;

    return {
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      email: user.email.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ?? undefined,
      lockedUntil: user.lockedUntil ?? undefined,
      loginAttempts: user.loginAttempts,
      deletedAt: user.deletedAt ?? undefined,
      isLocked: user.isLocked(),
      isDeleted: user.isDeleted,
      profileCompletion: profile.completionPercentage,
      activeSessions: context.activeSessions ?? 0,
      securityRecommendations: context.securityRecommendations ?? [],
    };
  }

  toAdminGetUserByIdResponse(
    user: User,
    context: {
      sessions: LoginSession[];
      roleHistory: any[];
    },
  ): AdminGetUserResponseDto {
    const detailedUser = this.toAdminDetailedUserResponse(user, context.sessions.length);

    return {
      ...detailedUser,
      sessions: context.sessions.map((session) => ({
        id: session.id,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress ?? undefined,
        userAgent: session.userAgent ?? undefined,
        deviceId: session.deviceId ?? undefined,
      })),
      roleHistory: context.roleHistory,
    };
  }

  /**
   * Maps the UserStats data object from the repository to the UserStatsResponseDto.
   */
  toUserStatsResponse(stats: UserStats): UserStatsResponseDto {
    return {
      total: stats.total,
      active: stats.active,
      inactive: stats.total - stats.active,
      deleted: stats.deleted,
      locked: stats.locked,
      newLast30Days: stats.newLast30Days,
      byRole: stats.byRole,
      averageProfileCompletion: 0,
      activeLast24Hours: stats.loginLast24Hours ?? 0,
      growthRate: 0,
    };
  }

  toDeactivateMyAccountResponse(context: {
    deactivatedAt: Date;
    sessionsTerminated: number;
  }): DeactivateMyAccountResponseDto {
    const reactivationAvailableAt = new Date(context.deactivatedAt);
    reactivationAvailableAt.setFullYear(reactivationAvailableAt.getFullYear() + 1);

    return {
      message: 'Account deactivated successfully.',
      deactivatedAt: context.deactivatedAt,
      sessionsTerminated: context.sessionsTerminated,
      reactivationAvailableAt,
    };
  }

  /**
   * Maps a paginated list of User domain objects to the admin-facing paginated response DTO.
   * @param paginatedResult The paginated result from the service/repository.
   * @returns A PaginatedUsersResponseDto.
   */
  toPaginatedUsersResponse(paginatedResult: PaginatedResult<User>): PaginatedUsersResponseDto {
    const data = paginatedResult.data.map((user) => this.toAdminDetailedUserResponse(user));

    return {
      data,
      meta: {
        total: paginatedResult.meta.total,
        page: paginatedResult.meta.page,
        limit: paginatedResult.meta.limit,
        totalPages: paginatedResult.meta.totalPages,
        hasNext: paginatedResult.meta.hasNext,
        hasPrev: paginatedResult.meta.hasPrevious,
      },
    };
  }

  /**
   * Maps data to the response for a user role change.
   * @param user The user whose role was changed.
   * @param previousRole The user's role before the change.
   * @param changedBy The email of the admin who made the change.
   * @param reason The reason for the role change.
   * @param userNotified Whether the user was notified.
   * @returns An UpdateUserRoleResponseDto.
   */
  toUpdateUserRoleResponse(
    user: User,
    context: {
      previousRole: UserRole;
      changedBy: string;
      reason?: string;
      userNotified: boolean;
    },
  ): UpdateUserRoleResponseDto {
    return {
      message: 'User role updated successfully.',
      user: this.toAdminDetailedUserResponse(user),
      previousRole: context.previousRole,
      newRole: user.role,
      changedBy: context.changedBy,
      reason: context.reason,
      userNotified: context.userNotified,
    };
  }

  /**
   * Maps data to the response for locking a user account.
   * @param user The user who was locked.
   * @param context Additional context for the response.
   * @returns A LockUserAccountResponseDto.
   */
  toLockUserAccountResponse(
    user: User,
    context: {
      reason: string;
      lockedBy: string;
      userNotified: boolean;
      sessionsTerminated: number;
    },
  ): LockUserAccountResponseDto {
    if (!user.lockedUntil) {
      throw new Error('Cannot create lock response for a user who is not locked.');
    }
    return {
      message: 'User account locked successfully.',
      userId: user.id,
      lockedUntil: user.lockedUntil,
      reason: context.reason,
      lockedBy: context.lockedBy,
      userNotified: context.userNotified,
      sessionsTerminated: context.sessionsTerminated,
    };
  }

  /**
   * Maps data to the response for unlocking a user account.
   * @param user The user who was unlocked.
   * @param context Additional context for the response.
   * @returns An UnlockUserAccountResponseDto.
   */
  toUnlockUserAccountResponse(
    user: User,
    context: {
      unlockedBy: string;
      reason?: string;
      userNotified: boolean;
    },
  ): UnlockUserAccountResponseDto {
    return {
      message: 'User account unlocked successfully.',
      userId: user.id,
      loginAttempts: user.loginAttempts,
      unlockedBy: context.unlockedBy,
      reason: context.reason,
      userNotified: context.userNotified,
    };
  }

  /**
   * Maps data to the response for soft-deleting a user account.
   * @param user The user who was deleted.
   * @param context Additional context for the response.
   * @returns A SoftDeleteUserResponseDto.
   */
  toSoftDeleteUserResponse(
    user: User,
    context: {
      reason: string;
      deletedBy: string;
      permanent: boolean;
      userNotified: boolean;
      sessionsTerminated: number;
      dataScheduledForDeletion: string[];
    },
  ): SoftDeleteUserResponseDto {
    if (!user.deletedAt) {
      throw new Error('Cannot create delete response for a user who is not deleted.');
    }
    return {
      message: 'User account deleted successfully.',
      userId: user.id,
      deletedAt: user.deletedAt,
      reason: context.reason,
      deletedBy: context.deletedBy,
      permanent: context.permanent,
      userNotified: context.userNotified,
      sessionsTerminated: context.sessionsTerminated,
      dataScheduledForDeletion: context.dataScheduledForDeletion,
    };
  }

  /**
   * Maps data to the response for restoring a soft-deleted user account.
   * @param user The user who was restored.
   * @param context Additional context for the response.
   * @returns A RestoreUserResponseDto.
   */
  toRestoreUserResponse(
    user: User,
    context: {
      restoredBy: string;
      reason?: string;
      reactivated: boolean;
    },
  ): RestoreUserResponseDto {
    return {
      message: 'User account restored successfully.',
      user: this.toAdminDetailedUserResponse(user),
      restoredBy: context.restoredBy,
      reason: context.reason,
      reactivated: context.reactivated,
    };
  }
}
