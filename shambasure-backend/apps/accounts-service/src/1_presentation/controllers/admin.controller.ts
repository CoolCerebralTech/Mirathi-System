import {
  Controller,
  Get,
  Param,
  Query,
  Delete,
  Patch,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@shamba/auth';
import { UserRole } from '@shamba/common/enums';

// Application Layer
import { UserService } from '../../2_application/services/user.service';
import {
  UserQueryDto,
  AdminUpdateUserDto,
  UpdateUserRoleRequestDto,
  LockUserAccountRequestDto,
  UnlockUserAccountRequestDto,
  SoftDeleteUserRequestDto,
  RestoreUserRequestDto,
  UserResponseDto,
  DetailedUserResponseDto,
  PaginatedUsersResponseDto,
  UpdateUserResponseDto,
  UpdateUserRoleResponseDto,
  LockUserAccountResponseDto,
  UnlockUserAccountResponseDto,
  SoftDeleteUserResponseDto,
  RestoreUserResponseDto,
  UserStatsResponseDto,
} from '../../2_application/dtos/user.dto';

/**
 * AdminController
 *
 * Handles all admin-only user management endpoints.
 * Requires ADMIN role for all operations.
 */
@ApiTags('Admin - User Management')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly userService: UserService) {}

  // ============================================================================
  // USER LISTING & DETAILS
  // ============================================================================

  @Get()
  @ApiOperation({
    summary: 'List all users',
    description: 'Returns paginated list of users with optional filters.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully.',
    type: PaginatedUsersResponseDto,
  })
  async getAllUsers(@Query() query: UserQueryDto): Promise<PaginatedUsersResponseDto> {
    return this.userService.getAllUsers(query);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Returns comprehensive user statistics for admin dashboard.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully.',
    type: UserStatsResponseDto,
  })
  async getUserStats(): Promise<UserStatsResponseDto> {
    return this.userService.getUserStats();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns detailed user information including sensitive data.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully.',
    type: DetailedUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  async getUserById(@Param('id', ParseUUIDPipe) id: string): Promise<DetailedUserResponseDto> {
    return this.userService.getUserById(id);
  }

  // ============================================================================
  // USER MODIFICATION
  // ============================================================================

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates user information. Admin can modify any field.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully.',
    type: UpdateUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  async updateUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @CurrentUser('sub') adminId: string,
    @Body() dto: AdminUpdateUserDto,
  ): Promise<UpdateUserResponseDto> {
    return this.userService.adminUpdateUser(userId, dto, adminId);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate user account',
    description: 'Activates a deactivated user account.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User activated successfully.',
    type: UpdateUserResponseDto,
  })
  async activateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') adminId: string,
  ): Promise<UpdateUserResponseDto> {
    return this.userService.adminUpdateUser(id, { isActive: true }, adminId);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate user account',
    description: 'Deactivates a user account. User cannot login.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deactivated successfully.',
    type: UpdateUserResponseDto,
  })
  async deactivateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') adminId: string,
  ): Promise<UpdateUserResponseDto> {
    return this.userService.adminUpdateUser(id, { isActive: false }, adminId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete user',
    description: 'Soft deletes a user account. Can be restored later.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User soft deleted successfully.',
    type: SoftDeleteUserResponseDto,
  })
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SoftDeleteUserRequestDto,
  ): Promise<SoftDeleteUserResponseDto> {
    return this.userService.softDeleteUser(id, dto);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore deleted user',
    description: 'Restores a soft-deleted user account.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User restored successfully.',
    type: RestoreUserResponseDto,
  })
  async restoreUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RestoreUserRequestDto,
  ): Promise<RestoreUserResponseDto> {
    return this.userService.restoreUser(id, dto);
  }

  // ============================================================================
  // ACCOUNT SECURITY
  // ============================================================================

  @Post(':id/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lock user account',
    description: 'Locks a user account for security reasons. Can set duration or indefinite.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User account locked successfully.',
    type: LockUserAccountResponseDto,
  })
  async lockUserAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') adminId: string,
    @Body() dto: LockUserAccountRequestDto,
  ): Promise<LockUserAccountResponseDto> {
    return this.userService.lockUserAccount(id, dto, adminId);
  }

  @Post(':id/unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unlock user account',
    description: 'Unlocks a locked user account and resets login attempts.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User account unlocked successfully.',
    type: UnlockUserAccountResponseDto,
  })
  async unlockUserAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UnlockUserAccountRequestDto,
  ): Promise<UnlockUserAccountResponseDto> {
    return this.userService.unlockUserAccount(id, dto);
  }

  // ============================================================================
  // ROLE MANAGEMENT
  // ============================================================================

  @Patch(':id/role')
  @ApiOperation({
    summary: 'Update user role',
    description: 'Changes user role. Creates audit trail entry.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User role updated successfully.',
    type: UpdateUserRoleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  async updateUserRole(
    @Param('id', ParseUUIDPipe) targetUserId: string,
    @CurrentUser('sub') adminUserId: string,
    @Body() dto: UpdateUserRoleRequestDto,
  ): Promise<UpdateUserRoleResponseDto> {
    return this.userService.updateUserRole(targetUserId, dto, adminUserId);
  }
}
