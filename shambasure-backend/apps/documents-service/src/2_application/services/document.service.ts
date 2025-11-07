import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { IDocumentRepository } from '../../3_domain/interfaces/document.repository.interface';
import { IStorageService } from '../../3_domain/interfaces/storage.service.interface';
import { Document } from '../../3_domain/models/document.model';
import {
  DocumentId,
  UserId,
  StoragePath,
  FileName,
  FileSize,
  MimeType,
  DocumentChecksum,
  StorageProvider,
} from '../../3_domain/value-objects';
import { DocumentMapper } from '../mappers/document.mapper';
import { BulkOperationsMapper } from '../mappers/bulk-operations.mapper';
import { FileValidatorService } from '../../4_infrastructure/storage/file-validator.service';
import { UploadDocumentDto, UploadDocumentResponseDto } from '../dtos/upload-document.dto';
import { VerifyDocumentDto, VerifyDocumentResponseDto } from '../dtos/verify-document.dto';
import {
  UpdateMetadataDto,
  UpdateAccessControlDto,
  UpdateDocumentResponseDto,
} from '../dtos/update-metadata.dto';
import {
  UpdateDocumentDetailsDto,
  UpdateDocumentDetailsResponseDto,
} from '../dtos/update-document-details.dto';
import {
  ShareDocumentDto,
  RevokeAccessDto,
  ShareDocumentResponseDto,
} from '../dtos/share-document.dto';
import { QueryDocumentsDto, PaginatedDocumentsResponseDto } from '../dtos/query-documents.dto';
import { SearchDocumentsDto } from '../dtos/search-documents.dto';
import {
  BulkDeleteDto,
  BulkUpdateStatusDto,
  BulkUpdateMetadataDto,
  BulkShareDto,
  BulkOperationResponseDto,
} from '../dtos/bulk-operations.dto';
import { DocumentResponseDto } from '../dtos/document-response.dto';

/**
 * DocumentService - Application Service
 *
 * RESPONSIBILITIES:
 * - Orchestrate use cases
 * - Coordinate between domain and infrastructure
 * - Handle transactions
 * - Emit domain events
 * - Map DTOs to domain and back
 *
 * DOES NOT:
 * - Contain business rules (Domain layer)
 * - Access database directly (Repository pattern)
 * - Handle HTTP concerns (Presentation layer)
 */
