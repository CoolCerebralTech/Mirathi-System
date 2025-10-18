// ============================================================================
// users.controller.ts - Admin User Management Controller
// ============================================================================
// Production-ready admin endpoints for user management with comprehensive
// security, validation, audit logging, and error handling.
// ============================================================================

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
  Logger,
  ValidationPipe,
  UsePipes,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { UserQueryDto, createPaginatedResponseDto, UpdateUserRoleDto } from '@shamba/common';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@shamba/auth';
import { UsersService } from '../services/users.service';
import { UserRole } from '@shamba/database';
import { UserEntity } from '../entities/user.entity';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Paginated response type for user lists
 */
const PaginatedUserResponse = createPaginatedResponseDto(UserEntity);
type PaginatedUserResponseType = InstanceType<typeof PaginatedUserResponse>;

/**
 * UsersController handles administrative user management operations.
 *
 * RESPONSIBILITY MATRIX:
 * ┌──────────────────────┬─────────────────────────────────────────┐
 * │ Endpoint             │ Purpose                                 │
 * ├──────────────────────┼─────────────────────────────────────────┤
 * │ GET /users           │ List users (paginated, filtered)        │
 * │ GET /users/:id       │ Get single user details by UUID         │
 * │ PATCH /users/:id/role│ Update user role (ADMIN only)           │
 * │ DELETE /users/:id    │ Permanently delete user & related data  │
 * └──────────────────────┴─────────────────────────────────────────┘
 *
 * SECURITY MODEL:
 * - Authentication: All endpoints require valid JWT (JwtAuthGuard)
 * - Authorization: All endpoints require ADMIN role (RolesGuard)
 * - Audit Logging: All operations logged with actor ID
 * - Self-Protection: Admins cannot modify their own role
 * - Data Sanitization: Passwords excluded via ClassSerializerInterceptor
 *
 * FEATURES:
 * - Pagination with configurable page size
 * - Full-text search across name and email
 * - Role-based filtering
 * - Soft delete support (if configured in service)
 * - Comprehensive error handling and validation
 */
