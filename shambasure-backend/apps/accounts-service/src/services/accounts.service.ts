import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, UserProfile, RoleChange, UserRole } from '@shamba/database';
import { PrismaService } from '@shamba/database';
import { MessagingService } from '@shamba/messaging';
import {
  UpdateMyUserDto,
  UpdateMyProfileDto,
  UserQueryDto,
  AdminUpdateUserDto,
  RoleChangeQueryDto,
  UserResponseDto,
  DetailedUserResponseDto,
  PaginatedUsersResponseDto,
  UpdateUserResponseDto,
  UpdateProfileResponseDto,
  createPaginationMeta,
  AddressDto,
  NextOfKinDto,
  BaseEvent,
  EventPattern,
  UserUpdatedData,
  UserDeletedData,
  UpdateUserRoleRequestDto,
  PaginationMetaDto,
} from '@shamba/common';
import { UserWithProfile } from '@shamba/auth';

// Define a type for the paginated response of raw data
type PaginatedRoleChangesResult = {
  data: (RoleChange & { user?: { firstName: string; lastName: string; email: string } })[];
  meta: PaginationMetaDto;
};

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService,
  ) {}

  // ============================================================================
  // USER-FACING OPERATIONS
  // ============================================================================

  async findActiveUserWithProfile(userId: string): Promise<UserWithProfile> {
    return this.findActiveUserById(userId);
  }
  /**
   * Retrieves the profile for the currently authenticated user.
   */
  async getMyProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.findActiveUserById(userId);
    return this.mapToUserResponse(user);
  }

  /**
   * Updates the core details (name, email) of the authenticated user.
   */
  async updateMyUser(userId: string, dto: UpdateMyUserDto): Promise<UpdateUserResponseDto> {
    const existingUser = await this.findActiveUserById(userId);

    if (dto.email && dto.email !== existingUser.email) {
      await this.validateEmailIsAvailable(dto.email);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { ...dto },
      include: { profile: true },
    });

    const eventPayload: UserUpdatedData = { userId, updatedFields: Object.keys(dto) };
    const event = this.createEvent(EventPattern.USER_UPDATED, eventPayload);
    this.messagingService.emit(event);

    this.logger.log(`User details updated: ${userId}`);
    return {
      message: 'User updated successfully.',
      user: this.mapToUserResponse(updatedUser),
    };
  }

  /**
   * Updates the profile details (bio, phone, etc.) of the authenticated user.
   */
  async updateMyProfile(
    userId: string,
    dto: UpdateMyProfileDto,
  ): Promise<UpdateProfileResponseDto> {
    await this.findActiveUserById(userId); // Verifies user exists and is active

    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        bio: dto.bio,
        phoneNumber: dto.phoneNumber,
        address: (dto.address as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        nextOfKin: (dto.nextOfKin as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
      update: {
        bio: dto.bio,
        phoneNumber: dto.phoneNumber,
        address: (dto.address as unknown as Prisma.InputJsonValue) ?? undefined,
        nextOfKin: (dto.nextOfKin as unknown as Prisma.InputJsonValue) ?? undefined,
      },
    });

    const eventPayload: UserUpdatedData = { userId, updatedFields: ['profile'] };
    const event = this.createEvent(EventPattern.USER_UPDATED, eventPayload);
    this.messagingService.emit(event);

    this.logger.log(`Profile updated: ${userId}`);
    return {
      message: 'Profile updated successfully.',
      profile: this.mapToProfileResponse(profile),
    };
  }

  // ============================================================================
  // ADMIN-FACING OPERATIONS
  // ============================================================================

  /**
   * Finds all users with pagination and filtering for admin purposes.
   */
  async findAllUsers(query: UserQueryDto): Promise<PaginatedUsersResponseDto> {
    const { page, limit, role, search, sortBy, sortOrder } = query;
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role && { role }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        include: { profile: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => this.mapToUserResponse(user)),
      meta: createPaginationMeta(total, query),
    };
  }

  /**
   * Finds a single user by ID, including detailed information for admins.
   */
  async findUserById(id: string): Promise<DetailedUserResponseDto> {
    const user = await this.findUserByIdInternal(id);
    return this.mapToDetailedUserResponse(user);
  }

  /**
   * Finds any non-deleted user by ID and returns the full Prisma model.
   * For controller use when creating Entities.
   */
  async findUserWithProfileById(userId: string): Promise<UserWithProfile> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { profile: true },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  /**
   * Allows an admin to update any user's information.
   */
  async adminUpdateUser(userId: string, dto: AdminUpdateUserDto): Promise<UpdateUserResponseDto> {
    const targetUser = await this.findUserByIdInternal(userId);

    if (dto.email && dto.email !== targetUser.email) {
      await this.validateEmailIsAvailable(dto.email);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
        lockedUntil: dto.lockedUntil ? new Date(dto.lockedUntil) : null,
      },
      include: { profile: true },
    });

    const eventPayload: UserUpdatedData = { userId, updatedFields: Object.keys(dto) };
    const event = this.createEvent(EventPattern.USER_UPDATED, eventPayload);
    this.messagingService.emit(event);

    this.logger.log(`User updated by admin: ${userId}`);
    return {
      message: 'User updated successfully.',
      user: this.mapToUserResponse(updatedUser),
    };
  }

  /**
   * Deactivates a user account and invalidates all their sessions.
   */
  async deactivateUser(userId: string): Promise<{ message: string }> {
    await this.findUserByIdInternal(userId); // Ensure user exists

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false, lockedUntil: null },
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    const eventPayload: UserUpdatedData = { userId, updatedFields: ['isActive'] };
    const event = this.createEvent(EventPattern.USER_UPDATED, eventPayload);
    this.messagingService.emit(event);

    this.logger.log(`User deactivated: ${userId}`);
    return { message: 'User deactivated successfully.' };
  }

  /**
   * Soft-deletes a user, anonymizing their email and invalidating sessions.
   */
  async deleteUser(userId: string): Promise<{ message: string }> {
    const user = await this.findUserByIdInternal(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
        email: `deleted_${Date.now()}_${user.email}`, // Anonymize email for compliance
      },
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    const eventPayload: UserDeletedData = { userId, email: user.email };
    const event = this.createEvent(EventPattern.USER_DELETED, eventPayload);
    this.messagingService.emit(event);

    this.logger.log(`User soft-deleted: ${userId}`);
    return { message: 'User deleted successfully.' };
  }

  /**
   * Retrieves a summary of user statistics for the admin dashboard.
   * This method performs several aggregate queries in a single, efficient transaction.
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    lockedUsers: number;
    usersByRole: Record<UserRole, number>;
  }> {
    // --- THE FIX IS HERE: Use the Fluent API ---

    // 1. Define each database query operation.
    const totalUsersQuery = this.prisma.user.count({ where: { deletedAt: null } });
    const activeUsersQuery = this.prisma.user.count({ where: { deletedAt: null, isActive: true } });
    const verifiedUsersQuery = this.prisma.userProfile.count({ where: { emailVerified: true } });
    const lockedUsersQuery = this.prisma.user.count({
      where: {
        deletedAt: null,
        lockedUntil: {
          not: null,
          gt: new Date(),
        },
      },
    });
    const usersByRoleQuery = this.prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
      where: { deletedAt: null },
    });

    // 2. Execute all defined queries in a single transaction.
    const [totalUsers, activeUsers, verifiedUsers, lockedUsers, usersByRole] =
      await this.prisma.$transaction([
        totalUsersQuery,
        activeUsersQuery,
        verifiedUsersQuery,
        lockedUsersQuery,
        usersByRoleQuery,
      ]);

    // The rest of the logic for processing the results remains the same.
    const roleCounts = Object.values(UserRole).reduce(
      (acc, role) => {
        acc[role] = 0;
        return acc;
      },
      {} as Record<UserRole, number>,
    );

    usersByRole.forEach((group) => {
      roleCounts[group.role] = group._count.role;
    });

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      lockedUsers,
      usersByRole: roleCounts,
    };
  }

  /**
   * Updates a user's role, creates an audit log, and invalidates their sessions.
   * Returns the complete, updated user object.
   */
  async updateUserRole(
    targetUserId: string,
    adminUserId: string,
    dto: UpdateUserRoleRequestDto,
  ): Promise<UserWithProfile> {
    const { role, reason } = dto;

    if (targetUserId === adminUserId) {
      throw new ForbiddenException('Admins cannot change their own role.');
    }

    const targetUser = await this.findUserWithProfileById(targetUserId); // Use our existing helper

    if (targetUser.role === role) {
      throw new BadRequestException('User already has this role.');
    }

    // Use a transaction to ensure both the user update and the audit log are created successfully.
    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetUserId },
        data: { role },
        include: { profile: true }, // Ensure the returned object includes the profile
      }),
      this.prisma.roleChange.create({
        data: {
          userId: targetUserId,
          oldRole: targetUser.role,
          newRole: role,
          changedBy: adminUserId,
          reason,
        },
      }),
    ]);

    // Invalidate sessions after the role change
    await this.prisma.refreshToken.deleteMany({ where: { userId: targetUserId } });

    this.logger.log(`Role updated for user ${targetUserId} by admin ${adminUserId}`);
    return updatedUser;
  }

  /**
   * Retrieves the role change history for all users.
   */
  async getRoleChangeHistory(query: RoleChangeQueryDto): Promise<PaginatedRoleChangesResult> {
    const { page, limit, userId, changedBy, sortBy, sortOrder } = query;
    const where: Prisma.RoleChangeWhereInput = {
      ...(userId && { userId }),
      ...(changedBy && { changedBy }),
    };

    const [roleChanges, total] = await this.prisma.$transaction([
      this.prisma.roleChange.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      this.prisma.roleChange.count({ where }),
    ]);

    return {
      data: roleChanges,
      meta: createPaginationMeta(total, query),
    };
  }

  /**
   * Retrieves the paginated role change history for a single, specific user.
   * Returns raw Prisma models for use in creating Entities.
   */
  async getRoleChangeHistoryForUser(
    userId: string,
    query: RoleChangeQueryDto,
  ): Promise<PaginatedRoleChangesResult> {
    // <-- Uses our shared raw data type
    const { page, limit, sortBy, sortOrder } = query;

    // First, verify that the user we're querying for actually exists.
    // This prevents requests for non-existent user IDs.
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true }, // We only need to select 'id' to confirm existence; it's efficient.
    });

    if (!userExists) {
      throw new NotFoundException('User not found.');
    }

    // Define the query conditions to find role changes for this specific user.
    const where: Prisma.RoleChangeWhereInput = { userId };

    const [roleChanges, total] = await this.prisma.$transaction([
      this.prisma.roleChange.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
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

    // Return the raw data and pagination metadata.
    return {
      data: roleChanges,
      meta: createPaginationMeta(total, query),
    };
  }

  // ============================================================================
  // PRIVATE UTILITIES
  // ============================================================================

  /**
   * Creates a standardized event object.
   */
  private createEvent<T extends EventPattern, D>(type: T, data: D): BaseEvent<T, D> {
    return {
      type,
      data,
      timestamp: new Date(),
      version: '1.0',
      source: 'accounts-service',
    };
  }

  /**
   * Finds a user that must be active and not deleted. Throws if not found.
   */
  private async findActiveUserById(userId: string): Promise<UserWithProfile> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true, deletedAt: null },
      include: { profile: true },
    });
    if (!user) {
      throw new NotFoundException('User not found or is inactive.');
    }
    return user;
  }

  /**
   * Finds any non-deleted user. Throws if not found. For admin use.
   */
  private async findUserByIdInternal(userId: string): Promise<UserWithProfile> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { profile: true },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  /**
   * Checks if an email is already in use by another non-deleted user.
   */
  private async validateEmailIsAvailable(email: string): Promise<void> {
    const existingUser = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (existingUser) {
      throw new ConflictException('Email address is already in use.');
    }
  }

  // ============================================================================
  // MAPPERS
  // ============================================================================

  private mapToUserResponse(user: UserWithProfile): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.profile ? this.mapToProfileResponse(user.profile) : undefined,
    };
  }

  private mapToDetailedUserResponse(user: UserWithProfile): DetailedUserResponseDto {
    return {
      ...this.mapToUserResponse(user),
      loginAttempts: user.loginAttempts,
      lockedUntil: user.lockedUntil ?? undefined,
      deletedAt: user.deletedAt ?? undefined,
    };
  }

  private mapToProfileResponse(profile: UserProfile) {
    return {
      bio: profile.bio ?? undefined,
      phoneNumber: profile.phoneNumber ?? undefined,
      emailVerified: profile.emailVerified,
      phoneVerified: profile.phoneVerified,
      address: this.parseJsonField<AddressDto>(profile.address),
      nextOfKin: this.parseJsonField<NextOfKinDto>(profile.nextOfKin),
    };
  }

  /**
   * Safely parses a Prisma.JsonValue field into a typed object.
   */
  private parseJsonField<T>(field: Prisma.JsonValue): T | undefined {
    if (!field || typeof field !== 'object') {
      return undefined;
    }
    return field as T;
  }
}
