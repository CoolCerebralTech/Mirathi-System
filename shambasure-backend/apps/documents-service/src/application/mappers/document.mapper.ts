import { Injectable } from '@nestjs/common';
import { Document } from '../../domain/models';
import { PaginatedDocumentsResponseDto } from '../dtos/query-documents.dto';
import { UploadDocumentResponseDto, UploadDocumentDto } from '../dtos/upload-document.dto';
import { VerifyDocumentResponseDto, VerifyDocumentDto } from '../dtos/verify-document.dto';
import { UpdateDocumentDto, UpdateDocumentResponseDto } from '../dtos/update-document.dto';
import { AccessControlResponseDto } from '../dtos/share-document.dto';
import { DocumentResponseDto } from '../dtos/document-response.dto';
import {
  DocumentId,
  UserId,
  WillId,
  AssetId,
  DocumentCategory,
  FileName,
  RejectionReason,
  RetentionPolicy,
  StorageProvider,
  RetentionPolicyType,
} from '../../domain/value-objects';

/**
 * Maps between Document domain objects and various Data Transfer Objects (DTOs).
 * This class is responsible for PRESENTATION logic only, such as generating URLs or
 * shaping data for API clients. It contains NO business logic.
 */
@Injectable()
export class DocumentMapper {
  // ============================================================================
  // DOMAIN TO RESPONSE DTO MAPPERS
  // ============================================================================

  /**
   * Maps a Document domain object to a detailed DocumentResponseDto.
   * Business logic (like permissions) should be calculated in the service and passed in.
   */
  toResponseDto(
    document: Document,
    options: {
      uploaderName?: string;
      verifierName?: string;
      totalVersions?: number;
      permissions?: { canEdit: boolean; canDelete: boolean; canVerify: boolean; canShare: boolean };
    } = {},
  ): DocumentResponseDto {
    return new DocumentResponseDto({
      id: document.id.value,
      fileName: document.fileName.value,
      mimeType: document.mimeType.value,
      sizeBytes: document.fileSize.sizeInBytes,
      category: document.category.value,
      status: document.status.value,
      uploaderId: document.uploaderId.value,
      uploaderName: options.uploaderName,
      verifiedBy: document.verifiedBy?.value,
      verifiedByName: options.verifierName,
      verifiedAt: document.verifiedAt ?? undefined,
      rejectionReason: document.rejectionReason?.value,
      assetId: document.assetId?.value,
      willId: document.willId?.value,
      identityForUserId: document.identityForUserId?.value,
      metadata: document.metadata ?? undefined,
      documentNumber: document.documentNumber ?? undefined, // FIX: Convert null to undefined
      issueDate: document.issueDate ?? undefined,
      expiryDate: document.expiryDate ?? undefined,
      issuingAuthority: document.issuingAuthority ?? undefined,
      isPublic: document.isPublic(),
      encrypted: document.encrypted,
      allowedViewers: document.allowedViewers.toArray().map((id) => id.value),
      storageProvider: document.storageProvider.value,
      checksum: document.checksum?.value,
      retentionPolicy: document.retentionPolicy?.value as RetentionPolicyType | undefined, // FIX: Cast to enum type
      version: document.version,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      deletedAt: document.deletedAt ?? undefined,
      isIndexed: document.isIndexed,
      indexedAt: document.indexedAt ?? undefined,
      expiresAt: document.expiresAt ?? undefined,
      isExpired: document.isExpired(),
      downloadUrl: this.generateDownloadUrl(document.id),
      previewUrl: this.isPreviewable(document.mimeType.value)
        ? this.generatePreviewUrl(document.id)
        : undefined,
      totalVersions: options.totalVersions,
      permissions: options.permissions,
    });
  }

