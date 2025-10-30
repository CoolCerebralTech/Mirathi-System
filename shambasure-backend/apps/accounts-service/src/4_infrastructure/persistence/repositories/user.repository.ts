import { Injectable, Logger } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '@shamba/database';
import {
  IUserRepository,
  IUserProfileRepository,
  UserFilters,
  ProfileFilters,
  PaginationOptions,
  PaginatedResult,
  UserStats,
  UserUpdateData,
} from '../../../3_domain/interfaces';
import { User } from '../../../3_domain/models/user.model';
import { UserProfile } from '../../../3_domain/models/user-profile.model';
import { Email, PhoneNumber } from '../../../3_domain/value-objects';
import { UserEntity, UserInclude, UserProfileInclude } from '../entities/account.entity';
import { UserMapper } from '../mappers/user.mapper';

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

export class UserRepositoryError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'UserRepositoryError';
  }
}

export class UserNotFoundError extends UserRepositoryError {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export class ProfileNotFoundError extends UserRepositoryError {
  constructor(profileId: string) {
    super(`Profile not found: ${profileId}`);
    this.name = 'ProfileNotFoundError';
  }
}

// ============================================================================
// PRISMA USER REPOSITORY
// ============================================================================

/**
 * PrismaUserRepository
 *
 * Concrete implementation of both IUserRepository and IUserProfileRepository.
 * This class is the definitive persistence gatekeeper for the entire User aggregate root.
 * By centralizing all user and profile operations, it guarantees transactional consistency
 * and enforces the aggregate boundary, preventing direct modification of child entities.
 */
@Injectable()
export class PrismaUserRepository implements IUserRepository, IUserProfileRepository {
  private readonly logger = new Logger(PrismaUserRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UserMapper,
  ) {}

  // ============================================================================
  // AGGREGATE SAVE METHOD (The Core of the Repository)
  // ============================================================================

  async save(user: User): Promise<void> {
    try {
      const persistenceData = this.mapper.toPersistence(user);

      // Use a transaction to ensure both User and UserProfile are saved atomically.
      await this.prisma.$transaction(async (tx) => {
        // Prisma's nested write will handle the transaction for User and its Profile.
        await tx.user.upsert({
          where: { id: user.id },
          create: persistenceData.create,
          update: persistenceData.update,
        });
      });

      this.logger.debug(`Successfully saved user aggregate in transaction: ${user.id}`);
    } catch (error) {
      this.logger.error(`Failed to save user aggregate: ${user.id}`, error);
      throw new UserRepositoryError(`Failed to save user ${user.id}`, error);
    }
  }

  async saveWithTransaction(user: User): Promise<void> {
    try {
      const persistenceData = this.mapper.toPersistence(user);

      await this.prisma.$transaction(async (tx) => {
        // Update user
        await tx.user.upsert({
          where: { id: user.id },
          create: persistenceData.create,
          update: persistenceData.update,
        });

        // Update profile separately to ensure both are saved
        const profilePersistence = this.mapper.profileToPersistence(user.profile);
        await tx.userProfile.upsert({
          where: { id: user.profile.id },
          create: profilePersistence.create,
          update: profilePersistence.update,
        });
      });

      this.logger.debug(`Successfully saved user aggregate in transaction: ${user.id}`);
    } catch (error) {
      this.logger.error(`Failed to save user aggregate in transaction: ${user.id}`, error);
      throw new UserRepositoryError(`Failed to save user ${user.id} in transaction`, error);
    }
  }

  // ============================================================================
  // IUserRepository IMPLEMENTATION
  // ============================================================================

  async findById(id: string): Promise<User | null> {
    try {
      const userEntity = await this.prisma.user.findUnique({
        where: { id },
        include: UserInclude,
      });

      if (!userEntity) {
        this.logger.debug(`User not found by ID: ${id}`);
        return null;
      }

      const user = this.mapper.toDomain(userEntity);
      this.logger.debug(`Successfully found user by ID: ${id}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user by ID: ${id}`, error);
      throw new UserRepositoryError(`Failed to find user by ID: ${id}`, error);
    }
  }

