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

/**
 * Repository-specific errors
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export class DocumentNotFoundError extends RepositoryError {
  constructor(documentId: DocumentId) {
    super(`Document not found: ${documentId.value}`);
    this.name = 'DocumentNotFoundError';
  }
}

/**
 * Production-ready Prisma implementation of the Document repository.
 * Handles all database operations with proper domain ↔ persistence mapping.
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
      // If the document is new (version === 1), just create it.
      if (document.version === 1) {
        await this.createDocument(document);
        return;
      }

      // Otherwise, try to update it with optimistic locking.
      await this.updateDocument(document);

      this.logger.debug(`Document saved: ${document.id.value}`);
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
          try {
            await this.createDocument(document);
          } catch (createErr: unknown) {
            if (createErr instanceof Error) {
              throw new RepositoryError('Failed to save document after update failure', createErr);
            }
            throw new RepositoryError('Failed to save document after update failure');
          }
        } else if (err.code === 'P2034') {
          throw new ConcurrentModificationError();
        }
      }

      if (err instanceof Error) {
        this.logger.error(`Failed to save document: ${err.message}`, err.stack);
        throw new RepositoryError('Failed to save document', err);
      }

      this.logger.error('Failed to save document: Unknown error');
      throw new RepositoryError('Failed to save document');
    }
  }

  async findById(id: DocumentId, includeDeleted = false): Promise<Document | null> {
    try {
      const prismaDocument = await this.prisma.document.findUnique({
        where: { id: id.value },
      });

      if (!prismaDocument) return null;
      if (!includeDeleted && prismaDocument.deletedAt) return null;

      return this.toDomain(prismaDocument);
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(`Failed to find document by ID: ${err.message}`, err.stack);
        throw new RepositoryError('Failed to find document', err);
      }

      // Fallback for non-Error throws (e.g., string, number, etc.)
      this.logger.error('Failed to find document by ID: Unknown error');
      throw new RepositoryError('Failed to find document');
    }
  }

  async findMany(
    filters: FindDocumentsFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Document>> {
    try {
      const where = this.buildWhereClause(filters);
      const page = pagination.page ?? 1;
      const limit = Math.min(pagination.limit ?? 20, 100);
      const skip = (page - 1) * limit;
      const orderBy = this.buildOrderBy(pagination);

      const [prismaDocuments, total] = await Promise.all([
        this.prisma.document.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        }),
        this.prisma.document.count({ where }),
      ]);

      const documents = prismaDocuments.map((doc) => this.toDomain(doc));
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(`Failed to find documents: ${err.message}`, err.stack);
        throw new RepositoryError('Failed to find documents', err);
      }

      this.logger.error('Failed to find documents: Unknown error');
      throw new RepositoryError('Failed to find documents');
    }
  }

  async search(
    options: DocumentSearchOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Document>> {
    try {
      const where = this.buildSearchWhereClause(options);
      const page = pagination.page ?? 1;
      const limit = Math.min(pagination.limit ?? 20, 100);
      const skip = (page - 1) * limit;

      const [prismaDocuments, total] = await Promise.all([
        this.prisma.document.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.document.count({ where }),
      ]);

      const documents = prismaDocuments.map((doc) => this.toDomain(doc));
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
      this.logger.error(`Failed to search documents: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to search documents', error);
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
      const prismaDocuments = await this.prisma.document.findMany({
        where: {
          assetId: assetId.value,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      return prismaDocuments.map((doc) => this.toDomain(doc));
    } catch (error) {
      this.logger.error(`Failed to find documents by asset ID: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to find documents by asset', error);
    }
  }

  async findByWillId(willId: WillId): Promise<Document[]> {
    try {
      const prismaDocuments = await this.prisma.document.findMany({
        where: {
          willId: willId.value,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      return prismaDocuments.map((doc) => this.toDomain(doc));
    } catch (error) {
      this.logger.error(`Failed to find documents by will ID: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to find documents by will', error);
    }
  }

  async findIdentityDocuments(userId: UserId): Promise<Document[]> {
    try {
      const prismaDocuments = await this.prisma.document.findMany({
        where: {
          identityForUserId: userId.value,
          deletedAt: null,
          category: 'IDENTITY_PROOF',
        },
        orderBy: { createdAt: 'desc' },
      });

      return prismaDocuments.map((doc) => this.toDomain(doc));
    } catch (error) {
      this.logger.error(`Failed to find identity documents: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to find identity documents', error);
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
      const prismaDocuments = await this.prisma.document.findMany({
        where: {
          id: { in: ids.map((id) => id.value) },
          deletedAt: null,
        },
      });

      return prismaDocuments.map((doc) => this.toDomain(doc));
    } catch (error) {
      this.logger.error(`Failed to find documents by IDs: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to find documents by IDs', error);
    }
  }

  async findExpiringSoon(withinDays: number): Promise<ExpiringDocument[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + withinDays);

      const prismaDocuments = await this.prisma.document.findMany({
        where: {
          expiryDate: {
            lte: futureDate,
            gte: new Date(),
          },
          deletedAt: null,
        },
        orderBy: { expiryDate: 'asc' },
        select: {
          id: true,
          filename: true,
          expiryDate: true,
          uploaderId: true,
        },
      });

      return prismaDocuments.map((doc) => ({
        id: new DocumentId(doc.id),
        fileName: doc.filename,
        expiryDate: doc.expiryDate!,
        uploaderId: new UserId(doc.uploaderId),
        daysUntilExpiry: Math.ceil(
          (doc.expiryDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        ),
      }));
    } catch (error) {
      this.logger.error(`Failed to find expiring documents: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to find expiring documents', error);
    }
  }

  async findExpired(): Promise<Document[]> {
    try {
      const prismaDocuments = await this.prisma.document.findMany({
        where: {
          expiryDate: {
            lt: new Date(),
          },
          deletedAt: null,
        },
        orderBy: { expiryDate: 'desc' },
      });

      return prismaDocuments.map((doc) => this.toDomain(doc));
    } catch (error) {
      this.logger.error(`Failed to find expired documents: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to find expired documents', error);
    }
  }

  async findAccessibleByUser(
    userId: UserId,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Document>> {
    try {
      const page = pagination.page ?? 1;
      const limit = Math.min(pagination.limit ?? 20, 100);
      const skip = (page - 1) * limit;

      const where = {
        deletedAt: null,
        OR: [
          { uploaderId: userId.value },
          { isPublic: true },
          { allowedViewers: { has: userId.value } },
        ],
      };

      const [prismaDocuments, total] = await Promise.all([
        this.prisma.document.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.document.count({ where }),
      ]);

      const documents = prismaDocuments.map((doc) => this.toDomain(doc));
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
      this.logger.error(`Failed to find accessible documents: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to find accessible documents', error);
    }
  }

  async findByRetentionPolicy(policy: string): Promise<Document[]> {
    try {
      const prismaDocuments = await this.prisma.document.findMany({
        where: {
          retentionPolicy: policy,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      return prismaDocuments.map((doc) => this.toDomain(doc));
    } catch (error) {
      this.logger.error(
        `Failed to find documents by retention policy: ${error.message}`,
        error.stack,
      );
      throw new RepositoryError('Failed to find documents by retention policy', error);
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async softDeleteMany(ids: DocumentId[], deletedBy: UserId): Promise<BulkOperationResult> {
    try {
      const now = new Date();

      const result = await this.prisma.document.updateMany({
        where: {
          id: { in: ids.map((id) => id.value) },
          deletedAt: null,
        },
        data: {
          deletedAt: now,
          updatedAt: now,
        },
      });

      this.logger.log(`Soft deleted ${result.count} documents by ${deletedBy.value}`);

      return {
        successCount: result.count,
        failedCount: ids.length - result.count,
        errors: [],
      };
    } catch (error) {
      this.logger.error(`Failed to soft delete documents: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to soft delete documents', error);
    }
  }

  async updateStatusMany(
    ids: DocumentId[],
    newStatus: DocumentStatus,
    updatedBy: UserId,
  ): Promise<BulkOperationResult> {
    try {
      const now = new Date();

      const result = await this.prisma.document.updateMany({
        where: {
          id: { in: ids.map((id) => id.value) },
          deletedAt: null,
        },
        data: {
          status: newStatus.value,
          updatedAt: now,
        },
      });

      this.logger.log(`Updated status for ${result.count} documents by ${updatedBy.value}`);

      return {
        successCount: result.count,
        failedCount: ids.length - result.count,
        errors: [],
      };
    } catch (error) {
      this.logger.error(`Failed to update document status: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to update document status', error);
    }
  }

  async shareMany(
    ids: DocumentId[],
    sharedBy: UserId,
    sharedWith: UserId[],
  ): Promise<BulkOperationResult> {
    try {
      const userIds = sharedWith.map((id) => id.value);
      const docIds = ids.map((id) => id.value);

      // 1. Fetch all relevant documents at once
      const docsToUpdate = await this.prisma.document.findMany({
        where: { id: { in: docIds } },
        select: { id: true, allowedViewers: true },
      });

      // 2. Prepare updates in a transaction
      const updatePromises = docsToUpdate.map((doc) => {
        const updatedViewers = [...new Set([...doc.allowedViewers, ...userIds])];
        return this.prisma.document.update({
          where: { id: doc.id },
          data: { allowedViewers: updatedViewers },
        });
      });

      const results = await this.prisma.$transaction(updatePromises);

      return {
        successCount: results.length,
        failedCount: ids.length - results.length,
        errors: [],
      };
    } catch (error) {
      this.logger.error(`Failed to share documents: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to share documents', error);
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
      this.logger.error(`Failed to check document existence: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to check document existence', error);
    }
  }

  async hasAccess(documentId: DocumentId, userId: UserId): Promise<boolean> {
    try {
      const document = await this.prisma.document.findFirst({
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

      return !!document;
    } catch (error) {
      this.logger.error(`Failed to check document access: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to check document access', error);
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
      this.logger.error(`Failed to check document verification: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to check document verification', error);
    }
  }

  async isExpired(documentId: DocumentId): Promise<boolean> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId.value },
        select: { expiryDate: true },
      });

      if (!document?.expiryDate) return false;
      return document.expiryDate < new Date();
    } catch (error) {
      this.logger.error(`Failed to check document expiration: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to check document expiration', error);
    }
  }

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  async getStats(filters?: FindDocumentsFilters): Promise<DocumentStats> {
    try {
      const where = filters ? this.buildWhereClause(filters) : { deletedAt: null };

      const [total, byStatus, byCategory, sizeStats, encryptedCount, publicCount, expiredCount] =
        await Promise.all([
          this.prisma.document.count({ where }),
          this.prisma.document.groupBy({
            by: ['status'],
            where,
            _count: true,
          }),
          this.prisma.document.groupBy({
            by: ['category'],
            where,
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
            where: { ...where, expiryDate: { lt: new Date() } },
          }),
        ]);

      return {
        total,
        byStatus: byStatus.reduce(
          (acc, item) => {
            acc[item.status] = item._count;
            return acc;
          },
          {} as Record<string, number>,
        ),
        byCategory: byCategory.reduce(
          (acc, item) => {
            acc[item.category] = item._count;
            return acc;
          },
          {} as Record<string, number>,
        ),
        totalSizeBytes: sizeStats._sum.sizeBytes || 0,
        averageSizeBytes: Math.round(sizeStats._avg.sizeBytes || 0),
        encrypted: encryptedCount,
        public: publicCount,
        expired: expiredCount,
      };
    } catch (error) {
      this.logger.error(`Failed to get document stats: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to get document stats', error);
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
      this.logger.error(`Failed to get storage stats: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to get storage stats', error);
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
      this.logger.error(`Failed to get verification metrics: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to get verification metrics', error);
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
      this.logger.error(`Failed to get upload stats: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to get upload stats', error);
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

      this.logger.log(`Purged ${result.count} soft-deleted documents`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to purge soft-deleted documents: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to purge soft-deleted documents', error);
    }
  }

  async archiveByRetentionPolicy(policy: string): Promise<number> {
    try {
      const result = await this.prisma.document.updateMany({
        where: {
          retentionPolicy: policy,
          deletedAt: null,
        },
        data: {
          metadata: {
            archived: true,
            archivedAt: new Date().toISOString(),
          },
        },
      });

      this.logger.log(`Archived ${result.count} documents with policy ${policy}`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to archive documents: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to archive documents', error);
    }
  }

  async findOrphaned(): Promise<Document[]> {
    try {
      const prismaDocuments = await this.prisma.document.findMany({
        where: {
          assetId: null,
          willId: null,
          identityForUserId: null,
          deletedAt: null,
        },
      });

      return prismaDocuments.map((doc) => this.toDomain(doc));
    } catch (error) {
      this.logger.error(`Failed to find orphaned documents: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to find orphaned documents', error);
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
        },
      });

      this.logger.log(`Cleaned up ${result.count} orphaned documents`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to cleanup orphaned documents: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to cleanup orphaned documents', error);
    }
  }

  // ============================================================================
  // TRANSACTION SUPPORT
  // ============================================================================

  async saveMany(documents: Document[]): Promise<void> {
    try {
      await this.prisma.$transaction(
        documents.map((doc) => {
          const data = this.toPersistence(doc);
          return this.prisma.document.upsert({
            where: { id: doc.id.value },
            create: data,
            update: data,
          });
        }),
      );

      this.logger.log(`Saved ${documents.length} documents in transaction`);
    } catch (error) {
      this.logger.error(`Failed to save documents in transaction: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to save documents in transaction', error);
    }
  }

  async hardDelete(id: DocumentId): Promise<void> {
    try {
      await this.prisma.document.delete({
        where: { id: id.value },
      });

      this.logger.log(`Hard deleted document: ${id.value}`);
    } catch (error) {
      this.logger.error(`Failed to hard delete document: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to hard delete document', error);
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
      this.logger.error(`Failed to hard delete documents: ${error.message}`, error.stack);
      throw new RepositoryError('Failed to hard delete documents', error);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async createDocument(document: Document): Promise<void> {
    await this.prisma.document.create({
      data: this.toPersistence(document),
    });
  }

  private async updateDocument(document: Document): Promise<void> {
    const data = this.toPersistence(document);

    await this.prisma.document.update({
      where: {
        id: document.id.value,
        version: document.version, // Optimistic locking
      },
      data,
    });
  }

  // ============================================================================
  // MAPPING HELPERS
  // ============================================================================

  private toPersistence(document: Document): Prisma.DocumentCreateInput {
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
      metadata: document.metadata ?? Prisma.JsonNull,
      documentNumber: document.documentNumber,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      issuingAuthority: document.issuingAuthority,
      isPublic: document.isPublic(),
      encrypted: document.encrypted,
      allowedViewers: document.allowedViewers.value.map((id) => id.value),
      storageProvider: document.storageProvider.value,
      retentionPolicy: document.retentionPolicy,
      version: document.version,
      isIndexed: false,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      deletedAt: document.deletedAt,
    };
  }

  private toDomain(prismaDoc: any): Document {
    return Document.fromPersistence({
      id: prismaDoc.id,
      fileName: prismaDoc.filename,
      fileSize: prismaDoc.sizeBytes,
      mimeType: prismaDoc.mimeType,
      checksum: prismaDoc.checksum,
      storagePath: prismaDoc.storagePath,
      category: prismaDoc.category,
      status: prismaDoc.status,
      uploaderId: prismaDoc.uploaderId,
      verifiedBy: prismaDoc.verifiedBy,
      verifiedAt: prismaDoc.verifiedAt,
      rejectionReason: prismaDoc.rejectionReason,
      assetId: prismaDoc.assetId,
      willId: prismaDoc.willId,
      identityForUserId: prismaDoc.identityForUserId,
      metadata: prismaDoc.metadata,
      documentNumber: prismaDoc.documentNumber,
      issueDate: prismaDoc.issueDate,
      expiryDate: prismaDoc.expiryDate,
      issuingAuthority: prismaDoc.issuingAuthority,
      isPublic: prismaDoc.isPublic,
      encrypted: prismaDoc.encrypted,
      allowedViewers: prismaDoc.allowedViewers,
      storageProvider: prismaDoc.storageProvider,
      retentionPolicy: prismaDoc.retentionPolicy,
      version: prismaDoc.version,
      createdAt: prismaDoc.createdAt,
      updatedAt: prismaDoc.updatedAt,
      deletedAt: prismaDoc.deletedAt,
    });
  }

  private buildWhereClause(filters: FindDocumentsFilters): any {
    const where: any = {};

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
      where.createdAt = {};
      if (filters.createdAfter) where.createdAt.gte = filters.createdAfter;
      if (filters.createdBefore) where.createdAt.lte = filters.createdBefore;
    }

    if (filters.updatedAfter || filters.updatedBefore) {
      where.updatedAt = {};
      if (filters.updatedAfter) where.updatedAt.gte = filters.updatedAfter;
      if (filters.updatedBefore) where.updatedAt.lte = filters.updatedBefore;
    }

    if (filters.hasExpired !== undefined) {
      if (filters.hasExpired) {
        where.expiryDate = { lt: new Date() };
      } else {
        where.OR = [{ expiryDate: null }, { expiryDate: { gte: new Date() } }];
      }
    }

    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    return where;
  }

  private buildSearchWhereClause(options: DocumentSearchOptions): any {
    const where: any = { deletedAt: null };

    if (options.query) {
      where.OR = [
        { filename: { contains: options.query, mode: 'insensitive' } },
        { documentNumber: { contains: options.query, mode: 'insensitive' } },
        { issuingAuthority: { contains: options.query, mode: 'insensitive' } },
      ];
    }

    if (options.category) where.category = options.category.value;
    if (options.status) where.status = options.status.value;
    if (options.uploaderId) where.uploaderId = options.uploaderId.value;

    return where;
  }

  private buildOrderBy(pagination?: PaginationOptions): any {
    if (!pagination?.sortBy) {
      return { createdAt: 'desc' };
    }

    const orderBy: any = {};
    orderBy[pagination.sortBy] = pagination.sortOrder || 'desc';
    return orderBy;
  }
}
