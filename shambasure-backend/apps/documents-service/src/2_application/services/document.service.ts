import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';

import { IDocumentRepository } from '../../3_domain/interfaces/document.repository.interface';
import { IStorageService } from '../../3_domain/interfaces/storage.service.interface';
import { FileValidatorService } from '../../4_infrastructure/storage/file-validator.service';
import { DocumentMapper } from '../mappers/document.mapper';
import { Document } from '../../3_domain/models/document.model';
import {
  DocumentId,
  UserId,
  WillId,
  AssetId,
  DocumentCategory,
  StoragePath,
  FileMetadata,
  MimeType,
  FileSize,
  DocumentChecksum,
  StorageProvider,
  AllowedViewers,
} from '../../3_domain/value-objects';
import {
  UploadDocumentResponseDto,
  VerifyDocumentResponseDto,
  UpdateDocumentResponseDto,
  PaginatedDocumentsResponseDto,
  DocumentStatsResponseDto,
  BulkOperationResponseDto,
} from '../dtos';
import {
  DocumentUploadedEvent,
  DocumentVerifiedEvent,
  DocumentRejectedEvent,
  DocumentDeletedEvent,
  DocumentVersionedEvent,
} from '../../3_domain/events';

export interface UploadDocumentCommand {
  file: Buffer;
  filename: string;
  mimeType: string;
  category: string;
  uploaderId: string;
  uploaderName: string;
  assetId?: string;
  willId?: string;
  identityForUserId?: string;
  metadata?: Record<string, any>;
  documentNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuingAuthority?: string;
  isPublic?: boolean;
  allowedViewers?: string[];
}

export interface VerifyDocumentCommand {
  documentId: string;
  verifierId: string;
  verifierName: string;
  status: string;
  reason?: string;
  documentNumber?: string;
  extractedData?: Record<string, any>;
  verificationMetadata?: Record<string, any>;
}

