// apps/documents-service/src/application/services/document.service.ts
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DocumentStatus, ReferenceType } from '@prisma/client';
import { randomUUID } from 'crypto';

import { ConfigService } from '@shamba/config';
import { IEventPublisher } from '@shamba/messaging';

import { IEncryptionService } from '../../infrastructure/encryption/encryption.service';
import { IOCRService } from '../../infrastructure/ocr/tesseract.service';
import { IDocumentRepository } from '../../infrastructure/repositories/document.repository';
import { IStorageService } from '../../infrastructure/storage/minio-storage.service';
import {
  DOCUMENT_REPOSITORY,
  ENCRYPTION_SERVICE,
  OCR_SERVICE,
  STORAGE_SERVICE,
} from '../../injection.tokens';
import { DocumentUploadedEvent } from '../events/document.events';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private readonly maxFileSizeMB: number;
  private readonly expiryDays: number;

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly repository: IDocumentRepository,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
    @Inject(OCR_SERVICE) private readonly ocr: IOCRService,
    @Inject(ENCRYPTION_SERVICE) private readonly encryption: IEncryptionService,
    private readonly eventPublisher: IEventPublisher,
    private readonly config: ConfigService,
  ) {
    this.maxFileSizeMB = parseInt(this.config.get('MAX_FILE_SIZE_MB') || '10', 10);
    this.expiryDays = parseInt(this.config.get('DOCUMENT_EXPIRY_DAYS') || '7', 10);
  }

  /**
   * Step 1: User initiates upload and gets a presigned URL
   */
  async initiateUpload(uploaderId: string, documentName: string) {
    const documentId = randomUUID();
    const storageKey = `${uploaderId}/${documentId}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.expiryDays);

    // Create document record in database
    const document = await this.repository.create({
      uploaderId,
      documentName,
      storageKey,
      expiresAt,
    });

    this.logger.log(`Upload initiated for document: ${documentId}`);

    return {
      documentId: document.id,
      storageKey,
      expiresAt,
    };
  }

  /**
   * Step 2: User uploads file, we process it with OCR
   */
  async processUpload(
    documentId: string,
    fileBuffer: Buffer,
    mimeType: string,
    uploaderId: string,
  ) {
    // Validate file size
    const fileSizeMB = fileBuffer.length / (1024 * 1024);
    if (fileSizeMB > this.maxFileSizeMB) {
      throw new BadRequestException(`File size exceeds ${this.maxFileSizeMB}MB limit`);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(mimeType)) {
      throw new BadRequestException('Only JPEG, PNG, and PDF files are allowed');
    }

    const document = await this.repository.findById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.uploaderId !== uploaderId) {
      throw new BadRequestException('Unauthorized to upload this document');
    }

    try {
      // Upload to MinIO
      const storageKey = document.storageKey!;
      await this.storage.uploadFile(storageKey, fileBuffer, mimeType);

      // Run OCR (only for images, skip PDF for now)
      let ocrResult = null;
      if (mimeType.startsWith('image/')) {
        try {
          ocrResult = await this.ocr.extractText(fileBuffer);
        } catch (error) {
          this.logger.warn('OCR failed, continuing without text extraction', error);
        }
      }

      // Check for duplicate reference
      if (ocrResult?.detectedReferenceNumber) {
        const isDuplicate = await this.repository.checkDuplicateReference(
          ocrResult.detectedReferenceNumber,
          ocrResult.detectedReferenceType as ReferenceType,
        );

        if (isDuplicate) {
          throw new BadRequestException(
            `Document with reference number ${ocrResult.detectedReferenceNumber} already exists in the system`,
          );
        }
      }

      // Update document status
      const updatedDocument = await this.repository.updateStatus(
        documentId,
        DocumentStatus.PENDING_VERIFICATION,
        {
          mimeType,
          fileSizeBytes: fileBuffer.length,
          referenceNumber: ocrResult?.detectedReferenceNumber,
          referenceType: ocrResult?.detectedReferenceType as ReferenceType,
          ocrConfidence: ocrResult?.confidence,
          ocrExtractedText: ocrResult?.text,
        },
      );

      // Publish event
      await this.eventPublisher.publish(
        new DocumentUploadedEvent(
          updatedDocument.id,
          updatedDocument.uploaderId,
          updatedDocument.documentName,
          updatedDocument.uploadedAt,
        ),
      );

      this.logger.log(`Document uploaded and processed: ${documentId}`);

      return {
        documentId: updatedDocument.id,
        status: updatedDocument.status,
        referenceNumber: updatedDocument.referenceNumber,
        referenceType: updatedDocument.referenceType,
        ocrConfidence: updatedDocument.ocrConfidence,
      };
    } catch (error) {
      this.logger.error(`Failed to process upload for document: ${documentId}`, error);
      throw error;
    }
  }

  /**
   * Get user's documents
   */
  async getUserDocuments(uploaderId: string, status?: DocumentStatus) {
    return this.repository.findByUploader(uploaderId, status);
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string, userId: string) {
    const document = await this.repository.findById(documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.uploaderId !== userId) {
      throw new BadRequestException('Unauthorized to access this document');
    }

    return document;
  }

  /**
   * Get presigned URL to view document
   */
  async getDocumentUrl(documentId: string, userId: string) {
    const document = await this.getDocumentById(documentId, userId);

    if (!document.storageKey) {
      throw new BadRequestException('Document file not available');
    }

    const url = await this.storage.getPresignedUrl(document.storageKey, 3600); // 1 hour
    return { url, expiresIn: 3600 };
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(documentId: string, userId: string) {
    const document = await this.getDocumentById(documentId, userId);

    // Delete from storage if exists
    if (document.storageKey) {
      try {
        await this.storage.deleteFile(document.storageKey);
      } catch (error) {
        this.logger.warn(`Failed to delete file from storage: ${document.storageKey}`, error);
      }
    }

    // Soft delete in database
    await this.repository.delete(documentId);

    this.logger.log(`Document deleted: ${documentId}`);
  }

  /**
   * Cleanup expired documents (cron job)
   */
  async cleanupExpiredDocuments() {
    const expiredDocs = await this.repository.findExpired();

    for (const doc of expiredDocs) {
      try {
        if (doc.storageKey) {
          await this.storage.deleteFile(doc.storageKey);
        }
        await this.repository.updateStatus(doc.id, DocumentStatus.EXPIRED, {
          deletedAt: new Date(),
        });

        this.logger.log(`Expired document cleaned up: ${doc.id}`);
      } catch (error) {
        this.logger.error(`Failed to cleanup expired document: ${doc.id}`, error);
      }
    }

    return expiredDocs.length;
  }
}
