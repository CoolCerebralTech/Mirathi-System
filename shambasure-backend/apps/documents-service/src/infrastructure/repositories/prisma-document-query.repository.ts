import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { Prisma } from '@prisma/client';

import {
  IDocumentQueryRepository,
  DocumentDTO,
  FindDocumentsFilters,
  PaginationOptions,
  PaginatedResult,
  DocumentSearchOptions,
  DocumentStats,
  ExpiringDocument,
} from '../../domain/interfaces';
import { DocumentId, UserId, WillId, AssetId, DocumentStatus } from '../../domain/value-objects';

type DocumentDtoPayload = Prisma.DocumentGetPayload<{
  select: {
    id: true;
    filename: true;
    sizeBytes: true; // <-- Note the name here
    mimeType: true;
    category: true;
    status: true;
    uploaderId: true;
    verifiedBy: true;
    verifiedAt: true;
    rejectionReason: true;
    assetId: true;
    willId: true;
    identityForUserId: true;
    documentNumber: true;
    issueDate: true;
    expiryDate: true;
    isPublic: true;
    isIndexed: true;
    version: true;
    createdAt: true;
    updatedAt: true;
    deletedAt: true;
  };
}>;

// ============================================================================
// Query Repository Errors
// ============================================================================

export class QueryRepositoryError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'QueryRepositoryError';
  }
}

export class InvalidQueryError extends QueryRepositoryError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidQueryError';
  }
}

// ============================================================================
// Prisma Document Query Repository (Pure CQRS Query Side)
// ============================================================================

