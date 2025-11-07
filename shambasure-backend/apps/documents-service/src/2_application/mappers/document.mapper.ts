import { Injectable } from '@nestjs/common';
import { Document } from '../../3_domain/models/document.model';
import { DocumentResponseDto, DocumentStatsResponseDto } from '../dtos/document-response.dto';
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
import { ShareDocumentResponseDto } from '../dtos/share-document.dto';
import { PaginatedDocumentsResponseDto } from '../dtos/query-documents.dto';
import {
  DocumentId,
  UserId,
  WillId,
  AssetId,
  DocumentCategory,
  DocumentStatus,
  StoragePath,
  FileName,
  FileSize,
  MimeType,
  DocumentChecksum,
  StorageProvider,
  RejectionReason,
} from '../../3_domain/value-objects';

/**
 * DocumentMapper - Application Layer
 *
 * RESPONSIBILITIES:
 * - Map Domain models to Response DTOs
 * - Map Request DTOs to Domain value objects
 * - Handle computed/derived fields
 * - Format data for presentation
 *
 * DOES NOT:
 * - Contain business logic (Domain layer)
 * - Handle persistence (Infrastructure layer)
 * - Make external calls
 */
@Injectable()
export class DocumentMapper {
  // ============================================================================
  // DOMAIN TO RESPONSE DTO
  // ============================================================================

  toResponseDto(
    document: Document,
    options: {
      includeDownloadUrl?: boolean;
      includePreviewUrl?: boolean;
      currentUserId?: UserId;
      computePermissions?: boolean;
    } = {},
  ): DocumentResponseDto {
    const dto = new DocumentResponseDto({
      id: document.id.value,
      filename: document.fileName.value,
      storagePath: document.storagePath.value,
      mimeType: document.mimeType.value,
      sizeBytes: document.fileSize.sizeInBytes,
      category: document.category.value,
      status: document.status.value,

      uploaderId: document.uploaderId.value,
      verifiedBy: document.verifiedBy?.value,
      verifiedAt: document.verifiedAt,
      rejectionReason: document.rejectionReason?.value,

      assetId: document.assetId?.value,
      willId: document.willId?.value,
      identityForUserId: document.identityForUserId?.value,

      metadata: document.metadata,
      documentNumber: document.documentNumber,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      issuingAuthority: document.issuingAuthority,

      isPublic: document.isPublic(),
      encrypted: document.encrypted,
      allowedViewers: document.allowedViewers.toArray().map((id) => id.value),
      storageProvider: document.storageProvider.value,
      checksum: document.checksum.value,
      retentionPolicy: document.retentionPolicy,
      version: document.version,

      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      deletedAt: document.deletedAt,
    });

    // Compute permissions if requested
    if (options.computePermissions && options.currentUserId) {
      dto.canEdit = !document.isVerified() && document.isOwnedBy(options.currentUserId);
      dto.canDelete = !document.isVerified() && document.isOwnedBy(options.currentUserId);
      dto.canVerify = document.isPending();
    }

    // Compute expiration status
    dto.isExpired = document.isExpired();

    // Add URLs if requested
    if (options.includeDownloadUrl) {
      dto.downloadUrl = this.generateDownloadUrl(document.id);
    }

    if (options.includePreviewUrl && this.isPreviewable(document.mimeType)) {
      dto.previewUrl = this.generatePreviewUrl(document.id);
    }

    return dto;
  }

  toUploadResponseDto(document: Document, downloadUrl?: string): UploadDocumentResponseDto {
    return new UploadDocumentResponseDto({
      id: document.id.value,
      filename: document.fileName.value,
      storagePath: document.storagePath.value,
      category: document.category.value,
      status: document.status.value,
      sizeBytes: document.fileSize.sizeInBytes,
      mimeType: document.mimeType.value,
      checksum: document.checksum.value,
      uploaderId: document.uploaderId.value,
      createdAt: document.createdAt,
      documentUrl: downloadUrl,
      downloadUrl: downloadUrl,
    });
  }

  toVerifyResponseDto(
    document: Document,
    verificationAttemptId?: string,
  ): VerifyDocumentResponseDto {
    return new VerifyDocumentResponseDto({
      id: document.id.value,
      status: document.status.value,
      verifiedBy: document.verifiedBy?.value || '',
      verifiedAt: document.verifiedAt || new Date(),
      documentNumber: document.documentNumber,
      rejectionReason: document.rejectionReason?.value,
      verificationAttemptId,
    });
  }

  toUpdateResponseDto(document: Document): UpdateDocumentResponseDto {
    return new UpdateDocumentResponseDto({
      id: document.id.value,
      filename: document.fileName.value,
      metadata: document.metadata,
      documentNumber: document.documentNumber,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      issuingAuthority: document.issuingAuthority,
      isPublic: document.isPublic(),
      allowedViewers: document.allowedViewers.toArray().map((id) => id.value),
      updatedAt: document.updatedAt,
    });
  }

