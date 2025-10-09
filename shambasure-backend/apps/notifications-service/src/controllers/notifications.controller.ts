// ============================================================================
// notifications.controller.ts - User Notification Endpoints
// ============================================================================

import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  UseInterceptors, 
  ClassSerializerInterceptor,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { 
  NotificationQueryDto, 
  createPaginatedResponseDto,
} from '@shamba/common';
import { JwtAuthGuard, CurrentUser } from '@shamba/auth';
import { NotificationsService } from '../services/notifications.service';
import { NotificationEntity } from '../entities/notification.entity';

const PaginatedNotificationResponse = createPaginatedResponseDto(NotificationEntity);

/**
 * NotificationsController - User-facing notification endpoints
 * 
 * NOTE: This controller does NOT handle event consumption.
 * Event handling is done in EventsHandler using @EventPattern decorators.
 * 
 * ROUTES:
 * - GET /notifications - List user's notifications
 * - GET /notifications/stats - Get notification statistics
 * - GET /notifications/:id - Get single notification
 */
@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ 
    summary: 'List my notifications',
    description: 'Get paginated list of notifications for authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notifications retrieved successfully',
    type: PaginatedNotificationResponse 
  })
  async findMyNotifications(
    @CurrentUser('sub') userId: string,
    @Query() query: NotificationQueryDto,
  ) {
    const { notifications, total } = await this.notificationsService.findForUser(
      userId, 
      query
    );
    
    const notificationEntities = notifications.map(n => new NotificationEntity(n));
    return new PaginatedNotificationResponse(notificationEntities, total, query);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get notification statistics',
    description: 'Get notification counts by status and channel'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistics retrieved successfully'
  })
  async getMyStats(@CurrentUser('sub') userId: string) {
    return this.notificationsService.getStats(userId);
  }

  @Get(':id')
  @ApiParam({ 
    name: 'id', 
    description: 'Notification UUID',
    type: 'string',
    format: 'uuid'
  })
  @ApiOperation({ 
    summary: 'Get notification by ID',
    description: 'Retrieve single notification details'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification retrieved successfully',
    type: NotificationEntity 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notification not found' 
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<NotificationEntity> {
    // TODO: Add authorization check - ensure notification belongs to user
    const notification = await this.notificationsService.findForUser(userId, {
      page: 1,
      limit: 1,
    });
    
    const found = notification.notifications.find(n => n.id === id);
    if (!found) {
      throw new NotFoundException('Notification not found');
    }
    
    return new NotificationEntity(found);
  }
}
