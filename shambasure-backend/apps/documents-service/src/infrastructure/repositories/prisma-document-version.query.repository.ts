import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { Prisma } from '@prisma/client';

import {
  IDocumentVersionQueryRepository,
  DocumentVersionDTO,
  FindDocumentVersionsFilters,
  VersionQueryOptions,
  VersionStorageStats,
} from '../../domain/interfaces';
import { DocumentVersionId, DocumentId, UserId } from '../../domain/value-objects';

type VersionDtoPayload = Prisma.DocumentVersionGetPayload<{
  select: {
    id: true;
    versionNumber: true;
    documentId: true;
    storagePath: true;
    sizeBytes: true;
    mimeType: true;
    checksum: true;
    changeNote: true;
    uploadedBy: true;
    createdAt: true;
  };
}>;
// ============================================================================
// Query Repository Errors
// ============================================================================

export class VersionQueryRepositoryError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'VersionQueryRepositoryError';
  }
}

export class VersionNotFoundError extends VersionQueryRepositoryError {
  constructor(versionId: DocumentVersionId) {
    super(`Document version not found: ${versionId.value}`);
    this.name = 'VersionNotFoundError';
  }
}

// ============================================================================
// Prisma Document Version Query Repository (Pure CQRS Query Side)
// ============================================================================

