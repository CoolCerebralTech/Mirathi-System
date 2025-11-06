import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { Prisma } from '@prisma/client';

import {
  IDocumentRepository,
  FindDocumentsFilters,
  PaginationOptions,
  PaginatedResult,
  DocumentSearchOptions,
  DocumentStats,
  BulkOperationResult,
  ExpiringDocument,
} from '../../3_domain/interfaces';
import { Document } from '../../3_domain/models/document.model';
import { ConcurrentModificationError } from '../../3_domain/models/document.model';
import { DocumentId, UserId, WillId, AssetId, DocumentStatus } from '../../3_domain/value-objects';
import { DocumentMapper } from '../mappers/document.mapper';
import { DocumentEntity } from '../entities/document.entity';

/**
 * Repository-specific errors
 */
export class RepositoryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'RepositoryError';
  }
}

export class DocumentNotFoundError extends RepositoryError {
  constructor(documentId: DocumentId) {
    super(`Document not found: ${documentId.value}`);
    this.name = 'DocumentNotFoundError';
  }
}

export class OptimisticLockError extends RepositoryError {
  constructor(documentId: DocumentId, expectedVersion: number, actualVersion: number) {
    super(
      `Optimistic lock failed for document ${documentId.value}. Expected version ${expectedVersion}, found ${actualVersion}`,
    );
    this.name = 'OptimisticLockError';
  }
}

/**
 * Production-ready Prisma implementation of IDocumentRepository.
 */