  toPaginatedResponse(
    documents: Document[],
    total: number,
    page: number,
    limit: number,
    options: {
      permissionMap?: Map<
        string,
        { canEdit: boolean; canDelete: boolean; canVerify: boolean; canShare: boolean }
      >;
      uploaderNamesMap?: Map<string, string>;
      verifierNamesMap?: Map<string, string>;
      versionCountsMap?: Map<string, number>;
    } = {},
  ): PaginatedDocumentsResponseDto {
    const data = documents.map((doc) =>
      this.toResponseDto(doc, {
        uploaderName: options.uploaderNamesMap?.get(doc.uploaderId.value),
        verifierName: doc.verifiedBy
          ? options.verifierNamesMap?.get(doc.verifiedBy.value)
          : undefined,
        totalVersions: options.versionCountsMap?.get(doc.id.value),
        permissions: options.permissionMap?.get(doc.id.value),
      }),
    );

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

  toUploadResponseDto(document: Document): UploadDocumentResponseDto {
    return new UploadDocumentResponseDto({
      id: document.id.value,
      fileName: document.fileName.value,
      storagePath: document.storagePath.value,
      category: document.category.value,
      status: document.status.value,
      sizeBytes: document.fileSize.sizeInBytes,
      mimeType: document.mimeType.value,
      checksum: document.checksum?.value,
      uploaderId: document.uploaderId.value,
      createdAt: document.createdAt,
    });
  }

  toVerifyResponseDto(
    document: Document,
    verificationAttemptId: string,
  ): VerifyDocumentResponseDto {
    return new VerifyDocumentResponseDto({
      id: document.id.value,
      status: document.status.value,
      verifiedBy: document.verifiedBy?.value,
      verifiedAt: document.verifiedAt ?? undefined,
      documentNumber: document.documentNumber ?? undefined, // FIX: Convert null to undefined
      rejectionReason: document.rejectionReason?.value,
      verificationAttemptId,
    });
  }

  toUpdateResponseDto(document: Document): UpdateDocumentResponseDto {
    return new UpdateDocumentResponseDto({
      id: document.id.value,
      updatedAt: document.updatedAt,
      version: document.version,
    });
  }

  toAccessControlResponseDto(document: Document): AccessControlResponseDto {
    return new AccessControlResponseDto({
      documentId: document.id.value,
      isPublic: document.isPublic(),
      allowedViewers: document.allowedViewers.toArray().map((id) => id.value),
      updatedAt: document.updatedAt,
    });
  }

  // ============================================================================
  // REQUEST DTO TO DOMAIN PRIMITIVES
  // ============================================================================

  uploadDtoToCreationParams(
    dto: UploadDocumentDto,
    uploaderId: UserId,
    storageProvider: StorageProvider,
  ): Partial<{
    uploaderId: UserId;
    fileName: FileName;
    category: DocumentCategory;
    storageProvider: StorageProvider;
    assetId: AssetId;
    willId: WillId;
    identityForUserId: UserId;
    metadata: Record<string, unknown>;
    documentNumber: string;
    issueDate: Date;
    expiryDate: Date;
    issuingAuthority: string;
    isPublic: boolean;
    retentionPolicy: RetentionPolicy;
  }> {
    // FIX: Properly type the return value and use object spread to remove undefined values
    const params: Record<string, unknown> = {
      uploaderId,
      fileName: FileName.create(dto.fileName),
      category: DocumentCategory.create(dto.category),
      storageProvider,
    };

    // Only add optional fields if they have values
    if (dto.assetId) params.assetId = new AssetId(dto.assetId);
    if (dto.willId) params.willId = new WillId(dto.willId);
    if (dto.identityForUserId) params.identityForUserId = new UserId(dto.identityForUserId);
    if (dto.metadata) params.metadata = dto.metadata;
    if (dto.documentNumber) params.documentNumber = dto.documentNumber;
    if (dto.issueDate) params.issueDate = new Date(dto.issueDate);
    if (dto.expiryDate) params.expiryDate = new Date(dto.expiryDate);
    if (dto.issuingAuthority) params.issuingAuthority = dto.issuingAuthority;
    if (dto.isPublic !== undefined) params.isPublic = dto.isPublic;
    if (dto.retentionPolicy) params.retentionPolicy = RetentionPolicy.create(dto.retentionPolicy);

    return params as Partial<{
      uploaderId: UserId;
      fileName: FileName;
      category: DocumentCategory;
      storageProvider: StorageProvider;
      assetId: AssetId;
      willId: WillId;
      identityForUserId: UserId;
      metadata: Record<string, unknown>;
      documentNumber: string;
      issueDate: Date;
      expiryDate: Date;
      issuingAuthority: string;
      isPublic: boolean;
      retentionPolicy: RetentionPolicy;
    }>;
  }

  verifyDtoToCommandPayload(dto: VerifyDocumentDto): {
    reason?: RejectionReason;
    documentNumber?: string;
    extractedData?: Record<string, unknown>;
    verificationMetadata?: Record<string, unknown>;
  } {
    // FIX: Properly type the return value
    const payload: {
      reason?: RejectionReason;
      documentNumber?: string;
      extractedData?: Record<string, unknown>;
      verificationMetadata?: Record<string, unknown>;
    } = {};

    if (dto.reason) payload.reason = RejectionReason.create(dto.reason);
    if (dto.documentNumber) payload.documentNumber = dto.documentNumber;
    if (dto.extractedData) payload.extractedData = dto.extractedData;
    if (dto.verificationMetadata) payload.verificationMetadata = dto.verificationMetadata;

    return payload;
  }

  updateDtoToCommandPayload(dto: UpdateDocumentDto): {
    fileName?: FileName;
    documentNumber?: string;
    issueDate?: Date;
    expiryDate?: Date;
    issuingAuthority?: string;
    metadata?: Record<string, unknown>;
    isPublic?: boolean;
    allowedViewers?: UserId[];
  } {
    // FIX: Properly type the return value
    const payload: {
      fileName?: FileName;
      documentNumber?: string;
      issueDate?: Date;
      expiryDate?: Date;
      issuingAuthority?: string;
      metadata?: Record<string, unknown>;
      isPublic?: boolean;
      allowedViewers?: UserId[];
    } = {};

    if (dto.fileName) payload.fileName = FileName.create(dto.fileName);
    if (dto.documentNumber) payload.documentNumber = dto.documentNumber;
    if (dto.issueDate) payload.issueDate = new Date(dto.issueDate);
    if (dto.expiryDate) payload.expiryDate = new Date(dto.expiryDate);
    if (dto.issuingAuthority) payload.issuingAuthority = dto.issuingAuthority;
    if (dto.metadata) payload.metadata = dto.metadata;
    if (dto.isPublic !== undefined) payload.isPublic = dto.isPublic;
    if (dto.allowedViewers) payload.allowedViewers = dto.allowedViewers.map((id) => new UserId(id));

    return payload;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private generateDownloadUrl = (id: DocumentId) => `/api/v1/documents/${id.value}/download`;
  private generatePreviewUrl = (id: DocumentId) => `/api/v1/documents/${id.value}/preview`;
  private isPreviewable = (mimeType: string) =>
    ['application/pdf', 'image/jpeg', 'image/png'].includes(mimeType);
}
