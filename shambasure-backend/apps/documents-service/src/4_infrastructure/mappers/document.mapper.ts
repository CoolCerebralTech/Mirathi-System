import { Document } from '../../3_domain/models/document.model';
import {
  DocumentEntity,
  CreateDocumentEntity,
  UpdateDocumentData,
} from '../entities/document.entity';
import { DocumentCategory, DocumentStatus } from '@shamba/common';
import {
  UserId,
  DocumentStatus as DomainDocumentStatus,
  RejectionReason,
} from '../../3_domain/value-objects';
import { Prisma } from '@prisma/client';

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
      checksum: document.checksum?.value ?? null, // FIXED: Handle nullable checksum
      category: document.category.value as DocumentCategory,
      status: document.status.value as DocumentStatus,

      uploaderId: document.uploaderId.value,

      verifiedBy: document.verifiedBy?.value ?? null,
      verifiedAt: document.verifiedAt,
      rejectionReason: document.rejectionReason?.value ?? null,

      assetId: document.assetId?.value ?? null,
      willId: document.willId?.value ?? null,
      identityForUserId: document.identityForUserId?.value ?? null,

      metadata: document.metadata === null ? Prisma.JsonNull : document.metadata,
      documentNumber: document.documentNumber,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      issuingAuthority: document.issuingAuthority,

      isPublic: document.isPublic(),
      encrypted: document.encrypted,
      allowedViewers: document.allowedViewers.toArray().map((id) => id.value),
      storageProvider: document.storageProvider.value,

      retentionPolicy: document.retentionPolicy?.value ?? null,
      expiresAt: document.expiresAt,

      isIndexed: document.isIndexed,

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
      checksum: entity.checksum, // FIXED: Pass nullable value directly
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
      metadata:
        typeof entity.metadata === 'object' &&
        entity.metadata !== null &&
        !Array.isArray(entity.metadata)
          ? (entity.metadata as Record<string, any>)
          : null,
      documentNumber: entity.documentNumber,
      issueDate: entity.issueDate,
      expiryDate: entity.expiryDate,
      issuingAuthority: entity.issuingAuthority,
      isPublic: entity.isPublic,
      encrypted: entity.encrypted,
      allowedViewers: entity.allowedViewers,
      storageProvider: entity.storageProvider,
      retentionPolicy: entity.retentionPolicy,
      expiresAt: entity.expiresAt, // NEW: Added missing field
      isIndexed: entity.isIndexed, // NEW: Added missing field
      indexedAt: entity.indexedAt, // NEW: Added missing field
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
   * Enhanced to handle all updatable fields with proper validation
   */
  static toPartialUpdate(
    document: Document,
    fieldsToUpdate: Partial<Document>,
  ): UpdateDocumentData {
    const updates: UpdateDocumentData = {
      version: document.version, // Always include for optimistic locking
      updatedAt: new Date(), // Always update the timestamp
    };

    // Status and verification fields
    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'status')) {
      updates.status = document.status.value;
      updates.verifiedBy = document.verifiedBy?.value ?? null;
      updates.verifiedAt = document.verifiedAt;
      updates.rejectionReason = document.rejectionReason?.value ?? null;
    }

    // File metadata fields
    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'fileName')) {
      updates.filename = document.fileName.value;
    }

    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'fileSize')) {
      updates.sizeBytes = document.fileSize.sizeInBytes;
    }

    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'mimeType')) {
      updates.mimeType = document.mimeType.value;
    }

    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'checksum')) {
      updates.checksum = document.checksum?.value ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'storagePath')) {
      updates.storagePath = document.storagePath.value;
    }

    // Document details
    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'metadata')) {
      updates.metadata = document.metadata === null ? Prisma.JsonNull : document.metadata;
    }

    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'documentNumber')) {
      updates.documentNumber = document.documentNumber;
    }

    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'issueDate')) {
      updates.issueDate = document.issueDate;
    }

    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'expiryDate')) {
      updates.expiryDate = document.expiryDate;
    }

    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'issuingAuthority')) {
      updates.issuingAuthority = document.issuingAuthority;
    }

    // Security and access control
    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'isPublic')) {
      updates.isPublic = document.isPublic();
    }

    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'encrypted')) {
      updates.encrypted = document.encrypted;
    }

    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'allowedViewers')) {
      updates.allowedViewers = document.allowedViewers.toArray().map((id) => id.value);
    }

    // Retention and lifecycle
    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'retentionPolicy')) {
      updates.retentionPolicy = document.retentionPolicy?.value ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'expiresAt')) {
      updates.expiresAt = document.expiresAt;
    }

    // Indexing state
    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'isIndexed')) {
      updates.isIndexed = document.isIndexed;
      updates.indexedAt = document.indexedAt;
    }

    // Deletion state
    if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'deletedAt')) {
      updates.deletedAt = document.deletedAt;
    }

    return updates;
  }

  /**
   * NEW: Creates update data for specific business operations
   */

  /**
   * Creates update data for verification operations
   */
  static toVerificationUpdate(
    document: Document,
    verifiedBy: UserId,
    status: DomainDocumentStatus,
    rejectionReason?: RejectionReason,
  ): UpdateDocumentData {
    return {
      status: status.value,
      verifiedBy: verifiedBy.value,
      verifiedAt: new Date(),
      rejectionReason: rejectionReason?.value ?? null,
      version: document.version,
      updatedAt: new Date(),
    };
  }

  /**
   * Creates update data for soft deletion
   */
  static toSoftDeleteUpdate(document: Document, _deletedBy: UserId): UpdateDocumentData {
    void _deletedBy;

    return {
      deletedAt: new Date(),
      version: document.version,
      updatedAt: new Date(),
      isPublic: false,
      allowedViewers: [],
    };
  }

  /**
   * Creates update data for restoration
   */
  static toRestoreUpdate(document: Document): UpdateDocumentData {
    return {
      deletedAt: null,
      version: document.version,
      updatedAt: new Date(),
    };
  }

  /**
   * Creates update data for indexing operations
   */
  static toIndexingUpdate(document: Document, isIndexed: boolean): UpdateDocumentData {
    return {
      isIndexed,
      indexedAt: isIndexed ? new Date() : null,
      version: document.version,
      updatedAt: new Date(),
    };
  }

  /**
   * NEW: Validation and helper methods
   */

  /**
   * Validates if an entity can be mapped to domain (data integrity check)
   */
  static isValidEntity(entity: DocumentEntity): boolean {
    return !!(
      entity.id &&
      entity.filename &&
      entity.storagePath &&
      entity.mimeType &&
      entity.sizeBytes > 0 &&
      entity.category &&
      entity.status &&
      entity.uploaderId &&
      entity.createdAt
    );
  }

  /**
   * Gets the list of fields that changed between two domain objects
   * Useful for audit logging and optimized updates
   */
  static getChangedFields(before: Document, after: Document): string[] {
    const changedFields: string[] = [];

    // Compare all gettable properties
    if (!before.fileName.equals(after.fileName)) changedFields.push('fileName');
    if (!before.fileSize.equals(after.fileSize)) changedFields.push('fileSize');
    if (!before.mimeType.equals(after.mimeType)) changedFields.push('mimeType');
    if (before.checksum?.value !== after.checksum?.value) changedFields.push('checksum');
    if (!before.status.equals(after.status)) changedFields.push('status');
    if (before.verifiedBy?.value !== after.verifiedBy?.value) changedFields.push('verifiedBy');
    if (before.verifiedAt?.getTime() !== after.verifiedAt?.getTime())
      changedFields.push('verifiedAt');
    if (before.rejectionReason?.value !== after.rejectionReason?.value)
      changedFields.push('rejectionReason');
    if (before.isPublic() !== after.isPublic()) changedFields.push('isPublic');
    if (!before.allowedViewers.equals(after.allowedViewers)) changedFields.push('allowedViewers');
    if (before.retentionPolicy?.value !== after.retentionPolicy?.value)
      changedFields.push('retentionPolicy');
    if (before.expiresAt?.getTime() !== after.expiresAt?.getTime()) changedFields.push('expiresAt');
    if (before.isIndexed !== after.isIndexed) changedFields.push('isIndexed');
    if (before.deletedAt?.getTime() !== after.deletedAt?.getTime()) changedFields.push('deletedAt');

    return changedFields;
  }
}