  toUpdateDetailsResponseDto(document: Document): UpdateDocumentDetailsResponseDto {
    return new UpdateDocumentDetailsResponseDto({
      id: document.id.value,
      documentNumber: document.documentNumber,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      issuingAuthority: document.issuingAuthority,
      updatedAt: document.updatedAt,
    });
  }

  toShareResponseDto(document: Document, sharedWith: UserId[]): ShareDocumentResponseDto {
    return new ShareDocumentResponseDto({
      documentId: document.id.value,
      sharedWith: sharedWith.map((id) => id.value),
      isPublic: document.isPublic(),
      allowedViewers: document.allowedViewers.toArray().map((id) => id.value),
      sharedAt: new Date(),
    });
  }

  toStatsResponseDto(stats: {
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    totalSizeBytes: number;
    averageSizeBytes: number;
    encrypted: number;
    public: number;
    expired: number;
  }): DocumentStatsResponseDto {
    return new DocumentStatsResponseDto({
      total: stats.total,
      byStatus: stats.byStatus,
      byCategory: stats.byCategory,
      totalSizeBytes: stats.totalSizeBytes,
      averageSizeBytes: stats.averageSizeBytes,
      encrypted: stats.encrypted,
      public: stats.public,
      expired: stats.expired,
    });
  }

  // ============================================================================
  // BULK MAPPING
  // ============================================================================

  toResponseDtoList(
    documents: Document[],
    options: {
      includeDownloadUrl?: boolean;
      includePreviewUrl?: boolean;
      currentUserId?: UserId;
      computePermissions?: boolean;
    } = {},
  ): DocumentResponseDto[] {
    return documents.map((document) => this.toResponseDto(document, options));
  }

  toPaginatedResponse(
    documents: Document[],
    total: number,
    page: number,
    limit: number,
    options: {
      includeDownloadUrl?: boolean;
      includePreviewUrl?: boolean;
      currentUserId?: UserId;
      computePermissions?: boolean;
    } = {},
  ): PaginatedDocumentsResponseDto {
    const data = this.toResponseDtoList(documents, options);
    const totalPages = Math.ceil(total / limit);

    return new PaginatedDocumentsResponseDto({
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    });
  }

  // ============================================================================
  // REQUEST DTO TO DOMAIN VALUE OBJECTS
  // ============================================================================

  uploadDtoToValueObjects(dto: UploadDocumentDto, uploaderId: UserId) {
    return {
      uploaderId,
      fileName: FileName.create(dto.filename),
      category: DocumentCategory.create(dto.category),
      assetId: dto.assetId ? new AssetId(dto.assetId) : undefined,
      willId: dto.willId ? new WillId(dto.willId) : undefined,
      identityForUserId: dto.identityForUserId ? new UserId(dto.identityForUserId) : undefined,
      metadata: dto.metadata,
      documentNumber: dto.documentNumber,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      issuingAuthority: dto.issuingAuthority,
      isPublic: dto.isPublic,
      retentionPolicy: dto.retentionPolicy,
    };
  }

  verifyDtoToValueObjects(dto: VerifyDocumentDto, verifierId: UserId) {
    return {
      verifierId,
      status: DocumentStatus.create(dto.status),
      reason: dto.reason ? RejectionReason.create(dto.reason) : undefined,
      documentNumber: dto.documentNumber,
      extractedData: dto.extractedData,
      verificationMetadata: dto.verificationMetadata,
    };
  }

  updateMetadataDtoToParams(dto: UpdateMetadataDto) {
    return {
      metadata: dto.metadata,
      documentNumber: dto.documentNumber,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      issuingAuthority: dto.issuingAuthority,
      tags: dto.tags,
    };
  }

  updateDetailsDtoToParams(dto: UpdateDocumentDetailsDto) {
    return {
      documentNumber: dto.documentNumber,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      issuingAuthority: dto.issuingAuthority,
    };
  }

  updateAccessControlDtoToParams(dto: UpdateAccessControlDto) {
    return {
      isPublic: dto.isPublic,
      allowedViewers: dto.allowedViewers?.map((id) => new UserId(id)) || [],
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private generateDownloadUrl(documentId: DocumentId): string {
    return `/api/v1/documents/${documentId.value}/download`;
  }

  private generatePreviewUrl(documentId: DocumentId): string {
    return `/api/v1/documents/${documentId.value}/preview`;
  }

  private isPreviewable(mimeType: MimeType): boolean {
    const previewableMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    return previewableMimeTypes.includes(mimeType.value);
  }

  /**
   * Formats file size to human-readable format
   */
  formatFileSize(sizeInBytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = sizeInBytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}
