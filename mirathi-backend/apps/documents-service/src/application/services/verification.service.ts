// apps/documents-service/src/application/services/verification.service.ts
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';

import { IEventPublisher } from '@shamba/messaging';

import type { IEncryptionService } from '../../infrastructure/encryption/encryption.service';
import type { IDocumentRepository } from '../../infrastructure/repositories/document.repository';
import type { IStorageService } from '../../infrastructure/storage/minio-storage.service';
import {
  DOCUMENT_REPOSITORY,
  ENCRYPTION_SERVICE,
  EVENT_PUBLISHER,
  STORAGE_SERVICE,
} from '../../injection.tokens';
import { VerificationAction } from '../../presentation/dto/verify-document.dto';
import { DocumentRejectedEvent, DocumentVerifiedEvent } from '../events/document.events';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly repository: IDocumentRepository,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
    @Inject(ENCRYPTION_SERVICE) private readonly encryption: IEncryptionService,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
  ) {}

  /**
   * Get all documents pending verification
   */
  async getPendingDocuments() {
    return this.repository.findPendingVerification();
  }

  /**
   * Get document with presigned URL for verifier to review
   */
  async getDocumentForVerification(documentId: string) {
    const document = await this.repository.findById(documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.status !== DocumentStatus.PENDING_VERIFICATION) {
      throw new BadRequestException('Document is not pending verification');
    }

    if (!document.storageKey) {
      throw new BadRequestException('Document file not available');
    }

    // Generate presigned URL for verifier to view document
    const url = await this.storage.getPresignedUrl(document.storageKey, 3600);

    return {
      document,
      viewUrl: url,
    };
  }

  /**
   * Verify document (approve or reject)
   */
  async verifyDocument(
    documentId: string,
    verifierId: string,
    action: VerificationAction,
    notes?: string,
  ) {
    const document = await this.repository.findById(documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.status !== DocumentStatus.PENDING_VERIFICATION) {
      throw new BadRequestException('Document is not pending verification');
    }

    // Record verification attempt
    await this.repository.recordVerification(documentId, verifierId, action, notes);

    if (action === VerificationAction.APPROVED) {
      return this.approveDocument(document, verifierId);
    } else {
      return this.rejectDocument(document, verifierId, notes);
    }
  }

  /**
   * Approve document
   */
  private async approveDocument(document: any, verifierId: string) {
    try {
      // Create encrypted reference (permanent storage)
      const referenceData = JSON.stringify({
        documentId: document.id,
        referenceNumber: document.referenceNumber,
        referenceType: document.referenceType,
        documentName: document.documentName,
        uploaderId: document.uploaderId,
        verifiedAt: new Date().toISOString(),
      });

      const encryptedReference = this.encryption.encrypt(referenceData);

      // Update document status
      const verifiedDocument = await this.repository.updateStatus(
        document.id,
        DocumentStatus.VERIFIED,
        {
          verifiedBy: verifierId,
          verifiedAt: new Date(),
          encryptedReference,
        },
      );

      // Delete file from MinIO (we only keep encrypted reference)
      if (document.storageKey) {
        try {
          await this.storage.deleteFile(document.storageKey);
          this.logger.log(`File deleted from storage after verification: ${document.storageKey}`);
        } catch (error) {
          this.logger.warn('Failed to delete file after verification', error);
        }
      }

      // Publish event
      await this.eventPublisher.publish(
        new DocumentVerifiedEvent(
          verifiedDocument.id,
          verifiedDocument.uploaderId,
          verifiedDocument.documentName,
          verifiedDocument.referenceNumber!,
          verifiedDocument.referenceType!,
          verifiedDocument.encryptedReference!,
          verifierId,
          verifiedDocument.verifiedAt!,
        ),
      );

      this.logger.log(`Document approved: ${document.id}`);

      return {
        documentId: verifiedDocument.id,
        status: verifiedDocument.status,
        encryptedReference: verifiedDocument.encryptedReference,
        message: 'Document verified successfully',
      };
    } catch (error) {
      this.logger.error('Failed to approve document', error);
      throw new BadRequestException('Failed to approve document');
    }
  }

  /**
   * Reject document
   */
  private async rejectDocument(document: any, verifierId: string, notes?: string) {
    try {
      // Update document status
      const rejectedDocument = await this.repository.updateStatus(
        document.id,
        DocumentStatus.REJECTED,
        {
          verifiedBy: verifierId,
          verifiedAt: new Date(),
          rejectionReason: notes || 'Document rejected by verifier',
        },
      );

      // Delete file from MinIO
      if (document.storageKey) {
        try {
          await this.storage.deleteFile(document.storageKey);
          this.logger.log(`File deleted from storage after rejection: ${document.storageKey}`);
        } catch (error) {
          this.logger.warn('Failed to delete file after rejection', error);
        }
      }

      // Publish event
      await this.eventPublisher.publish(
        new DocumentRejectedEvent(
          rejectedDocument.id,
          rejectedDocument.uploaderId,
          rejectedDocument.documentName,
          rejectedDocument.rejectionReason!,
          verifierId,
          rejectedDocument.verifiedAt!,
        ),
      );

      this.logger.log(`Document rejected: ${document.id}`);

      return {
        documentId: rejectedDocument.id,
        status: rejectedDocument.status,
        rejectionReason: rejectedDocument.rejectionReason,
        message: 'Document rejected',
      };
    } catch (error) {
      this.logger.error('Failed to reject document', error);
      throw new BadRequestException('Failed to reject document');
    }
  }

  /**
   * Decrypt document reference (for internal use)
   */
  decryptReference(encryptedReference: string) {
    try {
      const decrypted = this.encryption.decrypt(encryptedReference);
      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error('Failed to decrypt reference', error);
      throw new BadRequestException('Invalid encrypted reference');
    }
  }
}
