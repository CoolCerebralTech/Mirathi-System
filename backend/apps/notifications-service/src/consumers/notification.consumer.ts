import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventType } from '@shamba/common';
import { MessagingService } from '@shamba/messaging';
import { LoggerService } from '@shamba/observability';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class NotificationConsumer implements OnModuleInit {
  constructor(
    private messagingService: MessagingService,
    private notificationService: NotificationService,
    private logger: LoggerService,
  ) {}

  async onModuleInit() {
    await this.subscribeToEvents();
  }

  private async subscribeToEvents() {
    // User-related events
    await this.messagingService.subscribe(
      EventType.USER_CREATED,
      this.handleUserCreated.bind(this),
      { queue: 'notifications.user_events' }
    );

    await this.messagingService.subscribe(
      EventType.PASSWORD_RESET_REQUESTED,
      this.handlePasswordResetRequested.bind(this),
      { queue: 'notifications.auth_events' }
    );

    // Will and succession events
    await this.messagingService.subscribe(
      EventType.WILL_CREATED,
      this.handleWillCreated.bind(this),
      { queue: 'notifications.succession_events' }
    );

    // Document events
    await this.messagingService.subscribe(
      EventType.DOCUMENT_UPLOADED,
      this.handleDocumentUploaded.bind(this),
      { queue: 'notifications.document_events' }
    );

    this.logger.log('Notification consumer subscribed to events', 'NotificationConsumer');
  }

  private async handleUserCreated(data: any, envelope: any) {
    this.logger.info('Processing user created event', 'NotificationConsumer', {
      userId: data.userId,
      email: data.email,
    });

    try {
      await this.notificationService.sendNotification({
        templateName: 'WELCOME_EMAIL',
        recipientId: data.userId,
        channel: 'EMAIL',
        variables: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        },
        metadata: {
          eventType: 'USER_CREATED',
          source: 'accounts-service',
        },
      });
    } catch (error) {
      this.logger.error('Failed to process user created event', 'NotificationConsumer', {
        userId: data.userId,
        error: error.message,
      });
    }
  }

  private async handlePasswordResetRequested(data: any, envelope: any) {
    this.logger.info('Processing password reset requested event', 'NotificationConsumer', {
      userId: data.userId,
      email: data.email,
    });

    try {
      await this.notificationService.sendNotification({
        templateName: 'PASSWORD_RESET',
        recipientId: data.userId,
        channel: 'EMAIL',
        variables: {
          firstName: data.firstName, // Would need to get from user service
          resetToken: data.resetToken,
          expiresAt: data.expiresAt,
        },
        metadata: {
          eventType: 'PASSWORD_RESET_REQUESTED',
          source: 'accounts-service',
        },
      });
    } catch (error) {
      this.logger.error('Failed to process password reset event', 'NotificationConsumer', {
        userId: data.userId,
        error: error.message,
      });
    }
  }

  private async handleWillCreated(data: any, envelope: any) {
    this.logger.info('Processing will created event', 'NotificationConsumer', {
      willId: data.willId,
      testatorId: data.testatorId,
    });

    try {
      await this.notificationService.sendNotification({
        templateName: 'WILL_CREATED',
        recipientId: data.testatorId,
        channel: 'EMAIL',
        variables: {
          willTitle: data.title,
          willStatus: data.status,
          createdDate: new Date().toLocaleDateString(),
        },
        metadata: {
          eventType: 'WILL_CREATED',
          source: 'succession-service',
          willId: data.willId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to process will created event', 'NotificationConsumer', {
        willId: data.willId,
        error: error.message,
      });
    }
  }

  private async handleDocumentUploaded(data: any, envelope: any) {
    this.logger.info('Processing document uploaded event', 'NotificationConsumer', {
      documentId: data.documentId,
      uploaderId: data.uploaderId,
    });

    try {
      await this.notificationService.sendNotification({
        templateName: 'DOCUMENT_UPLOADED',
        recipientId: data.uploaderId,
        channel: 'EMAIL',
        variables: {
          documentName: data.filename,
          uploadDate: new Date().toLocaleDateString(),
          status: data.status,
        },
        metadata: {
          eventType: 'DOCUMENT_UPLOADED',
          source: 'documents-service',
          documentId: data.documentId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to process document uploaded event', 'NotificationConsumer', {
        documentId: data.documentId,
        error: error.message,
      });
    }
  }

  // Additional event handlers can be added here for other notification types
}