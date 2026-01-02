// src/presentation/resolvers/admin.resolver.ts
import { Logger, UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';

import { UserAdminService } from '../../application/services';
import { CurrentUser, Roles } from '../decorators';
import type { JwtPayload } from '../decorators';
import {
  BulkDeleteUsersInput,
  BulkSuspendUsersInput,
  ChangeRoleInput,
  ListUsersInput,
  SearchUsersInput,
  SuspendUserInput,
} from '../dtos/inputs';
import {
  BulkOperationResultOutput,
  PaginatedUsersOutput,
  SearchUsersResultOutput,
  UserOutput,
  UserStatisticsOutput,
} from '../dtos/outputs';
import { GqlAuthGuard, GqlRolesGuard } from '../guards';
import { StatisticsPresenterMapper, UserPresenterMapper } from '../mappers';

/**
 * Admin Resolver
 *
 * Handles administrative operations:
 * - User lifecycle management
 * - Role management
 * - User search & statistics
 * - Bulk operations
 *
 * All operations require ADMIN role
 */
@Resolver(() => UserOutput)
@UseGuards(GqlAuthGuard, GqlRolesGuard)
@Roles(UserRole.ADMIN)
export class AdminResolver {
  private readonly logger = new Logger(AdminResolver.name);

  constructor(
    private readonly userAdminService: UserAdminService,
    private readonly userMapper: UserPresenterMapper,
    private readonly statisticsMapper: StatisticsPresenterMapper,
  ) {}

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  /**
   * Search users with filters
   */
  @Query(() => SearchUsersResultOutput, {
    description: 'Search users with filters (Admin only)',
  })
  async searchUsers(@Args('input') input: SearchUsersInput): Promise<SearchUsersResultOutput> {
    const result = await this.userAdminService.searchUsers({
      status: input.status,
      role: input.role,
      county: input.county,
      limit: input.limit,
      offset: input.offset,
    });

    return {
      users: this.userMapper.toOutputList(result.users),
      total: result.total,
    };
  }

  /**
   * List users with pagination
   */
  @Query(() => PaginatedUsersOutput, {
    description: 'List users with pagination and sorting (Admin only)',
  })
  async listUsers(@Args('input') input: ListUsersInput): Promise<PaginatedUsersOutput> {
    const result = await this.userAdminService.listUsersPaginated({
      page: input.page,
      limit: input.limit,
      search: input.search,
      status: input.status,
      role: input.role,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
    });

    return {
      users: this.userMapper.toOutputList(result.users),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  /**
   * Get user statistics
   */
  @Query(() => UserStatisticsOutput, {
    description: 'Get user statistics for dashboard (Admin only)',
  })
  async userStatistics(): Promise<UserStatisticsOutput> {
    const stats = await this.userAdminService.getUserStatistics();
    return this.statisticsMapper.toOutput(stats);
  }

  // ==========================================================================
  // MUTATIONS - USER LIFECYCLE
  // ==========================================================================

  /**
   * Activate user
   */
  @Mutation(() => UserOutput, {
    description: 'Manually activate a user (Admin only)',
  })
  async activateUser(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() admin: JwtPayload,
  ): Promise<UserOutput> {
    this.logger.log(`Admin ${admin.sub} activating user: ${userId}`);

    const user = await this.userAdminService.activateUser(userId, admin.sub);
    return this.userMapper.toOutput(user);
  }

  /**
   * Suspend user
   */
  @Mutation(() => UserOutput, {
    description: 'Suspend a user (Admin only)',
  })
  async suspendUser(
    @Args('input') input: SuspendUserInput,
    @CurrentUser() admin: JwtPayload,
  ): Promise<UserOutput> {
    this.logger.log(`Admin ${admin.sub} suspending user: ${input.userId}`);

    const user = await this.userAdminService.suspendUser(input.userId, admin.sub, input.reason);

    return this.userMapper.toOutput(user);
  }

  /**
   * Unsuspend user
   */
  @Mutation(() => UserOutput, {
    description: 'Unsuspend a user (Admin only)',
  })
  async unsuspendUser(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() admin: JwtPayload,
  ): Promise<UserOutput> {
    this.logger.log(`Admin ${admin.sub} unsuspending user: ${userId}`);

    const user = await this.userAdminService.unsuspendUser(userId, admin.sub);
    return this.userMapper.toOutput(user);
  }

  /**
   * Delete user (soft delete)
   */
  @Mutation(() => UserOutput, {
    description: 'Delete a user (soft delete) (Admin only)',
  })
  async deleteUser(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() admin: JwtPayload,
  ): Promise<UserOutput> {
    this.logger.log(`Admin ${admin.sub} deleting user: ${userId}`);

    const user = await this.userAdminService.deleteUser(userId, admin.sub);
    return this.userMapper.toOutput(user);
  }

  /**
   * Restore deleted user
   */
  @Mutation(() => UserOutput, {
    description: 'Restore a soft-deleted user (Admin only)',
  })
  async restoreUser(@Args('userId', { type: () => ID }) userId: string): Promise<UserOutput> {
    this.logger.log(`Restoring user: ${userId}`);

    const user = await this.userAdminService.restoreUser(userId);
    return this.userMapper.toOutput(user);
  }

  // ==========================================================================
  // MUTATIONS - ROLE MANAGEMENT
  // ==========================================================================

  /**
   * Change user role
   */
  @Mutation(() => UserOutput, {
    description: 'Change user role (Admin only)',
  })
  async changeUserRole(
    @Args('input') input: ChangeRoleInput,
    @CurrentUser() admin: JwtPayload,
  ): Promise<UserOutput> {
    this.logger.log(
      `Admin ${admin.sub} changing role for user ${input.userId} to ${input.newRole}`,
    );

    const user = await this.userAdminService.changeUserRole(
      input.userId,
      input.newRole,
      admin.sub,
      input.reason,
    );

    return this.userMapper.toOutput(user);
  }

  /**
   * Promote user to VERIFIER
   */
  @Mutation(() => UserOutput, {
    description: 'Promote user to VERIFIER role (Admin only)',
  })
  async promoteToVerifier(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() admin: JwtPayload,
    @Args('reason', { nullable: true }) reason?: string,
  ): Promise<UserOutput> {
    this.logger.log(`Admin ${admin.sub} promoting user ${userId} to VERIFIER`);

    const user = await this.userAdminService.promoteToVerifier(userId, admin.sub, reason);
    return this.userMapper.toOutput(user);
  }

  /**
   * Promote user to ADMIN
   */
  @Mutation(() => UserOutput, {
    description: 'Promote user to ADMIN role (Admin only)',
  })
  async promoteToAdmin(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() admin: JwtPayload,
    @Args('reason', { nullable: true }) reason?: string,
  ): Promise<UserOutput> {
    this.logger.log(`Admin ${admin.sub} promoting user ${userId} to ADMIN`);

    const user = await this.userAdminService.promoteToAdmin(userId, admin.sub, reason);
    return this.userMapper.toOutput(user);
  }

  /**
   * Demote user to USER
   */
  @Mutation(() => UserOutput, {
    description: 'Demote user to USER role (Admin only)',
  })
  async demoteToUser(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() admin: JwtPayload,
    @Args('reason', { nullable: true }) reason?: string,
  ): Promise<UserOutput> {
    this.logger.log(`Admin ${admin.sub} demoting user ${userId} to USER`);

    const user = await this.userAdminService.demoteToUser(userId, admin.sub, reason);
    return this.userMapper.toOutput(user);
  }

  // ==========================================================================
  // MUTATIONS - BULK OPERATIONS
  // ==========================================================================

  /**
   * Bulk suspend users
   */
  @Mutation(() => BulkOperationResultOutput, {
    description: 'Suspend multiple users at once (Admin only)',
  })
  async bulkSuspendUsers(
    @Args('input') input: BulkSuspendUsersInput,
    @CurrentUser() admin: JwtPayload,
  ): Promise<BulkOperationResultOutput> {
    this.logger.log(`Admin ${admin.sub} bulk suspending ${input.userIds.length} users`);

    const result = await this.userAdminService.suspendMultipleUsers(
      input.userIds,
      admin.sub,
      input.reason,
    );

    return {
      succeeded: result.succeeded,
      failed: result.failed,
      totalSucceeded: result.succeeded.length,
      totalFailed: result.failed.length,
    };
  }

  /**
   * Bulk delete users
   */
  @Mutation(() => BulkOperationResultOutput, {
    description: 'Delete multiple users at once (Admin only)',
  })
  async bulkDeleteUsers(
    @Args('input') input: BulkDeleteUsersInput,
    @CurrentUser() admin: JwtPayload,
  ): Promise<BulkOperationResultOutput> {
    this.logger.log(`Admin ${admin.sub} bulk deleting ${input.userIds.length} users`);

    const result = await this.userAdminService.deleteMultipleUsers(input.userIds, admin.sub);

    return {
      succeeded: result.succeeded,
      failed: result.failed,
      totalSucceeded: result.succeeded.length,
      totalFailed: result.failed.length,
    };
  }
}
