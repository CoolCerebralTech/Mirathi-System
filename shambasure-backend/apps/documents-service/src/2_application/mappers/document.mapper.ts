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
  FileName,
  MimeType,
  RejectionReason,
  RetentionPolicy,
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
 * PRODUCTION CONSIDERATIONS:
 * - Null safety for optional fields
 * - Error handling for invalid mappings
 * - Performance for bulk operations
 * - Consistency across all mappings
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
      includeVersionInfo?: boolean;
    } = {},
  ): DocumentResponseDto {
    // Null-safe mapping for optional fields
    const dto = new DocumentResponseDto({
      id: document.id.value,
      fileName: document.fileName.value,
      storagePath: document.storagePath.value,
      mimeType: document.mimeType.value,
      sizeBytes: document.fileSize.sizeInBytes,
      category: document.category.value,
      status: document.status.value,

      uploaderId: document.uploaderId.value,
      verifiedBy: document.verifiedBy?.value ?? undefined,
      verifiedAt: document.verifiedAt ?? undefined,
      rejectionReason: document.rejectionReason?.value ?? undefined,

      assetId: document.assetId?.value ?? undefined,
      willId: document.willId?.value ?? undefined,
      identityForUserId: document.identityForUserId?.value ?? undefined,

      metadata: document.metadata ?? undefined,
      documentNumber: document.documentNumber ?? undefined,
      issueDate: document.issueDate ?? undefined,
      expiryDate: document.expiryDate ?? undefined,
      issuingAuthority: document.issuingAuthority ?? undefined,

      isPublic: document.isPublic(),
      encrypted: document.encrypted,
      allowedViewers: document.allowedViewers.toArray().map((id) => id.value),
      storageProvider: document.storageProvider.value,
      checksum: document.checksum?.value ?? '', // Handle nullable checksum
      retentionPolicy: document.retentionPolicy?.value ?? undefined,
      version: document.version,

      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      deletedAt: document.deletedAt ?? undefined,
    });

    // Compute permissions if requested
    if (options.computePermissions && options.currentUserId) {
      dto.canEdit = !document.isVerified() && document.isOwnedBy(options.currentUserId);
      dto.canDelete = !document.isVerified() && document.isOwnedBy(options.currentUserId);
      dto.canVerify = document.isPending() && !document.isOwnedBy(options.currentUserId);
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

    // Add version info if requested
    if (options.includeVersionInfo) {
      dto.currentVersion = document.version;
      // Note: totalVersions would need to be fetched from version repository
    }

    return dto;
  }

  toUploadResponseDto(
    document: Document,
    options: { downloadUrl?: string; documentUrl?: string } = {},
  ): UploadDocumentResponseDto {
    return new UploadDocumentResponseDto({
      id: document.id.value,
      fileName: document.fileName.value,
      storagePath: document.storagePath.value,
      category: document.category.value,
      status: document.status.value,
      sizeBytes: document.fileSize.sizeInBytes,
      mimeType: document.mimeType.value,
      checksum: document.checksum?.value ?? '', // Handle nullable checksum
      uploaderId: document.uploaderId.value,
      createdAt: document.createdAt,
      documentUrl: options.documentUrl,
      downloadUrl: options.downloadUrl,
    });
  }

  toVerifyResponseDto(
    document: Document,
    verificationAttemptId?: string,
  ): VerifyDocumentResponseDto {
    return new VerifyDocumentResponseDto({
      id: document.id.value,
      status: document.status.value,
      verifiedBy: document.verifiedBy?.value ?? '',
      verifiedAt: document.verifiedAt ?? new Date(),
      documentNumber: document.documentNumber ?? undefined,
      rejectionReason: document.rejectionReason?.value ?? undefined,
      verificationAttemptId,
    });
  }

  toUpdateResponseDto(document: Document): UpdateDocumentResponseDto {
    return new UpdateDocumentResponseDto({
      id: document.id.value,
      fileName: document.fileName.value,
      metadata: document.metadata ?? undefined,
      documentNumber: document.documentNumber ?? undefined,
      issueDate: document.issueDate ?? undefined,
      expiryDate: document.expiryDate ?? undefined,
      issuingAuthority: document.issuingAuthority ?? undefined,
      isPublic: document.isPublic(),
      allowedViewers: document.allowedViewers.toArray().map((id) => id.value),
      updatedAt: document.updatedAt,
    });
  }

  toUpdateDetailsResponseDto(document: Document): UpdateDocumentDetailsResponseDto {
    return new UpdateDocumentDetailsResponseDto({
      id: document.id.value,
      documentNumber: document.documentNumber ?? undefined,
      issueDate: document.issueDate ?? undefined,
      expiryDate: document.expiryDate ?? undefined,
      issuingAuthority: document.issuingAuthority ?? undefined,
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
      fileName: FileName.create(dto.fileName), // Note: DTO uses 'fileName' not 'filename'
      category: DocumentCategory.create(dto.category),
      assetId: dto.assetId ? new AssetId(dto.assetId) : undefined,
      willId: dto.willId ? new WillId(dto.willId) : undefined,
      identityForUserId: dto.identityForUserId ? new UserId(dto.identityForUserId) : undefined,
      metadata: dto.metadata ?? undefined,
      documentNumber: dto.documentNumber ?? undefined,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      issuingAuthority: dto.issuingAuthority ?? undefined,
      isPublic: dto.isPublic ?? false,
      retentionPolicy: dto.retentionPolicy
        ? RetentionPolicy.create(dto.retentionPolicy)
        : undefined,
    };
  }

  verifyDtoToValueObjects(dto: VerifyDocumentDto, verifierId: UserId) {
    return {
      verifierId,
      status: DocumentStatus.create(dto.status),
      reason: dto.reason ? RejectionReason.create(dto.reason) : undefined,
      documentNumber: dto.documentNumber ?? undefined,
      extractedData: dto.extractedData ?? undefined,
      verificationMetadata: dto.verificationMetadata ?? undefined,
    };
  }

  updateMetadataDtoToParams(dto: UpdateMetadataDto) {
    return {
      metadata: dto.metadata ?? undefined,
      documentNumber: dto.documentNumber ?? undefined,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      issuingAuthority: dto.issuingAuthority ?? undefined,
      tags: dto.tags ?? undefined,
    };
  }

  updateDetailsDtoToParams(dto: UpdateDocumentDetailsDto) {
    return {
      documentNumber: dto.documentNumber ?? undefined,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      issuingAuthority: dto.issuingAuthority ?? undefined,
    };
  }

  updateAccessControlDtoToParams(dto: UpdateAccessControlDto) {
    return {
      isPublic: dto.isPublic ?? undefined,
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
      'text/plain',
      'text/markdown',
    ];
    return previewableMimeTypes.includes(mimeType.value);
  }

  /**
   * Formats file size to human-readable format
   */
  formatFileSize(sizeInBytes: number): string {
    if (sizeInBytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const exponent = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
    const size = (sizeInBytes / Math.pow(1024, exponent)).toFixed(2);

    return `${size} ${units[exponent]}`;
  }

  /**
   * Validates if a domain object can be mapped to response DTO
   */
  isValidForMapping(document: Document): boolean {
    return !!(
      document?.id &&
      document.fileName &&
      document.storagePath &&
      document.category &&
      document.status
    );
  }
}
