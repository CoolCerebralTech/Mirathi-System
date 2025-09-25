import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  Delete, 
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery,
} from '@nestjs/swagger';
import { 
  UserResponseDto,
  UserQueryDto,
  createSuccessResponse,
  createPaginatedResponse,
} from '@shamba/common';
import { 
  JwtAuthGuard, 
  RolesGuard, 
  Roles, 
  CurrentUser,
} from '@shamba/auth';
import { UserService } from '../services/user.service';
import { LoggerService } from '@shamba/observability';
import { UserRole } from '@shamba/common';
import { JwtPayload } from '@shamba/auth';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private userService: UserService,
    private logger: LoggerService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Users retrieved successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  async findAll(
    @Query() query: UserQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Fetching users list', 'UsersController', { 
      adminUserId: user.userId 
    });
    
    const result = await this.userService.findAllUsers(query, user);
    
    return createPaginatedResponse(
      result.users,
      result.meta,
      'Users retrieved successfully',
    );
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully' 
  })
  async getStats(@CurrentUser() user: JwtPayload) {
    this.logger.debug('Fetching user statistics', 'UsersController', { 
      adminUserId: user.userId 
    });
    
    const stats = await this.userService.getStats(user);
    
    return createSuccessResponse(stats, 'Statistics retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Fetching user by ID', 'UsersController', { 
      targetUserId: id,
      currentUserId: user.userId,
    });
    
    const result = await this.userService.getUserById(id, user);
    
    return createSuccessResponse(result, 'User retrieved successfully');
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User deleted successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Deleting user', 'UsersController', { 
      targetUserId: id,
      adminUserId: user.userId,
    });
    
    await this.userService.deleteUser(id, user);
    
    return createSuccessResponse(null, 'User deleted successfully');
  }
}