export interface UpdateMetadataCommand {
  documentId: string;
  updaterId: string;
  metadata?: Record<string, any>;
  documentNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuingAuthority?: string;
  customMetadata?: Record<string, any>;
  tags?: string[];
}

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly storageService: IStorageService,
    private readonly fileValidator: FileValidatorService,
    private readonly documentMapper: DocumentMapper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // DOCUMENT UPLOAD & CREATION
  // ============================================================================

  async uploadDocument(command: UploadDocumentCommand): Promise<UploadDocumentResponseDto> {
    try {
      this.logger.log(`Uploading document: ${command.filename} for user ${command.uploaderId}`);

      // Validate file
      const validationResult = await this.fileValidator.validateFile(
        command.file,
        command.filename,
        command.mimeType,
      );

      if (!validationResult.isValid) {
        throw new BadRequestException(
          `File validation failed: ${validationResult.errors.join(', ')}`,
        );
      }

      if (validationResult.warnings.length > 0) {
        this.logger.warn(`File validation warnings: ${validationResult.warnings.join(', ')}`);
      }

      // Scan for viruses
      const scanResult = await this.storageService.scanForViruses(command.file);
      if (!scanResult.clean) {
        throw new BadRequestException(
          `File contains potential threats: ${scanResult.threats?.join(', ')}`,
        );
      }

      // Generate storage path
      const storagePath = this.generateStoragePath(
        command.uploaderId,
        command.filename,
        command.category,
      );

      // Save file to storage
      const storageResult = await this.storageService.save(command.file, storagePath.value, {
        contentType: command.mimeType,
        checksum: this.calculateChecksum(command.file),
      });

      // Create file metadata value objects
      const fileMetadata = FileMetadata.create(
        command.filename,
        command.mimeType,
        command.file.length,
        storageResult.checksum,
      );

      // Create domain entity
      const document = Document.create({
        id: new DocumentId(uuidv4()),
        fileMetadata,
        storagePath,
        category: DocumentCategory.fromString(command.category),
        uploaderId: new UserId(command.uploaderId),
        uploaderName: command.uploaderName,
        assetId: command.assetId ? new AssetId(command.assetId) : undefined,
        willId: command.willId ? new WillId(command.willId) : undefined,
        identityForUserId: command.identityForUserId
          ? new UserId(command.identityForUserId)
          : undefined,
        metadata: command.metadata,
        documentNumber: command.documentNumber,
        issueDate: command.issueDate,
        expiryDate: command.expiryDate,
        issuingAuthority: command.issuingAuthority,
        isPublic: command.isPublic || false,
        allowedViewers: command.allowedViewers || [],
      });

      // Save to database
      const savedDocument = await this.documentRepository.create(document);

      // Publish domain events
      this.publishDomainEvents(savedDocument);

      // Generate download URL
      const downloadUrl = await this.storageService.getDownloadUrl(
        savedDocument.storagePath.value,
        { filename: savedDocument.fileMetadata.filename },
      );

      this.logger.log(`Document uploaded successfully: ${savedDocument.id.value}`);

      return this.documentMapper.toUploadResponseDto(savedDocument, downloadUrl);
    } catch (error) {
      this.logger.error(`Failed to upload document: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ============================================================================
  // DOCUMENT RETRIEVAL
  // ============================================================================

  async getDocumentById(
    documentId: string,
    requestingUserId: string,
    options: { includeDownloadUrl?: boolean } = {},
  ): Promise<DocumentResponseDto> {
    try {
      const document = await this.findDocumentById(documentId);
      await this.ensureDocumentAccess(document, new UserId(requestingUserId));

      const userPermissions = this.calculateUserPermissions(document, new UserId(requestingUserId));

      return this.documentMapper.toResponseDto(document, {
        includeDownloadUrl: options.includeDownloadUrl,
        userPermissions,
      });
    } catch (error) {
      this.logger.error(`Failed to get document: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDocuments(
    filters: any,
    pagination: any,
    requestingUserId: string,
  ): Promise<PaginatedDocumentsResponseDto> {
    try {
      // Apply access control filters
      const enhancedFilters = this.applyAccessControlFilters(filters, new UserId(requestingUserId));

      const result = await this.documentRepository.findMany(enhancedFilters, pagination);

      // Calculate permissions for each document
      const userPermissionsMap = new Map<string, { canEdit: boolean; canDelete: boolean }>();
      result.data.forEach((document) => {
        userPermissionsMap.set(
          document.id.value,
          this.calculateUserPermissions(document, new UserId(requestingUserId)),
        );
      });

      return this.documentMapper.toPaginatedResponseDto(
        result.data,
        result.total,
        result.page,
        result.limit,
        { userPermissionsMap },
      );
    } catch (error) {
      this.logger.error(`Failed to get documents: ${error.message}`, error.stack);
      throw error;
    }
  }

  async searchDocuments(
    searchOptions: any,
    pagination: any,
    requestingUserId: string,
  ): Promise<PaginatedDocumentsResponseDto> {
    try {
      // Apply access control to search
      const enhancedSearch = { ...searchOptions, uploaderId: requestingUserId };

      const result = await this.documentRepository.search(enhancedSearch, pagination);

      const userPermissionsMap = new Map<string, { canEdit: boolean; canDelete: boolean }>();
      result.data.forEach((document) => {
        userPermissionsMap.set(
          document.id.value,
          this.calculateUserPermissions(document, new UserId(requestingUserId)),
        );
      });

      return this.documentMapper.toPaginatedResponseDto(
        result.data,
        result.total,
        result.page,
        result.limit,
        { userPermissionsMap },
      );
    } catch (error) {
      this.logger.error(`Failed to search documents: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ============================================================================
  // DOCUMENT VERIFICATION
  // ============================================================================

  async verifyDocument(command: VerifyDocumentCommand): Promise<VerifyDocumentResponseDto> {
    try {
      const document = await this.findDocumentById(command.documentId);

      // Business rule: Only verifiers/admins can verify documents
      await this.ensureUserCanVerify(document, new UserId(command.verifierId));

      if (command.status === 'VERIFIED') {
        document.verify(
          new UserId(command.verifierId),
          command.verifierName,
          command.documentNumber,
        );
      } else if (command.status === 'REJECTED') {
        if (!command.reason) {
          throw new BadRequestException('Rejection reason is required');
        }
        document.reject(new UserId(command.verifierId), command.verifierName, command.reason);
      }

      // Update metadata if provided
      if (command.extractedData) {
        document.updateMetadata(command.extractedData);
      }

      const updatedDocument = await this.documentRepository.update(document);
      this.publishDomainEvents(updatedDocument);

      this.logger.log(`Document ${command.documentId} verified with status: ${command.status}`);

      return this.documentMapper.toVerifyResponseDto(updatedDocument);
    } catch (error) {
      this.logger.error(`Failed to verify document: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ============================================================================
  // DOCUMENT METADATA & ACCESS CONTROL
  // ============================================================================

  async updateDocumentMetadata(command: UpdateMetadataCommand): Promise<UpdateDocumentResponseDto> {
    try {
      const document = await this.findDocumentById(command.documentId);

      // Business rule: Only owner or admin can update metadata
      await this.ensureUserCanModify(document, new UserId(command.updaterId));

      // Update metadata
      if (command.metadata) {
        document.updateMetadata(command.metadata);
      }

      // Update other fields if provided
      // Note: In a real implementation, you'd have specific methods for each field

      const updatedDocument = await this.documentRepository.update(document);
      this.publishDomainEvents(updatedDocument);

      this.logger.log(`Document metadata updated: ${command.documentId}`);

      return this.documentMapper.toUpdateResponseDto(updatedDocument);
    } catch (error) {
      this.logger.error(`Failed to update document metadata: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateDocumentAccessControl(
    documentId: string,
    updaterId: string,
    isPublic?: boolean,
    allowedViewers?: string[],
  ): Promise<UpdateDocumentResponseDto> {
    try {
      const document = await this.findDocumentById(documentId);
      await this.ensureUserCanModify(document, new UserId(updaterId));

      if (isPublic !== undefined) {
        if (isPublic) {
          document.makePublic(new UserId(updaterId));
        } else {
          document.makePrivate(new UserId(updaterId));
        }
      }

      if (allowedViewers) {
        // This would be implemented with a proper method in the domain model
        // For now, we'll update through the repository
      }

      const updatedDocument = await this.documentRepository.update(document);
      this.publishDomainEvents(updatedDocument);

      this.logger.log(`Document access control updated: ${documentId}`);

      return this.documentMapper.toUpdateResponseDto(updatedDocument);
    } catch (error) {
      this.logger.error(`Failed to update document access control: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ============================================================================
  // DOCUMENT DELETION
  // ============================================================================

  async deleteDocument(documentId: string, deletedBy: string, reason?: string): Promise<void> {
    try {
      const document = await this.findDocumentById(documentId);
      await this.ensureUserCanModify(document, new UserId(deletedBy));

      document.softDelete(new UserId(deletedBy), reason);

      await this.documentRepository.update(document);
      this.publishDomainEvents(document);

      this.logger.log(`Document soft deleted: ${documentId} by user ${deletedBy}`);
    } catch (error) {
      this.logger.error(`Failed to delete document: ${error.message}`, error.stack);
      throw error;
    }
  }

  async restoreDocument(documentId: string, restoredBy: string): Promise<DocumentResponseDto> {
    try {
      const document = await this.documentRepository.findById(new DocumentId(documentId), {
        includeDeleted: true,
      });

      if (!document) {
        throw new NotFoundException(`Document not found: ${documentId}`);
      }

      if (!document.isDeleted()) {
        throw new BadRequestException(`Document is not deleted: ${documentId}`);
      }

      await this.ensureUserCanModify(document, new UserId(restoredBy));

      document.restore(new UserId(restoredBy));

      const updatedDocument = await this.documentRepository.update(document);
      this.publishDomainEvents(updatedDocument);

      this.logger.log(`Document restored: ${documentId}`);

      return this.documentMapper.toResponseDto(updatedDocument);
    } catch (error) {
      this.logger.error(`Failed to restore document: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async bulkDeleteDocuments(
    documentIds: string[],
    deletedBy: string,
    reason?: string,
  ): Promise<BulkOperationResponseDto> {
    try {
      const documentIdsVO = documentIds.map((id) => new DocumentId(id));

      // Verify all documents exist and user has permission
      for (const documentId of documentIdsVO) {
        const document = await this.findDocumentById(documentId.value);
        await this.ensureUserCanModify(document, new UserId(deletedBy));
      }

      const result = await this.documentRepository.softDeleteMany(
        documentIdsVO,
        new UserId(deletedBy),
      );

      this.logger.log(`Bulk deleted ${result.success} documents`);

      // In a real implementation, you'd publish events for each deleted document

      return {
        success: result.success,
        failed: result.failed,
        errors: result.errors,
      };
    } catch (error) {
      this.logger.error(`Failed to bulk delete documents: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ============================================================================
  // STATISTICS & ANALYTICS
  // ============================================================================

  async getDocumentStats(userId?: string): Promise<DocumentStatsResponseDto> {
    try {
      const filters: any = {};
      if (userId) {
        filters.uploaderId = userId;
      }

      const stats = await this.documentRepository.getStats(filters);
      return this.documentMapper.toDocumentStatsResponseDto(stats);
    } catch (error) {
      this.logger.error(`Failed to get document stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getStorageStats(): Promise<any> {
    try {
      return await this.documentRepository.getStorageStats();
    } catch (error) {
      this.logger.error(`Failed to get storage stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ============================================================================
  // FILE DOWNLOAD
  // ============================================================================

  async generateDownloadUrl(documentId: string, requestingUserId: string): Promise<string> {
    try {
      const document = await this.findDocumentById(documentId);
      await this.ensureDocumentAccess(document, new UserId(requestingUserId));

      // Record download for audit trail
      document.recordDownload(new UserId(requestingUserId));
      await this.documentRepository.update(document);

      return await this.storageService.getDownloadUrl(document.storagePath.value, {
        filename: document.fileMetadata.filename,
      });
    } catch (error) {
      this.logger.error(`Failed to generate download URL: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getFileContent(documentId: string, requestingUserId: string): Promise<Buffer> {
    try {
      const document = await this.findDocumentById(documentId);
      await this.ensureDocumentAccess(document, new UserId(requestingUserId));

      const fileContent = await this.storageService.retrieve(document.storagePath.value, {
        validateChecksum: true,
        expectedChecksum: document.fileMetadata.checksum.value,
      });

      // Record view for audit trail
      document.recordView(new UserId(requestingUserId));
      await this.documentRepository.update(document);

      return fileContent.buffer;
    } catch (error) {
      this.logger.error(`Failed to get file content: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async findDocumentById(documentId: string): Promise<Document> {
    const document = await this.documentRepository.findById(new DocumentId(documentId));
    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId}`);
    }
    return document;
  }

  private async ensureDocumentAccess(document: Document, userId: UserId): Promise<void> {
    if (!document.canBeAccessedBy(userId)) {
      throw new ForbiddenException('Access denied to document');
    }
  }

  private async ensureUserCanModify(document: Document, userId: UserId): Promise<void> {
    if (!document.isOwnedBy(userId)) {
      // In production, you'd also check for admin role
      throw new ForbiddenException('Only document owner can modify this document');
    }

    if (document.isVerified()) {
      throw new ConflictException('Cannot modify verified document');
    }
  }

  private async ensureUserCanVerify(document: Document, userId: UserId): Promise<void> {
    // In production, you'd check if user has VERIFIER or ADMIN role
    // For now, we'll just allow any user to verify (this should be enhanced)
    if (document.isOwnedBy(userId)) {
      throw new ForbiddenException('Document owner cannot verify their own document');
    }
  }

  private calculateUserPermissions(
    document: Document,
    userId: UserId,
  ): { canEdit: boolean; canDelete: boolean } {
    const canEdit = document.isOwnedBy(userId) && !document.isVerified();
    const canDelete = document.isOwnedBy(userId) && !document.isVerified();

    return { canEdit, canDelete };
  }

  private applyAccessControlFilters(filters: any, userId: UserId): any {
    // Only show documents the user has access to
    return {
      ...filters,
      $or: [
        { uploaderId: userId.value },
        { isPublic: true },
        { allowedViewers: { has: userId.value } },
      ],
    };
  }

  private generateStoragePath(uploaderId: string, filename: string, category: string): StoragePath {
    const timestamp = Date.now();
    const uniqueId = uuidv4().substring(0, 8);
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

    const path = `documents/${uploaderId}/${category}/${timestamp}_${uniqueId}_${safeFilename}`;
    return new StoragePath(path);
  }

  private calculateChecksum(buffer: Buffer): string {
    // This would use the same method as in storage service
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private publishDomainEvents(document: Document): void {
    document.domainEvents.forEach((event) => {
      this.eventEmitter.emit(event.constructor.name, event);
    });
    document.clearDomainEvents();
  }
}
