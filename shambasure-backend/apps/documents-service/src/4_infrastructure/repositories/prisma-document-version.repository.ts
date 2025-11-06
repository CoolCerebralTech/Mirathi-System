import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { Prisma } from '@prisma/client';

import {
  IDocumentVersionRepository,
  FindDocumentVersionsFilters,
  VersionQueryOptions,
  VersionStorageStats,
  VersionComparison,
} from '../../3_domain/interfaces';
import { DocumentVersion } from '../../3_domain/models/document-version.model';
import { DuplicateVersionError } from '../../3_domain/models/document-version.model';
import { DocumentVersionId, DocumentId, UserId } from '../../3_domain/value-objects';
import { DocumentVersionMapper } from '../mappers/document-version.mapper';
import { DocumentVersionEntity } from '../entities/document-version.entity';

/**
 * Repository-specific errors
 */
export class VersionRepositoryError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'VersionRepositoryError';
  }
}

export class VersionNotFoundError extends VersionRepositoryError {
  constructor(versionId: DocumentVersionId) {
    super(`Document version not found: ${versionId.value}`);
    this.name = 'VersionNotFoundError';
  }
}

@Injectable()
export class PrismaDocumentVersionRepository implements IDocumentVersionRepository {
  private readonly logger = new Logger(PrismaDocumentVersionRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // CORE PERSISTENCE
  // ============================================================================

  async save(version: DocumentVersion): Promise<void> {
    try {
      const entity = DocumentVersionMapper.toPersistence(version);

      await this.prisma.documentVersion.create({
        data: {
          ...entity,
          createdAt: version.createdAt, // Use domain entity's createdAt
        },
      });

      this.logger.debug(`Version saved: ${version.id.value} (v${version.versionNumber})`);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DuplicateVersionError(version.documentId, version.versionNumber);
      }
      if (error instanceof Error) {
        this.logger.error(`Failed to save version: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to save version', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while saving a version');
    }
  }

  async saveMany(versions: DocumentVersion[]): Promise<void> {
    try {
      const entities = DocumentVersionMapper.toPersistenceMany(versions);

      await this.prisma.$transaction(
        entities.map((entity, index) =>
          this.prisma.documentVersion.create({
            data: {
              ...entity,
              createdAt: versions[index].createdAt, // Use domain entity's createdAt
            },
          }),
        ),
      );

      this.logger.log(`Saved ${versions.length} versions in transaction`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to save versions in batch: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to save versions in batch', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while saving versions in batch');
    }
  }

  // ============================================================================
  // CORE FINDERS
  // ============================================================================

  async findById(id: DocumentVersionId): Promise<DocumentVersion | null> {
    try {
      const entity = await this.prisma.documentVersion.findUnique({
        where: { id: id.value },
      });

      if (!entity) return null;

      return DocumentVersionMapper.toDomain(entity as DocumentVersionEntity);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find version by ID: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to find version by ID', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while finding a version by ID');
    }
  }

  async findByDocumentIdAndVersionNumber(
    documentId: DocumentId,
    versionNumber: number,
  ): Promise<DocumentVersion | null> {
    try {
      const entity = await this.prisma.documentVersion.findUnique({
        where: {
          documentId_versionNumber: {
            documentId: documentId.value,
            versionNumber,
          },
        },
      });

      if (!entity) return null;

      return DocumentVersionMapper.toDomain(entity as DocumentVersionEntity);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find version: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to find version', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while finding a version');
    }
  }

  async findAllByDocumentId(
    documentId: DocumentId,
    options?: VersionQueryOptions,
  ): Promise<DocumentVersion[]> {
    try {
      const entities = await this.prisma.documentVersion.findMany({
        where: { documentId: documentId.value },
        orderBy: this.buildOrderBy(options),
        take: options?.limit,
        skip: options?.offset,
      });

      return DocumentVersionMapper.toDomainMany(entities as DocumentVersionEntity[]);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find versions by document: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to find versions by document', error);
      }
      throw new VersionRepositoryError(
        'An unknown error occurred while finding versions by document',
      );
    }
  }

  async findMany(
    filters: FindDocumentVersionsFilters,
    options?: VersionQueryOptions,
  ): Promise<DocumentVersion[]> {
    try {
      const where = this.buildWhereClause(filters);

      const entities = await this.prisma.documentVersion.findMany({
        where,
        orderBy: this.buildOrderBy(options),
        take: options?.limit,
        skip: options?.offset,
      });

      return DocumentVersionMapper.toDomainMany(entities as DocumentVersionEntity[]);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find versions: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to find versions', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while finding versions');
    }
  }

  async findLatestForDocument(documentId: DocumentId): Promise<DocumentVersion | null> {
    try {
      const entity = await this.prisma.documentVersion.findFirst({
        where: { documentId: documentId.value },
        orderBy: { versionNumber: 'desc' },
      });

      if (!entity) return null;

      return DocumentVersionMapper.toDomain(entity as DocumentVersionEntity);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find latest version: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to find latest version', error);
      }
      throw new VersionRepositoryError(
        'An unknown error occurred while finding the latest version',
      );
    }
  }

  async findInitialForDocument(documentId: DocumentId): Promise<DocumentVersion | null> {
    try {
      const entity = await this.prisma.documentVersion.findFirst({
        where: {
          documentId: documentId.value,
          versionNumber: 1,
        },
      });

      if (!entity) return null;

      return DocumentVersionMapper.toDomain(entity as DocumentVersionEntity);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find initial version: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to find initial version', error);
      }
      throw new VersionRepositoryError(
        'An unknown error occurred while finding the initial version',
      );
    }
  }

  async findVersionRange(
    documentId: DocumentId,
    startVersion: number,
    endVersion: number,
  ): Promise<DocumentVersion[]> {
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
      });

      return DocumentVersionMapper.toDomainMany(entities as DocumentVersionEntity[]);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find version range: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to find version range', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while finding a version range');
    }
  }

  async findByIds(ids: DocumentVersionId[]): Promise<DocumentVersion[]> {
    try {
      const entities = await this.prisma.documentVersion.findMany({
        where: {
          id: { in: ids.map((id) => id.value) },
        },
      });

      // Preserve order of requested IDs
      const versionMap = new Map(
        entities.map((entity) => [
          entity.id,
          DocumentVersionMapper.toDomain(entity as DocumentVersionEntity),
        ]),
      );

      return ids
        .map((id) => versionMap.get(id.value))
        .filter((version): version is DocumentVersion => version !== undefined);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find versions by IDs: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to find versions by IDs', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while finding versions by IDs');
    }
  }

  async findByUploader(userId: UserId, options?: VersionQueryOptions): Promise<DocumentVersion[]> {
    try {
      const entities = await this.prisma.documentVersion.findMany({
        where: { uploadedBy: userId.value },
        orderBy: this.buildOrderBy(options),
        take: options?.limit,
        skip: options?.offset,
      });

      return DocumentVersionMapper.toDomainMany(entities as DocumentVersionEntity[]);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find versions by uploader: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to find versions by uploader', error);
      }
      throw new VersionRepositoryError(
        'An unknown error occurred while finding versions by uploader',
      );
    }
  }

  // ============================================================================
  // VALIDATION & CHECKS
  // ============================================================================

  async exists(id: DocumentVersionId): Promise<boolean> {
    try {
      const count = await this.prisma.documentVersion.count({
        where: { id: id.value },
      });
      return count > 0;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to check version existence: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to check version existence', error);
      }
      throw new VersionRepositoryError(
        'An unknown error occurred while checking version existence',
      );
    }
  }

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
      if (error instanceof Error) {
        this.logger.error(
          `Failed to check version existence for document: ${error.message}`,
          error.stack,
        );
        throw new VersionRepositoryError('Failed to check version existence for document', error);
      }
      throw new VersionRepositoryError(
        'An unknown error occurred while checking version existence for document',
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
      if (error instanceof Error) {
        this.logger.error(`Failed to get next version number: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to get next version number', error);
      }
      throw new VersionRepositoryError(
        'An unknown error occurred while getting the next version number',
      );
    }
  }

  async canCreateVersion(documentId: DocumentId, versionNumber: number): Promise<boolean> {
    try {
      const nextVersion = await this.getNextVersionNumber(documentId);
      return versionNumber === nextVersion;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to validate version creation: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to validate version creation', error);
      }
      throw new VersionRepositoryError(
        'An unknown error occurred while validating version creation',
      );
    }
  }