  async findByEmail(email: Email): Promise<User | null> {
    try {
      const userEntity = await this.prisma.user.findUnique({
        where: { email: email.getValue() },
        include: UserInclude,
      });

      if (!userEntity) {
        this.logger.debug(`User not found by email: ${email.getValue()}`);
        return null;
      }

      const user = this.mapper.toDomain(userEntity);
      this.logger.debug(`Successfully found user by email: ${email.getValue()}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user by email: ${email.getValue()}`, error);
      throw new UserRepositoryError(`Failed to find user by email: ${email.getValue()}`, error);
    }
  }
  async findByEmailWithProfile(email: Email): Promise<User | null> {
    try {
      const userEntity = await this.prisma.user.findUnique({
        where: { email: email.getValue() },
        include: { profile: true }, // The key change: always include the profile
      });

      if (!userEntity) {
        this.logger.debug(`User with profile not found by email: ${email.getValue()}`);
        return null;
      }

      const user = this.mapper.toDomain(userEntity as UserEntity); // Cast to ensure profile is included
      this.logger.debug(`Successfully found user with profile by email: ${email.getValue()}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user with profile by email: ${email.getValue()}`, error);
      throw new UserRepositoryError(
        `Failed to find user with profile by email: ${email.getValue()}`,
        error,
      );
    }
  }

  async findByIdWithProfile(id: string): Promise<User | null> {
    const entity = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    return entity ? this.mapper.toDomain(entity as UserEntity) : null;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    try {
      const count = await this.prisma.user.count({
        where: { email: email.getValue(), deletedAt: null },
      });

      const exists = count > 0;
      this.logger.debug(`Checked email existence: ${email.getValue()} -> ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(`Failed to check email existence: ${email.getValue()}`, error);
      throw new UserRepositoryError(`Failed to check email existence: ${email.getValue()}`, error);
    }
  }

  async findAll(
    filters: UserFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<User>> {
    try {
      const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const skip = (page - 1) * limit;
      const where = this.buildUserWhereClause(filters);

      const [userEntities, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,
          include: UserInclude,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        this.prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);
      const result = {
        data: userEntities.map((entity) => this.mapper.toDomain(entity)),
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };

      this.logger.debug(`Found ${userEntities.length} users with filters and pagination`);
      return result;
    } catch (error) {
      this.logger.error('Failed to find all users with filters and pagination', error);
      throw new UserRepositoryError('Failed to find all users', error);
    }
  }

  async getStats(): Promise<UserStats> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const now = new Date();

      const [
        total,
        active,
        deleted,
        locked,
        emailVerified,
        phoneVerified,
        newLast30Days,
        newLast7Days,
        loginLast24Hours,
        byRoleRaw,
      ] = await this.prisma.$transaction([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
        this.prisma.user.count({ where: { deletedAt: { not: null } } }),
        this.prisma.user.count({
          where: {
            lockedUntil: { not: null, gte: now },
            deletedAt: null,
          },
        }),
        this.prisma.userProfile.count({
          where: {
            emailVerified: true,
            user: { deletedAt: null },
          },
        }),
        this.prisma.userProfile.count({
          where: {
            phoneVerified: true,
            user: { deletedAt: null },
          },
        }),
        this.prisma.user.count({
          where: {
            createdAt: { gte: thirtyDaysAgo },
            deletedAt: null,
          },
        }),
        this.prisma.user.count({
          where: {
            createdAt: { gte: sevenDaysAgo },
            deletedAt: null,
          },
        }),
        this.prisma.user.count({
          where: {
            lastLoginAt: { gte: twentyFourHoursAgo },
            deletedAt: null,
          },
        }),
        this.prisma.user.groupBy({
          by: ['role'],
          _count: { role: true },
          where: { deletedAt: null },
          orderBy: { _count: { role: 'desc' } },
        }),
      ]);

      const byRole = Object.values(UserRole).reduce(
        (acc, role) => {
          acc[role] = 0;
          return acc;
        },
        {} as Record<UserRole, number>,
      );

      byRoleRaw.forEach((group) => {
        const role = group.role;
        const count =
          typeof group._count === 'object' && typeof group._count.role === 'number'
            ? group._count.role
            : 0;
        byRole[role] = count;
      });

      const stats: UserStats = {
        total,
        active,
        inactive: total - active,
        deleted,
        locked,
        emailVerified,
        phoneVerified,
        byRole,
        newLast30Days,
        newLast7Days,
        loginLast24Hours,
      };

      this.logger.debug('Successfully calculated user statistics');
      return stats;
    } catch (error) {
      this.logger.error('Failed to calculate user statistics', error);
      throw new UserRepositoryError('Failed to calculate user statistics', error);
    }
  }

  async bulkUpdate(userIds: string[], data: UserUpdateData): Promise<number> {
    try {
      const result = await this.prisma.user.updateMany({
        where: { id: { in: userIds }, deletedAt: null },
        data,
      });

      this.logger.debug(`Bulk updated ${result.count} users`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to bulk update users: ${userIds.join(', ')}`, error);
      throw new UserRepositoryError('Failed to bulk update users', error);
    }
  }
  async findRoleChangesByUserId(userId: string): Promise<any[]> {
    try {
      const roleChanges = await this.prisma.roleChange.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      // For now, we can return the raw Prisma entities. A mapper would be better long-term.
      return roleChanges;
    } catch (error) {
      this.logger.error(`Failed to find role changes for user: ${userId}`, error);
      throw new UserRepositoryError(`Failed to find role changes for user: ${userId}`, error);
    }
  }
  async bulkUpdateProfiles(userIds: string[], data: { emailVerified?: boolean }): Promise<number> {
    const result = await this.prisma.userProfile.updateMany({
      where: { userId: { in: userIds } },
      data,
    });
    return result.count;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      const persistenceData = this.mapper.profileToPersistence(profile);

      await this.prisma.userProfile.upsert({
        where: { id: profile.id },
        create: persistenceData.create,
        update: persistenceData.update,
      });

      this.logger.debug(`Successfully saved user profile: ${profile.id}`);
    } catch (error) {
      this.logger.error(`Failed to save user profile: ${profile.id}`, error);
      throw new UserRepositoryError(`Failed to save user profile: ${profile.id}`, error);
    }
  }

