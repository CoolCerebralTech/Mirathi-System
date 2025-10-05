// ============================================================================
// users.controller.ts - Admin User Management
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
  ClassSerializerInterceptor as UserClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam 
} from '@nestjs/swagger';
import { 
  UserQueryDto, 
  createPaginatedResponseDto,
  UpdateUserRoleDto 
} from '@shamba/common';
import { 
  JwtAuthGuard, 
  RolesGuard, 
  Roles,
  CurrentUser as AdminCurrentUser 
} from '@shamba/auth';
import { UsersService as AdminUsersService } from '../services/users.service';
import { UserRole } from '@shamba/database';
import { UserEntity as AdminUserEntity } from '../entities/user.entity';

// Dynamically create paginated response DTO for Swagger
const PaginatedUserResponse = createPaginatedResponseDto(AdminUserEntity);

/**
 * UsersController - Admin-only user management endpoints
 * 
 * SECURITY:
 * - All endpoints require authentication (JwtAuthGuard)
 * - All endpoints require ADMIN role (RolesGuard)
 * 
 * ENDPOINTS:
 * - GET /users - List all users (paginated, filtered, searchable)
 * - GET /users/:id - Get single user by ID
 * - PATCH /users/:id/role - Update user role
 * - DELETE /users/:id - Delete user
 */
@ApiTags('Users (Admin)')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(UserClassSerializerInterceptor)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  /**
   * List all users with pagination, search, and filters
   * Admin only
   */
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'List all users (Admin)',
    description: 'Get paginated list of users with search and filter capabilities'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Users retrieved successfully',
    type: PaginatedUserResponse 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin role required' 
  })
  async findMany(@Query() query: UserQueryDto) {
    const { users, total } = await this.usersService.findMany(query);

    // Serialize all users to strip passwords
    const userEntities = users.map(user => new AdminUserEntity(user));

    return new PaginatedUserResponse(userEntities, total, query);
  }

  /**
   * Get single user by ID
   * Admin only
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get user by ID (Admin)',
    description: 'Retrieve detailed information for a specific user'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User UUID',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User retrieved successfully',
    type: AdminUserEntity 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin role required' 
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<AdminUserEntity> {
    const user = await this.usersService.findOne(id);
    return new AdminUserEntity(user);
  }

  /**
   * Update user role
   * Admin only - cannot change own role
   */
  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Update user role (Admin)',
    description: 'Change the role of a user (cannot modify own role)'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User UUID',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User role updated successfully',
    type: AdminUserEntity 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Cannot modify own role' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin role required' 
  })
  async updateRole(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @AdminCurrentUser('sub') actorId: string,
  ): Promise<AdminUserEntity> {
    const updatedUser = await this.usersService.updateRole(
      userId,
      updateRoleDto.role,
      actorId
    );
    return new AdminUserEntity(updatedUser);
  }

  /**
   * Delete user
   * Admin only - cascades to all related data
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete user (Admin)',
    description: 'Permanently delete a user and all associated data (cascades)'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User UUID',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'User deleted successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin role required' 
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    await this.usersService.delete(id);
  }
}