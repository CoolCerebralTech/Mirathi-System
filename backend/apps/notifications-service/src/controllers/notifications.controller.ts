import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { 
  createSuccessResponse,
  createPaginatedResponse,
} from '@shamba/common';
import { 
  JwtAuthGuard, 
  RolesGuard, 
  CurrentUser,
  Roles,
} from '@shamba/auth';
import { NotificationService, SendNotificationOptions } from '../services/notification.service';
import { TemplateService } from '../services/template.service';
import { LoggerService } from '@shamba/observability';
import { UserRole } from '@shamba/common';
import { JwtPayload } from '@shamba/auth';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private notificationService: NotificationService,
    private templateService: TemplateService,
    private logger: LoggerService,
  ) {}

  @Post('send')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send a notification (Admin only)' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Notification sent successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  async sendNotification(
    @Body() sendOptions: SendNotificationOptions,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Sending notification via API', 'NotificationsController', {
      adminUserId: user.userId,
      templateName: sendOptions.templateName,
      recipientId: sendOptions.recipientId,
    });

    const result = await this.notificationService.sendNotification(sendOptions);

    if (result.success) {
      return createSuccessResponse(result, 'Notification sent successfully');
    } else {
      return createSuccessResponse(result, 'Notification failed to send', 400);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get notifications for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'channel', required: false, enum: ['EMAIL', 'SMS'] })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'SENT', 'FAILED'] })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Notifications retrieved successfully' 
  })
  async getNotifications(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('channel') channel?: string,
    @Query('status') status?: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Fetching user notifications', 'NotificationsController', {
      userId: user.userId,
      page,
      limit,
    });

    const result = await this.notificationService['notificationRepository'].findByRecipient(
      user.userId,
      { page, limit, channel: channel as any, status: status as any }
    );

    return createPaginatedResponse(
      result.notifications.map(notification => ({
        id: notification.id,
        channel: notification.channel,
        status: notification.status,
        subject: notification.subject,
        body: notification.body,
        sentAt: notification.sentAt,
        createdAt: notification.createdAt,
      })),
      {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
      'Notifications retrieved successfully'
    );
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get notification statistics (Admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully' 
  })
  async getNotificationStats(@CurrentUser() user: JwtPayload) {
    this.logger.debug('Fetching notification statistics', 'NotificationsController', {
      adminUserId: user.userId,
    });

    const stats = await this.notificationService['notificationRepository'].getStats('day');
    const health = await this.notificationService.getServiceHealth();

    return createSuccessResponse(
      { stats, health },
      'Statistics retrieved successfully'
    );
  }

  @Post('retry-failed')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry failed notifications (Admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Retry operation completed' 
  })
  async retryFailedNotifications(@CurrentUser() user: JwtPayload) {
    this.logger.info('Retrying failed notifications', 'NotificationsController', {
      adminUserId: user.userId,
    });

    const result = await this.notificationService.retryFailedNotifications();

    return createSuccessResponse(result, 'Retry operation completed');
  }

  @Post('process-pending')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process pending notifications (Admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Processing operation completed' 
  })
  async processPendingNotifications(@CurrentUser() user: JwtPayload) {
    this.logger.info('Processing pending notifications', 'NotificationsController', {
      adminUserId: user.userId,
    });

    const result = await this.notificationService.processPendingNotifications();

    return createSuccessResponse(result, 'Processing operation completed');
  }

  @Get('health')
  @ApiOperation({ summary: 'Get notification service health' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Health status retrieved' 
  })
  async getHealth(@CurrentUser() user: JwtPayload) {
    this.logger.debug('Checking notification service health', 'NotificationsController');

    const health = await this.notificationService.getServiceHealth();

    return createSuccessResponse(health, 'Health status retrieved');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Notification retrieved successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Notification not found' 
  })
  async getNotificationById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Fetching notification by ID', 'NotificationsController', {
      notificationId: id,
      userId: user.userId,
    });

    const notification = await this.notificationService['notificationRepository'].findById(id);

    // Authorization: Users can only view their own notifications unless admin
    if (notification.recipientId !== user.userId && user.role !== UserRole.ADMIN) {
      return createSuccessResponse(null, 'Access denied', 403);
    }

    const status = await this.notificationService.getNotificationStatus(id);

    return createSuccessResponse(
      {
        id: notification.id,
        channel: notification.channel,
        status: status.status,
        subject: notification.subject,
        body: notification.body,
        sentAt: status.sentAt,
        failReason: status.failReason,
        retryCount: status.retryCount,
        createdAt: notification.createdAt,
      },
      'Notification retrieved successfully'
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a notification (Admin only)' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Notification deleted successfully' 
  })
  async deleteNotification(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Deleting notification', 'NotificationsController', {
      notificationId: id,
      adminUserId: user.userId,
    });

    await this.notificationService['notificationRepository'].updateStatus(id, 'SENT'); // Soft delete

    return createSuccessResponse(null, 'Notification deleted successfully');
  }
}