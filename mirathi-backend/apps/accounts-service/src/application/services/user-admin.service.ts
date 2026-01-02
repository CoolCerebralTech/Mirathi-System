// src/application/services/user-admin.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { User } from '../../domain/aggregates/user.aggregate';
import {
  ActivateUserHandler,
  ChangeUserRoleHandler,
  DeleteUserHandler,
  RestoreUserHandler,
  SuspendUserHandler,
  UnsuspendUserHandler,
} from '../commands/handlers/admin';
import {
  ActivateUserCommand,
  ChangeUserRoleCommand,
  DeleteUserCommand,
  RestoreUserCommand,
  SuspendUserCommand,
  UnsuspendUserCommand,
} from '../commands/impl/admin';
import {
  GetUserStatisticsHandler,
  ListUsersPaginatedHandler,
  PaginatedUsersResult,
  SearchUsersHandler,
  SearchUsersResult,
  UserStatistics,
} from '../queries/handlers';
import { GetUserStatisticsQuery, ListUsersPaginatedQuery, SearchUsersQuery } from '../queries/impl';

/**
 * User Admin Service - Orchestrates admin operations
 *
 * This service provides administrative operations for user management.
 * All operations require ADMIN role (enforced at controller level via guards).
 */
@Injectable()
export class UserAdminService {
  private readonly logger = new Logger(UserAdminService.name);

  constructor(
    // Command Handlers
    private readonly activateUserHandler: ActivateUserHandler,
    private readonly suspendUserHandler: SuspendUserHandler,
    private readonly unsuspendUserHandler: UnsuspendUserHandler,
    private readonly changeUserRoleHandler: ChangeUserRoleHandler,
    private readonly deleteUserHandler: DeleteUserHandler,
    private readonly restoreUserHandler: RestoreUserHandler,

    // Query Handlers
    private readonly searchUsersHandler: SearchUsersHandler,
    private readonly listUsersPaginatedHandler: ListUsersPaginatedHandler,
    private readonly getUserStatisticsHandler: GetUserStatisticsHandler,
  ) {}

  // ============================================================================
  // USER LIFECYCLE MANAGEMENT
  // ============================================================================

  async activateUser(userId: string, activatedBy: string): Promise<User> {
    const command = new ActivateUserCommand(userId, activatedBy);
    return await this.activateUserHandler.execute(command);
  }

  async suspendUser(userId: string, suspendedBy: string, reason?: string): Promise<User> {
    const command = new SuspendUserCommand(userId, suspendedBy, reason);
    return await this.suspendUserHandler.execute(command);
  }

  async unsuspendUser(userId: string, unsuspendedBy: string): Promise<User> {
    const command = new UnsuspendUserCommand(userId, unsuspendedBy);
    return await this.unsuspendUserHandler.execute(command);
  }

  async deleteUser(userId: string, deletedBy: string): Promise<User> {
    const command = new DeleteUserCommand(userId, deletedBy);
    return await this.deleteUserHandler.execute(command);
  }

  async restoreUser(userId: string): Promise<User> {
    const command = new RestoreUserCommand(userId);
    return await this.restoreUserHandler.execute(command);
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
    const command = new ChangeUserRoleCommand(userId, newRole, changedBy, reason);
    return await this.changeUserRoleHandler.execute(command);
  }

  async promoteToVerifier(userId: string, promotedBy: string, reason?: string): Promise<User> {
    return await this.changeUserRole(userId, UserRole.VERIFIER, promotedBy, reason);
  }

  async promoteToAdmin(userId: string, promotedBy: string, reason?: string): Promise<User> {
    return await this.changeUserRole(userId, UserRole.ADMIN, promotedBy, reason);
  }

  async demoteToUser(userId: string, demotedBy: string, reason?: string): Promise<User> {
    return await this.changeUserRole(userId, UserRole.USER, demotedBy, reason);
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
    const query = new SearchUsersQuery(
      criteria.status,
      criteria.role,
      criteria.county,
      criteria.createdAtFrom,
      criteria.createdAtTo,
      criteria.limit,
      criteria.offset,
    );
    return await this.searchUsersHandler.execute(query);
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
    const query = new ListUsersPaginatedQuery(
      options.page,
      options.limit,
      options.search,
      options.status,
      options.role,
      options.sortBy,
      options.sortOrder,
    );
    return await this.listUsersPaginatedHandler.execute(query);
  }

  // ============================================================================
  // STATISTICS & ANALYTICS
  // ============================================================================

  async getUserStatistics(): Promise<UserStatistics> {
    const query = new GetUserStatisticsQuery();
    return await this.getUserStatisticsHandler.execute(query);
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
    const recentUsersResult = await this.listUsersPaginated({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    // Get pending onboarding count
    const pendingOnboardingResult = await this.searchUsers({
      status: 'PENDING_ONBOARDING',
      limit: 1,
    });

    // Get suspended users count
    const suspendedResult = await this.searchUsers({
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

    for (const userId of userIds) {
      try {
        await this.suspendUser(userId, suspendedBy, reason);
        succeeded.push(userId);
      } catch (error) {
        this.logger.error(`Failed to suspend user ${userId}`, error);
        failed.push(userId);
      }
    }

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

    for (const userId of userIds) {
      try {
        await this.deleteUser(userId, deletedBy);
        succeeded.push(userId);
      } catch (error) {
        this.logger.error(`Failed to delete user ${userId}`, error);
        failed.push(userId);
      }
    }

    this.logger.log(
      `Batch delete completed: ${succeeded.length} succeeded, ${failed.length} failed`,
    );

    return { succeeded, failed };
  }
}