@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly storageService: IStorageService,
    private readonly documentMapper: DocumentMapper,
    private readonly bulkMapper: BulkOperationsMapper,
    private readonly fileValidator: FileValidatorService,
  ) {}

  // ============================================================================
  // UPLOAD OPERATIONS
  // ============================================================================

  async uploadDocument(
    dto: UploadDocumentDto,
    file: Buffer,
    uploaderId: UserId,
  ): Promise<UploadDocumentResponseDto> {
    this.logger.log(`Uploading document: ${dto.filename} by user ${uploaderId.value}`);

    try {
      // 1. Validate file
      const validationResult = await this.fileValidator.validateFile(
        file,
        dto.filename,
        this.detectMimeType(file),
      );

      if (!validationResult.isValid) {
        throw new BadRequestException(
          `File validation failed: ${validationResult.errors.map((e) => e.message).join(', ')}`,
        );
      }

      // 2. Extract file metadata from validation
      const fileName = FileName.create(dto.filename);
      const fileSize = FileSize.create(file.length);
      const mimeType = MimeType.create(validationResult.metadata.mimeType);
      const checksum = DocumentChecksum.create(validationResult.metadata.checksum);

      // 3. Generate storage path
      const storagePath = this.generateStoragePath(uploaderId, fileName);

      // 4. Save file to storage
      const saveResult = await this.storageService.save(file, storagePath, {
        contentType: mimeType,
        metadata: {
          uploaderId: uploaderId.value,
          originalFilename: dto.filename,
        },
      });

      // 5. Map DTO to domain params
      const domainParams = this.documentMapper.uploadDtoToValueObjects(dto, uploaderId);

      // 6. Create domain aggregate
      const document = Document.create({
        fileName,
        fileSize,
        mimeType,
        checksum,
        storagePath: saveResult.path,
        category: domainParams.category,
        uploaderId: domainParams.uploaderId,
        storageProvider: StorageProvider.create('local'),
        assetId: domainParams.assetId,
        willId: domainParams.willId,
        identityForUserId: domainParams.identityForUserId,
        metadata: domainParams.metadata,
        documentNumber: domainParams.documentNumber,
        issueDate: domainParams.issueDate,
        expiryDate: domainParams.expiryDate,
        issuingAuthority: domainParams.issuingAuthority,
        isPublic: domainParams.isPublic,
        retentionPolicy: domainParams.retentionPolicy,
      });

      // 7. Persist document
      await this.documentRepository.save(document);

      // 8. TODO: Publish domain events (DocumentUploadedEvent)
      // await this.eventPublisher.publish(document.domainEvents);
      document.clearDomainEvents();

      // 9. Generate download URL
      const downloadUrl = await this.storageService.getPresignedDownloadUrl(storagePath, {
        expiresInSeconds: 3600,
        fileNameToSuggest: fileName,
      });

      this.logger.log(`Document uploaded successfully: ${document.id.value}`);

      return this.documentMapper.toUploadResponseDto(document, downloadUrl);
    } catch (error) {
      this.logger.error(`Failed to upload document: ${error.message}`, error.stack);

      // Cleanup on failure
      if (error.storagePath) {
        await this.storageService.delete(error.storagePath).catch(() => {});
      }

      throw error;
    }
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  async getDocumentById(
    documentId: DocumentId,
    currentUserId?: UserId,
  ): Promise<DocumentResponseDto> {
    this.logger.debug(`Fetching document: ${documentId.value}`);

    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId.value}`);
    }

    // Check access
    if (currentUserId && !document.canBeAccessedBy(currentUserId)) {
      throw new NotFoundException(`Document not found: ${documentId.value}`);
    }

    return this.documentMapper.toResponseDto(document, {
      includeDownloadUrl: true,
      includePreviewUrl: true,
      currentUserId,
      computePermissions: !!currentUserId,
    });
  }

  async queryDocuments(
    dto: QueryDocumentsDto,
    currentUserId?: UserId,
  ): Promise<PaginatedDocumentsResponseDto> {
    this.logger.debug(`Querying documents with filters: ${JSON.stringify(dto)}`);

    // Convert DTO filters to repository filters
    const filters = this.buildRepositoryFilters(dto);

    const result = await this.documentRepository.findMany(filters, {
      page: dto.page || 1,
      limit: dto.limit || 20,
      sortBy: dto.sortBy as any,
      sortOrder: dto.sortOrder,
    });

    return this.documentMapper.toPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
      {
        includeDownloadUrl: false,
        currentUserId,
        computePermissions: !!currentUserId,
      },
    );
  }

  async searchDocuments(
    dto: SearchDocumentsDto,
    currentUserId?: UserId,
  ): Promise<PaginatedDocumentsResponseDto> {
    this.logger.debug(`Searching documents: ${dto.query}`);

    const result = await this.documentRepository.search(
      {
        query: dto.query,
        category: dto.category,
        status: dto.status,
        uploaderId: dto.uploaderId,
        tags: dto.tags,
      },
      {
        page: dto.page || 1,
        limit: dto.limit || 20,
      },
    );

    return this.documentMapper.toPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
      {
        currentUserId,
        computePermissions: !!currentUserId,
      },
    );
  }

  async downloadDocument(
    documentId: DocumentId,
    currentUserId: UserId,
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }> {
    this.logger.log(`Downloading document: ${documentId.value} by user ${currentUserId.value}`);

    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId.value}`);
    }

    if (!document.canBeAccessedBy(currentUserId)) {
      throw new NotFoundException(`Document not found: ${documentId.value}`);
    }

    // Record download event
    document.recordDownload(currentUserId, 'unknown-ip', 'unknown-agent');
    await this.documentRepository.save(document);

    // Retrieve file from storage
    const fileResult = await this.storageService.retrieve(document.storagePath);

    return {
      buffer: fileResult.buffer,
      filename: document.fileName.value,
      mimeType: document.mimeType.value,
    };
  }

  // ============================================================================
  // UPDATE OPERATIONS
  // ============================================================================

  async updateMetadata(
    documentId: DocumentId,
    dto: UpdateMetadataDto,
    currentUserId: UserId,
  ): Promise<UpdateDocumentResponseDto> {
    this.logger.log(`Updating document metadata: ${documentId.value}`);

    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId.value}`);
    }

    if (!document.isOwnedBy(currentUserId)) {
      throw new BadRequestException('Only document owner can update metadata');
    }

    const params = this.documentMapper.updateMetadataDtoToParams(dto);

    if (params.metadata) {
      document.updateMetadata(params.metadata, currentUserId);
    }

    if (params.documentNumber || params.issueDate || params.expiryDate || params.issuingAuthority) {
      document.updateDocumentDetails({
        documentNumber: params.documentNumber,
        issueDate: params.issueDate,
        expiryDate: params.expiryDate,
        issuingAuthority: params.issuingAuthority,
        updatedBy: currentUserId,
      });
    }

    await this.documentRepository.save(document);

    return this.documentMapper.toUpdateResponseDto(document);
  }

  async updateDocumentDetails(
    documentId: DocumentId,
    dto: UpdateDocumentDetailsDto,
    currentUserId: UserId,
  ): Promise<UpdateDocumentDetailsResponseDto> {
    this.logger.log(`Updating document details: ${documentId.value}`);

    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId.value}`);
    }

    if (!document.isOwnedBy(currentUserId)) {
      throw new BadRequestException('Only document owner can update details');
    }

    const params = this.documentMapper.updateDetailsDtoToParams(dto);

    document.updateDocumentDetails({
      ...params,
      updatedBy: currentUserId,
    });

    await this.documentRepository.save(document);

    return this.documentMapper.toUpdateDetailsResponseDto(document);
  }

  async updateAccessControl(
    documentId: DocumentId,
    dto: UpdateAccessControlDto,
    currentUserId: UserId,
  ): Promise<UpdateDocumentResponseDto> {
    this.logger.log(`Updating document access control: ${documentId.value}`);

    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId.value}`);
    }

    if (!document.isOwnedBy(currentUserId)) {
      throw new BadRequestException('Only document owner can update access control');
    }

    const params = this.documentMapper.updateAccessControlDtoToParams(dto);

    if (params.isPublic !== undefined) {
      if (params.isPublic) {
        document.makePublic(currentUserId);
      } else {
        document.makePrivate(currentUserId);
      }
    }

    if (params.allowedViewers && params.allowedViewers.length > 0) {
      document.shareWith(currentUserId, params.allowedViewers);
    }

    await this.documentRepository.save(document);

    return this.documentMapper.toUpdateResponseDto(document);
  }

  // ============================================================================
  // VERIFICATION OPERATIONS
  // ============================================================================

  async verifyDocument(
    documentId: DocumentId,
    dto: VerifyDocumentDto,
    verifierId: UserId,
  ): Promise<VerifyDocumentResponseDto> {
    this.logger.log(`Verifying document: ${documentId.value} by verifier ${verifierId.value}`);

    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId.value}`);
    }

    const params = this.documentMapper.verifyDtoToValueObjects(dto, verifierId);

    if (params.status.isVerified()) {
      document.verify(params.verifierId);
    } else if (params.status.isRejected()) {
      if (!params.reason) {
        throw new BadRequestException('Rejection reason is required');
      }
      document.reject(params.verifierId, params.reason);
    }

    // Update extracted details if provided
    if (params.documentNumber) {
      document.updateDocumentDetails({
        documentNumber: params.documentNumber,
        updatedBy: verifierId,
      });
    }

    await this.documentRepository.save(document);

    // TODO: Create verification attempt record
    // const attempt = DocumentVerificationAttempt.create...
    // await verificationAttemptRepository.save(attempt);

    return this.documentMapper.toVerifyResponseDto(document);
  }

  // ============================================================================
  // SHARING OPERATIONS
  // ============================================================================

  async shareDocument(
    documentId: DocumentId,
    dto: ShareDocumentDto,
    currentUserId: UserId,
  ): Promise<ShareDocumentResponseDto> {
    this.logger.log(`Sharing document: ${documentId.value} with ${dto.userIds.length} users`);

    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId.value}`);
    }

    if (!document.isOwnedBy(currentUserId)) {
      throw new BadRequestException('Only document owner can share');
    }

    const userIds = dto.userIds.map((id) => new UserId(id));

    if (dto.makePublic) {
      document.makePublic(currentUserId);
    } else {
      document.shareWith(currentUserId, userIds);
    }

    await this.documentRepository.save(document);

    return this.documentMapper.toShareResponseDto(document, userIds);
  }

  async revokeAccess(
    documentId: DocumentId,
    dto: RevokeAccessDto,
    currentUserId: UserId,
  ): Promise<ShareDocumentResponseDto> {
    this.logger.log(`Revoking access for document: ${documentId.value}`);

    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId.value}`);
    }

    if (!document.isOwnedBy(currentUserId)) {
      throw new BadRequestException('Only document owner can revoke access');
    }

    const userIds = dto.userIds.map((id) => new UserId(id));
    document.revokeAccess(currentUserId, userIds);

    await this.documentRepository.save(document);

    return this.documentMapper.toShareResponseDto(document, []);
  }

  // ============================================================================
  // DELETE OPERATIONS
  // ============================================================================

  async softDeleteDocument(documentId: DocumentId, currentUserId: UserId): Promise<void> {
    this.logger.log(`Soft deleting document: ${documentId.value}`);

    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId.value}`);
    }

    if (!document.isOwnedBy(currentUserId)) {
      throw new BadRequestException('Only document owner can delete');
    }

    document.softDelete(currentUserId);
    await this.documentRepository.save(document);
  }

  async restoreDocument(
    documentId: DocumentId,
    currentUserId: UserId,
  ): Promise<DocumentResponseDto> {
    this.logger.log(`Restoring document: ${documentId.value}`);

    const document = await this.documentRepository.findById(documentId, true);

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId.value}`);
    }

    if (!document.isOwnedBy(currentUserId)) {
      throw new BadRequestException('Only document owner can restore');
    }

    document.restore(currentUserId);
    await this.documentRepository.save(document);

    return this.documentMapper.toResponseDto(document);
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async bulkDelete(dto: BulkDeleteDto, currentUserId: UserId): Promise<BulkOperationResponseDto> {
    this.logger.log(`Bulk deleting ${dto.documentIds.length} documents`);

    const documentIds = dto.documentIds.map((id) => new DocumentId(id));
    const result = await this.documentRepository.softDeleteMany(documentIds, currentUserId);

    return this.bulkMapper.fromRepositoryBulkResult(result);
  }

  async bulkUpdateStatus(
    dto: BulkUpdateStatusDto,
    currentUserId: UserId,
  ): Promise<BulkOperationResponseDto> {
    this.logger.log(`Bulk updating status for ${dto.documentIds.length} documents`);

    const documentIds = dto.documentIds.map((id) => new DocumentId(id));
    const result = await this.documentRepository.updateStatusMany(
      documentIds,
      dto.status as any,
      currentUserId,
    );

    return this.bulkMapper.toBulkOperationResponseDto(result);
  }

  async bulkShare(dto: BulkShareDto, currentUserId: UserId): Promise<BulkOperationResponseDto> {
    this.logger.log(`Bulk sharing ${dto.documentIds.length} documents`);

    const documentIds = dto.documentIds.map((id) => new DocumentId(id));
    const userIds = dto.userIds.map((id) => new UserId(id));

    const result = await this.documentRepository.shareMany(documentIds, currentUserId, userIds);

    return this.bulkMapper.toBulkOperationResponseDto(result);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private generateStoragePath(uploaderId: UserId, fileName: FileName): StoragePath {
    const timestamp = Date.now();
    const sanitized = fileName.value.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${uploaderId.value}/${timestamp}_${sanitized}`;
    return StoragePath.create(path);
  }

  private detectMimeType(buffer: Buffer): string {
    // Simple magic number detection
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return 'application/pdf';
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return 'image/png';
    }
    return 'application/octet-stream';
  }

  private buildRepositoryFilters(dto: QueryDocumentsDto): any {
    return {
      uploaderId: dto.uploaderId ? new UserId(dto.uploaderId) : undefined,
      status: dto.status,
      category: dto.category,
      assetId: dto.assetId ? new AssetId(dto.assetId) : undefined,
      willId: dto.willId ? new WillId(dto.willId) : undefined,
      identityForUserId: dto.identityForUserId ? new UserId(dto.identityForUserId) : undefined,
      isPublic: dto.isPublic,
      encrypted: dto.encrypted,
      storageProvider: dto.storageProvider
        ? StorageProvider.create(dto.storageProvider)
        : undefined,
      documentNumber: dto.documentNumber,
      issuingAuthority: dto.issuingAuthority,
      createdAfter: dto.createdAfter ? new Date(dto.createdAfter) : undefined,
      createdBefore: dto.createdBefore ? new Date(dto.createdBefore) : undefined,
      updatedAfter: dto.updatedAfter ? new Date(dto.updatedAfter) : undefined,
      updatedBefore: dto.updatedBefore ? new Date(dto.updatedBefore) : undefined,
      includeDeleted: dto.includeDeleted,
      hasExpired: dto.hasExpired,
      retentionPolicy: dto.retentionPolicy,
      verifiedBy: dto.verifiedBy ? new UserId(dto.verifiedBy) : undefined,
    };
  }
}
