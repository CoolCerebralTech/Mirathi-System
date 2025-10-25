import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService, User, UserProfile, RoleChange, UserRole } from '@shamba/database';
import { UserQueryDto, RoleChangeQueryDto, SortOrder } from '@shamba/common';

/**
 * Pure data access layer for user-related operations.
 * No business logic - only database queries and transactions.
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // CREATE OPERATIONS
  // ============================================================================

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async createWithProfile(
    userData: Omit<Prisma.UserCreateInput, 'profile'>,
    profileData?: Omit<Prisma.UserProfileCreateInput, 'user'>,
  ): Promise<User & { profile: UserProfile | null }> {
    return this.prisma.user.create({
      data: {
        ...userData,
        profile: profileData ? { create: profileData } : { create: {} },
      },
      include: { profile: true },
    });
  }

  // ============================================================================
  // READ OPERATIONS - USERS
  // ============================================================================

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async findByIdWithProfile(id: string): Promise<(User & { profile: UserProfile | null }) | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: { profile: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  async findByEmailWithProfile(
    email: string,
  ): Promise<(User & { profile: UserProfile | null }) | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
        deletedAt: null,
      },
      include: { profile: true },
    });
  }

  async findOneOrFail(where: Prisma.UserWhereUniqueInput): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: {
        ...where,
        deletedAt: null,
      },
    });
    if (!user) {
      throw new NotFoundException(`User ${where.id || where.email || 'not found'}`);
    }
    return user;
  }

  async findOneOrFailWithProfile(
    where: Prisma.UserWhereUniqueInput,
  ): Promise<User & { profile: UserProfile | null }> {
    const user = await this.prisma.user.findUnique({
      where: {
        ...where,
        deletedAt: null,
      },
      include: { profile: true },
    });
    if (!user) {
      throw new NotFoundException(`User ${where.id || where.email || 'not found'}`);
    }
    return user;
  }

  async findMany(
    query: UserQueryDto,
  ): Promise<{ users: (User & { profile: UserProfile | null })[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = SortOrder.DESC,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { profile: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        email,
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        id,
        deletedAt: null,
      },
    });
    return count > 0;
  }

  // ============================================================================
  // UPDATE OPERATIONS - USERS
  // ============================================================================

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: {
        id,
        deletedAt: null,
      },
      data,
    });
  }

  async updateWithProfile(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<User & { profile: UserProfile | null }> {
    return this.prisma.user.update({
      where: {
        id,
        deletedAt: null,
      },
      data,
      include: { profile: true },
    });
  }

  async updateLoginSuccess(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
        loginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async incrementLoginAttempts(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const updatedAttempts = user.loginAttempts + 1;
    let lockedUntil: Date | null = null;

    // Lock account after 5 failed attempts for 30 minutes
    if (updatedAttempts >= 5) {
      lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + 30);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        loginAttempts: updatedAttempts,
        lockedUntil,
      },
    });
  }

  // ============================================================================
  // DELETE OPERATIONS - USERS
  // ============================================================================

  async softDelete(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        email: `deleted_${Date.now()}_${user.email}`,
      },
    });
  }

  async hardDelete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  // ============================================================================
  // PROFILE OPERATIONS
  // ============================================================================

  async findProfileByUserId(userId: string): Promise<UserProfile | null> {
    return this.prisma.userProfile.findUnique({
      where: { userId },
    });
  }

  async createProfile(data: Prisma.UserProfileCreateInput): Promise<UserProfile> {
    return this.prisma.userProfile.create({ data });
  }

  async updateProfile(userId: string, data: Prisma.UserProfileUpdateInput): Promise<UserProfile> {
    return this.prisma.userProfile.update({
      where: { userId },
      data,
    });
  }

  async upsertProfile(
    userId: string,
    data: Omit<Prisma.UserProfileCreateInput, 'user'>,
  ): Promise<UserProfile> {
    return this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });
  }

  async markEmailAsVerified(userId: string): Promise<UserProfile> {
    return this.prisma.userProfile.update({
      where: { userId },
      data: { emailVerified: true },
    });
  }

  async markPhoneAsVerified(userId: string): Promise<UserProfile> {
    return this.prisma.userProfile.update({
      where: { userId },
      data: { phoneVerified: true },
    });
  }

  // ============================================================================
  // TOKEN OPERATIONS
  // ============================================================================

  async createPasswordResetToken(data: Prisma.PasswordResetTokenCreateInput): Promise<any> {
    return this.prisma.passwordResetToken.create({ data });
  }

  async findPasswordResetToken(tokenHash: string): Promise<any> {
    return this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async invalidatePasswordResetToken(tokenHash: string): Promise<any> {
    return this.prisma.passwordResetToken.update({
      where: { tokenHash },
      data: { used: true },
    });
  }

  async deletePasswordResetToken(tokenHash: string): Promise<any> {
    return this.prisma.passwordResetToken.delete({ where: { tokenHash } });
  }

  async deleteExpiredPasswordResetTokens(): Promise<{ count: number }> {
    const result = await this.prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return { count: result.count };
  }

  // ============================================================================
  // SESSION OPERATIONS
  // ============================================================================

  async createRefreshToken(data: Prisma.RefreshTokenCreateInput): Promise<any> {
    return this.prisma.refreshToken.create({ data });
  }

  async findRefreshToken(tokenHash: string): Promise<any> {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  async deleteRefreshToken(tokenHash: string): Promise<any> {
    return this.prisma.refreshToken.delete({ where: { tokenHash } });
  }

  async deleteAllUserRefreshTokens(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
    return { count: result.count };
  }

  async deleteExpiredRefreshTokens(): Promise<{ count: number }> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return { count: result.count };
  }

  // ============================================================================
  // ROLE CHANGE OPERATIONS
  // ============================================================================

  async createRoleChange(data: Prisma.RoleChangeCreateInput): Promise<RoleChange> {
    return this.prisma.roleChange.create({ data });
  }

  async findRoleChanges(query: RoleChangeQueryDto): Promise<{
    roleChanges: (RoleChange & { user?: { firstName: string; lastName: string; email: string } })[];
    total: number;
  }> {
    const {
      page = 1,
      limit = 10,
      userId,
      changedBy,
      sortBy = 'createdAt',
      sortOrder = SortOrder.DESC,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.RoleChangeWhereInput = {
      ...(userId && { userId }),
      ...(changedBy && { changedBy }),
    };

    const orderBy: Prisma.RoleChangeOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [roleChanges, total] = await this.prisma.$transaction([
      this.prisma.roleChange.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.roleChange.count({ where }),
    ]);

    return { roleChanges, total };
  }

  async findRoleChangesByUserId(
    userId: string,
    query: RoleChangeQueryDto,
  ): Promise<{
    roleChanges: (RoleChange & { user?: { firstName: string; lastName: string; email: string } })[];
    total: number;
  }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = SortOrder.DESC } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.RoleChangeWhereInput = { userId };

    const orderBy: Prisma.RoleChangeOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [roleChanges, total] = await this.prisma.$transaction([
      this.prisma.roleChange.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.roleChange.count({ where }),
    ]);

    return { roleChanges, total };
  }

  // ============================================================================
  // COMPLEX TRANSACTIONS
  // ============================================================================

  /**
   * Update user role and create audit record in a transaction.
   * This ensures both operations succeed or both fail.
   */
  async updateUserRoleWithAudit(
    userId: string,
    oldRole: UserRole,
    newRole: UserRole,
    changedBy: string,
    reason?: string,
  ): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: {
          id: userId,
          deletedAt: null,
        },
        data: { role: newRole },
      });

      await tx.roleChange.create({
        data: {
          userId,
          oldRole,
          newRole,
          changedBy,
          reason,
        },
      });

      return updatedUser;
    });
  }

  /**
   * Soft delete user and cleanup sessions in a transaction.
   */
  async softDeleteUserWithCleanup(userId: string): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      // Verify user exists
      const user = await tx.user.findUnique({
        where: {
          id: userId,
          deletedAt: null,
        },
      });
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      // Delete all refresh tokens
      await tx.refreshToken.deleteMany({
        where: { userId },
      });

      // Soft delete user
      const deletedUser = await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          isActive: false,
          email: `deleted_${Date.now()}_${user.email}`,
        },
      });

      return deletedUser;
    });
  }

  /**
   * Reset password and invalidate sessions in a transaction.
   */
  async resetPasswordWithCleanup(
    userId: string,
    hashedPassword: string,
    tokenId: string,
  ): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      const [updatedUser] = await Promise.all([
        tx.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        }),
        tx.passwordResetToken.update({
          where: { id: tokenId },
          data: { used: true },
        }),
        tx.refreshToken.deleteMany({
          where: { userId },
        }),
      ]);

      return updatedUser;
    });
  }

  // ============================================================================
  // STATISTICS & ANALYTICS
  // ============================================================================

  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    lockedUsers: number;
    usersByRole: Record<UserRole, number>;
  }> {
    const [totalUsers, activeUsers, verifiedUsers, lockedUsers, usersByRole] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.userProfile.count({ where: { emailVerified: true } }),
      this.prisma.user.count({ where: { deletedAt: null, lockedUntil: { not: null } } }),
      this.prisma.user.groupBy({
        by: ['role'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
    ]);

    const roleCounts = usersByRole.reduce(
      (acc, item) => {
        acc[item.role] = item._count._all;
        return acc;
      },
      {} as Record<UserRole, number>,
    );

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      lockedUsers,
      usersByRole: roleCounts,
    };
  }

  async getRecentRegistrations(days: number = 7): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return this.prisma.user.count({
      where: {
        createdAt: { gte: date },
        deletedAt: null,
      },
    });
  }
}
