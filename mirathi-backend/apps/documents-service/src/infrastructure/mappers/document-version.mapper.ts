import { DocumentVersion } from '../../domain/models/document-version.model';
import {
  CreateDocumentVersionEntity,
  DocumentVersionEntity,
} from '../entities/document-version.entity';

/**
 * DocumentVersion Mapper - Handles Domain ↔ Persistence transformation.
 *
 * This class is a stateless translator. It contains no business logic.
 * Its sole responsibility is to convert data between the domain model shape
 * and the persistence entity shape.
 */
export class DocumentVersionMapper {
  /**
   * Converts a DocumentVersion domain model (mutable or readonly)
   * to a persistence entity suitable for creation.
   */
  static toPersistence(version: Readonly<DocumentVersion>): CreateDocumentVersionEntity {
    return {
      id: version.id.value,
      versionNumber: version.versionNumber,
      documentId: version.documentId.value,
      storagePath: version.storagePath.value,
      sizeBytes: version.fileSize.sizeInBytes,
      mimeType: version.mimeType.value,
      checksum: version.checksum?.value ?? null,
      changeNote: version.changeNote,
      uploadedBy: version.uploadedBy.value,
    };
  }

  /**
   * Converts a raw persistence entity from the database into a DocumentVersion domain model.
   */
  static toDomain(entity: DocumentVersionEntity): DocumentVersion {
    // The fromPersistence factory in the domain model is the single source of truth
    // for reconstituting a valid domain object.
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
   * Converts an array of persistence entities to an array of domain models.
   */
  static toDomainMany(entities: readonly DocumentVersionEntity[]): DocumentVersion[] {
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Converts an array of domain models (mutable or readonly)
   * to an array of persistence entities.
   */
  static toPersistenceMany(
    versions: readonly Readonly<DocumentVersion>[],
  ): CreateDocumentVersionEntity[] {
    return versions.map((version) => this.toPersistence(version));
  }
}
