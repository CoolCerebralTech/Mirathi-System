import { Document } from '../../3_domain/models/document.model';
import { DocumentEntity, CreateDocumentEntity } from '../entities/document.entity';

/**
 * Document Mapper - Handles Domain ↔ Persistence transformation
 *
 * RESPONSIBILITIES:
 * - Convert Domain aggregates to database entities
 * - Rehydrate Domain aggregates from database entities
 * - Handle value object serialization/deserialization
 * - Maintain data integrity during mapping
 */
export class DocumentMapper {
  /**
   * Converts Domain aggregate to Persistence entity (for CREATE/UPDATE)
   */
  static toPersistence(document: Document): CreateDocumentEntity {
    return {
      id: document.id.value,
      filename: document.fileName.value,
      storagePath: document.storagePath.value,
      mimeType: document.mimeType.value,
      sizeBytes: document.fileSize.sizeInBytes,
      checksum: document.checksum.value,
      category: document.category.value,
      status: document.status.value,

      uploaderId: document.uploaderId.value,

      verifiedBy: document.verifiedBy?.value ?? null,
      verifiedAt: document.verifiedAt,
      rejectionReason: document.rejectionReason?.value ?? null,

      assetId: document.assetId?.value ?? null,
      willId: document.willId?.value ?? null,
      identityForUserId: document.identityForUserId?.value ?? null,

      metadata: document.metadata,
      documentNumber: document.documentNumber,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      issuingAuthority: document.issuingAuthority,

      isPublic: document.isPublic(),
      encrypted: document.encrypted,
      allowedViewers: document.allowedViewers.toArray().map((id) => id.value),
      storageProvider: document.storageProvider.value,

      retentionPolicy: document.retentionPolicy,

      isIndexed: false,

      version: document.version,
    };
  }

  /**
   * Converts Persistence entity to Domain aggregate (for READ)
   */
  static toDomain(entity: DocumentEntity): Document {
    return Document.fromPersistence({
      id: entity.id,
      fileName: entity.filename,
      fileSize: entity.sizeBytes,
      mimeType: entity.mimeType,
      checksum: entity.checksum,
      storagePath: entity.storagePath,
      category: entity.category,
      status: entity.status,
      uploaderId: entity.uploaderId,
      verifiedBy: entity.verifiedBy,
      verifiedAt: entity.verifiedAt,
      rejectionReason: entity.rejectionReason,
      assetId: entity.assetId,
      willId: entity.willId,
      identityForUserId: entity.identityForUserId,
      metadata: entity.metadata,
      documentNumber: entity.documentNumber,
      issueDate: entity.issueDate,
      expiryDate: entity.expiryDate,
      issuingAuthority: entity.issuingAuthority,
      isPublic: entity.isPublic,
      encrypted: entity.encrypted,
      allowedViewers: entity.allowedViewers,
      storageProvider: entity.storageProvider,
      retentionPolicy: entity.retentionPolicy,
      version: entity.version,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
  }

  /**
   * Converts multiple entities to domain aggregates (batch operation)
   */
  static toDomainMany(entities: DocumentEntity[]): Document[] {
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Converts multiple domain aggregates to entities (batch operation)
   */
  static toPersistenceMany(documents: Document[]): CreateDocumentEntity[] {
    return documents.map((doc) => this.toPersistence(doc));
  }

  /**
   * Creates a partial update entity (for PATCH operations)
   */
  static toPartialUpdate(
    document: Document,
    fieldsToUpdate: Partial<Document>,
  ): Partial<CreateDocumentEntity> {
    const updates: Partial<CreateDocumentEntity> = {
      version: document.version, // Always include for optimistic locking
    };

    if (fieldsToUpdate.hasOwnProperty('status')) {
      updates.status = document.status.value;
      updates.verifiedBy = document.verifiedBy?.value ?? null;
      updates.verifiedAt = document.verifiedAt;
      updates.rejectionReason = document.rejectionReason?.value ?? null;
    }

    if (fieldsToUpdate.hasOwnProperty('metadata')) {
      updates.metadata = document.metadata;
    }

    if (fieldsToUpdate.hasOwnProperty('isPublic')) {
      updates.isPublic = document.isPublic();
    }

    if (fieldsToUpdate.hasOwnProperty('allowedViewers')) {
      updates.allowedViewers = document.allowedViewers.toArray().map((id) => id.value);
    }

    if (fieldsToUpdate.hasOwnProperty('deletedAt')) {
      updates.deletedAt = document.deletedAt;
    }

    return updates;
  }
}