@Injectable()
export class PrismaDocumentVersionQueryRepository implements IDocumentVersionQueryRepository {
  private readonly logger = new Logger(PrismaDocumentVersionQueryRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // CORE QUERY OPERATIONS
  // ============================================================================

  async findById(id: DocumentVersionId): Promise<DocumentVersionDTO | null> {
    try {
      const entity = await this.prisma.documentVersion.findUnique({
        where: { id: id.value },
        select: this.getVersionDTOSelect(),
      });

      if (!entity) return null;

      return this.mapEntityToDTO(entity);
    } catch (error) {
      this.logger.error(`Failed to find version by ID ${id.value}`, error);
      throw new VersionQueryRepositoryError('Failed to find version by ID', error);
    }
  }

  async findByDocumentIdAndVersionNumber(
    documentId: DocumentId,
    versionNumber: number,
  ): Promise<DocumentVersionDTO | null> {
    try {
      const entity = await this.prisma.documentVersion.findUnique({
        where: {
          documentId_versionNumber: {
            documentId: documentId.value,
            versionNumber,
          },
        },
        select: this.getVersionDTOSelect(),
      });

      if (!entity) return null;

      return this.mapEntityToDTO(entity);
    } catch (error) {
      this.logger.error(
        `Failed to find version ${versionNumber} for document ${documentId.value}`,
        error,
      );
      throw new VersionQueryRepositoryError('Failed to find version', error);
    }
  }

  async findAllByDocumentId(
    documentId: DocumentId,
    options?: VersionQueryOptions,
  ): Promise<DocumentVersionDTO[]> {
    try {
      const entities = await this.prisma.documentVersion.findMany({
        where: { documentId: documentId.value },
        orderBy: this.buildOrderBy(options),
        take: options?.limit,
        skip: options?.offset,
        select: this.getVersionDTOSelect(),
      });

      return entities.map((entity) => this.mapEntityToDTO(entity));
    } catch (error) {
      this.logger.error(`Failed to find versions for document ${documentId.value}`, error);
      throw new VersionQueryRepositoryError('Failed to find versions by document', error);
    }
  }

  async findLatestForDocument(documentId: DocumentId): Promise<DocumentVersionDTO | null> {
    try {
      const entity = await this.prisma.documentVersion.findFirst({
        where: { documentId: documentId.value },
        orderBy: { versionNumber: 'desc' },
        select: this.getVersionDTOSelect(),
      });

      if (!entity) return null;

      return this.mapEntityToDTO(entity);
    } catch (error) {
      this.logger.error(`Failed to find latest version for document ${documentId.value}`, error);
      throw new VersionQueryRepositoryError('Failed to find latest version', error);
    }
  }

  async findMany(
    filters: FindDocumentVersionsFilters,
    options?: VersionQueryOptions,
  ): Promise<DocumentVersionDTO[]> {
    try {
      const where = this.buildWhereClause(filters);

      const entities = await this.prisma.documentVersion.findMany({
        where,
        orderBy: this.buildOrderBy(options),
        take: options?.limit,
        skip: options?.offset,
        select: this.getVersionDTOSelect(),
      });

      return entities.map((entity) => this.mapEntityToDTO(entity));
    } catch (error) {
      this.logger.error(`Failed to find versions with filters`, error);
      throw new VersionQueryRepositoryError('Failed to find versions', error);
    }
  }

  // ============================================================================
  // VALIDATION & CHECK QUERIES
  // ============================================================================

  async existsForDocument(documentId: DocumentId, versionNumber: number): Promise<boolean> {
    try {
      const count = await this.prisma.documentVersion.count({
        where: {
          documentId: documentId.value,
          versionNumber,
        },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(
        `Failed to check version existence for document ${documentId.value} version ${versionNumber}`,
        error,
      );
      throw new VersionQueryRepositoryError(
        'Failed to check version existence for document',
        error,
      );
    }
  }

  async getNextVersionNumber(documentId: DocumentId): Promise<number> {
    try {
      const latest = await this.prisma.documentVersion.findFirst({
        where: { documentId: documentId.value },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
      });

      return latest ? latest.versionNumber + 1 : 1;
    } catch (error) {
      this.logger.error(
        `Failed to get next version number for document ${documentId.value}`,
        error,
      );
      throw new VersionQueryRepositoryError('Failed to get next version number', error);
    }
  }

  async countForDocument(documentId: DocumentId): Promise<number> {
    try {
      return await this.prisma.documentVersion.count({
        where: { documentId: documentId.value },
      });
    } catch (error) {
      this.logger.error(`Failed to count versions for document ${documentId.value}`, error);
      throw new VersionQueryRepositoryError('Failed to count versions', error);
    }
  }

  // ============================================================================
  // STORAGE & ANALYTICS QUERIES
  // ============================================================================

  async getTotalStorageUsageForDocument(documentId: DocumentId): Promise<number> {
    try {
      const result = await this.prisma.documentVersion.aggregate({
        where: { documentId: documentId.value },
        _sum: { sizeBytes: true },
      });

      return result._sum?.sizeBytes || 0;
    } catch (error) {
      this.logger.error(`Failed to get storage usage for document ${documentId.value}`, error);
      throw new VersionQueryRepositoryError('Failed to get storage usage', error);
    }
  }

  async getStorageStatsForDocument(documentId: DocumentId): Promise<VersionStorageStats> {
    try {
      const [totalVersions, sizeStats, dateStats] = await Promise.all([
        this.prisma.documentVersion.count({
          where: { documentId: documentId.value },
        }),
        this.prisma.documentVersion.aggregate({
          where: { documentId: documentId.value },
          _sum: { sizeBytes: true },
          _avg: { sizeBytes: true },
        }),
        this.prisma.documentVersion.aggregate({
          where: { documentId: documentId.value },
          _min: { createdAt: true },
          _max: { createdAt: true },
        }),
      ]);

      return {
        totalVersions,
        totalSizeBytes: sizeStats._sum?.sizeBytes || 0,
        averageSizeBytes: Math.round(sizeStats._avg?.sizeBytes || 0),
        oldestVersionDate: dateStats._min?.createdAt || new Date(),
        newestVersionDate: dateStats._max?.createdAt || new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get storage stats for document ${documentId.value}`, error);
      throw new VersionQueryRepositoryError('Failed to get storage stats', error);
    }
  }

  async getVersionCountsForDocuments(documentIds: DocumentId[]): Promise<Map<string, number>> {
    try {
      const idValues = documentIds.map((id) => id.value);

      const counts = await this.prisma.documentVersion.groupBy({
        by: ['documentId'],
        where: {
          documentId: { in: idValues },
        },
        _count: {
          _all: true,
        },
      });

      const countsMap = new Map<string, number>();
      counts.forEach((item) => {
        countsMap.set(item.documentId, item._count._all);
      });

      // Ensure all requested document IDs are in the map, even if count is 0
      documentIds.forEach((id) => {
        if (!countsMap.has(id.value)) {
          countsMap.set(id.value, 0);
        }
      });

      return countsMap;
    } catch (error) {
      this.logger.error(`Failed to get version counts for ${documentIds.length} documents`, error);
      throw new VersionQueryRepositoryError('Failed to get version counts', error);
    }
  }

  // ============================================================================
  // ENHANCED QUERY OPERATIONS
  // ============================================================================

  async findByUploader(
    userId: UserId,
    options?: VersionQueryOptions,
  ): Promise<DocumentVersionDTO[]> {
    try {
      const entities = await this.prisma.documentVersion.findMany({
        where: { uploadedBy: userId.value },
        orderBy: this.buildOrderBy(options),
        take: options?.limit,
        skip: options?.offset,
        select: this.getVersionDTOSelect(),
      });

      return entities.map((entity) => this.mapEntityToDTO(entity));
    } catch (error) {
      this.logger.error(`Failed to find versions by uploader ${userId.value}`, error);
      throw new VersionQueryRepositoryError('Failed to find versions by uploader', error);
    }
  }

  async findVersionRange(
    documentId: DocumentId,
    startVersion: number,
    endVersion: number,
  ): Promise<DocumentVersionDTO[]> {
    try {
      const entities = await this.prisma.documentVersion.findMany({
        where: {
          documentId: documentId.value,
          versionNumber: {
            gte: startVersion,
            lte: endVersion,
          },
        },
        orderBy: { versionNumber: 'asc' },
        select: this.getVersionDTOSelect(),
      });

      return entities.map((entity) => this.mapEntityToDTO(entity));
    } catch (error) {
      this.logger.error(
        `Failed to find version range ${startVersion}-${endVersion} for document ${documentId.value}`,
        error,
      );
      throw new VersionQueryRepositoryError('Failed to find version range', error);
    }
  }

  async getVersionSequenceInfo(documentId: DocumentId): Promise<{
    currentVersion: number;
    totalVersions: number;
    latestVersionId: string;
    firstVersionId: string;
  }> {
    try {
      const [latest, first, total] = await Promise.all([
        this.prisma.documentVersion.findFirst({
          where: { documentId: documentId.value },
          orderBy: { versionNumber: 'desc' },
          select: { id: true, versionNumber: true },
        }),
        this.prisma.documentVersion.findFirst({
          where: { documentId: documentId.value },
          orderBy: { versionNumber: 'asc' },
          select: { id: true },
        }),
        this.prisma.documentVersion.count({
          where: { documentId: documentId.value },
        }),
      ]);

      return {
        currentVersion: latest?.versionNumber || 0,
        totalVersions: total,
        latestVersionId: latest?.id || '',
        firstVersionId: first?.id || '',
      };
    } catch (error) {
      this.logger.error(
        `Failed to get version sequence info for document ${documentId.value}`,
        error,
      );
      throw new VersionQueryRepositoryError('Failed to get version sequence info', error);
    }
  }

  async getVersionActivityStats(timeRange: { start: Date; end: Date }): Promise<{
    totalVersionsCreated: number;
    byDay: Array<{ date: string; count: number }>;
    byUser: Record<string, number>;
    averageVersionsPerDay: number;
  }> {
    try {
      const where = {
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      };

      const [total, versions, byUser] = await Promise.all([
        this.prisma.documentVersion.count({ where }),
        this.prisma.documentVersion.findMany({
          where,
          select: { createdAt: true, uploadedBy: true },
        }),
        this.prisma.documentVersion.groupBy({
          by: ['uploadedBy'],
          where,
          _count: {
            _all: true,
          },
        }),
      ]);

      const byDayMap = new Map<string, number>();
      versions.forEach((v) => {
        const dateKey = v.createdAt.toISOString().split('T')[0];
        byDayMap.set(dateKey, (byDayMap.get(dateKey) || 0) + 1);
      });

      const byDay = Array.from(byDayMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const daysDiff =
        Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24)) ||
        1;

      return {
        totalVersionsCreated: total,
        byDay,
        byUser: byUser.reduce(
          (acc, item) => {
            acc[item.uploadedBy] = item._count._all;
            return acc;
          },
          {} as Record<string, number>,
        ),
        averageVersionsPerDay: total / daysDiff,
      };
    } catch (error) {
      this.logger.error(`Failed to get version activity stats`, error);
      throw new VersionQueryRepositoryError('Failed to get version activity stats', error);
    }
  }

  async getGlobalStorageStats(): Promise<{
    totalVersions: number;
    totalDocuments: number;
    totalSizeBytes: number;
    averageVersionsPerDocument: number;
    topDocumentsByVersionCount: Array<{ documentId: string; versionCount: number }>;
    topDocumentsBySize: Array<{ documentId: string; totalBytes: number }>;
  }> {
    try {
      const [totalVersions, uniqueDocs, sizeSum, byVersionCount, bySize] = await Promise.all([
        this.prisma.documentVersion.count(),
        this.prisma.documentVersion.groupBy({
          by: ['documentId'],
          _count: { _all: true },
          orderBy: { documentId: 'asc' },
        }),
        this.prisma.documentVersion.aggregate({
          _sum: { sizeBytes: true },
        }),
        this.prisma.documentVersion.groupBy({
          by: ['documentId'],
          _count: { _all: true },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
          take: 10,
        }),
        this.prisma.documentVersion.groupBy({
          by: ['documentId'],
          _sum: { sizeBytes: true },
          orderBy: {
            _sum: {
              sizeBytes: 'desc',
            },
          },
          take: 10,
        }),
      ]);

      return {
        totalVersions,
        totalDocuments: uniqueDocs.length,
        totalSizeBytes: sizeSum._sum?.sizeBytes || 0,
        averageVersionsPerDocument: uniqueDocs.length > 0 ? totalVersions / uniqueDocs.length : 0,
        topDocumentsByVersionCount: byVersionCount.map((item) => ({
          documentId: item.documentId,
          versionCount: item._count?._all ?? 0,
        })),
        topDocumentsBySize: bySize.map((item) => ({
          documentId: item.documentId,
          totalBytes: item._sum?.sizeBytes || 0,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get global storage stats`, error);
      throw new VersionQueryRepositoryError('Failed to get global storage stats', error);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private getVersionDTOSelect(): Prisma.DocumentVersionSelect {
    return {
      id: true,
      versionNumber: true,
      documentId: true,
      storagePath: true,
      sizeBytes: true,
      mimeType: true,
      checksum: true,
      changeNote: true,
      uploadedBy: true,
      createdAt: true,
    };
  }

  private mapEntityToDTO(entity: VersionDtoPayload): DocumentVersionDTO {
    return {
      id: entity.id,
      versionNumber: entity.versionNumber,
      documentId: entity.documentId,
      fileSize: entity.sizeBytes,
      mimeType: entity.mimeType,
      checksum: entity.checksum,
      changeNote: entity.changeNote,
      uploadedBy: entity.uploadedBy,
      createdAt: entity.createdAt,
    };
  }

  private buildWhereClause(filters: FindDocumentVersionsFilters): Prisma.DocumentVersionWhereInput {
    const where: Prisma.DocumentVersionWhereInput = {};

    if (filters.documentId) where.documentId = filters.documentId.value;
    if (filters.uploadedBy) where.uploadedBy = filters.uploadedBy.value;

    if (filters.versionNumber !== undefined) {
      where.versionNumber = filters.versionNumber;
    }

    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {
        ...(filters.createdAfter && { gte: filters.createdAfter }),
        ...(filters.createdBefore && { lte: filters.createdBefore }),
      };
    }

    return where;
  }

  private buildOrderBy(
    options?: VersionQueryOptions,
  ): Prisma.DocumentVersionOrderByWithRelationInput {
    if (!options?.sortBy) {
      return { versionNumber: 'desc' };
    }

    const sortOrder = options.sortOrder || 'desc';

    switch (options.sortBy) {
      case 'versionNumber':
        return { versionNumber: sortOrder };
      case 'fileSize':
        return { sizeBytes: sortOrder };
      case 'createdAt':
      default:
        return { createdAt: sortOrder };
    }
  }
}
