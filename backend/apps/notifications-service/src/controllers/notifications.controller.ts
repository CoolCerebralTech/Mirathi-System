import { Controller, Get, Query, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ShambaEvent, NotificationQueryDto, createPaginatedResponseDto, UserCreatedEvent } from '@shamba/common';
import { JwtAuthGuard, CurrentUser, JwtPayload } from '@shamba/auth';
import { NotificationsService } from '../services/notifications.service';
import { NotificationEntity } from '../entities/notification.entity';

const PaginatedNotificationResponse = createPaginatedResponseDto(NotificationEntity);

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // --- EVENT CONSUMERS ---
  // This is the primary way this service is triggered.

  @EventPattern(EventPattern.USER_CREATED)
  async handleUserCreated(@Payload() event: UserCreatedEvent): Promise<void> {
    await this.notificationsService.createAndQueueNotification(
      'user-welcome-email', // Template name
      event.data.userId,
      { firstName: event.data.firstName }, // Variables for the template
    );
  }

  // Add more @EventPattern handlers here for other events like `password.reset_requested` etc.
  // @EventPattern(EventPattern.PASSWORD_RESET_REQUESTED)
  // async handlePasswordReset(...) { ... }


  // --- API ENDPOINTS (for users to view their notifications) ---

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get a paginated list of notifications for the authenticated user' })
  @ApiResponse({ status: 200, type: PaginatedNotificationResponse })
  async findMyNotifications(
    @CurrentUser('sub') userId: string,
    @Query() query: NotificationQueryDto,
  ) {
    const { notifications, total } = await this.notificationsService.findForUser(userId, query);
    const notificationEntities = notifications.map(n => new NotificationEntity(n));
    return new PaginatedNotificationResponse(notificationEntities, total, query);
  }
}