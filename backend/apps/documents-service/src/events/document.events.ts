import { Injectable } from '@nestjs/common';
import { EventType } from '@shamba/common';
import { MessagingService } from '@shamba/messaging';
import { LoggerService } from '@shamba/observability';

@Injectable()
export class DocumentEvents {
  constructor(
    private messagingService: MessagingService,
    private logger: LoggerService,
  ) {}

  async documentUploaded(payload: {
    documentId: string;
    uploaderId: string;
    filename: string;
    status: string;
    timestamp: Date;
  }) {
    try {
      await this.messagingService.publish(EventType.DOCUMENT_UPLOADED, payload);
      this.logger.info('Document uploaded event published', 'DocumentEvents', {
        documentId: payload.documentId,
      });
    } catch (error) {
      this.logger.error('Failed to publish document uploaded event', 'DocumentEvents', {
        error: error.message,
        documentId: payload.documentId,
      });
    }
  }

  async documentVerified(payload: {
    documentId: string;
    uploaderId: string;
    verifiedBy: string;
    confidenceScore: number;
    timestamp: Date;
  }) {
    try {
      await this.messagingService.publish(EventType.DOCUMENT_VERIFIED, payload);
      this.logger.info('Document verified event published', 'DocumentEvents', {
        documentId: payload.documentId,
      });
    } catch (error) {
      this.logger.error('Failed to publish document verified event', 'DocumentEvents', {
        error: error.message,
        documentId: payload.documentId,
      });
    }
  }

  async documentRejected(payload: {
    documentId: string;
    uploaderId: string;
    rejectedBy: string;
    reasons: string[];
    timestamp: Date;
  }) {
    try {
      await this.messagingService.publish('document.rejected', payload);
      this.logger.info('Document rejected event published', 'DocumentEvents', {
        documentId: payload.documentId,
      });
    } catch (error) {
      this.logger.error('Failed to publish document rejected event', 'DocumentEvents', {
        error: error.message,
        documentId: payload.documentId,
      });
    }
  }

  async documentDeleted(payload: {
    documentId: string;
    uploaderId: string;
    deletedBy: string;
    timestamp: Date;
  }) {
    try {
      await this.messagingService.publish('document.deleted', payload);
      this.logger.info('Document deleted event published', 'DocumentEvents', {
        documentId: payload.documentId,
      });
    } catch (error) {
      this.logger.error('Failed to publish document deleted event', 'DocumentEvents', {
        error: error.message,
        documentId: payload.documentId,
      });
    }
  }

  async documentVersionAdded(payload: {
    documentId: string;
    versionNumber: number;
    uploaderId: string;
    timestamp: Date;
  }) {
    try {
      await this.messagingService.publish('document.version_added', payload);
      this.logger.info('Document version added event published', 'DocumentEvents', {
        documentId: payload.documentId,
        version: payload.versionNumber,
      });
    } catch (error) {
      this.logger.error('Failed to publish document version event', 'DocumentEvents', {
        error: error.message,
        documentId: payload.documentId,
      });
    }
  }
}