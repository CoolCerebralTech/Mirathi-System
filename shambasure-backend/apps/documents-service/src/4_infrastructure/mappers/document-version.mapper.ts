import { DocumentVersion } from '../../3_domain/models/document-version.model';
import {
  DocumentVersionId,
  DocumentId,
  UserId,
  StoragePath,
  FileSize,
  MimeType,
  DocumentChecksum,
} from '../../3_domain/value-objects';
import {
  DocumentVersionEntity,
  CreateDocumentVersionEntity,
} from '../entities/document-version.entity';

/**
 * DocumentVersion Mapper - Handles Domain ↔ Persistence transformation
 *
 * RESPONSIBILITIES:
 * - Convert DocumentVersion entities to database records
 * - Rehydrate DocumentVersion entities from database
 * - Handle value object serialization/deserialization
 */
type DocumentVersionSummary = ReturnType<(typeof DocumentVersionMapper)['toSummary']>;

export class DocumentVersionMapper {
  /**
   * Converts Domain entity to Persistence entity (for CREATE)
   */
  static toPersistence(version: DocumentVersion): CreateDocumentVersionEntity {
    return {
      id: version.id.value,
      versionNumber: version.versionNumber,
      documentId: version.documentId.value,
      storagePath: version.storagePath.value,
      sizeBytes: version.fileSize.sizeInBytes,
      mimeType: version.mimeType.value,
      checksum: version.checksum?.value ?? null, // FIXED: Handle nullable checksum
      changeNote: version.changeNote,
      uploadedBy: version.uploadedBy.value,
    };
  }

  /**
   * Converts Persistence entity to Domain entity (for READ)
   */
  static toDomain(entity: DocumentVersionEntity): DocumentVersion {
    return DocumentVersion.fromPersistence({
      id: entity.id,
      versionNumber: entity.versionNumber,
      documentId: entity.documentId,
      storagePath: entity.storagePath,
      fileSize: entity.sizeBytes,
      mimeType: entity.mimeType,
      checksum: entity.checksum, // FIXED: Pass nullable value directly
      changeNote: entity.changeNote,
      uploadedBy: entity.uploadedBy,
      createdAt: entity.createdAt,
    });
  }