  // ============================================================================
  // STATISTICS & ANALYTICS
  // ============================================================================

  async countForDocument(documentId: DocumentId): Promise<number> {
    try {
      return await this.prisma.documentVersion.count({
        where: { documentId: documentId.value },
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to count versions: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to count versions', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while counting versions');
    }
  }

  async getTotalStorageUsageForDocument(documentId: DocumentId): Promise<number> {
    try {
      const result = await this.prisma.documentVersion.aggregate({
        where: { documentId: documentId.value },
        _sum: { sizeBytes: true },
      });

      return result._sum.sizeBytes || 0;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get storage usage: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to get storage usage', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while getting storage usage');
    }
  }

  async getStorageStatsForDocument(documentId: DocumentId): Promise<VersionStorageStats> {
    try {
      const [versions, sizeStats, dateStats] = await Promise.all([
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
        totalVersions: versions,
        totalSizeBytes: sizeStats._sum.sizeBytes || 0,
        averageSizeBytes: Math.round(sizeStats._avg.sizeBytes || 0),
        oldestVersion: dateStats._min.createdAt || new Date(),
        newestVersion: dateStats._max.createdAt || new Date(),
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get storage stats: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to get storage stats', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while getting storage stats');
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
          _count: true,
        }),
        this.prisma.documentVersion.aggregate({
          _sum: { sizeBytes: true },
        }),
        this.prisma.documentVersion.groupBy({
          by: ['documentId'],
          _count: true,
          orderBy: { _count: { versionNumber: 'desc' } },
          take: 10,
        }),
        this.prisma.documentVersion.groupBy({
          by: ['documentId'],
          _sum: { sizeBytes: true },
          orderBy: { _sum: { sizeBytes: 'desc' } },
          take: 10,
        }),
      ]);

      return {
        totalVersions,
        totalDocuments: uniqueDocs.length,
        totalSizeBytes: sizeSum._sum.sizeBytes || 0,
        averageVersionsPerDocument: uniqueDocs.length > 0 ? totalVersions / uniqueDocs.length : 0,
        topDocumentsByVersionCount: byVersionCount.map((item) => ({
          documentId: item.documentId,
          versionCount: item._count,
        })),
        topDocumentsBySize: bySize.map((item) => ({
          documentId: item.documentId,
          totalBytes: item._sum.sizeBytes || 0,
        })),
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get global storage stats: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to get global storage stats', error);
      }
      throw new VersionRepositoryError(
        'An unknown error occurred while getting global storage stats',
      );
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
          _count: true,
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
            acc[item.uploadedBy] = item._count;
            return acc;
          },
          {} as Record<string, number>,
        ),
        averageVersionsPerDay: total / daysDiff,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get version activity stats: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to get version activity stats', error);
      }
      throw new VersionRepositoryError(
        'An unknown error occurred while getting version activity stats',
      );
    }
  }

  async compareVersions(
    versionId1: DocumentVersionId,
    versionId2: DocumentVersionId,
  ): Promise<VersionComparison> {
    try {
      const [version1, version2] = await Promise.all([
        this.findById(versionId1),
        this.findById(versionId2),
      ]);

      if (!version1 || !version2) {
        throw new VersionRepositoryError('One or both versions not found for comparison');
      }

      if (!version1.belongsToDocument(version2.documentId)) {
        throw new VersionRepositoryError('Cannot compare versions from different documents');
      }

      const isV1Newer = version1.isNewerThan(version2);
      const olderVersion = isV1Newer ? version2 : version1;
      const newerVersion = isV1Newer ? version1 : version2;

      const sizeDifference = newerVersion.fileSize.sizeInBytes - olderVersion.fileSize.sizeInBytes;
      const timeDifference =
        (newerVersion.createdAt.getTime() - olderVersion.createdAt.getTime()) / (1000 * 60 * 60);

      return {
        olderVersionId: olderVersion.id,
        newerVersionId: newerVersion.id,
        sizeDifference,
        timeDifference,
        uploaderChanged: !olderVersion.wasUploadedBy(newerVersion.uploadedBy),
      };
    } catch (error) {
      // Preserve re-throwing specific repository errors
      if (error instanceof VersionRepositoryError) {
        throw error;
      }
      if (error instanceof Error) {
        this.logger.error(`Failed to compare versions: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to compare versions', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while comparing versions');
    }
  }

  // ============================================================================
  // MAINTENANCE OPERATIONS
  // ============================================================================

  async pruneOldVersions(documentId: DocumentId, keepLatest: number): Promise<number> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const versions = await tx.documentVersion.findMany({
          where: { documentId: documentId.value },
          orderBy: { versionNumber: 'desc' },
          select: { id: true, versionNumber: true },
        });

        if (versions.length <= keepLatest) return 0;

        const toDelete = versions.slice(keepLatest).map((v) => v.id);

        const result = await tx.documentVersion.deleteMany({
          where: {
            id: { in: toDelete },
          },
        });

        this.logger.log(
          `Pruned ${result.count} old versions for document ${documentId.value}, keeping ${keepLatest} latest`,
        );
        return result.count;
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to prune old versions: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to prune old versions', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while pruning old versions');
    }
  }

  async deleteAllForDocument(documentId: DocumentId): Promise<number> {
    try {
      const result = await this.prisma.documentVersion.deleteMany({
        where: { documentId: documentId.value },
      });

      this.logger.log(`Deleted ${result.count} versions for document ${documentId.value}`);
      return result.count;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to delete versions for document: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to delete versions for document', error);
      }
      throw new VersionRepositoryError(
        'An unknown error occurred while deleting versions for a document',
      );
    }
  }

  async findOlderThan(date: Date): Promise<DocumentVersion[]> {
    try {
      const entities = await this.prisma.documentVersion.findMany({
        where: {
          createdAt: { lt: date },
        },
      });

      return DocumentVersionMapper.toDomainMany(entities as DocumentVersionEntity[]);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find old versions: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to find old versions', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while finding old versions');
    }
  }

  async deleteOlderThan(date: Date): Promise<number> {
    try {
      const result = await this.prisma.documentVersion.deleteMany({
        where: {
          createdAt: { lt: date },
        },
      });

      this.logger.log(`Deleted ${result.count} versions older than ${date.toISOString()}`);
      return result.count;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to delete old versions: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to delete old versions', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while deleting old versions');
    }
  }

  async findLargeVersions(minSizeBytes: number): Promise<DocumentVersion[]> {
    try {
      const entities = await this.prisma.documentVersion.findMany({
        where: {
          sizeBytes: { gte: minSizeBytes },
        },
        orderBy: { sizeBytes: 'desc' },
      });

      return DocumentVersionMapper.toDomainMany(entities as DocumentVersionEntity[]);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find large versions: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to find large versions', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while finding large versions');
    }
  }

  async archiveOldVersions(olderThan: Date): Promise<number> {
    try {
      const count = await this.prisma.documentVersion.count({
        where: {
          createdAt: { lt: olderThan },
        },
      });

      this.logger.log(`Would archive ${count} versions older than ${olderThan.toISOString()}`);
      return count;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to archive old versions: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to archive old versions', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while archiving old versions');
    }
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  async deleteMany(ids: DocumentVersionId[]): Promise<number> {
    try {
      const result = await this.prisma.documentVersion.deleteMany({
        where: {
          id: { in: ids.map((id) => id.value) },
        },
      });

      this.logger.log(`Deleted ${result.count} versions`);
      return result.count;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to delete many versions: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to delete many versions', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while deleting many versions');
    }
  }

  async findForDocuments(documentIds: DocumentId[]): Promise<Map<string, DocumentVersion[]>> {
    try {
      const entities = await this.prisma.documentVersion.findMany({
        where: {
          documentId: { in: documentIds.map((id) => id.value) },
        },
        orderBy: { versionNumber: 'desc' },
      });

      const versionsByDoc = new Map<string, DocumentVersion[]>();

      entities.forEach((entity) => {
        const version = DocumentVersionMapper.toDomain(entity as DocumentVersionEntity);
        const docId = entity.documentId;

        if (!versionsByDoc.has(docId)) {
          versionsByDoc.set(docId, []);
        }
        versionsByDoc.get(docId)!.push(version);
      });

      return versionsByDoc;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find versions for documents: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to find versions for documents', error);
      }
      throw new VersionRepositoryError(
        'An unknown error occurred while finding versions for documents',
      );
    }
  }

  async getVersionCountsForDocuments(documentIds: DocumentId[]): Promise<Map<string, number>> {
    try {
      const counts = await this.prisma.documentVersion.groupBy({
        by: ['documentId'],
        where: {
          documentId: { in: documentIds.map((id) => id.value) },
        },
        _count: true,
      });

      const countsMap = new Map<string, number>();
      counts.forEach((item) => {
        countsMap.set(item.documentId, item._count);
      });

      return countsMap;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get version counts: ${error.message}`, error.stack);
        throw new VersionRepositoryError('Failed to get version counts', error);
      }
      throw new VersionRepositoryError('An unknown error occurred while getting version counts');
    }
  }

  // ============================================================================
  // PRIVATE QUERY BUILDERS
  // ============================================================================

  private buildWhereClause(filters: FindDocumentVersionsFilters): Prisma.DocumentVersionWhereInput {
    const where: Prisma.DocumentVersionWhereInput = {};

    if (filters.documentId) where.documentId = filters.documentId.value;
    if (filters.uploadedBy) where.uploadedBy = filters.uploadedBy.value;

    const versionFilter: Prisma.IntFilter = {};
    if (filters.versionNumber) versionFilter.equals = filters.versionNumber;
    if (filters.versionNumberGte) versionFilter.gte = filters.versionNumberGte;
    if (filters.versionNumberLte) versionFilter.lte = filters.versionNumberLte;
    if (Object.keys(versionFilter).length > 0) where.versionNumber = versionFilter;

    if (filters.mimeType) where.mimeType = filters.mimeType.value;

    if (filters.createdAfter || filters.createdBefore) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filters.createdAfter) dateFilter.gte = filters.createdAfter;
      if (filters.createdBefore) dateFilter.lte = filters.createdBefore;
      where.createdAt = dateFilter;
    }

    if (filters.minFileSize || filters.maxFileSize) {
      const sizeFilter: Prisma.IntFilter = {};
      if (filters.minFileSize) sizeFilter.gte = filters.minFileSize;
      if (filters.maxFileSize) sizeFilter.lte = filters.maxFileSize;
      where.sizeBytes = sizeFilter;
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
      case 'fileSize':
        return { sizeBytes: sortOrder };
      case 'createdAt':
        return { createdAt: sortOrder };
      case 'versionNumber':
      default:
        return { versionNumber: sortOrder };
    }
  }
}
