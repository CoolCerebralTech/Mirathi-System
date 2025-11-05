import { Injectable } from '@nestjs/common';
import { Document } from '../../3_domain/models/document.model';
import {
  DocumentResponseDto,
  DocumentVersionResponseDto,
  DocumentVerificationAttemptResponseDto,
} from '../dtos/document-response.dto';
import { UploadDocumentResponseDto } from '../dtos/upload-document.dto';
import { VerifyDocumentResponseDto } from '../dtos/verify-document.dto';
import { UpdateDocumentResponseDto } from '../dtos/update-metadata.dto';
import { DocumentVersion } from '../../3_domain/models/document-version.model';
import { DocumentVerificationAttempt } from '../../3_domain/models/document-verification-attempt.model';
import {
  DocumentId,
  UserId,
  WillId,
  AssetId,
  DocumentCategory,
  DocumentStatus,
  StoragePath,
  FileMetadata,
  StorageProvider,
  AllowedViewers,
  RejectionReason,
} from '../../3_domain/value-objects';

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
      userPermissions?: { canEdit: boolean; canDelete: boolean };
      currentVersion?: DocumentVersion;
      totalVersions?: number;
    } = {},
  ): DocumentResponseDto {
    const {
      includeDownloadUrl = false,
      includePreviewUrl = false,
      userPermissions,
      currentVersion,
      totalVersions,
    } = options;

    const dto = new DocumentResponseDto({
      id: document.id.value,
      filename: document.fileMetadata.filename,
      storagePath: document.storagePath.value,
      mimeType: document.fileMetadata.mimeType.value,
      sizeBytes: document.fileMetadata.size.value,
      category: document.category.value,
      status: document.status.value,

      // Ownership & Upload Info
      uploaderId: document.uploaderId.value,
      uploaderName: document.uploaderName,

      // Verification Tracking
      verifiedBy: document.verifiedBy?.value,
      verifiedByName: document.verifiedByName,
      verifiedAt: document.verifiedAt,
      rejectionReason: document.rejectionReason?.value,

      // Cross-service References
      assetId: document.assetId?.value,
      willId: document.willId?.value,
      identityForUserId: document.identityForUserId?.value,

      // Metadata & Extended Properties
      metadata: document.metadata,
      documentNumber: document.documentNumber,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      issuingAuthority: document.issuingAuthority,

      // Security & Access Control
      isPublic: document.isPublic,
      encrypted: document.encrypted,
      allowedViewers: document.allowedViewers.userIds,
      storageProvider: document.storageProvider.value,
      checksum: document.fileMetadata.checksum.value,

      // System Timestamps
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      deletedAt: document.deletedAt,

      // Computed Properties
      canEdit: userPermissions?.canEdit,
      canDelete: userPermissions?.canDelete,

      // Version Information
      currentVersion: currentVersion?.versionNumber,
      totalVersions,
    });

    // Add URLs if requested
    if (includeDownloadUrl) {
      dto.downloadUrl = this.generateDownloadUrl(document);
    }

    if (includePreviewUrl) {
      dto.previewUrl = this.generatePreviewUrl(document);
    }

    // Add latest version if provided
    if (currentVersion) {
      dto.latestVersion = this.documentVersionToResponseDto(currentVersion, {
        includeDownloadUrl,
      });
    }

    return dto;
  }

  toUploadResponseDto(document: Document, downloadUrl?: string): UploadDocumentResponseDto {
    return new UploadDocumentResponseDto({
      id: document.id.value,
      filename: document.fileMetadata.filename,
      storagePath: document.storagePath.value,
      category: document.category.value,
      status: document.status.value,
      sizeBytes: document.fileMetadata.size.value,
      mimeType: document.fileMetadata.mimeType.value,
      checksum: document.fileMetadata.checksum.value,
      uploaderId: document.uploaderId.value,
      createdAt: document.createdAt,
      documentUrl: downloadUrl,
    });
  }

  toVerifyResponseDto(document: Document): VerifyDocumentResponseDto {
    return new VerifyDocumentResponseDto({
      id: document.id.value,
      status: document.status.value,
      verifiedBy: document.verifiedBy?.value,
      verifiedAt: document.verifiedAt,
      documentNumber: document.documentNumber,
      rejectionReason: document.rejectionReason?.value,
    });
  }

  toUpdateResponseDto(document: Document): UpdateDocumentResponseDto {
    return new UpdateDocumentResponseDto({
      id: document.id.value,
      filename: document.fileMetadata.filename,
      metadata: document.metadata,
      documentNumber: document.documentNumber,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      issuingAuthority: document.issuingAuthority,
      isPublic: document.isPublic,
      allowedViewers: document.allowedViewers.userIds,
      updatedAt: document.updatedAt,
    });
  }

  // ============================================================================
  // DOCUMENT VERSION MAPPING
  // ============================================================================

  documentVersionToResponseDto(
    version: DocumentVersion,
    options: { includeDownloadUrl?: boolean } = {},
  ): DocumentVersionResponseDto {
    const dto = new DocumentVersionResponseDto({
      id: version.id.value,
      versionNumber: version.versionNumber,
      documentId: version.documentId.value,
      storagePath: version.storagePath.value,
      filename: version.fileMetadata.filename,
      mimeType: version.fileMetadata.mimeType.value,
      sizeBytes: version.fileMetadata.size.value,
      checksum: version.fileMetadata.checksum.value,
      changeNote: version.changeNote,
      uploadedBy: version.uploadedBy.value,
      uploadedByName: version.uploadedByName,
      createdAt: version.createdAt,
      fileSizeHumanReadable: version.fileSizeHumanReadable,
    });

    if (options.includeDownloadUrl) {
      dto.downloadUrl = this.generateVersionDownloadUrl(version);
    }

    return dto;
  }

  // ============================================================================
  // VERIFICATION ATTEMPT MAPPING
  // ============================================================================

  verificationAttemptToResponseDto(
    attempt: DocumentVerificationAttempt,
  ): DocumentVerificationAttemptResponseDto {
    return new DocumentVerificationAttemptResponseDto({
      id: attempt.id.value,
      documentId: attempt.documentId.value,
      verifierId: attempt.verifierId.value,
      verifierName: attempt.verifierName,
      status: attempt.status.value,
      reason: attempt.reason?.value,
      metadata: attempt.metadata,
      createdAt: attempt.createdAt,
    });
  }

  // ============================================================================
  // BULK MAPPING
  // ============================================================================

  toResponseDtoList(
    documents: Document[],
    options: {
      includeDownloadUrl?: boolean;
      userPermissionsMap?: Map<string, { canEdit: boolean; canDelete: boolean }>;
      versionsMap?: Map<string, DocumentVersion>;
      versionCountsMap?: Map<string, number>;
    } = {},
  ): DocumentResponseDto[] {
    const {
      includeDownloadUrl = false,
      userPermissionsMap = new Map(),
      versionsMap = new Map(),
      versionCountsMap = new Map(),
    } = options;

    return documents.map((document) => {
      const documentId = document.id.value;
      const userPermissions = userPermissionsMap.get(documentId);
      const currentVersion = versionsMap.get(documentId);
      const totalVersions = versionCountsMap.get(documentId);

      return this.toResponseDto(document, {
        includeDownloadUrl,
        userPermissions,
        currentVersion,
        totalVersions,
      });
    });
  }

  documentVersionToResponseDtoList(
    versions: DocumentVersion[],
    options: { includeDownloadUrl?: boolean } = {},
  ): DocumentVersionResponseDto[] {
    return versions.map((version) => this.documentVersionToResponseDto(version, options));
  }

  verificationAttemptToResponseDtoList(
    attempts: DocumentVerificationAttempt[],
  ): DocumentVerificationAttemptResponseDto[] {
    return attempts.map((attempt) => this.verificationAttemptToResponseDto(attempt));
  }

  // ============================================================================
  // REQUEST DTO TO DOMAIN PARAMS
  // ============================================================================

  uploadDtoToCreateParams(
    dto: any, // Using any to avoid circular dependency with UploadDocumentDto
    uploaderId: string,
    uploaderName: string,
    fileMetadata: FileMetadata,
    storagePath: StoragePath,
  ) {
    return {
      id: new DocumentId(dto.id), // ID should be generated in service layer
      fileMetadata,
      storagePath,
      category: DocumentCategory.fromString(dto.category),
      uploaderId: new UserId(uploaderId),
      uploaderName,
      assetId: dto.assetId ? new AssetId(dto.assetId) : undefined,
      willId: dto.willId ? new WillId(dto.willId) : undefined,
      identityForUserId: dto.identityForUserId ? new UserId(dto.identityForUserId) : undefined,
      metadata: dto.metadata,
      documentNumber: dto.documentNumber,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      issuingAuthority: dto.issuingAuthority,
      isPublic: dto.isPublic || false,
      allowedViewers: dto.allowedViewers || [],
    };
  }

  verifyDtoToDomainParams(dto: any, verifierId: string, verifierName: string) {
    return {
      status: new DocumentStatus(dto.status),
      reason: dto.reason,
      documentNumber: dto.documentNumber,
      extractedData: dto.extractedData,
      verificationMetadata: dto.verificationMetadata,
      verifierId: new UserId(verifierId),
      verifierName,
    };
  }

  updateMetadataDtoToDomainParams(dto: any) {
    return {
      metadata: dto.metadata,
      documentNumber: dto.documentNumber,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      issuingAuthority: dto.issuingAuthority,
      customMetadata: dto.customMetadata,
      tags: dto.tags,
    };
  }

  updateAccessControlDtoToDomainParams(dto: any) {
    return {
      isPublic: dto.isPublic,
      allowedViewers: dto.allowedViewers || [],
    };
  }

  // ============================================================================
  // DOMAIN TO PAGINATED RESPONSE
  // ============================================================================

  toPaginatedResponseDto(
    documents: Document[],
    total: number,
    page: number,
    limit: number,
    options: {
      includeDownloadUrl?: boolean;
      userPermissionsMap?: Map<string, { canEdit: boolean; canDelete: boolean }>;
      versionsMap?: Map<string, DocumentVersion>;
      versionCountsMap?: Map<string, number>;
    } = {},
  ) {
    const data = this.toResponseDtoList(documents, options);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private generateDownloadUrl(document: Document): string {
    // In production, this would generate a signed URL
    return `/api/documents/${document.id.value}/download`;
  }

  private generatePreviewUrl(document: Document): string {
    // In production, this would generate a preview URL
    return `/api/documents/${document.id.value}/preview`;
  }

  private generateVersionDownloadUrl(version: DocumentVersion): string {
    return `/api/documents/${version.documentId.value}/versions/${version.versionNumber}/download`;
  }
}
