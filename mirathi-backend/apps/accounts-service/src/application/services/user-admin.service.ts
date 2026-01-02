// src/application/services/user-admin.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserRole } from '@prisma/client';

import { User } from '../../domain/aggregates/user.aggregate';
// Admin Commands
import {
  ActivateUserCommand,
  ChangeUserRoleCommand,
  DeleteUserCommand,
  RestoreUserCommand,
  SuspendUserCommand,
  UnsuspendUserCommand,
} from '../commands/impl/admin';
// Query Results Interfaces
import { PaginatedUsersResult, SearchUsersResult, UserStatistics } from '../queries/handlers';
// Queries
import { GetUserStatisticsQuery, ListUsersPaginatedQuery, SearchUsersQuery } from '../queries/impl';

/**
 * User Admin Service - Orchestrates admin operations
 *
 * UPGRADE NOTE: Uses CommandBus and QueryBus for CQRS compliance.
 */
@Injectable()
export class UserAdminService {
  private readonly logger = new Logger(UserAdminService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ============================================================================
  // USER LIFECYCLE MANAGEMENT
  // ============================================================================

  async activateUser(userId: string, activatedBy: string): Promise<User> {
    return this.commandBus.execute(new ActivateUserCommand(userId, activatedBy));
  }

  async suspendUser(userId: string, suspendedBy: string, reason?: string): Promise<User> {
    return this.commandBus.execute(new SuspendUserCommand(userId, suspendedBy, reason));
  }

  async unsuspendUser(userId: string, unsuspendedBy: string): Promise<User> {
    return this.commandBus.execute(new UnsuspendUserCommand(userId, unsuspendedBy));
  }

  async deleteUser(userId: string, deletedBy: string): Promise<User> {
    return this.commandBus.execute(new DeleteUserCommand(userId, deletedBy));
  }

  async restoreUser(userId: string): Promise<User> {
    return this.commandBus.execute(new RestoreUserCommand(userId));
  }

  // ============================================================================
  // ROLE MANAGEMENT
  // ============================================================================

  async changeUserRole(
    userId: string,
    newRole: UserRole,
    changedBy: string,
    reason?: string,
  ): Promise<User> {
    return this.commandBus.execute(new ChangeUserRoleCommand(userId, newRole, changedBy, reason));
  }

  async promoteToVerifier(userId: string, promotedBy: string, reason?: string): Promise<User> {
    return this.changeUserRole(userId, UserRole.VERIFIER, promotedBy, reason);
  }

  async promoteToAdmin(userId: string, promotedBy: string, reason?: string): Promise<User> {
    return this.changeUserRole(userId, UserRole.ADMIN, promotedBy, reason);
  }

  async demoteToUser(userId: string, demotedBy: string, reason?: string): Promise<User> {
    return this.changeUserRole(userId, UserRole.USER, demotedBy, reason);
  }

  // ============================================================================
  // USER SEARCH & LISTING
  // ============================================================================

  async searchUsers(criteria: {
    status?: string;
    role?: string;
    county?: string;
    createdAtFrom?: Date;
    createdAtTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<SearchUsersResult> {
    return this.queryBus.execute(
      new SearchUsersQuery(
        criteria.status,
        criteria.role,
        criteria.county,
        criteria.createdAtFrom,
        criteria.createdAtTo,
        criteria.limit,
        criteria.offset,
      ),
    );
  }

  async listUsersPaginated(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedUsersResult> {
    return this.queryBus.execute(
      new ListUsersPaginatedQuery(
        options.page,
        options.limit,
        options.search,
        options.status,
        options.role,
        options.sortBy,
        options.sortOrder,
      ),
    );
  }

  // ============================================================================
  // STATISTICS & ANALYTICS
  // ============================================================================

  async getUserStatistics(): Promise<UserStatistics> {
    return this.queryBus.execute(new GetUserStatisticsQuery());
  }

  /**
   * Get dashboard overview for admin panel
   */
  async getDashboardOverview(): Promise<{
    statistics: UserStatistics;
    recentUsers: User[];
    pendingOnboarding: number;
    suspendedCount: number;
  }> {
    const statistics = await this.getUserStatistics();

    // Get recent users (last 10)
    const recentUsersResult: PaginatedUsersResult = await this.listUsersPaginated({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    // Get pending onboarding count
    const pendingOnboardingResult: SearchUsersResult = await this.searchUsers({
      status: 'PENDING_ONBOARDING',
      limit: 1,
    });

    // Get suspended users count
    const suspendedResult: SearchUsersResult = await this.searchUsers({
      status: 'SUSPENDED',
      limit: 1,
    });

    return {
      statistics,
      recentUsers: recentUsersResult.users,
      pendingOnboarding: pendingOnboardingResult.total,
      suspendedCount: suspendedResult.total,
    };
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Suspend multiple users (batch operation)
   */
  async suspendMultipleUsers(
    userIds: string[],
    suspendedBy: string,
    reason?: string,
  ): Promise<{ succeeded: string[]; failed: string[] }> {
    const succeeded: string[] = [];
    const failed: string[] = [];

    // Parallel execution for better performance on bulk operations
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          // Use CommandBus for consistency
          await this.commandBus.execute(new SuspendUserCommand(userId, suspendedBy, reason));
          succeeded.push(userId);
        } catch (error) {
          this.logger.error(`Failed to suspend user ${userId}`, error);
          failed.push(userId);
        }
      }),
    );

    this.logger.log(
      `Batch suspend completed: ${succeeded.length} succeeded, ${failed.length} failed`,
    );

    return { succeeded, failed };
  }

  /**
   * Delete multiple users (batch operation)
   */
  async deleteMultipleUsers(
    userIds: string[],
    deletedBy: string,
  ): Promise<{ succeeded: string[]; failed: string[] }> {
    const succeeded: string[] = [];
    const failed: string[] = [];

    await Promise.all(
      userIds.map(async (userId) => {
        try {
          await this.commandBus.execute(new DeleteUserCommand(userId, deletedBy));
          succeeded.push(userId);
        } catch (error) {
          this.logger.error(`Failed to delete user ${userId}`, error);
          failed.push(userId);
        }
      }),
    );

    this.logger.log(
      `Batch delete completed: ${succeeded.length} succeeded, ${failed.length} failed`,
    );

    return { succeeded, failed };
  }
}
