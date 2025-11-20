import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { Prisma } from '@prisma/client';

import { IDocumentRepository } from '../../domain/interfaces';
import { Document } from '../../domain/models';
import { DocumentId } from '../../domain/value-objects';
import { DocumentMapper } from '../mappers/document.mapper';
import { DocumentVersionMapper } from '../mappers/document-version.mapper';
import { DocumentVerificationAttemptMapper } from '../mappers/document-verification.mapper';

import { DocumentEntity } from '../entities/document.entity';
import { DocumentVersionEntity } from '../entities/document-version.entity';
import { DocumentVerificationAttemptEntity } from '../entities/document-verification.entity';

// This type precisely defines the shape of the data returned by Prisma's `include` query.
type FullDocumentEntity = DocumentEntity & {
  versions: DocumentVersionEntity[];
  verificationAttempts: DocumentVerificationAttemptEntity[];
};
// ============================================================================
// Repository-Specific Errors
// ============================================================================

export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export class DocumentNotFoundError extends RepositoryError {
  constructor(documentId: DocumentId) {
    super(`Document with ID '${documentId.value}' was not found.`);
    this.name = 'DocumentNotFoundError';
  }
}

export class OptimisticLockError extends RepositoryError {
  constructor(documentId: DocumentId, expectedVersion: number, actualVersion: number | undefined) {
    super(
      `Optimistic lock failed for document ${documentId.value}. Expected version ${expectedVersion}, but found ${actualVersion ?? 'unknown'}. The data has been modified by another process.`,
    );
    this.name = 'OptimisticLockError';
  }
}

export class DocumentSaveError extends RepositoryError {
  constructor(documentId: DocumentId, cause?: unknown) {
    super(`Failed to save document ${documentId.value}`, cause);
    this.name = 'DocumentSaveError';
  }
}

// ============================================================================
// Prisma Document Repository (Command Side - Pure CQRS)
// ============================================================================

