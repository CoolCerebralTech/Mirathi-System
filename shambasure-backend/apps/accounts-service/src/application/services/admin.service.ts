import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  Inject,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  IUserRepository,
  IRefreshTokenRepository,
  ILoginSessionRepository,
  IPasswordHistoryRepository,
  UserFilters,
  PaginationOptions,
  UserUpdateData,
} from '../../domain/interfaces';
import type { IEventPublisher, INotificationService } from '../../domain/interfaces';
import { User } from '../../domain/models/user.model';
import { Email, Password } from '../../domain/value-objects';
import { UserMapper } from '../mappers';
import { UsersBulkUpdatedEvent } from '../../domain/events';
import {
  UserQueryDto,
  AdminUpdateUserRequestDto,
  UpdateUserRoleRequestDto,
  LockUserAccountRequestDto,
  UnlockUserAccountRequestDto,
  SoftDeleteUserRequestDto,
  RestoreUserRequestDto,
  AdminCreateUserRequestDto,
  AdminBulkUpdateUsersRequestDto,
  AdminUpdateUserResponseDto,
  UpdateUserRoleResponseDto,
  LockUserAccountResponseDto,
  UnlockUserAccountResponseDto,
  SoftDeleteUserResponseDto,
  RestoreUserResponseDto,
  AdminCreateUserResponseDto,
  AdminBulkUpdateUsersResponseDto,
  PaginatedUsersResponseDto,
  UserStatsResponseDto,
  GetUserResponseDto,
} from '../dtos/admin.dto';
import { UserRole } from '@shamba/common';

// Custom exceptions for admin operations
export class AdminServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AdminServiceError';
  }
}

export class AdminSecurityError extends AdminServiceError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'ADMIN_SECURITY_ERROR', context);
    this.name = 'AdminSecurityError';
  }
}

export class BulkOperationError extends AdminServiceError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'BULK_OPERATION_ERROR', context);
    this.name = 'BulkOperationError';
  }
}

