// apps/documents-service/src/application/services/document.service.ts
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DocumentStatus, ReferenceType } from '@prisma/client';
import { randomUUID } from 'crypto';

import { ConfigService } from '@shamba/config';
import { IEventPublisher } from '@shamba/messaging';

import type { IOCRService, OCRResult } from '../../infrastructure/ocr/tesseract.service';
import type { IDocumentRepository } from '../../infrastructure/repositories/document.repository';
import type { IStorageService } from '../../infrastructure/storage/minio-storage.service';
import {
  DOCUMENT_REPOSITORY,
  EVENT_PUBLISHER,
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
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
    private readonly config: ConfigService,
  ) {
    // Config values are already numbers per your new schema
    this.maxFileSizeMB = this.config.get('MAX_FILE_SIZE_MB');
    this.expiryDays = this.config.get('DOCUMENT_EXPIRY_DAYS');
  }

  async initiateUpload(uploaderId: string, documentName: string) {
    const documentId = randomUUID();
    const storageKey = `${uploaderId}/${documentId}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.expiryDays);

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

  async processUpload(
    documentId: string,
    fileBuffer: Buffer,
    mimeType: string,
    uploaderId: string,
  ) {
    const fileSizeMB = fileBuffer.length / (1024 * 1024);
    if (fileSizeMB > this.maxFileSizeMB) {
      throw new BadRequestException(`File size exceeds ${this.maxFileSizeMB}MB limit`);
    }

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
      await this.storage.uploadFile(document.storageKey!, fileBuffer, mimeType);

      // FIX 2: Explicitly type the variable so TypeScript knows it can hold an object later
      let ocrResult: OCRResult | null = null;

      if (mimeType.startsWith('image/')) {
        try {
          ocrResult = await this.ocr.extractText(fileBuffer);
        } catch (error) {
          this.logger.warn('OCR failed, continuing without text extraction', error);
        }
      }

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

  async getUserDocuments(uploaderId: string, status?: DocumentStatus) {
    return this.repository.findByUploader(uploaderId, status);
  }

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

  async getDocumentUrl(documentId: string, userId: string) {
    const document = await this.getDocumentById(documentId, userId);

    if (!document.storageKey) {
      throw new BadRequestException('Document file not available');
    }

    const url = await this.storage.getPresignedUrl(document.storageKey, 3600);
    return { url, expiresIn: 3600 };
  }

  async deleteDocument(documentId: string, userId: string) {
    const document = await this.getDocumentById(documentId, userId);

    if (document.storageKey) {
      try {
        await this.storage.deleteFile(document.storageKey);
      } catch (error) {
        this.logger.warn(`Failed to delete file from storage: ${document.storageKey}`, error);
      }
    }

    await this.repository.delete(documentId);
    this.logger.log(`Document deleted: ${documentId}`);
  }

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