@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
  private readonly logger = new Logger(PrismaDocumentRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a new unique identity for a Document aggregate.
   */
  public nextIdentity(): DocumentId {
    return DocumentId.generate();
  }

  /**
   * Saves a single Document aggregate with full transaction support and optimistic locking.
   * This persists the entire aggregate including all child entities and domain events.
   */
  async save(document: Document): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.saveDocumentAggregate(tx, document);
      });

      document.clearDomainEvents();
      this.logger.debug(`Successfully saved document: ${document.id.value}`);
    } catch (error) {
      this.logger.error(`Failed to save document ${document.id.value}`, error);
      throw new DocumentSaveError(document.id, error);
    }
  }

  /**
   * Saves multiple Document aggregates within a single atomic transaction.
   * All documents are saved or none are saved (rollback on any failure).
   */
  async saveMany(documents: Document[]): Promise<void> {
    if (documents.length === 0) {
      return;
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const document of documents) {
          await this.saveDocumentAggregate(tx, document);
        }
      });

      // Clear domain events only after successful transaction
      documents.forEach((doc) => doc.clearDomainEvents());
      this.logger.debug(`Successfully saved ${documents.length} documents in transaction`);
    } catch (error) {
      this.logger.error(`Failed to save ${documents.length} documents in transaction`, error);
      throw new RepositoryError(`Failed to save documents in transaction`, error);
    }
  }

  /**
   * Finds a single Document aggregate by its ID with all child entities loaded.
   * Returns null if document is not found or soft-deleted.
   */
  async findById(id: DocumentId): Promise<Document | null> {
    try {
      const entity = await this.prisma.document.findUnique({
        where: {
          id: id.value,
          deletedAt: null, // Exclude soft-deleted documents
        },
        include: {
          versions: {
            orderBy: { versionNumber: 'asc' },
          },
          verificationAttempts: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!entity) {
        return null;
      }

      return this.reconstituteAggregate(entity as FullDocumentEntity);
    } catch (error) {
      this.logger.error(`Failed to find document by ID ${id.value}`, error);
      throw new RepositoryError(`Failed to find document by ID ${id.value}`, error);
    }
  }

  /**
   * Finds multiple Document aggregates by their IDs in a single query.
   * Only returns non-deleted documents.
   */
  async findByIds(ids: DocumentId[]): Promise<Document[]> {
    if (ids.length === 0) {
      return [];
    }

    try {
      const idValues = ids.map((id) => id.value);
      const entities = await this.prisma.document.findMany({
        where: {
          id: { in: idValues },
          deletedAt: null,
        },
        include: {
          versions: { orderBy: { versionNumber: 'asc' } },
          verificationAttempts: { orderBy: { createdAt: 'asc' } },
        },
      });

      return entities.map((entity) => this.reconstituteAggregate(entity as FullDocumentEntity));
    } catch (error) {
      this.logger.error(`Failed to find documents by IDs`, error);
      throw new RepositoryError(`Failed to find documents by IDs`, error);
    }
  }

  /**
   * Permanently deletes a Document and all its related records from the database.
   * WARNING: This is a hard delete for GDPR/compliance purposes only.
   */
  async hardDelete(id: DocumentId): Promise<void> {
    try {
      // Use transaction to ensure all related records are deleted
      await this.prisma.$transaction(async (tx) => {
        // Delete child entities first to maintain referential integrity
        await tx.documentVersion.deleteMany({
          where: { documentId: id.value },
        });

        await tx.documentVerificationAttempt.deleteMany({
          where: { documentId: id.value },
        });

        // Delete the root aggregate
        await tx.document.delete({
          where: { id: id.value },
        });
      });

      this.logger.log(`Hard-deleted document and all related records: ${id.value}`);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new DocumentNotFoundError(id);
        }
        if (error.code === 'P2003') {
          this.logger.error(
            `Foreign key constraint violation while hard-deleting document ${id.value}`,
            error,
          );
          throw new RepositoryError(
            `Cannot hard-delete document ${id.value} due to existing references`,
            error,
          );
        }
      }

      this.logger.error(`Failed to hard-delete document ${id.value}`, error);
      throw new RepositoryError(`Failed to hard-delete document ${id.value}`, error);
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Core method to save a single document aggregate with proper optimistic locking.
   */
  private async saveDocumentAggregate(
    tx: Prisma.TransactionClient,
    document: Document,
  ): Promise<void> {
    const isNew = document.version === 1;

    if (isNew) {
      await this.createDocumentAggregate(tx, document);
    } else {
      await this.updateDocumentAggregate(tx, document);
    }
  }

  /**
   * Creates a new document aggregate with all child entities.
   */
  private async createDocumentAggregate(
    tx: Prisma.TransactionClient,
    document: Document,
  ): Promise<void> {
    const documentData = DocumentMapper.toPersistence(document);
    const versionsData = document.versions.map((version) =>
      DocumentVersionMapper.toPersistence(version),
    );
    const attemptsData = document.verificationAttempts.map((attempt) =>
      DocumentVerificationAttemptMapper.toPersistence(attempt),
    );

    try {
      await tx.document.create({
        data: {
          ...documentData,
          versions: {
            create: versionsData,
          },
          verificationAttempts: {
            create: attemptsData,
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new RepositoryError(`Document with ID ${document.id.value} already exists`, error);
        }
      }
      throw error;
    }
  }

  /**
   * Updates an existing document aggregate with optimistic locking.
   */
  private async updateDocumentAggregate(
    tx: Prisma.TransactionClient,
    document: Document,
  ): Promise<void> {
    // First, update the root document with optimistic locking
    const updateData = DocumentMapper.toUpdateData(document);

    const result = await tx.document.updateMany({
      where: {
        id: document.id.value,
        version: document.version - 1, // Optimistic lock check
      },
      data: updateData,
    });

    if (result.count === 0) {
      // Check current version for better error message
      const current = await tx.document.findUnique({
        where: { id: document.id.value },
        select: { version: true },
      });

      throw new OptimisticLockError(document.id, document.version - 1, current?.version);
    }

    // Then, save any new child entities
    await this.saveNewChildEntities(tx, document);
  }

  /**
   * Saves new child entities that were added to the aggregate.
   */
  private async saveNewChildEntities(
    tx: Prisma.TransactionClient,
    document: Document,
  ): Promise<void> {
    // Get existing child entity IDs to determine what's new
    const [existingVersionIds, existingAttemptIds] = await Promise.all([
      tx.documentVersion
        .findMany({
          where: { documentId: document.id.value },
          select: { id: true },
        })
        .then((versions) => versions.map((v) => v.id)),

      tx.documentVerificationAttempt
        .findMany({
          where: { documentId: document.id.value },
          select: { id: true },
        })
        .then((attempts) => attempts.map((a) => a.id)),
    ]);

    // Save new versions
    const newVersions = document.versions.filter(
      (version) => !existingVersionIds.includes(version.id.value),
    );

    if (newVersions.length > 0) {
      await tx.documentVersion.createMany({
        data: newVersions.map((version) => DocumentVersionMapper.toPersistence(version)),
      });
    }

    // Save new verification attempts
    const newAttempts = document.verificationAttempts.filter(
      (attempt) => !existingAttemptIds.includes(attempt.id.value),
    );

    if (newAttempts.length > 0) {
      await tx.documentVerificationAttempt.createMany({
        data: newAttempts.map((attempt) =>
          DocumentVerificationAttemptMapper.toPersistence(attempt),
        ),
      });
    }
  }

  /**
   * Reconstitutes a Document aggregate from a complete persistence entity with relations.
   */
  private reconstituteAggregate(entity: FullDocumentEntity): Document {
    const versionsForMapper = entity.versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      documentId: v.documentId,
      storagePath: v.storagePath,
      fileSize: v.sizeBytes,
      mimeType: v.mimeType,
      checksum: v.checksum,
      changeNote: v.changeNote,
      uploadedBy: v.uploadedBy,
      createdAt: v.createdAt,
    }));

    const attemptsForMapper = entity.verificationAttempts.map((a) => ({
      id: a.id,
      documentId: a.documentId,
      verifierId: a.verifierId,
      status: a.status,
      reason: a.reason,
      metadata: a.metadata as Record<string, any> | null,
      createdAt: a.createdAt,
    }));

    // Now we call the mapper with the correctly shaped data.
    return DocumentMapper.toDomain(entity, versionsForMapper, attemptsForMapper);
  }
}