@Injectable()
export class PrismaDocumentQueryRepository implements IDocumentQueryRepository {
  private readonly logger = new Logger(PrismaDocumentQueryRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // LIST & SEARCH QUERIES
  // ============================================================================

  async findMany(
    filters: FindDocumentsFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<DocumentDTO>> {
    try {
      const where = this.buildWhereClause(filters);
      const page = Math.max(1, pagination.page);
      const limit = Math.min(Math.max(1, pagination.limit), 100);
      const skip = (page - 1) * limit;
      const orderBy = this.buildOrderBy(pagination);

      const [entities, total] = await this.prisma.$transaction([
        this.prisma.document.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: this.getDocumentDTOSelect(),
        }),
        this.prisma.document.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: entities.map((entity) => this.mapEntityToDTO(entity)),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    } catch (error) {
      this.logger.error(`Failed to find documents with filters`, error);
      throw new QueryRepositoryError('Failed to find documents', error);
    }
  }

  async search(
    options: DocumentSearchOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<DocumentDTO>> {
    try {
      const where = this.buildSearchWhereClause(options);
      const page = Math.max(1, pagination.page);
      const limit = Math.min(Math.max(1, pagination.limit), 100);
      const skip = (page - 1) * limit;
      const orderBy = this.buildOrderBy(pagination);

      const [entities, total] = await this.prisma.$transaction([
        this.prisma.document.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: this.getDocumentDTOSelect(),
        }),
        this.prisma.document.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: entities.map((entity) => this.mapEntityToDTO(entity)),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    } catch (error) {
      this.logger.error(`Failed to search documents with query: ${options.query}`, error);
      throw new QueryRepositoryError('Failed to search documents', error);
    }
  }

  async findPendingVerification(
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<DocumentDTO>> {
    return this.findMany(
      {
        status: DocumentStatus.createPending(),
        includeDeleted: false,
      },
      pagination,
    );
  }

  async findAccessibleByUser(
    userId: UserId,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<DocumentDTO>> {
    try {
      const page = Math.max(1, pagination.page);
      const limit = Math.min(Math.max(1, pagination.limit), 100);
      const skip = (page - 1) * limit;

      const where = {
        deletedAt: null,
        OR: [
          { uploaderId: userId.value },
          { isPublic: true },
          { allowedViewers: { has: userId.value } },
        ],
      };

      const [entities, total] = await this.prisma.$transaction([
        this.prisma.document.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: this.getDocumentDTOSelect(),
        }),
        this.prisma.document.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: entities.map((entity) => this.mapEntityToDTO(entity)),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    } catch (error) {
      this.logger.error(`Failed to find accessible documents for user ${userId.value}`, error);
      throw new QueryRepositoryError('Failed to find accessible documents', error);
    }
  }

  // ============================================================================
  // SPECIALIZED & REPORTING QUERIES
  // ============================================================================

  async findByAssetId(assetId: AssetId): Promise<DocumentDTO[]> {
    try {
      const entities = await this.prisma.document.findMany({
        where: {
          assetId: assetId.value,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        select: this.getDocumentDTOSelect(),
      });

      return entities.map((entity) => this.mapEntityToDTO(entity));
    } catch (error) {
      this.logger.error(`Failed to find documents by asset ID ${assetId.value}`, error);
      throw new QueryRepositoryError('Failed to find documents by asset', error);
    }
  }

  async findByWillId(willId: WillId): Promise<DocumentDTO[]> {
    try {
      const entities = await this.prisma.document.findMany({
        where: {
          willId: willId.value,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        select: this.getDocumentDTOSelect(),
      });

      return entities.map((entity) => this.mapEntityToDTO(entity));
    } catch (error) {
      this.logger.error(`Failed to find documents by will ID ${willId.value}`, error);
      throw new QueryRepositoryError('Failed to find documents by will', error);
    }
  }

  async findIdentityDocuments(userId: UserId): Promise<DocumentDTO[]> {
    try {
      const entities = await this.prisma.document.findMany({
        where: {
          identityForUserId: userId.value,
          deletedAt: null,
          category: 'IDENTITY_PROOF',
        },
        orderBy: { createdAt: 'desc' },
        select: this.getDocumentDTOSelect(),
      });

      return entities.map((entity) => this.mapEntityToDTO(entity));
    } catch (error) {
      this.logger.error(`Failed to find identity documents for user ${userId.value}`, error);
      throw new QueryRepositoryError('Failed to find identity documents', error);
    }
  }

  async findExpiringSoon(withinDays: number): Promise<ExpiringDocument[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + withinDays);

      const entities = await this.prisma.document.findMany({
        where: {
          expiresAt: {
            lte: futureDate,
            gte: new Date(),
          },
          deletedAt: null,
        },
        orderBy: { expiresAt: 'asc' },
        select: {
          id: true,
          filename: true,
          expiresAt: true,
          uploaderId: true,
        },
      });

      return entities.map((entity) => ({
        id: new DocumentId(entity.id),
        fileName: entity.filename,
        expiryDate: entity.expiresAt!,
        uploaderId: new UserId(entity.uploaderId),
        daysUntilExpiry: Math.ceil(
          (entity.expiresAt!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        ),
      }));
    } catch (error) {
      this.logger.error(`Failed to find expiring documents within ${withinDays} days`, error);
      throw new QueryRepositoryError('Failed to find expiring documents', error);
    }
  }

  async findExpired(): Promise<DocumentDTO[]> {
    try {
      const entities = await this.prisma.document.findMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
          deletedAt: null,
        },
        orderBy: { expiresAt: 'desc' },
        select: this.getDocumentDTOSelect(),
      });

      return entities.map((entity) => this.mapEntityToDTO(entity));
    } catch (error) {
      this.logger.error(`Failed to find expired documents`, error);
      throw new QueryRepositoryError('Failed to find expired documents', error);
    }
  }

  async findOrphaned(): Promise<DocumentDTO[]> {
    try {
      const entities = await this.prisma.document.findMany({
        where: {
          assetId: null,
          willId: null,
          identityForUserId: null,
          deletedAt: null,
          category: {
            notIn: ['IDENTITY_PROOF'],
          },
        },
        select: this.getDocumentDTOSelect(),
      });

      return entities.map((entity) => this.mapEntityToDTO(entity));
    } catch (error) {
      this.logger.error(`Failed to find orphaned documents`, error);
      throw new QueryRepositoryError('Failed to find orphaned documents', error);
    }
  }

  // ============================================================================
  // VALIDATION & CHECK QUERIES
  // ============================================================================

  async exists(id: DocumentId): Promise<boolean> {
    try {
      const count = await this.prisma.document.count({
        where: { id: id.value, deletedAt: null },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check document existence for ID ${id.value}`, error);
      throw new QueryRepositoryError('Failed to check document existence', error);
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
      this.logger.error(
        `Failed to check access for user ${userId.value} to document ${documentId.value}`,
        error,
      );
      throw new QueryRepositoryError('Failed to check document access', error);
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
      this.logger.error(
        `Failed to check verification status for document ${documentId.value}`,
        error,
      );
      throw new QueryRepositoryError('Failed to check document verification', error);
    }
  }

  async isExpired(documentId: DocumentId): Promise<boolean> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId.value },
        select: { expiresAt: true },
      });

      if (!document?.expiresAt) {
        return false;
      }
      return document.expiresAt < new Date();
    } catch (error) {
      this.logger.error(`Failed to check expiration for document ${documentId.value}`, error);
      throw new QueryRepositoryError('Failed to check document expiration', error);
    }
  }

  // ============================================================================
  // ANALYTICS & STATISTICS
  // ============================================================================

  async getStats(filters?: FindDocumentsFilters): Promise<DocumentStats> {
    try {
      const where = filters ? this.buildWhereClause(filters) : { deletedAt: null };

      const [
        total,
        byStatusRaw,
        byCategoryRaw,
        sizeStats,
        encryptedCount,
        publicCount,
        expiredCount,
      ] = await this.prisma.$transaction([
        this.prisma.document.count({ where }),
        this.prisma.document.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
          orderBy: { status: 'asc' },
        }),
        this.prisma.document.groupBy({
          by: ['category'],
          where,
          _count: { _all: true },
          orderBy: { status: 'asc' },
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
            expiresAt: { lt: new Date() },
          },
        }),
      ]);

      // ✅ Explicitly type these to satisfy ESLint + TS
      const byStatus = (byStatusRaw as Array<{ status: string; _count: { _all: number } }>).reduce(
        (acc, item) => {
          acc[item.status] = item._count?._all ?? 0;
          return acc;
        },
        {} as Record<string, number>,
      );

      const byCategory = (
        byCategoryRaw as Array<{ category: string; _count: { _all: number } }>
      ).reduce(
        (acc, item) => {
          acc[item.category] = item._count?._all ?? 0;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        total,
        byStatus,
        byCategory,
        totalSizeBytes: sizeStats._sum?.sizeBytes ?? 0,
        averageSizeBytes: Math.round(sizeStats._avg?.sizeBytes ?? 0),
        encrypted: encryptedCount,
        public: publicCount,
        expired: expiredCount,
      };
    } catch (error) {
      this.logger.error(`Failed to get document statistics`, error);
      throw new QueryRepositoryError('Failed to get document stats', error);
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
          orderBy: { category: 'asc' },
        }),
        this.prisma.document.groupBy({
          by: ['storageProvider'],
          where,
          _sum: { sizeBytes: true },
          orderBy: { storageProvider: 'asc' },
        }),
        this.prisma.document.groupBy({
          by: ['uploaderId'],
          where,
          _sum: { sizeBytes: true },
          _count: { _all: true },
          orderBy: { uploaderId: 'asc' },
        }),
      ]);

      return {
        totalSizeBytes: totalSize._sum?.sizeBytes ?? 0,
        byCategory: byCategory.reduce(
          (acc, item) => {
            acc[item.category] = item._sum?.sizeBytes ?? 0;
            return acc;
          },
          {} as Record<string, number>,
        ),
        byStorageProvider: byProvider.reduce(
          (acc, item) => {
            acc[item.storageProvider] = item._sum?.sizeBytes ?? 0;
            return acc;
          },
          {} as Record<string, number>,
        ),
        byUser: byUser.map((item) => ({
          userId: item.uploaderId,
          totalBytes: item._sum?.sizeBytes ?? 0,
          documentCount: item._count?._all ?? 0,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get storage statistics`, error);
      throw new QueryRepositoryError('Failed to get storage stats', error);
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
      this.logger.error(`Failed to get verification metrics`, error);
      throw new QueryRepositoryError('Failed to get verification metrics', error);
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
          _count: { _all: true },
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
            acc[item.category] = item._count._all;
            return acc;
          },
          {} as Record<string, number>,
        ),
        byDay,
      };
    } catch (error) {
      this.logger.error(`Failed to get upload statistics`, error);
      throw new QueryRepositoryError('Failed to get upload stats', error);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private getDocumentDTOSelect(): Prisma.DocumentSelect {
    return {
      id: true,
      filename: true,
      sizeBytes: true,
      mimeType: true,
      category: true,
      status: true,
      uploaderId: true,
      verifiedBy: true,
      verifiedAt: true,
      rejectionReason: true,
      assetId: true,
      willId: true,
      identityForUserId: true,
      documentNumber: true,
      issueDate: true,
      expiryDate: true,
      isPublic: true,
      isIndexed: true,
      version: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    };
  }

  private mapEntityToDTO(entity: DocumentDtoPayload): DocumentDTO {
    return {
      id: entity.id,
      fileName: entity.filename,
      fileSize: entity.sizeBytes,
      mimeType: entity.mimeType,
      category: entity.category,
      status: entity.status,
      uploaderId: entity.uploaderId,
      verifiedBy: entity.verifiedBy,
      verifiedAt: entity.verifiedAt,
      rejectionReason: entity.rejectionReason,
      assetId: entity.assetId,
      willId: entity.willId,
      identityForUserId: entity.identityForUserId,
      documentNumber: entity.documentNumber,
      issueDate: entity.issueDate,
      expiryDate: entity.expiryDate,
      isPublic: entity.isPublic,
      isIndexed: entity.isIndexed,
      version: entity.version,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

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
      where.createdAt = {
        ...(filters.createdAfter && { gte: filters.createdAfter }),
        ...(filters.createdBefore && { lte: filters.createdBefore }),
      };
    }

    if (filters.updatedAfter || filters.updatedBefore) {
      where.updatedAt = {
        ...(filters.updatedAfter && { gte: filters.updatedAfter }),
        ...(filters.updatedBefore && { lte: filters.updatedBefore }),
      };
    }

    if (filters.hasExpired !== undefined) {
      if (filters.hasExpired) {
        where.expiresAt = { lt: new Date() };
      } else {
        where.OR = [{ expiresAt: null }, { expiresAt: { gte: new Date() } }];
      }
    }

    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    return where;
  }

  private buildSearchWhereClause(options: DocumentSearchOptions): Prisma.DocumentWhereInput {
    const where: Prisma.DocumentWhereInput = { deletedAt: null };

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

  private buildOrderBy(pagination: PaginationOptions): Prisma.DocumentOrderByWithRelationInput {
    if (!pagination.sortBy) {
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
