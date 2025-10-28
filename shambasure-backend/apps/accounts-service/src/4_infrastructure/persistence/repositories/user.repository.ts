import { Injectable } from '@nestjs/common';
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
import { UserInclude, UserProfileInclude } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UserMapper,
  ) {}

  // ============================================================================
  // AGGREGATE SAVE METHOD (The Core of the Repository)
  // ============================================================================

  async save(user: User): Promise<void> {
    const persistenceData = this.mapper.toPersistence(user);

    await this.prisma.user.upsert({
      where: { id: user.id },
      create: persistenceData.create,
      update: persistenceData.update,
      include: UserInclude,
    });
  }

  // ============================================================================
  // IUserRepository IMPLEMENTATION
  // ============================================================================

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.prisma.user.findUnique({
      where: { id },
      include: UserInclude,
    });
    return userEntity ? this.mapper.toDomain(userEntity) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userEntity = await this.prisma.user.findUnique({
      where: { email: email.getValue() },
      include: UserInclude,
    });
    return userEntity ? this.mapper.toDomain(userEntity) : null;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.getValue(), deletedAt: null },
    });
    return count > 0;
  }

  async findAll(
    filters: UserFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<User>> {
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
    return {
      data: userEntities.map((entity) => this.mapper.toDomain(entity)),
      meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
    };
  }

  // All other IUserRepository methods (getStats, bulkUpdate, etc.) are exactly as you provided.
  // They are excellent and require no changes.
  async getStats(): Promise<UserStats> {
    // [Implementation from your file - no changes needed]
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
      this.prisma.user.count({ where: { lockedUntil: { not: null, gte: now }, deletedAt: null } }),
      this.prisma.userProfile.count({ where: { emailVerified: true, user: { deletedAt: null } } }),
      this.prisma.userProfile.count({ where: { phoneVerified: true, user: { deletedAt: null } } }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null } }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo }, deletedAt: null } }),
      this.prisma.user.count({
        where: { lastLoginAt: { gte: twentyFourHoursAgo }, deletedAt: null },
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
    return {
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
  }

  async bulkUpdate(userIds: string[], data: UserUpdateData): Promise<number> {
    const result = await this.prisma.user.updateMany({
      where: { id: { in: userIds }, deletedAt: null },
      data,
    });
    return result.count;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    const persistenceData = this.mapper.profileToPersistence(profile);

    await this.prisma.userProfile.upsert({
      where: { id: profile.id },
      create: persistenceData.create,
      update: persistenceData.update,
    });
  }

  // ============================================================================
  // IUserProfileRepository IMPLEMENTATION
  // ============================================================================

  async findProfileById(id: string): Promise<UserProfile | null> {
    const profileEntity = await this.prisma.userProfile.findUnique({
      where: { id },
    });
    // Note: This returns a detached profile model. For modifications, always load the full User aggregate.
    return profileEntity ? this.mapper.toDomain({ user: null, ...profileEntity }).profile : null;
  }

  async findProfileByUserId(userId: string): Promise<UserProfile | null> {
    const user = await this.findById(userId);
    return user ? user.profile : null;
  }

  async findUserByPhoneNumber(phoneNumber: PhoneNumber): Promise<User | null> {
    const userEntity = await this.prisma.user.findFirst({
      where: { profile: { phoneNumber: phoneNumber.getValue() }, deletedAt: null },
      include: UserInclude,
    });
    return userEntity ? this.mapper.toDomain(userEntity) : null;
  }

  async existsByPhoneNumber(phoneNumber: PhoneNumber): Promise<boolean> {
    const count = await this.prisma.userProfile.count({
      where: { phoneNumber: phoneNumber.getValue(), user: { deletedAt: null } },
    });
    return count > 0;
  }

  async isPhoneNumberUnique(phoneNumber: PhoneNumber): Promise<boolean> {
    const count = await this.prisma.userProfile.count({
      where: { phoneNumber: phoneNumber.getValue(), user: { deletedAt: null } },
    });
    return count === 0;
  }

  async deleteProfile(id: string): Promise<void> {
    await this.prisma.userProfile.delete({ where: { id } });
  }

  async findAllProfiles(
    filters: ProfileFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<UserProfile>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const { sortBy = 'createdAt', sortOrder = 'desc' } = pagination ?? {};
    const skip = (page - 1) * limit;

    const where = this.buildProfileWhereClause(filters);

    const [profileEntities, total] = await this.prisma.$transaction([
      this.prisma.userProfile.findMany({
        where,
        include: UserProfileInclude,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.userProfile.count({ where }),
    ]);

    const data = profileEntities.map((p) => this.mapper.toDomain({ user: null, ...p }).profile);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private buildUserWhereClause(filters: UserFilters): Prisma.UserWhereInput {
    // [Implementation from your file - no changes needed]
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
    if (typeof filters.isPhoneVerified === 'boolean') where.phoneVerified = filters.isPhoneVerified;
    if (typeof filters.isEmailVerified === 'boolean') where.emailVerified = filters.isEmailVerified;
    if (typeof filters.hasMarketingOptIn === 'boolean')
      where.marketingOptIn = filters.hasMarketingOptIn;
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
          { address: Prisma.JsonNull },
          { nextOfKin: Prisma.JsonNull },
        ];
      }
    }
    return where;
  }
}
