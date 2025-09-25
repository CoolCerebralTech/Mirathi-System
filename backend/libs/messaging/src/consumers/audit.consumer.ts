import { Injectable } from '@nestjs/common';
import { EventType } from '@shamba/common';
import { BaseConsumer } from './base.consumer';
import { MessageEnvelope } from '../interfaces/messaging.interface';

@Injectable()
export class AuditConsumer extends BaseConsumer {
  protected getEventHandlers() {
    return [
      {
        eventType: EventType.USER_CREATED,
        handler: this.handleUserCreated.bind(this),
        options: { queue: 'audit.user_events', prefetch: 10 },
      },
      {
        eventType: EventType.USER_UPDATED,
        handler: this.handleUserUpdated.bind(this),
        options: { queue: 'audit.user_events', prefetch: 10 },
      },
      {
        eventType: EventType.WILL_CREATED,
        handler: this.handleWillCreated.bind(this),
        options: { queue: 'audit.succession_events', prefetch: 5 },
      },
      {
        eventType: EventType.DOCUMENT_UPLOADED,
        handler: this.handleDocumentUploaded.bind(this),
        options: { queue: 'audit.document_events', prefetch: 5 },
      },
      // Add more event handlers as needed
    ];
  }

  private async handleUserCreated(data: any, envelope: MessageEnvelope): Promise<void> {
    try {
      this.logger.log(`Audit: User created - ${data.userId}`);
      // Here you would create an audit log entry
      // await this.auditService.logUserCreation(data, envelope);
    } catch (error) {
      this.handleError(error, EventType.USER_CREATED, envelope);
    }
  }

  private async handleUserUpdated(data: any, envelope: MessageEnvelope): Promise<void> {
    try {
      this.logger.log(`Audit: User updated - ${data.userId}`);
      // await this.auditService.logUserUpdate(data, envelope);
    } catch (error) {
      this.handleError(error, EventType.USER_UPDATED, envelope);
    }
  }

  private async handleWillCreated(data: any, envelope: MessageEnvelope): Promise<void> {
    try {
      this.logger.log(`Audit: Will created - ${data.willId} by ${data.testatorId}`);
      // await this.auditService.logWillCreation(data, envelope);
    } catch (error) {
      this.handleError(error, EventType.WILL_CREATED, envelope);
    }
  }

  private async handleDocumentUploaded(data: any, envelope: MessageEnvelope): Promise<void> {
    try {
      this.logger.log(`Audit: Document uploaded - ${data.documentId} by ${data.uploaderId}`);
      // await this.auditService.logDocumentUpload(data, envelope);
    } catch (error) {
      this.handleError(error, EventType.DOCUMENT_UPLOADED, envelope);
    }
  }
}