  /**
   * Converts multiple entities to domain entities (batch operation)
   */
  static toDomainMany(entities: DocumentVersionEntity[]): DocumentVersion[] {
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Converts multiple domain entities to persistence entities (batch operation)
   */
  static toPersistenceMany(versions: DocumentVersion[]): CreateDocumentVersionEntity[] {
    return versions.map((version) => this.toPersistence(version));
  }

  /**
   * Maps a version entity with minimal fields (for performance)
   */
  static toMinimalDomain(entity: {
    id: string;
    versionNumber: number;
    documentId: string;
    createdAt: Date;
  }): {
    id: DocumentVersionId;
    versionNumber: number;
    documentId: DocumentId;
    createdAt: Date;
  } {
    return {
      id: new DocumentVersionId(entity.id),
      versionNumber: entity.versionNumber,
      documentId: new DocumentId(entity.documentId),
      createdAt: entity.createdAt,
    };
  }

  /**
   * NEW: Creates a domain entity from creation parameters (without full domain object)
   * Useful for creating versions directly from upload data
   */
  static fromCreationParams(params: {
    documentId: DocumentId;
    versionNumber: number;
    storagePath: StoragePath;
    fileSize: FileSize;
    mimeType: MimeType;
    checksum?: DocumentChecksum;
    uploadedBy: UserId;
    changeNote?: string;
  }): DocumentVersion {
    return DocumentVersion.create({
      documentId: params.documentId,
      versionNumber: params.versionNumber,
      storagePath: params.storagePath,
      fileSize: params.fileSize,
      mimeType: params.mimeType,
      checksum: params.checksum,
      uploadedBy: params.uploadedBy,
      changeNote: params.changeNote,
    });
  }

  /**
   * NEW: Converts to a summary format for listing versions
   */
  static toSummary(version: DocumentVersion): {
    id: string;
    versionNumber: number;
    fileSize: number;
    mimeType: string;
    hasChecksum: boolean;
    changeNote: string | null;
    uploadedBy: string;
    createdAt: Date;
    isInitialVersion: boolean;
  } {
    return {
      id: version.id.value,
      versionNumber: version.versionNumber,
      fileSize: version.fileSize.sizeInBytes,
      mimeType: version.mimeType.value,
      hasChecksum: version.hasChecksum(),
      changeNote: version.changeNote,
      uploadedBy: version.uploadedBy.value,
      createdAt: version.createdAt,
      isInitialVersion: version.isInitialVersion(),
    };
  }

  /**
   * NEW: Converts multiple versions to summary format (for efficient listing)
   */
  static toSummaryMany(versions: DocumentVersion[]): Array<ReturnType<typeof this.toSummary>> {
    return versions.map((version) => this.toSummary(version));
  }

  /**
   * NEW: Creates a comparison result between two versions
   */
  static compareVersions(
    current: DocumentVersion,
    previous: DocumentVersion | null,
  ): {
    hasChanges: boolean;
    changes: {
      sizeChanged: boolean;
      mimeTypeChanged: boolean;
      checksumChanged: boolean;
      storagePathChanged: boolean;
    };
    currentSummary: DocumentVersionSummary;
    previousSummary: DocumentVersionSummary | null;
  } {
    const changes = {
      sizeChanged: previous ? !current.fileSize.equals(previous.fileSize) : false,
      mimeTypeChanged: previous ? !current.mimeType.equals(previous.mimeType) : false,
      checksumChanged: previous ? current.checksum?.value !== previous.checksum?.value : false,
      storagePathChanged: previous ? !current.storagePath.equals(previous.storagePath) : false,
    };

    return {
      hasChanges: Object.values(changes).some(Boolean),
      changes,
      currentSummary: this.toSummary(current),
      previousSummary: previous ? this.toSummary(previous) : null,
    };
  }

  /**
   * NEW: Validates if an entity can be mapped to domain (data integrity check)
   */
  static isValidEntity(entity: DocumentVersionEntity): boolean {
    return !!(
      entity.id &&
      entity.versionNumber > 0 &&
      entity.documentId &&
      entity.storagePath &&
      entity.sizeBytes >= 0 &&
      entity.mimeType &&
      entity.uploadedBy &&
      entity.createdAt
    );
  }

  /**
   * NEW: Gets the next version number based on existing versions
   */
  static getNextVersionNumber(existingVersions: DocumentVersion[]): number {
    if (existingVersions.length === 0) {
      return 1;
    }

    const maxVersion = Math.max(...existingVersions.map((v) => v.versionNumber));
    return maxVersion + 1;
  }

  /**
   * NEW: Creates a version entity for rollback operations
   */
  static createRollbackVersion(
    targetVersion: DocumentVersion,
    rolledBackBy: UserId,
    rollbackReason: string,
  ): DocumentVersion {
    return DocumentVersion.create({
      documentId: targetVersion.documentId,
      versionNumber: targetVersion.versionNumber + 1, // New version after rollback
      storagePath: targetVersion.storagePath,
      fileSize: targetVersion.fileSize,
      mimeType: targetVersion.mimeType,
      checksum: targetVersion.checksum ?? undefined,
      uploadedBy: rolledBackBy,
      changeNote: `Rollback to version ${targetVersion.versionNumber}: ${rollbackReason}`,
    });
  }

  /**
   * NEW: Extracts file information for download/display purposes
   */
  static toFileInfo(version: DocumentVersion): {
    fileName: string;
    fileSize: number;
    mimeType: string;
    checksum: string | null;
    storagePath: string;
    uploadedAt: Date;
  } {
    // Note: fileName would typically come from the parent document
    // This is a simplified version - in practice you might need the document context
    return {
      fileName: `document_version_${version.versionNumber}`,
      fileSize: version.fileSize.sizeInBytes,
      mimeType: version.mimeType.value,
      checksum: version.checksum?.value ?? null,
      storagePath: version.storagePath.value,
      uploadedAt: version.createdAt,
    };
  }
}