@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
  private readonly logger = new Logger(PrismaDocumentRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // CORE PERSISTENCE
  // ============================================================================

  async save(document: Document): Promise<void> {
    try {
      const isNew = document.version === 1;

      if (isNew) {
        // The createData payload from the corrected mapper is now type-compatible.
        const createData = DocumentMapper.toPersistence(document);
        await this.prisma.document.create({
          data: createData,
        });
        this.logger.debug(`Created new document: ${document.id.value}`);
      } else {
        const updateData = DocumentMapper.toPersistence(document);
        // Destructure to remove fields that should not be in the update payload
        const { ...dataToUpdate } = updateData;

        // Use 'updateMany' as it allows non-unique fields in its 'where' clause.
        const result = await this.prisma.document.updateMany({
          where: {
            id: document.id.value,
            version: document.version - 1, // Optimistic locking check
          },
          data: {
            ...dataToUpdate,
            version: document.version, // Increment the version
            updatedAt: new Date(),
          },
        });

        // If count is 0, the lock failed or the document was deleted.
        if (result.count === 0) {
          const exists = await this.prisma.document.count({ where: { id: document.id.value } });
          if (exists === 0) {
            throw new DocumentNotFoundError(document.id);
          } else {
            throw new ConcurrentModificationError();
          }
        }
        this.logger.debug(`Updated document: ${document.id.value} to version ${document.version}`);
      }
    } catch (error) {
      // Re-throw our specific domain errors directly
      if (error instanceof ConcurrentModificationError || error instanceof DocumentNotFoundError) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle unique constraint violation on create
        if (error.code === 'P2002') {
          throw new RepositoryError('Document with this ID already exists', error);
        }
      }

      // Apply robust, type-safe error handling for all other cases
      if (error instanceof Error) {
        this.logger.error(
          `Failed to save document ${document.id.value}: ${error.message}`,
          error.stack,
        );
        throw new RepositoryError('Failed to save document', error);
      }
      throw new RepositoryError(
        `An unknown error occurred while saving document ${document.id.value}`,
      );
    }
  }

  async findById(id: DocumentId, includeDeleted = false): Promise<Document | null> {
    try {
      const where: Prisma.DocumentWhereInput = { id: id.value };
      if (!includeDeleted) {
        where.deletedAt = null;
      }

      const entity = await this.prisma.document.findFirst({
        where,
      });

      if (!entity) return null;

      // FIXED: Added validation before mapping
      if (!DocumentMapper.isValidEntity(entity as DocumentEntity)) {
        this.logger.warn(`Invalid document entity found for ID: ${id.value}`);
        return null;
      }

      return DocumentMapper.toDomain(entity as DocumentEntity);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find document by ID: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to find document by ID', error);
      }
      throw new RepositoryError('An unknown error occurred while finding a document by ID');
    }
  }

  async findMany(
    filters: FindDocumentsFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Document>> {
    try {
      const where = this.buildWhereClause(filters);
      const page = Math.max(1, pagination.page ?? 1);
      const limit = Math.min(Math.max(1, pagination.limit ?? 20), 100); // FIXED: Better limits
      const skip = (page - 1) * limit;
      const orderBy = this.buildOrderBy(pagination);

      const [entities, total] = await this.prisma.$transaction([
        this.prisma.document.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        }),
        this.prisma.document.count({ where }),
      ]);

      // FIXED: Filter out invalid entities and log warnings
      const validEntities = entities.filter((entity) =>
        DocumentMapper.isValidEntity(entity as DocumentEntity),
      );

      if (validEntities.length !== entities.length) {
        this.logger.warn(
          `Filtered out ${entities.length - validEntities.length} invalid documents from findMany results`,
        );
      }

      const documents = DocumentMapper.toDomainMany(validEntities as DocumentEntity[]);
      const totalPages = Math.ceil(total / limit);

      return {
        data: documents,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find documents: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to find documents', error);
      }
      throw new RepositoryError('An unknown error occurred while finding documents');
    }
  }

  async search(
    options: DocumentSearchOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Document>> {
    try {
      const where = this.buildSearchWhereClause(options);
      const page = Math.max(1, pagination.page ?? 1);
      const limit = Math.min(Math.max(1, pagination.limit ?? 20), 100);
      const skip = (page - 1) * limit;
      const orderBy = this.buildOrderBy(pagination);

      const [entities, total] = await this.prisma.$transaction([
        this.prisma.document.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        }),
        this.prisma.document.count({ where }),
      ]);

      // FIXED: Filter invalid entities in search too
      const validEntities = entities.filter((entity) =>
        DocumentMapper.isValidEntity(entity as DocumentEntity),
      );

      const documents = DocumentMapper.toDomainMany(validEntities as DocumentEntity[]);
      const totalPages = Math.ceil(total / limit);

      return {
        data: documents,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to search documents: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to search documents', error);
      }
      throw new RepositoryError('An unknown error occurred while searching documents');
    }
  }

  // ============================================================================
  // SPECIALIZED FINDERS
  // ============================================================================

  async findByUploaderId(
    uploaderId: UserId,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Document>> {
    return this.findMany({ uploaderId, includeDeleted: false }, pagination);
  }

  async findByAssetId(assetId: AssetId): Promise<Document[]> {
    try {
      const entities = await this.prisma.document.findMany({
        where: {
          assetId: assetId.value,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      const validEntities = entities.filter((entity) =>
        DocumentMapper.isValidEntity(entity as DocumentEntity),
      );

      return DocumentMapper.toDomainMany(validEntities as DocumentEntity[]);
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to find documents by asset ID: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to find documents by asset', error);
      }
      throw new RepositoryError('An unknown error occurred while finding documents by asset ID');
    }
  }

  async findByWillId(willId: WillId): Promise<Document[]> {
    try {
      const entities = await this.prisma.document.findMany({
        where: {
          willId: willId.value,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      const validEntities = entities.filter((entity) =>
        DocumentMapper.isValidEntity(entity as DocumentEntity),
      );

      return DocumentMapper.toDomainMany(validEntities as DocumentEntity[]);
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to find documents by will ID: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to find documents by will', error);
      }
      throw new RepositoryError('An unknown error occurred while finding documents by will ID');
    }
  }

  async findIdentityDocuments(userId: UserId): Promise<Document[]> {
    try {
      const entities = await this.prisma.document.findMany({
        where: {
          identityForUserId: userId.value,
          deletedAt: null,
          category: 'IDENTITY_PROOF', // FIXED: Use correct enum value
        },
        orderBy: { createdAt: 'desc' },
      });

      const validEntities = entities.filter((entity) =>
        DocumentMapper.isValidEntity(entity as DocumentEntity),
      );

      return DocumentMapper.toDomainMany(validEntities as DocumentEntity[]);
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to find identity documents: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to find identity documents', error);
      }
      throw new RepositoryError('An unknown error occurred while finding identity documents');
    }
  }

  async findPendingVerification(pagination: PaginationOptions): Promise<PaginatedResult<Document>> {
    return this.findMany(
      {
        status: DocumentStatus.createPending(),
        includeDeleted: false,
      },
      pagination,
    );
  }

  async findByIds(ids: DocumentId[]): Promise<Document[]> {
    try {
      const idValues = ids.map((id) => id.value);

      const entities = await this.prisma.document.findMany({
        where: {
          id: { in: idValues },
          deletedAt: null,
        },
      });

      const validEntities = entities.filter((entity) =>
        DocumentMapper.isValidEntity(entity as DocumentEntity),
      );

      // FIXED: Preserve order of requested IDs
      const documentMap = new Map(
        validEntities.map((entity) => [
          entity.id,
          DocumentMapper.toDomain(entity as DocumentEntity),
        ]),
      );

      return ids
        .map((id) => documentMap.get(id.value))
        .filter((doc): doc is Document => doc !== undefined);
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to find documents by IDs: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to find documents by IDs', error);
      }
      throw new RepositoryError('An unknown error occurred while finding documents by IDs');
    }
  }

  async findExpiringSoon(withinDays: number): Promise<ExpiringDocument[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + withinDays);

      const entities = await this.prisma.document.findMany({
        where: {
          expiresAt: {
            // FIXED: Use expiresAt (retention) not expiryDate (document expiry)
            lte: futureDate,
            gte: new Date(),
          },
          deletedAt: null,
        },
        orderBy: { expiresAt: 'asc' },
        select: {
          id: true,
          filename: true,
          expiresAt: true, // FIXED: Use expiresAt
          uploaderId: true,
        },
      });

      return entities.map((entity) => ({
        id: new DocumentId(entity.id),
        fileName: entity.filename,
        expiryDate: entity.expiresAt!, // FIXED: Use expiresAt
        uploaderId: new UserId(entity.uploaderId),
        daysUntilExpiry: Math.ceil(
          (entity.expiresAt!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        ),
      }));
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to find expiring documents: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to find expiring documents', error);
      }
      throw new RepositoryError('An unknown error occurred while finding expiring documents');
    }
  }

  async findExpired(): Promise<Document[]> {
    try {
      const entities = await this.prisma.document.findMany({
        where: {
          expiresAt: {
            // FIXED: Use expiresAt (retention) not expiryDate (document expiry)
            lt: new Date(),
          },
          deletedAt: null,
        },
        orderBy: { expiresAt: 'desc' },
      });

      const validEntities = entities.filter((entity) =>
        DocumentMapper.isValidEntity(entity as DocumentEntity),
      );

      return DocumentMapper.toDomainMany(validEntities as DocumentEntity[]);
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to find expired documents: am an error`, error.stack);
        throw new RepositoryError('Failed to find expired documents', error);
      }
      throw new RepositoryError('An unknown error occurred while finding expired documents');
    }
  }

  async findAccessibleByUser(
    userId: UserId,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Document>> {
    try {
      const page = Math.max(1, pagination.page ?? 1);
      const limit = Math.min(Math.max(1, pagination.limit ?? 20), 100);
      const skip = (page - 1) * limit;

      const where = {
        deletedAt: null,
        OR: [
          { uploaderId: userId.value },
          { isPublic: true },
          { allowedViewers: { has: userId.value } },
        ],
      };

      const [entities, total] = await Promise.all([
        this.prisma.document.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.document.count({ where }),
      ]);

      const validEntities = entities.filter((entity) =>
        DocumentMapper.isValidEntity(entity as DocumentEntity),
      );

      const documents = DocumentMapper.toDomainMany(validEntities as DocumentEntity[]);
      const totalPages = Math.ceil(total / limit);

      return {
        data: documents,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to find accessible documents: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to find accessible documents', error);
      }
      throw new RepositoryError('An unknown error occurred while finding accessible documents');
    }
  }

  async findByRetentionPolicy(policy: string): Promise<Document[]> {
    try {
      const entities = await this.prisma.document.findMany({
        where: {
          retentionPolicy: policy,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      const validEntities = entities.filter((entity) =>
        DocumentMapper.isValidEntity(entity as DocumentEntity),
      );

      return DocumentMapper.toDomainMany(validEntities as DocumentEntity[]);
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(
          `Failed to find documents by retention policy: ${error.message}`,
          error.stack,
        );
        throw new RepositoryError('Failed to find documents by retention policy', error);
      }
      throw new RepositoryError(
        'An unknown error occurred while finding documents by retention policy',
      );
    }
  }

  // ============================================================================
  // BULK OPERATIONS (CONTINUED)
  // ============================================================================

  async softDeleteMany(ids: DocumentId[], deletedBy: UserId): Promise<BulkOperationResult> {
    try {
      const now = new Date();
      const idValues = ids.map((id) => id.value);

      // FIXED: Use transaction for consistency and better error handling
      const result = await this.prisma.$transaction(async (tx) => {
        // First, check which documents exist and are not already deleted
        const existingDocs = await tx.document.findMany({
          where: {
            id: { in: idValues },
            deletedAt: null,
          },
          select: { id: true },
        });

        const existingIds = existingDocs.map((doc) => doc.id);

        if (existingIds.length > 0) {
          await tx.document.updateMany({
            where: {
              id: { in: existingIds },
            },
            data: {
              deletedAt: now,
              updatedAt: now,
              isPublic: false, // FIXED: Remove public access on deletion
              allowedViewers: [], // FIXED: Clear shared access on deletion
            },
          });
        }

        return {
          successCount: existingIds.length,
          failedCount: idValues.length - existingIds.length,
          existingIds,
        };
      });

      const errors = ids
        .filter((id) => !result.existingIds.includes(id.value))
        .map((id) => ({ id: id.value, error: 'Document not found or already deleted' }));

      this.logger.log(`Soft deleted ${result.successCount} documents by ${deletedBy.value}`);

      return {
        successCount: result.successCount,
        failedCount: result.failedCount,
        errors,
      };
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to soft delete documents: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to soft delete documents', error);
      }
      throw new RepositoryError('An unknown error occurred while soft deleting documents');
    }
  }

  async updateStatusMany(
    ids: DocumentId[],
    newStatus: DocumentStatus,
    updatedBy: UserId,
  ): Promise<BulkOperationResult> {
    try {
      const now = new Date();
      const idValues = ids.map((id) => id.value);

      const result = await this.prisma.$transaction(async (tx) => {
        const existingDocs = await tx.document.findMany({
          where: {
            id: { in: idValues },
            deletedAt: null,
          },
          select: { id: true },
        });

        const existingIds = existingDocs.map((doc) => doc.id);

        if (existingIds.length > 0) {
          await tx.document.updateMany({
            where: {
              id: { in: existingIds },
            },
            data: {
              status: newStatus.value,
              updatedAt: now,
              // FIXED: Set verification fields when status changes to verified/rejected
              ...(newStatus.isVerified() && {
                verifiedBy: updatedBy.value,
                verifiedAt: now,
                rejectionReason: null,
              }),
              ...(newStatus.isRejected() && {
                verifiedBy: updatedBy.value,
                verifiedAt: now,
                // Note: rejectionReason would need to be provided separately
              }),
            },
          });
        }

        return {
          successCount: existingIds.length,
          failedCount: idValues.length - existingIds.length,
          existingIds,
        };
      });

      const errors = ids
        .filter((id) => !result.existingIds.includes(id.value))
        .map((id) => ({ id: id.value, error: 'Document not found or deleted' }));

      this.logger.log(`Updated status for ${result.successCount} documents by ${updatedBy.value}`);

      return {
        successCount: result.successCount,
        failedCount: result.failedCount,
        errors,
      };
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to update document status: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to update document status', error);
      }
      throw new RepositoryError('An unknown error occurred while updating document statuses');
    }
  }

  async shareMany(
    ids: DocumentId[],
    sharedBy: UserId,
    sharedWith: UserId[],
  ): Promise<BulkOperationResult> {
    try {
      const docIdValues = ids.map((id) => id.value);
      const userIdValues = sharedWith.map((id) => id.value);

      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Fetch all documents to be updated
        const docsToUpdate = await tx.document.findMany({
          where: {
            id: { in: docIdValues },
            deletedAt: null,
          },
          select: { id: true, allowedViewers: true, uploaderId: true },
        });

        // 2. Verify ownership and prepare updates
        const updates = docsToUpdate
          .filter((doc) => doc.uploaderId === sharedBy.value) // FIXED: Verify ownership
          .map((doc) => {
            const updatedViewers = [...new Set([...doc.allowedViewers, ...userIdValues])];
            return tx.document.update({
              where: { id: doc.id },
              data: {
                allowedViewers: updatedViewers,
                updatedAt: new Date(),
              },
            });
          });

        // 3. Execute updates
        const results = await Promise.all(updates);

        const updatedIds = docsToUpdate.map((doc) => doc.id);
        const notFoundIds = docIdValues.filter((id) => !updatedIds.includes(id));
        const notOwnedIds = docsToUpdate
          .filter((doc) => doc.uploaderId !== sharedBy.value)
          .map((doc) => doc.id);

        return {
          successCount: results.length,
          failedCount: docIdValues.length - results.length,
          notFoundIds,
          notOwnedIds,
        };
      });

      // 4. Build detailed error report
      const errors = [
        ...result.notFoundIds.map((id) => ({ id, error: 'Document not found or deleted' })),
        ...result.notOwnedIds.map((id) => ({ id, error: 'Document not owned by user' })),
      ];

      this.logger.log(`Shared ${result.successCount} documents by ${sharedBy.value}`);

      return {
        successCount: result.successCount,
        failedCount: result.failedCount,
        errors,
      };
    } catch (error) {
      // 4. Apply robust, type-safe error handling for the entire transaction
      if (error instanceof Error) {
        this.logger.error(`Failed to share documents: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to share documents', error);
      }
      throw new RepositoryError('An unknown error occurred while sharing documents');
    }
  }

  // ============================================================================
  // VALIDATION & CHECKS
  // ============================================================================

  async exists(id: DocumentId): Promise<boolean> {
    try {
      const count = await this.prisma.document.count({
        where: { id: id.value },
      });
      return count > 0;
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to check document existence: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to check document existence', error);
      }
      throw new RepositoryError('An unknown error occurred while checking document existence');
    }
  }

  async hasAccess(documentId: DocumentId, userId: UserId): Promise<boolean> {
    try {
      const count = await this.prisma.document.count({
        where: {
          id: documentId.value,
          deletedAt: null,
          OR: [
            { uploaderId: userId.value },
            { isPublic: true },
            { allowedViewers: { has: userId.value } },
          ],
        },
      });

      return count > 0;
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to check document access: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to check document access', error);
      }
      throw new RepositoryError('An unknown error occurred while checking document access');
    }
  }

  async isVerified(documentId: DocumentId): Promise<boolean> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId.value },
        select: { status: true },
      });

      return document?.status === 'VERIFIED';
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to check document verification: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to check document verification', error);
      }
      throw new RepositoryError('An unknown error occurred while checking document verification');
    }
  }

  async isExpired(documentId: DocumentId): Promise<boolean> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId.value },
        select: { expiresAt: true }, // FIXED: Use expiresAt (retention expiry)
      });

      if (!document?.expiresAt) {
        return false;
      }
      return document.expiresAt < new Date();
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to check document expiration: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to check document expiration', error);
      }
      throw new RepositoryError('An unknown error occurred while checking document expiration');
    }
  }

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  async getStats(filters?: FindDocumentsFilters): Promise<DocumentStats> {
    try {
      const where = filters ? this.buildWhereClause(filters) : { deletedAt: null };

      const [total, byStatus, byCategory, sizeStats, encryptedCount, publicCount, expiredCount] =
        await this.prisma.$transaction([
          this.prisma.document.count({ where }),
          this.prisma.document.groupBy({
            by: ['status'],
            where,
            orderBy: { status: 'asc' },
            _count: true,
          }),
          this.prisma.document.groupBy({
            by: ['category'],
            where,
            orderBy: { category: 'asc' },
            _count: true,
          }),
          this.prisma.document.aggregate({
            where,
            _sum: { sizeBytes: true },
            _avg: { sizeBytes: true },
          }),
          this.prisma.document.count({ where: { ...where, encrypted: true } }),
          this.prisma.document.count({ where: { ...where, isPublic: true } }),
          this.prisma.document.count({
            where: {
              ...where,
              expiresAt: { lt: new Date() }, // FIXED: Use expiresAt for retention expiry
            },
          }),
        ]);

      return {
        total,
        byStatus: byStatus.reduce(
          (acc, item) => {
            const count = typeof item._count === 'object' ? (item._count._all ?? 0) : 0;
            acc[item.status] = count;
            return acc;
          },
          {} as Record<string, number>,
        ),

        byCategory: byCategory.reduce(
          (acc, item) => {
            const count = typeof item._count === 'object' ? (item._count._all ?? 0) : 0;
            acc[item.category] = count;
            return acc;
          },
          {} as Record<string, number>,
        ),
        totalSizeBytes: sizeStats._sum?.sizeBytes ?? 0, // ✅ optional chaining
        averageSizeBytes: Math.round(sizeStats._avg?.sizeBytes ?? 0), // ✅
        encrypted: encryptedCount ?? 0,
        public: publicCount ?? 0,
        expired: expiredCount ?? 0,
      };
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to get document stats: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to get document stats', error);
      }
      throw new RepositoryError('An unknown error occurred while getting document stats');
    }
  }

  async getStorageStats(): Promise<{
    totalSizeBytes: number;
    byCategory: Record<string, number>;
    byStorageProvider: Record<string, number>;
    byUser: Array<{ userId: string; totalBytes: number; documentCount: number }>;
  }> {
    try {
      const where = { deletedAt: null };

      const [totalSize, byCategory, byProvider, byUser] = await Promise.all([
        this.prisma.document.aggregate({
          where,
          _sum: { sizeBytes: true },
        }),
        this.prisma.document.groupBy({
          by: ['category'],
          where,
          _sum: { sizeBytes: true },
        }),
        this.prisma.document.groupBy({
          by: ['storageProvider'],
          where,
          _sum: { sizeBytes: true },
        }),
        this.prisma.document.groupBy({
          by: ['uploaderId'],
          where,
          _sum: { sizeBytes: true },
          _count: true,
          orderBy: { _sum: { sizeBytes: 'desc' } },
          take: 100,
        }),
      ]);

      return {
        totalSizeBytes: totalSize._sum.sizeBytes || 0,
        byCategory: byCategory.reduce(
          (acc, item) => {
            acc[item.category] = item._sum.sizeBytes || 0;
            return acc;
          },
          {} as Record<string, number>,
        ),
        byStorageProvider: byProvider.reduce(
          (acc, item) => {
            acc[item.storageProvider] = item._sum.sizeBytes || 0;
            return acc;
          },
          {} as Record<string, number>,
        ),
        byUser: byUser.map((item) => ({
          userId: item.uploaderId,
          totalBytes: item._sum.sizeBytes || 0,
          documentCount: item._count,
        })),
      };
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to get storage stats: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to get storage stats', error);
      }
      throw new RepositoryError('An unknown error occurred while getting storage stats');
    }
  }

  async getVerificationMetrics(timeRange: { start: Date; end: Date }): Promise<{
    totalVerified: number;
    totalRejected: number;
    totalPending: number;
    averageVerificationTimeHours: number;
    byVerifier: Record<string, { verified: number; rejected: number }>;
  }> {
    try {
      const where = {
        createdAt: { gte: timeRange.start, lte: timeRange.end },
        deletedAt: null,
      };

      const [verified, rejected, pending, documents] = await Promise.all([
        this.prisma.document.count({ where: { ...where, status: 'VERIFIED' } }),
        this.prisma.document.count({ where: { ...where, status: 'REJECTED' } }),
        this.prisma.document.count({ where: { ...where, status: 'PENDING_VERIFICATION' } }),
        this.prisma.document.findMany({
          where: {
            ...where,
            status: { in: ['VERIFIED', 'REJECTED'] },
            verifiedAt: { not: null },
          },
          select: {
            createdAt: true,
            verifiedAt: true,
            verifiedBy: true,
            status: true,
          },
        }),
      ]);

      const verificationTimes = documents
        .filter((d) => d.verifiedAt)
        .map((d) => (d.verifiedAt!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60));

      const averageVerificationTimeHours =
        verificationTimes.length > 0
          ? verificationTimes.reduce((a, b) => a + b, 0) / verificationTimes.length
          : 0;

      const byVerifier: Record<string, { verified: number; rejected: number }> = {};
      documents.forEach((doc) => {
        if (doc.verifiedBy) {
          if (!byVerifier[doc.verifiedBy]) {
            byVerifier[doc.verifiedBy] = { verified: 0, rejected: 0 };
          }
          if (doc.status === 'VERIFIED') {
            byVerifier[doc.verifiedBy].verified++;
          } else {
            byVerifier[doc.verifiedBy].rejected++;
          }
        }
      });

      return {
        totalVerified: verified,
        totalRejected: rejected,
        totalPending: pending,
        averageVerificationTimeHours,
        byVerifier,
      };
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to get verification metrics: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to get verification metrics', error);
      }
      throw new RepositoryError('An unknown error occurred while getting verification metrics');
    }
  }

  async getUploadStats(timeRange: { start: Date; end: Date }): Promise<{
    totalUploads: number;
    byCategory: Record<string, number>;
    byDay: Array<{ date: string; count: number; totalBytes: number }>;
  }> {
    try {
      const where = {
        createdAt: { gte: timeRange.start, lte: timeRange.end },
        deletedAt: null,
      };

      const [total, byCategory, documents] = await Promise.all([
        this.prisma.document.count({ where }),
        this.prisma.document.groupBy({
          by: ['category'],
          where,
          _count: true,
        }),
        this.prisma.document.findMany({
          where,
          select: {
            createdAt: true,
            sizeBytes: true,
          },
        }),
      ]);

      const byDayMap = new Map<string, { count: number; totalBytes: number }>();
      documents.forEach((doc) => {
        const dateKey = doc.createdAt.toISOString().split('T')[0];
        const existing = byDayMap.get(dateKey) || { count: 0, totalBytes: 0 };
        byDayMap.set(dateKey, {
          count: existing.count + 1,
          totalBytes: existing.totalBytes + doc.sizeBytes,
        });
      });

      const byDay = Array.from(byDayMap.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalUploads: total,
        byCategory: byCategory.reduce(
          (acc, item) => {
            acc[item.category] = item._count;
            return acc;
          },
          {} as Record<string, number>,
        ),
        byDay,
      };
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to get upload stats: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to get upload stats', error);
      }
      throw new RepositoryError('An unknown error occurred while getting upload stats');
    }
  }

  // ============================================================================
  // MAINTENANCE OPERATIONS
  // ============================================================================

  async purgeSoftDeleted(olderThan: Date): Promise<number> {
    try {
      const result = await this.prisma.document.deleteMany({
        where: {
          deletedAt: { not: null, lt: olderThan },
        },
      });

      this.logger.log(
        `Purged ${result.count} soft-deleted documents older than ${olderThan.toISOString()}`,
      );
      return result.count;
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to purge soft-deleted documents: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to purge soft-deleted documents', error);
      }
      throw new RepositoryError('An unknown error occurred while purging soft-deleted documents');
    }
  }

  async archiveByRetentionPolicy(policy: string): Promise<number> {
    try {
      const result = await this.prisma.document.updateMany({
        where: {
          retentionPolicy: policy,
          deletedAt: null,
          // FIXED: Only archive documents that haven't been archived already
          metadata: {
            path: ['archived'],
            equals: Prisma.DbNull, // Check if archived field doesn't exist
          },
        },
        data: {
          metadata: {
            archived: true,
            archivedAt: new Date().toISOString(),
            archivedBy: 'system', // FIXED: Track who archived
          },
        },
      });

      this.logger.log(`Archived ${result.count} documents with policy ${policy}`);
      return result.count;
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to archive documents: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to archive documents', error);
      }
      throw new RepositoryError('An unknown error occurred while archiving documents');
    }
  }

  async findOrphaned(): Promise<Document[]> {
    try {
      const entities = await this.prisma.document.findMany({
        where: {
          assetId: null,
          willId: null,
          identityForUserId: null,
          deletedAt: null,
          // FIXED: Exclude certain categories that might not need associations
          category: {
            notIn: ['IDENTITY_PROOF'], // Identity documents might not have asset/will associations
          },
        },
      });

      const validEntities = entities.filter((entity) =>
        DocumentMapper.isValidEntity(entity as DocumentEntity),
      );

      return DocumentMapper.toDomainMany(validEntities as DocumentEntity[]);
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to find orphaned documents: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to find orphaned documents', error);
      }
      throw new RepositoryError('An unknown error occurred while finding orphaned documents');
    }
  }

  async cleanupOrphaned(olderThan: Date): Promise<number> {
    try {
      const result = await this.prisma.document.deleteMany({
        where: {
          assetId: null,
          willId: null,
          identityForUserId: null,
          createdAt: { lt: olderThan },
          deletedAt: null,
          // FIXED: Only cleanup documents that are truly orphaned (no business purpose)
          category: {
            notIn: ['IDENTITY_PROOF', 'OTHER'], // Keep identity and other documents even if orphaned
          },
        },
      });

      this.logger.log(
        `Cleaned up ${result.count} orphaned documents older than ${olderThan.toISOString()}`,
      );
      return result.count;
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to cleanup orphaned documents: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to cleanup orphaned documents', error);
      }
      throw new RepositoryError('An unknown error occurred while cleaning up orphaned documents');
    }
  }

  // ============================================================================
  // TRANSACTION SUPPORT
  // ============================================================================

  async saveMany(documents: Document[]): Promise<void> {
    const documentsToCreate = documents.filter((doc) => doc.version === 1);
    const documentsToUpdate = documents.filter((doc) => doc.version > 1);

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Handle documents to create
        if (documentsToCreate.length > 0) {
          const createData = DocumentMapper.toPersistenceMany(documentsToCreate);
          await tx.document.createMany({
            data: createData,
          });
        }

        // 2. Handle documents to update with optimistic locking
        if (documentsToUpdate.length > 0) {
          for (const doc of documentsToUpdate) {
            const { ...updateData } = DocumentMapper.toPersistence(doc);

            const result = await tx.document.updateMany({
              where: {
                id: doc.id.value,
                version: doc.version - 1, // FIXED: version field name
              },
              data: {
                ...updateData,
                updatedAt: new Date(),
              },
            });

            if (result.count === 0) {
              const existing = await tx.document.findUnique({
                where: { id: doc.id.value },
                select: { version: true },
              });

              // Inferred as number because of ?? 0
              const existingVersion: number = (existing?.version ?? 0) as number;

              throw new OptimisticLockError(doc.id, doc.version - 1, existingVersion);
            }
          }
        }
      });

      // Clear domain events after successful save
      documents.forEach((doc) => doc.clearDomainEvents());

      this.logger.log(`Saved ${documents.length} documents in transaction`);
    } catch (error) {
      // Re-throw our specific domain error
      if (error instanceof ConcurrentModificationError) {
        throw error;
      }
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to save documents in transaction: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to save documents in transaction', error);
      }
      throw new RepositoryError('An unknown error occurred while saving documents in transaction');
    }
  }

  async hardDelete(id: DocumentId): Promise<void> {
    try {
      await this.prisma.document.delete({
        where: { id: id.value },
      });

      this.logger.log(`Hard deleted document: ${id.value}`);
    } catch (error) {
      // Preserve the specific check for Prisma's "not found" error
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new DocumentNotFoundError(id);
      }

      // Apply robust, type-safe error handling for all other errors
      if (error instanceof Error) {
        this.logger.error(`Failed to hard delete document: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to hard delete document', error);
      }
      throw new RepositoryError('An unknown error occurred while hard deleting a document');
    }
  }

  async hardDeleteMany(ids: DocumentId[]): Promise<number> {
    try {
      const result = await this.prisma.document.deleteMany({
        where: {
          id: { in: ids.map((id) => id.value) },
        },
      });

      this.logger.log(`Hard deleted ${result.count} documents`);
      return result.count;
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to hard delete documents: ${error.message}`, error.stack);
        throw new RepositoryError('Failed to hard delete documents', error);
      }
      throw new RepositoryError('An unknown error occurred while hard deleting documents');
    }
  }

  // ============================================================================
  // PRIVATE QUERY BUILDERS (No changes needed here - already correct)
  // ============================================================================

  private buildWhereClause(filters: FindDocumentsFilters): Prisma.DocumentWhereInput {
    const where: Prisma.DocumentWhereInput = {};

    if (filters.uploaderId) where.uploaderId = filters.uploaderId.value;
    if (filters.status) where.status = filters.status.value;
    if (filters.category) where.category = filters.category.value;
    if (filters.assetId) where.assetId = filters.assetId.value;
    if (filters.willId) where.willId = filters.willId.value;
    if (filters.identityForUserId) where.identityForUserId = filters.identityForUserId.value;
    if (filters.isPublic !== undefined) where.isPublic = filters.isPublic;
    if (filters.encrypted !== undefined) where.encrypted = filters.encrypted;
    if (filters.storageProvider) where.storageProvider = filters.storageProvider.value;
    if (filters.verifiedBy) where.verifiedBy = filters.verifiedBy.value;
    if (filters.retentionPolicy) where.retentionPolicy = filters.retentionPolicy;

    if (filters.createdAfter || filters.createdBefore) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filters.createdAfter) dateFilter.gte = filters.createdAfter;
      if (filters.createdBefore) dateFilter.lte = filters.createdBefore;
      where.createdAt = dateFilter;
    }

    if (filters.updatedAfter || filters.updatedBefore) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filters.updatedAfter) dateFilter.gte = filters.updatedAfter;
      if (filters.updatedBefore) dateFilter.lte = filters.updatedBefore;
      where.updatedAt = dateFilter;
    }

    if (filters.hasExpired !== undefined) {
      if (filters.hasExpired) {
        where.expiresAt = { lt: new Date() }; // FIXED: Use expiresAt
      } else {
        where.OR = [{ expiresAt: null }, { expiresAt: { gte: new Date() } }]; // FIXED: Use expiresAt
      }
    }

    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    return where;
  }

  private buildSearchWhereClause(options: DocumentSearchOptions): Prisma.DocumentWhereInput {
    const where: Prisma.DocumentWhereInput = { deletedAt: null };
    const queryFilter: Prisma.DocumentWhereInput[] = [];

    if (options.query) {
      const query = options.query;
      queryFilter.push({
        OR: [
          { filename: { contains: query, mode: 'insensitive' } },
          { documentNumber: { contains: query, mode: 'insensitive' } },
          { issuingAuthority: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    if (options.category) where.category = options.category.value;
    if (options.status) where.status = options.status.value;
    if (options.uploaderId) where.uploaderId = options.uploaderId.value;

    if (queryFilter.length > 0) {
      where.AND = queryFilter;
    }

    return where;
  }

  private buildOrderBy(pagination?: PaginationOptions): Prisma.DocumentOrderByWithRelationInput {
    if (!pagination?.sortBy) {
      return { createdAt: 'desc' };
    }

    const sortOrder = pagination.sortOrder || 'desc';

    switch (pagination.sortBy) {
      case 'updatedAt':
        return { updatedAt: sortOrder };
      case 'fileName':
        return { filename: sortOrder };
      case 'fileSize':
        return { sizeBytes: sortOrder };
      case 'expiryDate':
        return { expiryDate: sortOrder };
      case 'createdAt':
      default:
        return { createdAt: sortOrder };
    }
  }
}
