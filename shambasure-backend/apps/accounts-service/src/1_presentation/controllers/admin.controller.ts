import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AdminService } from '../../2_application/services/admin.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser, type JwtPayload } from '@shamba/auth';
import { UserRole } from '@shamba/common';
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
} from '../../2_application/dtos/admin.dto';

/**
 * AdminController
 *
 * Handles all administrative operations HTTP endpoints:
 * - User management (CRUD)
 * - Role management
 * - Account locking/unlocking
 * - User deletion and restoration
 * - Bulk operations
 * - Statistics and reporting
 *
 * All endpoints require JWT authentication and ADMIN role.
 */
@ApiTags('Admin - User Management')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==========================================================================
  // USER RETRIEVAL & STATISTICS
  // ==========================================================================

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users (paginated)',
    description:
      'Returns a paginated list of users with filtering and sorting options. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully.',
    type: PaginatedUsersResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have ADMIN role.',
  })
  async getAllUsers(@Query() query: UserQueryDto): Promise<PaginatedUsersResponseDto> {
    return this.adminService.getAllUsers(query);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Returns aggregated user statistics for admin dashboard. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully.',
    type: UserStatsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have ADMIN role.',
  })
  async getUserStats(@CurrentUser() admin: JwtPayload): Promise<UserStatsResponseDto> {
    return this.adminService.getUserStats(admin.sub);
  }

  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns detailed information about a specific user. Admin only.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User unique identifier (UUID)',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully.',
    type: GetUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  async getUserById(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() admin: JwtPayload,
  ): Promise<GetUserResponseDto> {
    return this.adminService.getUserById(userId, admin.sub);
  }

  // ==========================================================================
  // USER CREATION
  // ==========================================================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user',
    description:
      'Creates a new user account with a temporary password. Optionally sends welcome email. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully.',
    type: AdminCreateUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async createUser(
    @Body() dto: AdminCreateUserRequestDto,
    @CurrentUser() admin: JwtPayload,
  ): Promise<AdminCreateUserResponseDto> {
    return this.adminService.createUser(dto, admin.sub);
  }

  // ==========================================================================
  // USER UPDATES
  // ==========================================================================

  @Patch(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user information',
    description: 'Updates user account details (name, email, status, lock status). Admin only.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User unique identifier (UUID)',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully.',
    type: AdminUpdateUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already in use.',
  })
  async updateUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AdminUpdateUserRequestDto,
    @CurrentUser() admin: JwtPayload,
  ): Promise<AdminUpdateUserResponseDto> {
    return this.adminService.updateUser(userId, dto, admin.sub);
  }

  // ==========================================================================
  // ROLE MANAGEMENT
  // ==========================================================================

  @Patch(':userId/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user role',
    description: "Changes a user's role with audit trail. Admin only.",
  })
  @ApiParam({
    name: 'userId',
    description: 'User unique identifier (UUID)',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User role updated successfully.',
    type: UpdateUserRoleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot change own role or invalid role.',
  })
  async updateUserRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserRoleRequestDto,
    @CurrentUser() admin: JwtPayload,
  ): Promise<UpdateUserRoleResponseDto> {
    return this.adminService.updateUserRole(userId, dto, admin.sub);
  }

  // ==========================================================================
  // ACCOUNT LOCKING
  // ==========================================================================

  @Post(':userId/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lock user account',
    description:
      'Locks a user account temporarily or indefinitely. Revokes all sessions. Admin only.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User unique identifier (UUID)',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User account locked successfully.',
    type: LockUserAccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot lock own account.',
  })
  async lockUserAccount(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: LockUserAccountRequestDto,
    @CurrentUser() admin: JwtPayload,
  ): Promise<LockUserAccountResponseDto> {
    return this.adminService.lockUserAccount(userId, dto, admin.sub);
  }

  @Post(':userId/unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unlock user account',
    description: 'Unlocks a previously locked user account. Admin only.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User unique identifier (UUID)',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User account unlocked successfully.',
    type: UnlockUserAccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'User account is not locked.',
  })
  async unlockUserAccount(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UnlockUserAccountRequestDto,
    @CurrentUser() admin: JwtPayload,
  ): Promise<UnlockUserAccountResponseDto> {
    return this.adminService.unlockUserAccount(userId, dto, admin.sub);
  }

  // ==========================================================================
  // USER DELETION & RESTORATION
  // ==========================================================================

  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete user',
    description:
      'Soft deletes a user account. Can be restored later. Revokes all sessions. Admin only.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User unique identifier (UUID)',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully.',
    type: SoftDeleteUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete own account or user already deleted.',
  })
  async softDeleteUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SoftDeleteUserRequestDto,
    @CurrentUser() admin: JwtPayload,
  ): Promise<SoftDeleteUserResponseDto> {
    return this.adminService.softDeleteUser(userId, dto, admin.sub);
  }

  @Post(':userId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore deleted user',
    description: 'Restores a previously deleted user account. Admin only.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User unique identifier (UUID)',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User restored successfully.',
    type: RestoreUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'User is not deleted.',
  })
  async restoreUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: RestoreUserRequestDto,
    @CurrentUser() admin: JwtPayload,
  ): Promise<RestoreUserResponseDto> {
    return this.adminService.restoreUser(userId, dto, admin.sub);
  }

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================

  @Patch('bulk/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk update users',
    description: 'Updates multiple users at once (role, status, lock). Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk update completed.',
    type: AdminBulkUpdateUsersResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async bulkUpdateUsers(
    @Body() dto: AdminBulkUpdateUsersRequestDto,
    @CurrentUser() admin: JwtPayload,
  ): Promise<AdminBulkUpdateUsersResponseDto> {
    return this.adminService.bulkUpdateUsers(dto, admin.sub);
  }

  // ==========================================================================
  // SESSION & PASSWORD MANAGEMENT
  // ==========================================================================

  @Post(':userId/terminate-sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Terminate all user sessions',
    description: 'Revokes all active sessions for a user. Admin only.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User unique identifier (UUID)',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sessions terminated successfully.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'All sessions terminated successfully.' },
        sessionsTerminated: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  async terminateUserSessions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() admin: JwtPayload,
  ): Promise<{ message: string; sessionsTerminated: number }> {
    const sessionsTerminated = await this.adminService.terminateUserSessions(userId, admin.sub);
    return {
      message: 'All sessions terminated successfully.',
      sessionsTerminated,
    };
  }

  @Post(':userId/force-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Force password reset',
    description:
      'Generates a new temporary password and sends it to the user. Revokes all sessions. Admin only.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User unique identifier (UUID)',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password reset successfully. Temporary password sent to user.',
        },
        temporaryPassword: { type: 'string', example: 'Temp@123!xyz' },
        emailSent: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing access token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot reset own password this way.',
  })
  async forcePasswordReset(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() admin: JwtPayload,
  ): Promise<{ message: string; temporaryPassword: string; emailSent: boolean }> {
    const temporaryPassword = await this.adminService.forcePasswordReset(userId, admin.sub);
    return {
      message: 'Password reset successfully. Temporary password sent to user.',
      temporaryPassword,
      emailSent: true,
    };
  }
}
