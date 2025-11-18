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

type RawDocumentVersionRow = {
  id: string;
  versionNumber: number;
  documentId: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  checksum: string | null;
  changeNote: string | null;
  uploadedBy: string;
  createdAt: Date;
};

type RawVerificationAttemptRow = {
  id: string;
  documentId: string;
  verifierId: string;
  status: string;
  reason: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
};

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
      checksum: document.checksum?.value ?? null,
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
  static toDomain(
    entity: DocumentEntity,
    versions: RawDocumentVersionRow[] = [],
    verificationAttempts: RawVerificationAttemptRow[] = [],
  ): Document {
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
      expiresAt: entity.expiresAt,
      isIndexed: entity.isIndexed,
      indexedAt: entity.indexedAt,
      version: entity.version,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
      versions: versions,
      verificationAttempts: verificationAttempts,
    });
  }

  /**
   * Converts multiple entities to domain aggregates (batch operation)
   */
  static toDomainMany(entities: DocumentEntity[]): Document[] {
    return entities.map((entity) => this.toDomain(entity, [], []));
  }

  /**
   * Converts multiple domain aggregates to entities (batch operation)
   */
  static toPersistenceMany(documents: Document[]): CreateDocumentEntity[] {
    return documents.map((doc) => this.toPersistence(doc));
  }

  /**
   * Converts a Document aggregate to data for Prisma update operation.
   */
  static toUpdateData(document: Document): UpdateDocumentData {
    // Step 1: serialize to persistence format
    const persistenceData = this.toPersistence(document);

    // Step 2: Create a shallow clone
    const updateData = { ...persistenceData } as Record<string, unknown>;

    // Step 3: Omit immutable/unwanted fields
    for (const key of ['id', 'uploaderId', 'createdAt']) {
      if (key in updateData) {
        delete updateData[key];
      }
    }

    // Step 4: Add system-managed fields
    return {
      ...updateData,
      updatedAt: new Date(),
    } as UpdateDocumentData;
  }

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
  static toSoftDeleteUpdate(document: Document): UpdateDocumentData {
    return {
      deletedAt: document.deletedAt,
      isPublic: document.isPublic(),
      allowedViewers: document.allowedViewers.toArray().map((id) => id.value),
      version: document.version,
      updatedAt: new Date(),
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
