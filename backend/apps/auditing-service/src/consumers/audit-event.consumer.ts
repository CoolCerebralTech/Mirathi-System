import { Injectable, OnModuleInit } from '@nestjs/common';
import { MessagingService } from '@shamba/messaging';
import { AuditService } from '../services/audit.service';
import { LoggerService } from '@shamba/observability';
import { EventType, AuditAction, AuditResource, AuditSeverity } from '@shamba/common';

@Injectable()
export class AuditEventConsumer implements OnModuleInit {
  constructor(
    private messagingService: MessagingService,
    private auditService: AuditService,
    private logger: LoggerService,
  ) {}

  async onModuleInit() {
    await this.subscribeToEvents();
  }

  private async subscribeToEvents(): Promise<void> {
    // Subscribe to user events
    await this.messagingService.subscribe(
      EventType.USER_CREATED,
      this.handleUserCreated.bind(this),
      { queue: 'audit.user_events' }
    );

    await this.messagingService.subscribe(
      EventType.USER_UPDATED,
      this.handleUserUpdated.bind(this),
      { queue: 'audit.user_events' }
    );

    await this.messagingService.subscribe(
      EventType.PASSWORD_RESET_REQUESTED,
      this.handlePasswordResetRequested.bind(this),
      { queue: 'audit.user_events' }
    );

    // Subscribe to succession events
    await this.messagingService.subscribe(
      EventType.WILL_CREATED,
      this.handleWillCreated.bind(this),
      { queue: 'audit.succession_events' }
    );

    await this.messagingService.subscribe(
      EventType.ASSET_CREATED,
      this.handleAssetCreated.bind(this),
      { queue: 'audit.succession_events' }
    );

    // Subscribe to document events
    await this.messagingService.subscribe(
      EventType.DOCUMENT_UPLOADED,
      this.handleDocumentUploaded.bind(this),
      { queue: 'audit.document_events' }
    );

    await this.messagingService.subscribe(
      EventType.DOCUMENT_VERIFIED,
      this.handleDocumentVerified.bind(this),
      { queue: 'audit.document_events' }
    );

    // Subscribe to notification events
    await this.messagingService.subscribe(
      EventType.NOTIFICATION_SENT,
      this.handleNotificationSent.bind(this),
      { queue: 'audit.notification_events' }
    );

    this.logger.log('Audit event consumer subscribed to all events', 'AuditEventConsumer');
  }

  private async handleUserCreated(data: any, envelope: any): Promise<void> {
    try {
      await this.auditService.logEvent({
        action: AuditAction.CREATE,
        resource: AuditResource.USER,
        resourceId: data.userId,
        userId: data.userId, // System or admin user who created this
        userIp: 'system',
        userAgent: 'accounts-service',
        severity: AuditSeverity.LOW,
        details: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
        },
        correlationId: envelope.correlationId,
        service: 'accounts-service',
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Failed to log user created event', 'AuditEventConsumer', {
        error: error.message,
        userId: data.userId,
      });
    }
  }

  private async handleUserUpdated(data: any, envelope: any): Promise<void> {
    try {
      await this.auditService.logEvent({
        action: AuditAction.UPDATE,
        resource: AuditResource.USER,
        resourceId: data.userId,
        userId: data.userId, // The user who made the change
        userIp: 'system',
        userAgent: 'accounts-service',
        severity: AuditSeverity.LOW,
        details: data,
        correlationId: envelope.correlationId,
        service: 'accounts-service',
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Failed to log user updated event', 'AuditEventConsumer', {
        error: error.message,
        userId: data.userId,
      });
    }
  }

  private async handlePasswordResetRequested(data: any, envelope: any): Promise<void> {
    try {
      await this.auditService.logEvent({
        action: AuditAction.PASSWORD_RESET_REQUESTED,
        resource: AuditResource.USER,
        resourceId: data.userId,
        userId: data.userId,
        userIp: 'system',
        userAgent: 'accounts-service',
        severity: AuditSeverity.MEDIUM,
        details: {
          email: data.email,
          resetToken: '***REDACTED***',
        },
        correlationId: envelope.correlationId,
        service: 'accounts-service',
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Failed to log password reset event', 'AuditEventConsumer', {
        error: error.message,
        userId: data.userId,
      });
    }
  }

  private async handleWillCreated(data: any, envelope: any): Promise<void> {
    try {
      await this.auditService.logEvent({
        action: AuditAction.CREATE,
        resource: AuditResource.WILL,
        resourceId: data.willId,
        userId: data.testatorId,
        userIp: 'system',
        userAgent: 'succession-service',
        severity: AuditSeverity.MEDIUM,
        details: {
          title: data.title,
          status: data.status,
        },
        correlationId: envelope.correlationId,
        service: 'succession-service',
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Failed to log will created event', 'AuditEventConsumer', {
        error: error.message,
        willId: data.willId,
      });
    }
  }

  private async handleAssetCreated(data: any, envelope: any): Promise<void> {
    try {
      await this.auditService.logEvent({
        action: AuditAction.CREATE,
        resource: AuditResource.ASSET,
        resourceId: data.assetId,
        userId: data.ownerId,
        userIp: 'system',
        userAgent: 'succession-service',
        severity: AuditSeverity.LOW,
        details: {
          name: data.name,
          type: data.type,
        },
        correlationId: envelope.correlationId,
        service: 'succession-service',
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Failed to log asset created event', 'AuditEventConsumer', {
        error: error.message,
        assetId: data.assetId,
      });
    }
  }

  private async handleDocumentUploaded(data: any, envelope: any): Promise<void> {
    try {
      await this.auditService.logEvent({
        action: AuditAction.CREATE,
        resource: AuditResource.DOCUMENT,
        resourceId: data.documentId,
        userId: data.uploaderId,
        userIp: 'system',
        userAgent: 'documents-service',
        severity: AuditSeverity.LOW,
        details: {
          filename: data.filename,
          status: data.status,
        },
        correlationId: envelope.correlationId,
        service: 'documents-service',
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Failed to log document uploaded event', 'AuditEventConsumer', {
        error: error.message,
        documentId: data.documentId,
      });
    }
  }

  private async handleDocumentVerified(data: any, envelope: any): Promise<void> {
    try {
      await this.auditService.logEvent({
        action: AuditAction.VERIFY,
        resource: AuditResource.DOCUMENT,
        resourceId: data.documentId,
        userId: 'system', // System or verifier user
        userIp: 'system',
        userAgent: 'documents-service',
        severity: AuditSeverity.MEDIUM,
        details: {
          status: data.status,
        },
        correlationId: envelope.correlationId,
        service: 'documents-service',
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Failed to log document verified event', 'AuditEventConsumer', {
        error: error.message,
        documentId: data.documentId,
      });
    }
  }

  private async handleNotificationSent(data: any, envelope: any): Promise<void> {
    try {
      await this.auditService.logEvent({
        action: AuditAction.NOTIFY,
        resource: AuditResource.NOTIFICATION,
        resourceId: data.notificationId,
        userId: 'system',
        userIp: 'system',
        userAgent: 'notifications-service',
        severity: AuditSeverity.LOW,
        details: {
          recipientId: data.recipientId,
          channel: data.channel,
          status: data.status,
          template: data.template,
        },
        correlationId: envelope.correlationId,
        service: 'notifications-service',
        status: data.status === 'SENT' ? 'success' : 'failure',
      });
    } catch (error) {
      this.logger.error('Failed to log notification sent event', 'AuditEventConsumer', {
        error: error.message,
        notificationId: data.notificationId,
      });
    }
  }
}