  // ============================================================================
  // IUserProfileRepository IMPLEMENTATION
  // ============================================================================

  async findProfileById(id: string): Promise<UserProfile | null> {
    try {
      const profileEntity = await this.prisma.userProfile.findUnique({
        where: { id },
      });

      if (!profileEntity) {
        this.logger.debug(`Profile not found by ID: ${id}`);
        return null;
      }

      // Create a temporary user structure to use the mapper
      const tempUser = {
        id: profileEntity.userId,
        email: 'temp@email.com', // Required but not used
        password: 'temp',
        firstName: 'temp',
        lastName: 'temp',
        role: UserRole.USER,
        isActive: true,
        lastLoginAt: null,
        loginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        profile: profileEntity,
      } as UserEntity;

      const user = this.mapper.toDomain(tempUser);
      this.logger.debug(`Successfully found profile by ID: ${id}`);
      return user.profile;
    } catch (error) {
      this.logger.error(`Failed to find profile by ID: ${id}`, error);
      throw new UserRepositoryError(`Failed to find profile by ID: ${id}`, error);
    }
  }

  async findProfileByUserId(userId: string): Promise<UserProfile | null> {
    try {
      const user = await this.findById(userId);
      const profile = user ? user.profile : null;

      if (!profile) {
        this.logger.debug(`Profile not found for user ID: ${userId}`);
      } else {
        this.logger.debug(`Successfully found profile for user ID: ${userId}`);
      }

      return profile;
    } catch (error) {
      this.logger.error(`Failed to find profile by user ID: ${userId}`, error);
      throw new UserRepositoryError(`Failed to find profile by user ID: ${userId}`, error);
    }
  }

  // FIX: Changed from findUserByPhoneNumber to findProfileByPhoneNumber to match interface
  async findProfileByPhoneNumber(phoneNumber: PhoneNumber): Promise<UserProfile | null> {
    try {
      const userEntity = await this.prisma.user.findFirst({
        where: {
          profile: {
            phoneNumber: phoneNumber.getValue(),
          },
          deletedAt: null,
        },
        include: UserInclude,
      });

      if (!userEntity) {
        this.logger.debug(`User not found by phone number: ${phoneNumber.getValue()}`);
        return null;
      }

      const user = this.mapper.toDomain(userEntity);
      this.logger.debug(`Successfully found profile by phone number: ${phoneNumber.getValue()}`);
      return user.profile;
    } catch (error) {
      this.logger.error(`Failed to find profile by phone number: ${phoneNumber.getValue()}`, error);
      throw new UserRepositoryError(
        `Failed to find profile by phone number: ${phoneNumber.getValue()}`,
        error,
      );
    }
  }

  async isPhoneNumberUnique(phoneNumber: PhoneNumber): Promise<boolean> {
    try {
      const count = await this.prisma.userProfile.count({
        where: {
          phoneNumber: phoneNumber.getValue(),
          user: { deletedAt: null },
        },
      });

      const isUnique = count === 0;
      this.logger.debug(
        `Checked phone number uniqueness: ${phoneNumber.getValue()} -> ${isUnique}`,
      );
      return isUnique;
    } catch (error) {
      this.logger.error(
        `Failed to check phone number uniqueness: ${phoneNumber.getValue()}`,
        error,
      );
      throw new UserRepositoryError(
        `Failed to check phone number uniqueness: ${phoneNumber.getValue()}`,
        error,
      );
    }
  }

  async deleteProfile(id: string): Promise<void> {
    try {
      await this.prisma.userProfile.delete({ where: { id } });
      this.logger.debug(`Successfully deleted profile: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete profile: ${id}`, error);
      throw new UserRepositoryError(`Failed to delete profile: ${id}`, error);
    }
  }

