import {
  Controller,
  Get,
  Param,
  Query,
  Delete,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import {
  UserQueryDto,
  AdminUpdateUserDto,
  UpdateUserRoleRequestDto,
  RoleChangeQueryDto,
  PaginatedUsersResponseDto,
  PaginatedRoleChangesResponseDto,
  UpdateUserResponseDto,
} from '@shamba/common';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@shamba/auth';
import { AccountsService } from '../services/accounts.service';
import { UserRole } from '@shamba/database';
import { UserEntity, DetailedUserEntity, RoleChangeEntity } from '../entities/user.entity';

@ApiTags('Admin - User Management')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly accountsService: AccountsService) {}

  // ============================================================================
  // USER LISTING & DETAILS
  // ============================================================================

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedUsersResponseDto })
  async findAllUsers(@Query() query: UserQueryDto): Promise<PaginatedUsersResponseDto> {
    // The service returns the DTO directly, which is correct for this list view.
    return this.accountsService.findAllUsers(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, type: DetailedUserEntity })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async findUserById(@Param('id', ParseUUIDPipe) id: string): Promise<DetailedUserEntity> {
    // The service returns the raw data, which we wrap in the DetailedUserEntity for serialization.
    const userWithProfile = await this.accountsService.findUserWithProfileById(id);

    // The 'userWithProfile' object has the exact shape the DetailedUserEntity constructor expects.
    return new DetailedUserEntity(userWithProfile);
  }

  // ============================================================================
  // USER MODIFICATION
  // ============================================================================

  @Patch(':id')
  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, type: UpdateUserResponseDto })
  async updateUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: AdminUpdateUserDto,
  ): Promise<UpdateUserResponseDto> {
    return this.accountsService.adminUpdateUser(userId, dto);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a user account' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, type: UpdateUserResponseDto })
  async activateUser(@Param('id', ParseUUIDPipe) id: string): Promise<UpdateUserResponseDto> {
    // For consistency, this returns the full updated user object.
    return this.accountsService.adminUpdateUser(id, { isActive: true });
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a user account' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User deactivated successfully' })
  async deactivateUser(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.accountsService.deactivateUser(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a user account' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User soft deleted successfully' })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.accountsService.deleteUser(id);
  }

  // ============================================================================
  // ACCOUNT SECURITY
  // ============================================================================

  @Post(':id/unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlock a user account' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, type: UpdateUserResponseDto })
  async unlockUser(@Param('id', ParseUUIDPipe) id: string): Promise<UpdateUserResponseDto> {
    return this.accountsService.adminUpdateUser(id, {
      lockedUntil: undefined,
      loginAttempts: 0,
    });
  }

  // ============================================================================
  // ROLE MANAGEMENT
  // ============================================================================

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update a user role' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, type: UserEntity })
  async updateUserRole(
    @Param('id', ParseUUIDPipe) targetUserId: string,
    @CurrentUser('sub') adminUserId: string,
    @Body() dto: UpdateUserRoleRequestDto,
  ): Promise<UserEntity> {
    const updatedUser = await this.accountsService.updateUserRole(targetUserId, adminUserId, dto);

    // 2. The returned 'updatedUser' is a full UserWithProfile object,
    //    perfect for the UserEntity constructor.
    return new UserEntity(updatedUser);
  }

  @Get('roles/history')
  @ApiOperation({ summary: 'Get role change history for all users' })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedRoleChangesResponseDto })
  async getRoleChangeHistory(
    @Query() query: RoleChangeQueryDto,
  ): Promise<PaginatedRoleChangesResponseDto> {
    const result = await this.accountsService.getRoleChangeHistory(query);
    // Wrap each data item in the RoleChangeEntity for serialization.
    return {
      data: result.data.map((rc) => new RoleChangeEntity(rc)),
      meta: result.meta,
    };
  }

  @Get(':id/roles/history')
  @ApiOperation({ summary: 'Get role change history for a specific user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedRoleChangesResponseDto })
  async getUserRoleHistory(
    @Param('id', ParseUUIDPipe) userId: string,
    @Query() query: RoleChangeQueryDto,
  ): Promise<PaginatedRoleChangesResponseDto> {
    const result = await this.accountsService.getRoleChangeHistoryForUser(userId, query);
    return {
      data: result.data.map((rc) => new RoleChangeEntity(rc)),
      meta: result.meta,
    };
  }

  // ============================================================================
  // DASHBOARD STATISTICS
  // ============================================================================

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get user statistics summary' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully' })
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    lockedUsers: number;
    usersByRole: Record<UserRole, number>;
  }> {
    // The controller cleanly calls the service, which contains all the business logic.
    return this.accountsService.getUserStats();
  }
}