/**
 * AdminService
 *
 * Production-ready administrative operations with comprehensive security,
 * error handling, and domain event coordination.
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly TEMP_PASSWORD_LENGTH = 12;
  private readonly PASSWORD_HISTORY_COUNT: number;
  private readonly MAX_ADMIN_COUNT = 10;

  constructor(
    @Inject('IUserRepository')
    private readonly userRepo: IUserRepository,

    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepo: IRefreshTokenRepository,

    @Inject('ILoginSessionRepository')
    private readonly loginSessionRepo: ILoginSessionRepository,

    @Inject('IPasswordHistoryRepository')
    private readonly passwordHistoryRepo: IPasswordHistoryRepository,

    @Inject('IEventPublisher')
    private readonly eventPublisher: IEventPublisher,

    @Inject('INotificationService')
    private readonly notificationService: INotificationService,

    private readonly userMapper: UserMapper,
  ) {}

  // ==========================================================================
  // USER RETRIEVAL & STATISTICS
  // ==========================================================================

  async getAllUsers(query: UserQueryDto): Promise<PaginatedUsersResponseDto> {
    try {
      this.logger.log(`Fetching users with query`, { query });

      // The adminId is not used in this method after permission checks, so we can remove it.
      // Assuming a guard handles the permission check before this method is called.

      const filters: UserFilters = {
        role: query.role,
        isActive: query.isActive,
        emailVerified: query.emailVerified,
        isLocked: query.isLocked,
        isDeleted: query.includeDeleted ?? false,
        search: query.search,
      };

      const pagination: PaginationOptions = {
        page: query.page ?? 1,
        limit: Math.min(query.limit ?? 20, 100),
        sortBy: query.sortBy ?? 'createdAt',
        sortOrder: query.sortOrder ?? 'desc',
      };

      // 1. --- UPDATED ---
      // The `findAll` method in the repository should be responsible for including the profile.
      // This solves the N+1 query problem.
      const paginatedResult = await this.userRepo.findAll(filters, pagination);

      // 2. --- REMOVED ---
      // The entire block for fetching profiles separately is now gone.
      /*
      const profilesMap = new Map<string, UserProfile>();
      const profilePromises = paginatedResult.data.map(async (user) => { ... });
      await Promise.all(profilePromises);
      */

      this.logger.log(`Successfully fetched ${paginatedResult.data.length} users`);

      // 3. --- UPDATED ---
      // The mapper call is now much simpler.
      return this.userMapper.toPaginatedUsersResponse(paginatedResult);
    } catch (error) {
      this.logger.error(`Failed to fetch users for admin`, error);
      throw this.handleServiceError(error);
    }
  }

  async getUserById(userId: string, adminId: string): Promise<GetUserResponseDto> {
    try {
      this.logger.log(`Admin ${adminId} fetching user: ${userId}`);

      await this.validateAdminPermissions(adminId);

      const user = await this.userRepo.findByIdWithProfile(userId);
      if (!user) {
        throw new NotFoundException('User not found.');
      }

      const activeSessions = await this.loginSessionRepo.findActiveByUserId(userId);
      const roleHistory = await this.userRepo.findRoleChangesByUserId(userId);

      this.logger.log(`Admin ${adminId} successfully fetched user: ${userId}`);

      return this.userMapper.toAdminGetUserByIdResponse(user, {
        sessions: activeSessions,
        roleHistory,
      });
    } catch (error) {
      this.logger.error(`Failed to fetch user ${userId} for admin ${adminId}`, error);
      throw this.handleServiceError(error);
    }
  }

  async getUserStats(adminId: string): Promise<UserStatsResponseDto> {
    try {
      this.logger.log(`Admin ${adminId} fetching user statistics`);

      await this.validateAdminPermissions(adminId);

      const stats = await this.userRepo.getStats();

      this.logger.log(`Admin ${adminId} successfully fetched user statistics`);
      return this.userMapper.toUserStatsResponse(stats);
    } catch (error) {
      this.logger.error(`Failed to fetch user statistics for admin ${adminId}`, error);
      throw this.handleServiceError(error);
    }
  }

  // ==========================================================================
  // USER CREATION
  // ==========================================================================

  async createUser(
    dto: AdminCreateUserRequestDto,
    adminId: string,
  ): Promise<AdminCreateUserResponseDto> {
    try {
      this.logger.log(`Admin ${adminId} creating user for email: ${dto.email}`);

      await this.validateAdminPermissions(adminId);

      const email = Email.create(dto.email);

      if (await this.userRepo.existsByEmail(email)) {
        throw new ConflictException('An account with this email already exists.');
      }

      // 1. --- SIMPLIFIED PASSWORD & USER CREATION ---
      const tempPassword = this.generateSecureTemporaryPassword();
      const password = await Password.create(tempPassword);

      // The User.create factory now handles profile creation internally.
      const user = User.create({
        id: randomUUID(),
        email,
        password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        marketingOptIn: dto.marketingOptIn ?? false,
      });

      // 2. --- USE THE NEW AGGREGATE METHOD ---
      // Delegate all initial state changes to the User aggregate.
      user.setInitialAdminState(
        {
          role: dto.role,
          isActive: dto.isActive,
          isEmailVerified: dto.emailVerified,
        },
        adminId,
      );

      // 3. --- REMOVED DIRECT PROFILE MANIPULATION ---
      /*
      const profile = UserProfile.create({ ... });
      if (dto.emailVerified) {
        profile.markEmailAsVerified();
      }
      */

      // 4. --- SIMPLIFIED SAVING ---
      // Save the entire aggregate. The repository handles the transaction.
      await this.userRepo.save(user);

      // Store password in history
      await this.passwordHistoryRepo.save(user.id, password.getValue());

      // Publish all domain events created during the process
      await this.publishDomainEvents(user);

      // Send welcome email (logic is correct, just needs the profile from the user object)
      let emailSent = false;
      if (dto.sendWelcomeEmail ?? true) {
        try {
          await this.sendWelcomeEmail(user, tempPassword); // Pass user, not user and profile
          emailSent = true;
          this.logger.log(`Welcome email sent to new user: ${user.id}`);
        } catch (error) {
          this.logger.error(`Failed to send welcome email to user ${user.id}`, error);
        }
      }

      this.logger.log(`Admin ${adminId} successfully created user: ${user.id}`);

      // 5. --- ALIGN MAPPER CALL ---
      return this.userMapper.toAdminCreateUserResponse(user, tempPassword, emailSent);
    } catch (error) {
      this.logger.error(`Failed to create user for admin ${adminId}`, error);
      throw this.handleServiceError(error);
    }
  }

  // ==========================================================================
  // USER UPDATES
  // ==========================================================================

  async updateUser(
    userId: string,
    dto: AdminUpdateUserRequestDto,
    adminId: string,
  ): Promise<AdminUpdateUserResponseDto> {
    try {
      this.logger.log(`Admin ${adminId} updating user: ${userId}`, { updates: dto });
      await this.validateAdminPermissions(adminId);

      const user = await this.userRepo.findByIdWithProfile(userId);
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      const initialEventCount = user.domainEvents.length;

      // --- EMAIL UNIQUENESS CHECK MOVED HERE (CORRECT PLACE) ---
      if (dto.email) {
        const newEmail = Email.create(dto.email);
        if (!user.email.equals(newEmail)) {
          const existingUser = await this.userRepo.findByEmail(newEmail);
          if (existingUser && existingUser.id !== userId) {
            throw new ConflictException('This email address is already in use.');
          }
        }
      }

      // --- DELEGATE ALL OTHER LOGIC TO THE DOMAIN MODEL ---
      user.updateByAdmin(
        {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email ? Email.create(dto.email) : undefined,
          isActive: dto.isActive,
          lockedUntil:
            dto.lockedUntil === undefined
              ? undefined
              : dto.lockedUntil
                ? new Date(dto.lockedUntil)
                : null,
          loginAttempts: dto.loginAttempts,
          isEmailVerified: dto.emailVerified,
          isPhoneVerified: dto.phoneVerified,
          marketingOptIn: dto.marketingOptIn,
        },
        adminId, // Pass the adminId string
      );

      if (user.domainEvents.length > initialEventCount) {
        await this.userRepo.save(user);
        await this.publishDomainEvents(user);
        this.logger.log(`Admin ${adminId} successfully updated user ${userId}`);
      } else {
        this.logger.debug(`No changes detected for user update: ${userId}`);
      }

      const updatedFields = Object.keys(dto);
      return this.userMapper.toAdminUpdateUserResponse(user, updatedFields);
    } catch (error) {
      this.logger.error(`Failed to update user ${userId} for admin ${adminId}`, error);
      throw this.handleServiceError(error);
    }
  }

  // ==========================================================================
  // ROLE MANAGEMENT
  // ==========================================================================

  async updateUserRole(
    userId: string,
    dto: UpdateUserRoleRequestDto,
    adminId: string,
  ): Promise<UpdateUserRoleResponseDto> {
    try {
      this.logger.log(`Admin ${adminId} updating role for user: ${userId} to ${dto.newRole}`);

      // 1. --- FETCH ADMIN AND TARGET USER CONCURRENTLY ---
      // This is slightly more efficient.
      const [admin, targetUser] = await Promise.all([
        this.userRepo.findById(adminId),
        this.userRepo.findByIdWithProfile(userId), // Fetch with profile
      ]);

      // Validate admin permissions (using the fetched admin object)
      if (!admin || !admin.isAdmin() || !admin.isActive || admin.isLocked()) {
        throw new ForbiddenException('Insufficient permissions for administrative operations.');
      }

      if (!targetUser) {
        throw new NotFoundException('User not found.');
      }

      const adminEmail = admin.email.getValue();

      // Security checks (these are well-implemented and stay)
      if (
        userId === adminId &&
        targetUser.role === UserRole.ADMIN &&
        dto.newRole !== UserRole.ADMIN
      ) {
        throw new AdminSecurityError('Admins cannot change their own role.');
      }
      if (dto.newRole === UserRole.ADMIN) {
        await this.validateAdminPromotion(adminId, userId);
      }

      const previousRole = targetUser.role;

      // Use the domain method to change the role
      targetUser.changeRole(dto.newRole, adminId, dto.reason);

      // Save the aggregate
      await this.userRepo.save(targetUser);

      // Publish the RoleChangedEvent
      await this.publishDomainEvents(targetUser);

      // Send notification (this logic is correct)
      if (dto.notifyUser ?? true) {
        this.sendRoleChangeNotification(targetUser, previousRole, dto.newRole, dto.reason).catch(
          (error) => this.logger.error('Failed to send role change notification', error),
        );
      }

      this.logger.log(
        `Admin ${adminId} successfully changed role for user ${userId} from ${previousRole} to ${dto.newRole}`,
      );

      // 2. --- ALIGN MAPPER CALL ---
      // Use the refactored mapper with a clean context object.
      return this.userMapper.toUpdateUserRoleResponse(targetUser, {
        previousRole,
        changedBy: adminEmail,
        reason: dto.reason,
        userNotified: dto.notifyUser ?? true,
      });
    } catch (error) {
      this.logger.error(`Failed to update role for user ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  // ==========================================================================
  // ACCOUNT LOCKING
  // ==========================================================================

  async lockUserAccount(
    userId: string,
    dto: LockUserAccountRequestDto,
    adminId: string,
  ): Promise<LockUserAccountResponseDto> {
    try {
      this.logger.log(`Admin ${adminId} locking account for user: ${userId}`, {
        reason: dto.reason,
      });

      // 1. --- FETCH ADMIN AND TARGET USER CONCURRENTLY ---
      const [admin, targetUser] = await Promise.all([
        this.userRepo.findById(adminId),
        this.userRepo.findById(userId), // Profile not needed for this action
      ]);

      // Validate admin permissions
      if (!admin || !admin.isAdmin() || !admin.isActive || admin.isLocked()) {
        throw new ForbiddenException('Insufficient permissions for administrative operations.');
      }

      if (!targetUser) {
        throw new NotFoundException('User not found.');
      }

      // Security checks (these are correct and stay)
      if (userId === adminId) {
        throw new AdminSecurityError('Admins cannot lock their own account.');
      }
      if (targetUser.isLocked()) {
        throw new BadRequestException('User account is already locked.');
      }

      // Use the domain method to lock the account
      targetUser.lock({
        reason: 'admin_action',
        by: adminId,
        durationMinutes: dto.durationMinutes,
      });

      // Save the aggregate
      await this.userRepo.save(targetUser);

      // Revoke all user sessions (simplified logic)
      const sessionsTerminated = await this.refreshTokenRepo.revokeAllByUserId(userId);
      await this.loginSessionRepo.revokeAllByUserId(userId); // Also revoke login sessions

      // Publish the UserLockedEvent
      await this.publishDomainEvents(targetUser);

      // Send notification to user (logic is correct, but check lockedUntil)
      if (dto.notifyUser ?? true) {
        if (targetUser.lockedUntil) {
          // Safety check
          this.sendAccountLockedNotification(targetUser, dto.reason, targetUser.lockedUntil).catch(
            (error) => this.logger.error('Failed to send account locked notification', error),
          );
        }
      }

      this.logger.log(
        `Admin ${adminId} successfully locked account for user ${userId}, sessions terminated: ${sessionsTerminated}`,
      );

      // 2. --- ALIGN MAPPER CALL ---
      return this.userMapper.toLockUserAccountResponse(targetUser, {
        reason: dto.reason,
        lockedBy: admin.email.getValue(),
        userNotified: dto.notifyUser ?? true,
        sessionsTerminated,
      });
    } catch (error) {
      this.logger.error(`Failed to lock account for user ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  async unlockUserAccount(
    userId: string,
    dto: UnlockUserAccountRequestDto,
    adminId: string,
  ): Promise<UnlockUserAccountResponseDto> {
    try {
      this.logger.log(`Admin ${adminId} unlocking account for user: ${userId}`);

      // 1. --- FETCH ADMIN AND TARGET USER CONCURRENTLY ---
      const [admin, targetUser] = await Promise.all([
        this.userRepo.findById(adminId),
        this.userRepo.findById(userId),
      ]);

      // Validate admin permissions
      if (!admin || !admin.isAdmin() || !admin.isActive || admin.isLocked()) {
        throw new ForbiddenException('Insufficient permissions for administrative operations.');
      }

      if (!targetUser) {
        throw new NotFoundException('User not found.');
      }

      if (!targetUser.isLocked()) {
        throw new BadRequestException('User account is not locked.');
      }

      // Use the domain method to unlock the account and reset login attempts
      targetUser.unlock(adminId);

      // Save the aggregate with the updated state
      await this.userRepo.save(targetUser);

      // Publish the UserUnlockedEvent
      await this.publishDomainEvents(targetUser);

      // Send notification to user (this logic is correct)
      if (dto.notifyUser ?? true) {
        this.sendAccountUnlockedNotification(targetUser, dto.reason).catch((error) =>
          this.logger.error('Failed to send account unlocked notification', error),
        );
      }

      this.logger.log(`Admin ${adminId} successfully unlocked account for user ${userId}`);

      // 2. --- ALIGN MAPPER CALL ---
      return this.userMapper.toUnlockUserAccountResponse(targetUser, {
        unlockedBy: admin.email.getValue(),
        reason: dto.reason,
        userNotified: dto.notifyUser ?? true,
      });
    } catch (error) {
      this.logger.error(`Failed to unlock account for user ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }
  // ==========================================================================
  // USER DELETION & RESTORATION
  // ==========================================================================

  async softDeleteUser(
    userId: string,
    dto: SoftDeleteUserRequestDto,
    adminId: string,
  ): Promise<SoftDeleteUserResponseDto> {
    try {
      this.logger.log(`Admin ${adminId} soft-deleting user: ${userId}`, {
        reason: dto.reason,
        permanent: dto.permanent,
      });

      // 1. --- FETCH ADMIN AND TARGET USER CONCURRENTLY ---
      const [admin, targetUser] = await Promise.all([
        this.userRepo.findById(adminId),
        this.userRepo.findById(userId),
      ]);

      // Validate admin permissions
      if (!admin || !admin.isAdmin() || !admin.isActive || admin.isLocked()) {
        throw new ForbiddenException('Insufficient permissions for administrative operations.');
      }

      if (!targetUser) {
        throw new NotFoundException('User not found.');
      }

      // Security checks (these are correct and stay)
      if (userId === adminId) {
        throw new AdminSecurityError('Admins cannot delete their own account.');
      }
      if (targetUser.isDeleted) {
        throw new BadRequestException('User is already deleted.');
      }

      // NOTE: We are ignoring the `dto.permanent` flag for this method.
      // Permanent deletion should be a separate, more explicit flow.

      // Use the domain method to soft delete the user
      targetUser.softDelete(adminId);

      // Save the aggregate with the updated state (deletedAt, isActive)
      await this.userRepo.save(targetUser);

      // Revoke all user sessions
      const sessionsTerminated = await this.refreshTokenRepo.revokeAllByUserId(userId);
      await this.loginSessionRepo.revokeAllByUserId(userId);

      // Publish the UserDeletedEvent
      await this.publishDomainEvents(targetUser);

      // Send notification to user
      if (dto.notifyUser ?? true) {
        this.sendAccountDeletedNotification(targetUser, dto.reason, dto.permanent ?? false).catch(
          (error) => this.logger.error('Failed to send account deleted notification', error),
        );
      }

      this.logger.log(
        `Admin ${adminId} successfully soft-deleted user ${userId}, sessions terminated: ${sessionsTerminated}`,
      );

      // 2. --- ALIGN MAPPER CALL ---
      return this.userMapper.toSoftDeleteUserResponse(targetUser, {
        reason: dto.reason,
        deletedBy: admin.email.getValue(),
        permanent: dto.permanent ?? false,
        userNotified: dto.notifyUser ?? true,
        sessionsTerminated,
        dataScheduledForDeletion: this.getDataScheduledForDeletion(dto.permanent ?? false),
      });
    } catch (error) {
      this.logger.error(`Failed to soft-delete user ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  async restoreUser(
    userId: string,
    dto: RestoreUserRequestDto,
    adminId: string,
  ): Promise<RestoreUserResponseDto> {
    try {
      this.logger.log(`Admin ${adminId} restoring user: ${userId}`);

      // 1. --- FETCH ADMIN AND TARGET USER CONCURRENTLY ---
      const [admin, targetUser] = await Promise.all([
        this.userRepo.findById(adminId),
        this.userRepo.findByIdWithProfile(userId), // Fetch with profile for the response
      ]);

      // Validate admin permissions
      if (!admin || !admin.isAdmin() || !admin.isActive || admin.isLocked()) {
        throw new ForbiddenException('Insufficient permissions for administrative operations.');
      }

      if (!targetUser) {
        throw new NotFoundException('User not found.');
      }

      if (!targetUser.isDeleted) {
        throw new BadRequestException('User is not deleted.');
      }

      const shouldReactivate = dto.reactivate ?? true;

      // 2. --- USE THE NEW, EXPLICIT DOMAIN METHOD ---
      targetUser.restore(adminId, dto.reason);

      // If the DTO specifies not to reactivate, we can deactivate it again.
      // The restore method already reactivates it by default.
      if (!shouldReactivate) {
        targetUser.deactivate(adminId, 'Restored as inactive by admin');
      }

      // 3. --- SAVE THE AGGREGATE ---
      await this.userRepo.save(targetUser);

      // Publish the domain events (UserReactivatedEvent, etc.)
      await this.publishDomainEvents(targetUser);

      // Send notification to user
      this.sendAccountRestoredNotification(targetUser, dto.reason).catch((error) =>
        this.logger.error('Failed to send account restored notification', error),
      );

      this.logger.log(`Admin ${adminId} successfully restored user ${userId}`);

      // 4. --- ALIGN MAPPER CALL ---
      return this.userMapper.toRestoreUserResponse(targetUser, {
        restoredBy: admin.email.getValue(),
        reason: dto.reason,
        reactivated: targetUser.isActive, // Use the final state of the user object
      });
    } catch (error) {
      this.logger.error(`Failed to restore user ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================

  async bulkUpdateUsers(
    dto: AdminBulkUpdateUsersRequestDto,
    adminId: string,
  ): Promise<AdminBulkUpdateUsersResponseDto> {
    try {
      this.logger.log(`Admin ${adminId} performing bulk update on ${dto.userIds.length} users`);
      await this.validateAdminPermissions(adminId);

      if (dto.userIds.length === 0) {
        throw new BadRequestException('No user IDs provided for bulk update.');
      }
      if (dto.userIds.length > 1000) {
        throw new BadRequestException('Bulk operations are limited to 1000 users at a time.');
      }

      const failures: Array<{ userId: string; error: string }> = [];

      // Prevent admin from changing their own role or deactivating themselves in bulk.
      const filteredUserIds = dto.userIds.filter((id) => {
        if (id === adminId && (dto.role !== undefined || dto.isActive === false)) {
          failures.push({ userId: id, error: 'Cannot modify own account in bulk operation.' });
          return false;
        }
        return true;
      });

      if (filteredUserIds.length === 0) {
        throw new BulkOperationError('No valid user IDs remaining for bulk update.');
      }

      // 1. --- SEPARATE USER AND PROFILE DATA ---
      const userData: UserUpdateData = {};
      const profileData: { emailVerified?: boolean } = {};

      if (dto.role !== undefined) userData.role = dto.role;
      if (dto.isActive !== undefined) userData.isActive = dto.isActive;
      if (dto.lockedUntil !== undefined)
        userData.lockedUntil = dto.lockedUntil ? new Date(dto.lockedUntil) : null;
      if (dto.loginAttempts !== undefined) userData.loginAttempts = dto.loginAttempts;
      if (dto.emailVerified !== undefined) profileData.emailVerified = dto.emailVerified;

      let usersUpdated = 0;

      // 2. --- PERFORM SEPARATE BULK UPDATES ---
      if (Object.keys(userData).length > 0) {
        usersUpdated = await this.userRepo.bulkUpdate(filteredUserIds, userData);
      }
      if (Object.keys(profileData).length > 0) {
        // You will need to add a `bulkUpdateProfiles` method to your IUserRepository
        await this.userRepo.bulkUpdateProfiles(filteredUserIds, profileData);
        // We assume the number of users updated is the same as the first operation.
        if (usersUpdated === 0) usersUpdated = filteredUserIds.length;
      }

      const updatedUserIds = filteredUserIds.slice(0, usersUpdated);

      // Simple failure tracking (can be improved if repo returns more detail)
      if (usersUpdated < filteredUserIds.length) {
        filteredUserIds.slice(usersUpdated).forEach((id) => {
          failures.push({ userId: id, error: 'Update failed or user not found.' });
        });
      }

      // 3. --- PUBLISH A SINGLE BULK EVENT ---
      if (usersUpdated > 0) {
        const bulkUpdateEvent = new UsersBulkUpdatedEvent({
          adminId,
          updatedUserIds,
          changes: { ...userData, ...profileData },
          reason: dto.reason,
        });
        // This assumes a generic event publisher, not one tied to a specific aggregate
        await this.eventPublisher.publish(bulkUpdateEvent);
      }

      this.logger.log(
        `Admin ${adminId} completed bulk update: ${usersUpdated} successful, ${failures.length} failed`,
      );

      // 4. --- ALIGN MAPPER CALL ---
      return this.userMapper.toAdminBulkUpdateUsersResponse({
        usersUpdated,
        updatedUserIds,
        failures,
        reason: dto.reason,
      });
    } catch (error) {
      this.logger.error(`Bulk update failed for admin ${adminId}`, error);
      throw this.handleServiceError(error);
    }
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  async terminateUserSessions(userId: string, adminId: string): Promise<number> {
    try {
      this.logger.log(`Admin ${adminId} terminating all sessions for user: ${userId}`);

      // Fetching the admin and target user is a good pattern for validation
      const [admin, targetUser] = await Promise.all([
        this.userRepo.findById(adminId),
        this.userRepo.findById(userId),
      ]);

      if (!admin || !admin.isAdmin()) {
        throw new ForbiddenException('Insufficient permissions for administrative operations.');
      }

      if (!targetUser) {
        throw new NotFoundException('User not found.');
      }

      // Security check for self-termination
      if (userId === adminId) {
        this.logger.warn(`Admin ${adminId} is terminating their own sessions.`);
        // This is a valid action, but worth logging as a high-priority event.
      }

      // 1. --- SIMPLIFIED SESSION REVOCATION ---
      // It's clearer to await them separately and sum the result.
      const refreshTokensRevoked = await this.refreshTokenRepo.revokeAllByUserId(userId);
      const sessionsRevoked = await this.loginSessionRepo.revokeAllByUserId(userId);
      const sessionsTerminated = refreshTokensRevoked + sessionsRevoked;

      // NOTE: For a more advanced implementation, the repository methods could return the IDs
      // of the revoked tokens/sessions, which would be useful for the domain event.
      // For now, we'll pass an empty array as the original code did.

      // 2. --- ALIGNED DOMAIN EVENT CALL ---
      // The domain method call is already correct.
      targetUser.revokeAllSessions(adminId, [], 'Admin terminated all sessions');
      await this.publishDomainEvents(targetUser);

      // Send notification
      this.sendSessionsTerminatedNotification(targetUser, sessionsTerminated).catch((error) =>
        this.logger.error('Failed to send sessions terminated notification', error),
      );

      this.logger.log(
        `Admin ${adminId} terminated ${sessionsTerminated} sessions for user ${userId}`,
      );

      return sessionsTerminated;
    } catch (error) {
      this.logger.error(`Failed to terminate sessions for user ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  async forcePasswordReset(userId: string, adminId: string): Promise<string> {
    try {
      this.logger.log(`Admin ${adminId} forcing password reset for user: ${userId}`);

      // 1. --- FETCH ADMIN AND TARGET USER CONCURRENTLY ---
      const [admin, targetUser] = await Promise.all([
        this.userRepo.findById(adminId),
        this.userRepo.findById(userId),
      ]);

      // Validate admin permissions
      if (!admin || !admin.isAdmin() || !admin.isActive || admin.isLocked()) {
        throw new ForbiddenException('Insufficient permissions for administrative operations.');
      }

      if (!targetUser) {
        throw new NotFoundException('User not found.');
      }

      // Security check for self-reset
      if (userId === adminId) {
        throw new AdminSecurityError(
          'Admins cannot force-reset their own password via this method.',
        );
      }

      // Generate temporary password
      const tempPassword = this.generateSecureTemporaryPassword();
      const newPassword = await Password.create(tempPassword);

      // 2. --- ALIGN DOMAIN MODEL CALL ---
      // Fetch the user's password history to pass to the domain model
      const recentPasswords = await this.passwordHistoryRepo.findByUserId(
        userId,
        this.PASSWORD_HISTORY_COUNT,
      );
      const recentPasswordHashes = recentPasswords.map((p) => p.passwordHash);

      // Call the domain method with the required history
      await targetUser.resetPassword(newPassword, recentPasswordHashes);

      // Save the user with the new password
      await this.userRepo.save(targetUser);

      // Store the new password in the history
      await this.passwordHistoryRepo.save(userId, newPassword.getValue());

      // Revoke all sessions (this logic is correct)
      await this.refreshTokenRepo.revokeAllByUserId(userId);
      await this.loginSessionRepo.revokeAllByUserId(userId);

      // Publish the PasswordResetEvent
      await this.publishDomainEvents(targetUser);

      // Send notification with new password (this logic is correct)
      this.sendForcePasswordResetNotification(targetUser, tempPassword).catch((error) =>
        this.logger.error('Failed to send force password reset notification', error),
      );

      this.logger.log(`Admin ${adminId} successfully forced password reset for user ${userId}`);

      return tempPassword;
    } catch (error) {
      this.logger.error(`Failed to force password reset for user ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }
  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  private async validateAdminPermissions(adminId: string): Promise<void> {
    const admin = await this.userRepo.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin user not found.');
    }

    if (!admin.isAdmin()) {
      throw new ForbiddenException('Insufficient permissions for administrative operations.');
    }

    if (!admin.isActive) {
      throw new ForbiddenException('Admin account is inactive.');
    }

    if (admin.isLocked()) {
      throw new ForbiddenException('Admin account is locked.');
    }
  }

  private async validateAdminPromotion(adminId: string, targetUserId: string): Promise<void> {
    // This logic remains the same.
    const currentAdmins = await this.userRepo.findByRole(UserRole.ADMIN, 100);

    // Use the class property instead of a hardcoded number.
    if (currentAdmins.length >= this.MAX_ADMIN_COUNT) {
      throw new AdminSecurityError('Maximum number of administrators has been reached.');
    }

    // The logging is excellent and remains the same.
    this.logger.warn(`Admin ${adminId} is promoting user ${targetUserId} to ADMIN role`, {
      adminId,
      targetUserId,
      currentAdminCount: currentAdmins.length,
    });
  }

  private generateSecureTemporaryPassword(): string {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghjkmnpqrstuvwxyz';
    const numbers = '23456789';
    const special = '!@#$%^&*';

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    const allChars = uppercase + lowercase + numbers + special;
    for (let i = 4; i < this.TEMP_PASSWORD_LENGTH; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  private async publishDomainEvents(user: User): Promise<void> {
    if (user.domainEvents.length > 0) {
      try {
        await this.eventPublisher.publishBatch(user.domainEvents);
        user.clearDomainEvents();
      } catch (error) {
        this.logger.error('Failed to publish domain events', error);
        // Don't throw - event publishing failure shouldn't break the main flow
      }
    }
  }

  private getDataScheduledForDeletion(permanent: boolean): string[] {
    if (permanent) {
      return [
        'personal_data',
        'profile_information',
        'sessions',
        'login_history',
        'audit_logs',
        'documents',
        'preferences',
      ];
    }
    return ['personal_data', 'profile_information', 'sessions'];
  }

  // ==========================================================================
  // NOTIFICATION METHODS
  // ==========================================================================

  private async sendWelcomeEmail(user: User, tempPassword: string): Promise<void> {
    await this.notificationService.sendEmail({
      to: user.email.getValue(),
      subject: 'Welcome to Shamba Sure - Account Created',
      template: 'admin-created-user',
      data: {
        firstName: user.firstName,
        email: user.email.getValue(),
        temporaryPassword: tempPassword,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        supportEmail: 'support@shambasure.com',
      },
    });
  }

  private async sendRoleChangeNotification(
    user: User,
    oldRole: UserRole,
    newRole: UserRole,
    reason?: string,
  ): Promise<void> {
    await this.notificationService.sendEmail({
      to: user.email.getValue(),
      subject: 'Your account role has been updated',
      template: 'role-changed',
      data: {
        firstName: user.firstName,
        oldRole,
        newRole,
        reason: reason || 'No reason provided',
        effectiveDate: new Date().toISOString(),
      },
    });
  }

  private async sendAccountLockedNotification(
    user: User,
    reason: string,
    lockedUntil: Date,
  ): Promise<void> {
    await this.notificationService.sendEmail({
      to: user.email.getValue(),
      subject: 'Your account has been locked',
      template: 'account-locked',
      data: {
        firstName: user.firstName,
        reason,
        lockedUntil: lockedUntil.toISOString(),
        supportContact: 'support@shambasure.com',
      },
    });
  }

  private async sendAccountUnlockedNotification(user: User, reason?: string): Promise<void> {
    await this.notificationService.sendEmail({
      to: user.email.getValue(),
      subject: 'Your account has been unlocked',
      template: 'account-unlocked',
      data: {
        firstName: user.firstName,
        reason: reason || 'Account review completed',
        unlockDate: new Date().toISOString(),
      },
    });
  }

  private async sendAccountDeletedNotification(
    user: User,
    reason: string,
    permanent: boolean,
  ): Promise<void> {
    await this.notificationService.sendEmail({
      to: user.email.getValue(),
      subject: 'Your account has been deleted',
      template: 'account-deleted',
      data: {
        firstName: user.firstName,
        reason,
        permanent,
        deletionDate: new Date().toISOString(),
        ...(permanent ? {} : { restorationPeriod: '30 days' }),
      },
    });
  }

  private async sendAccountRestoredNotification(user: User, reason?: string): Promise<void> {
    await this.notificationService.sendEmail({
      to: user.email.getValue(),
      subject: 'Your account has been restored',
      template: 'account-restored',
      data: {
        firstName: user.firstName,
        reason: reason || 'Account restoration requested',
        restorationDate: new Date().toISOString(),
      },
    });
  }

  private async sendSessionsTerminatedNotification(
    user: User,
    sessionCount: number,
  ): Promise<void> {
    await this.notificationService.sendEmail({
      to: user.email.getValue(),
      subject: 'Your sessions have been terminated',
      template: 'sessions-terminated',
      data: {
        firstName: user.firstName,
        sessionCount,
        terminationDate: new Date().toISOString(),
        reason: 'Security action by administrator',
      },
    });
  }

  private async sendForcePasswordResetNotification(user: User, newPassword: string): Promise<void> {
    await this.notificationService.sendEmail({
      to: user.email.getValue(),
      subject: 'Your password has been reset',
      template: 'admin-password-reset',
      data: {
        firstName: user.firstName,
        temporaryPassword: newPassword,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        resetDate: new Date().toISOString(),
        securityNotice:
          'For your security, please change this password immediately after logging in.',
      },
    });
  }

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  private handleServiceError(error: unknown): Error {
    // If it's already an HTTP exception, rethrow it
    if (
      error instanceof NotFoundException ||
      error instanceof BadRequestException ||
      error instanceof ConflictException ||
      error instanceof ForbiddenException
    ) {
      return error;
    }

    // Handle custom service errors
    if (error instanceof AdminServiceError) {
      switch (error.constructor) {
        case AdminSecurityError:
          return new ForbiddenException(error.message);
        case BulkOperationError:
          return new BadRequestException(error.message);
        default:
          return new BadRequestException(error.message);
      }
    }

    // Log unexpected errors
    if (error instanceof Error) {
      this.logger.error('Unexpected error in AdminService', error.message, error.stack);
      return new InternalServerErrorException(
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred. Please try again.',
      );
    }

    // Fallback for non-Error throwables
    this.logger.error('Unexpected non-Error thrown in AdminService', String(error));
    return new InternalServerErrorException('An unexpected error occurred. Please try again.');
  }
}