  async findAllProfiles(filters: ProfileFilters): Promise<UserProfile[]> {
    try {
      const where = this.buildProfileWhereClause(filters);

      const profileEntities = await this.prisma.userProfile.findMany({
        where,
        include: UserProfileInclude,
        orderBy: { createdAt: 'desc' },
      });

      // Create temporary user structures to use the mapper
      const profiles = profileEntities.map((entity) => {
        const tempUser = {
          id: entity.userId,
          email: 'temp@email.com',
          password: 'temp',
          firstName: 'temp',
          lastName: 'temp',
          role: UserRole.USER,
          isActive: true,
          lastLoginAt: null,
          loginAttempts: 0,
          lockedUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          profile: entity,
        } as UserEntity;

        return this.mapper.toDomain(tempUser).profile;
      });

      this.logger.debug(`Found ${profiles.length} profiles with filters`);
      return profiles;
    } catch (error) {
      this.logger.error('Failed to find all profiles with filters', error);
      throw new UserRepositoryError('Failed to find all profiles', error);
    }
  }

  // ============================================================================
  // ADDITIONAL UTILITY METHODS
  // ============================================================================

  async softDelete(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });

      this.logger.debug(`Successfully soft-deleted user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to soft-delete user: ${userId}`, error);
      throw new UserRepositoryError(`Failed to soft-delete user: ${userId}`, error);
    }
  }

  async findByRole(role: UserRole, limit?: number): Promise<User[]> {
    try {
      const userEntities = await this.prisma.user.findMany({
        where: {
          role,
          deletedAt: null,
        },
        include: UserInclude,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      const users = userEntities.map((entity) => this.mapper.toDomain(entity));
      this.logger.debug(`Found ${users.length} users with role: ${role}`);
      return users;
    } catch (error) {
      this.logger.error(`Failed to find users by role: ${role}`, error);
      throw new UserRepositoryError(`Failed to find users by role: ${role}`, error);
    }
  }

  async count(filters?: UserFilters): Promise<number> {
    try {
      const where = filters ? this.buildUserWhereClause(filters) : {};
      const count = await this.prisma.user.count({ where });

      this.logger.debug(`Counted ${count} users with filters`);
      return count;
    } catch (error) {
      this.logger.error('Failed to count users', error);
      throw new UserRepositoryError('Failed to count users', error);
    }
  }

  // ============================================================================
  // PRIVATE HELPERS (No changes needed - they are excellent)
  // ============================================================================

  private buildUserWhereClause(filters: UserFilters): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (filters.isDeleted === true) {
      where.deletedAt = { not: null };
    } else if (filters.isDeleted === false) {
      where.deletedAt = null;
    }

    if (typeof filters.isActive === 'boolean') {
      where.isActive = filters.isActive;
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (typeof filters.isLocked === 'boolean') {
      where.lockedUntil = filters.isLocked ? { not: null, gte: new Date() } : null;
    }

    if (typeof filters.emailVerified === 'boolean') {
      where.profile = { emailVerified: filters.emailVerified };
    }

    if (filters.search) {
      const search = { contains: filters.search, mode: 'insensitive' as const };
      where.OR = [
        { email: search },
        { firstName: search },
        { lastName: search },
        { profile: { phoneNumber: search } },
      ];
    }

    return where;
  }

  private buildProfileWhereClause(filters: ProfileFilters): Prisma.UserProfileWhereInput {
    const where: Prisma.UserProfileWhereInput = { user: { deletedAt: null } };

    if (typeof filters.isPhoneVerified === 'boolean') {
      where.phoneVerified = filters.isPhoneVerified;
    }

    if (typeof filters.isEmailVerified === 'boolean') {
      where.emailVerified = filters.isEmailVerified;
    }

    if (typeof filters.hasMarketingOptIn === 'boolean') {
      where.marketingOptIn = filters.hasMarketingOptIn;
    }

    if (typeof filters.isComplete === 'boolean') {
      if (filters.isComplete) {
        where.AND = [
          { bio: { not: null } },
          { phoneNumber: { not: null } },
          { phoneVerified: true },
          { emailVerified: true },
          { address: { not: Prisma.JsonNull } },
          { nextOfKin: { not: Prisma.JsonNull } },
        ];
      } else {
        where.OR = [
          { bio: null },
          { phoneNumber: null },
          { phoneVerified: false },
          { emailVerified: false },
          { address: { equals: Prisma.JsonNull } },
          { nextOfKin: { equals: Prisma.JsonNull } },
        ];
      }
    }

    return where;
  }
}