@ApiTags('User Management (Admin Only)')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }),
)
@ApiBearerAuth()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {
    this.logger.log('UsersController initialized - Admin user management active');
  }

  // ========================================================================
  // USER LISTING & RETRIEVAL ENDPOINTS
  // ========================================================================

  /**
   * List all users with advanced filtering, search, and pagination.
   *
   * FLOW:
   * 1. Validate admin authentication and authorization
   * 2. Parse and validate query parameters (page, limit, search, role)
   * 3. Execute database query with filters
   * 4. Calculate total count for pagination metadata
   * 5. Serialize users (exclude passwords and sensitive fields)
   * 6. Return paginated response with metadata
   *
   * FEATURES:
   * - Search: Full-text search on firstName, lastName, email
   * - Filter: By role (ADMIN, MANAGER, USER, etc.)
   * - Sort: Multiple fields with ASC/DESC
   * - Pagination: Default 10 items, max 100 per page
   *
   * SECURITY: Admin role required, audit logging enabled
   */
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List all users with pagination and filters',
    description: `Retrieves a paginated list of users with support for:
    - Full-text search (name, email)
    - Role filtering (ADMIN, MANAGER, USER)
    - Flexible sorting
    - Configurable page size
    
    Only accessible by administrators. All sensitive data is automatically excluded.`,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-indexed)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (max 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for name or email',
    example: 'john@example.com',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'Filter by user role',
    example: UserRole.LAND_OWNER,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully with pagination metadata.',
    type: PaginatedUserResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required. Provide valid JWT token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions. Admin role required.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters (e.g., negative page number).',
  })
  async findMany(
    @Query() query: UserQueryDto,
    @CurrentUser('sub') adminId: string,
  ): Promise<PaginatedUserResponseType> {
    try {
      this.logger.log(
        `User list requested by admin: ${adminId} | ` +
          `Page: ${query.page ?? 1}, Limit: ${query.limit ?? 10}, ` +
          `Search: ${query.search ?? 'none'}, Role: ${query.role ?? 'all'}`,
      );

      const { users, total } = await this.usersService.findMany(query);

      // Serialize users to strip sensitive data (passwords, tokens, etc.)
      const userEntities = users.map((user) => new UserEntity(user));

      this.logger.log(`Retrieved ${users.length} users (${total} total) for admin: ${adminId}`);

      return new PaginatedUserResponse(userEntities, total, query);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `User list retrieval failed for admin ${adminId}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * Get detailed information for a specific user by UUID.
   *
   * FLOW:
   * 1. Validate UUID format (ParseUUIDPipe)
   * 2. Validate admin authentication and authorization
   * 3. Query database for user with relations (profile, etc.)
   * 4. Handle user not found scenario
   * 5. Serialize and return user data
   *
   * RETURNS: Complete user object including:
   * - Basic info (name, email, role)
   * - Profile data (bio, phone, address)
   * - Next of kin information
   * - Account metadata (created/updated timestamps)
   *
   * SECURITY: Admin only, password excluded, audit logged
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get user by ID',
    description: `Retrieves complete information for a specific user including:
    - Personal details and contact information
    - User profile (bio, phone, address)
    - Next of kin details
    - Account status and metadata
    
    Sensitive information (password hashes, tokens) is automatically excluded.`,
  })
  @ApiParam({
    name: 'id',
    description: 'User unique identifier (UUID v4)',
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully.',
    type: UserEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid UUID format provided.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User with specified ID does not exist.',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') adminId: string,
  ): Promise<UserEntity> {
    try {
      this.logger.log(`User details requested for ID: ${id} by admin: ${adminId}`);

      const user = await this.usersService.findOne(id);

      this.logger.log(`User details retrieved: ${id} by admin: ${adminId}`);

      return new UserEntity(user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `User retrieval failed for ID ${id} by admin ${adminId}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  // ========================================================================
  // USER MODIFICATION ENDPOINTS
  // ========================================================================

  /**
   * Update user role (ADMIN, MANAGER, USER, etc.).
   *
   * FLOW:
   * 1. Validate UUID format and role enum value
   * 2. Check if admin is attempting to modify their own role (forbidden)
   * 3. Verify target user exists
   * 4. Update role in database
   * 5. Log role change for audit trail
   * 6. Return updated user object
   *
   * BUSINESS RULES:
   * - Admins cannot change their own role (prevents lockout)
   * - Only valid UserRole enum values accepted
   * - Role changes are immediately effective
   * - Existing sessions remain valid (consider token refresh)
   *
   * SECURITY: Self-modification prevention, audit logging,
   * validation of role transitions
   */
  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update user role',
    description: `Changes the role of a user. Supports all defined roles in the system.
    
    IMPORTANT RESTRICTIONS:
    - Admins cannot modify their own role (prevents privilege lockout)
    - Role changes are logged for audit purposes
    - Active user sessions remain valid after role change
    
    Consider implementing additional security measures:
    - Require password confirmation for sensitive role changes
    - Invalidate existing sessions after role change
    - Implement approval workflow for role elevation`,
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID to update',
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateUserRoleDto,
    description: 'New role to assign',
    examples: {
      promoteToAdmin: {
        value: { role: 'ADMIN' },
        description: 'Promote user to administrator',
      },
      demoteToUser: {
        value: { role: 'USER' },
        description: 'Demote user to regular user',
      },
      assignManager: {
        value: { role: 'MANAGER' },
        description: 'Assign manager role',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User role updated successfully.',
    type: UserEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot modify own role or invalid role value provided.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Invalid role enum value.',
  })
  async updateRole(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @CurrentUser('sub') actorId: string,
  ): Promise<UserEntity> {
    try {
      // Prevent self-modification
      if (userId === actorId) {
        this.logger.warn(`Admin ${actorId} attempted to modify their own role - blocked`);
        throw new BadRequestException(
          'Cannot modify your own role. This operation must be performed by another administrator.',
        );
      }

      this.logger.log(
        `Role update requested for user: ${userId} to ${updateRoleDto.role} by admin: ${actorId}`,
      );

      const updatedUser = await this.usersService.updateRole(userId, updateRoleDto.role, actorId);

      this.logger.log(
        `Role updated successfully: User ${userId} -> ${updateRoleDto.role} by admin: ${actorId}`,
      );

      return new UserEntity(updatedUser);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Role update failed for user ${userId} by admin ${actorId}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  // ========================================================================
  // USER DELETION ENDPOINT
  // ========================================================================

  /**
   * Permanently delete a user and all associated data.
   *
   * FLOW:
   * 1. Validate UUID format
   * 2. Verify target user exists
   * 3. Check for cascade delete implications (profile, tokens, etc.)
   * 4. Execute deletion (cascades to related records)
   * 5. Log deletion for audit and compliance
   * 6. Return 204 No Content
   *
   * IMPORTANT WARNINGS:
   * - This is a PERMANENT operation - data cannot be recovered
   * - Cascades to: user profile, refresh tokens, password reset tokens
   * - Consider implementing soft delete for data retention requirements
   * - Ensure GDPR/data protection compliance before deletion
   *
   * BUSINESS CONSIDERATIONS:
   * - Implement soft delete for audit trail preservation
   * - Archive data before deletion for compliance
   * - Notify affected services of user deletion
   * - Handle orphaned references in other services
   *
   * SECURITY: Admin only, irreversible operation, comprehensive audit logging
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user permanently',
    description: `Permanently deletes a user and ALL associated data including:
    - User account and credentials
    - User profile information
    - Refresh tokens and active sessions
    - Password reset tokens
    - Related records (cascading delete)
    
    ⚠️ WARNING: This operation is IRREVERSIBLE
    
    RECOMMENDATIONS:
    - Implement soft delete for data retention
    - Archive user data before deletion
    - Verify compliance with data protection regulations
    - Implement approval workflow for deletion requests
    - Consider data export before deletion (GDPR right to data portability)`,
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID to delete permanently',
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User deleted successfully. No content returned.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid UUID format.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found or already deleted.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User cannot be deleted due to existing dependencies.',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') adminId: string,
  ): Promise<void> {
    try {
      this.logger.warn(`User deletion requested: ${id} by admin: ${adminId} - PERMANENT OPERATION`);

      await this.usersService.delete(id);

      this.logger.warn(`User deleted permanently: ${id} by admin: ${adminId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `User deletion failed for ID ${id} by admin ${adminId}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
