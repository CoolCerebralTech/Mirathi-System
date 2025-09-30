import {
  Controller,
  Get,
  Param,
  Query,
  Delete,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserQueryDto, createPaginatedResponseDto } from '@shamba/common';
import { JwtAuthGuard, RolesGuard, Roles } from '@shamba/auth';
import { UsersService } from '../services/users.service';
import { UserRole } from '@shamba/common';
import { UserEntity } from '../entities/user.entity';

// Dynamically create the paginated response DTO for Swagger
const PaginatedUserResponse = createPaginatedResponseDto(UserEntity);

@ApiTags('Users (Admin)')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get a paginated list of all users (Admin only)' })
  @ApiResponse({ status: 200, type: PaginatedUserResponse })
  async findMany(@Query() query: UserQueryDto) {
    const { users, total } = await this.usersService.findMany(query);
    const userEntities = users.map(user => new UserEntity(user));
    return new PaginatedUserResponse(userEntities, total, query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get a single user by ID (Admin only)' })
  @ApiResponse({ status: 200, type: UserEntity })
  async findOne(@Param('id') id: string): Promise<UserEntity> {
    const user = await this.usersService.findOne(id);
    return new UserEntity(user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user by ID (Admin only)' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string): Promise<void> {
    await this.usersService.delete(id);
  }
}