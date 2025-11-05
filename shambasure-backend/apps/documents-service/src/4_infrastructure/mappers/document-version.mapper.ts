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
      checksum: version.checksum.value,
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
      checksum: entity.checksum,
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
}
