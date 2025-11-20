import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { Prisma } from '@prisma/client';

import {
  IDocumentVerificationAttemptQueryRepository,
  DocumentVerificationAttemptDTO,
  FindVerificationAttemptsFilters,
  VerificationQueryOptions,
  VerifierPerformance,
  DocumentVerificationHistory,
  VerificationTimelineEntry,
  VerificationComplianceAudit,
  VerificationMetrics,
} from '../../domain/interfaces';
import { VerificationAttemptId, DocumentId, UserId } from '../../domain/value-objects';

type VerificationDtoPayload = Prisma.DocumentVerificationAttemptGetPayload<{
  select: {
    id: true;
    documentId: true;
    verifierId: true;
    status: true;
    reason: true;
    metadata: true;
    createdAt: true;
  };
}>;
// ============================================================================
// Query Repository Errors
// ============================================================================

export class VerificationQueryRepositoryError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'VerificationQueryRepositoryError';
  }
}

export class VerificationAttemptNotFoundError extends VerificationQueryRepositoryError {
  constructor(attemptId: VerificationAttemptId) {
    super(`Verification attempt not found: ${attemptId.value}`);
    this.name = 'VerificationAttemptNotFoundError';
  }
}

// ============================================================================
// Prisma Document Verification Query Repository (Pure CQRS Query Side)
// ============================================================================

@Injectable()
export class PrismaDocumentVerificationQueryRepository
  implements IDocumentVerificationAttemptQueryRepository
{
  private readonly logger = new Logger(PrismaDocumentVerificationQueryRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // CORE QUERY OPERATIONS (Required by Interface)
  // ============================================================================

  async findById(id: VerificationAttemptId): Promise<DocumentVerificationAttemptDTO | null> {
    try {
      const entity = await this.prisma.documentVerificationAttempt.findUnique({
        where: { id: id.value },
        select: this.getVerificationDTOSelect(),
      });

      if (!entity) return null;

      return this.mapEntityToDTO(entity);
    } catch (error) {
      this.logger.error(`Failed to find verification attempt by ID ${id.value}`, error);
      throw new VerificationQueryRepositoryError(
        'Failed to find verification attempt by ID',
        error,
      );
    }
  }

  async findLatestForDocument(
    documentId: DocumentId,
  ): Promise<DocumentVerificationAttemptDTO | null> {
    try {
      const entity = await this.prisma.documentVerificationAttempt.findFirst({
        where: { documentId: documentId.value },
        orderBy: { createdAt: 'desc' },
        select: this.getVerificationDTOSelect(),
      });

      if (!entity) return null;

      return this.mapEntityToDTO(entity);
    } catch (error) {
      this.logger.error(
        `Failed to find latest verification attempt for document ${documentId.value}`,
        error,
      );
      throw new VerificationQueryRepositoryError('Failed to find latest attempt', error);
    }
  }

  async findAllForDocument(
    documentId: DocumentId,
    options?: VerificationQueryOptions,
  ): Promise<DocumentVerificationAttemptDTO[]> {
    try {
      const entities = await this.prisma.documentVerificationAttempt.findMany({
        where: { documentId: documentId.value },
        orderBy: this.buildOrderBy(options),
        take: options?.limit,
        skip: options?.offset,
        select: this.getVerificationDTOSelect(),
      });

      return entities.map((entity) => this.mapEntityToDTO(entity));
    } catch (error) {
      this.logger.error(
        `Failed to find verification attempts for document ${documentId.value}`,
        error,
      );
      throw new VerificationQueryRepositoryError('Failed to find attempts for document', error);
    }
  }

  async findMany(
    filters: FindVerificationAttemptsFilters,
    options?: VerificationQueryOptions,
  ): Promise<DocumentVerificationAttemptDTO[]> {
    try {
      const where = this.buildWhereClause(filters);

      const entities = await this.prisma.documentVerificationAttempt.findMany({
        where,
        orderBy: this.buildOrderBy(options),
        take: options?.limit,
        skip: options?.offset,
        select: this.getVerificationDTOSelect(),
      });

      return entities.map((entity) => this.mapEntityToDTO(entity));
    } catch (error) {
      this.logger.error(`Failed to find verification attempts with filters`, error);
      throw new VerificationQueryRepositoryError('Failed to find verification attempts', error);
    }
  }

  async findByVerifier(
    verifierId: UserId,
    options?: VerificationQueryOptions,
  ): Promise<DocumentVerificationAttemptDTO[]> {
    try {
      const entities = await this.prisma.documentVerificationAttempt.findMany({
        where: { verifierId: verifierId.value },
        orderBy: this.buildOrderBy(options),
        take: options?.limit,
        skip: options?.offset,
        select: this.getVerificationDTOSelect(),
      });

      return entities.map((entity) => this.mapEntityToDTO(entity));
    } catch (error) {
      this.logger.error(
        `Failed to find verification attempts by verifier ${verifierId.value}`,
        error,
      );
      throw new VerificationQueryRepositoryError('Failed to find attempts by verifier', error);
    }
  }

  async hasVerifierAttempted(documentId: DocumentId, verifierId: UserId): Promise<boolean> {
    try {
      const count = await this.prisma.documentVerificationAttempt.count({
        where: {
          documentId: documentId.value,
          verifierId: verifierId.value,
        },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(
        `Failed to check if verifier ${verifierId.value} attempted document ${documentId.value}`,
        error,
      );
      throw new VerificationQueryRepositoryError('Failed to check verifier attempt', error);
    }
  }

  async countForDocument(documentId: DocumentId): Promise<number> {
    try {
      return await this.prisma.documentVerificationAttempt.count({
        where: { documentId: documentId.value },
      });
    } catch (error) {
      this.logger.error(
        `Failed to count verification attempts for document ${documentId.value}`,
        error,
      );
      throw new VerificationQueryRepositoryError('Failed to count attempts', error);
    }
  }

  async getAttemptCountsForDocuments(documentIds: DocumentId[]): Promise<Map<string, number>> {
    try {
      const idValues = documentIds.map((id) => id.value);

      const counts = await this.prisma.documentVerificationAttempt.groupBy({
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
      this.logger.error(`Failed to get attempt counts for ${documentIds.length} documents`, error);
      throw new VerificationQueryRepositoryError('Failed to get attempt counts', error);
    }
  }

  // ============================================================================
  // ENHANCED ANALYTICS OPERATIONS (Optional - for advanced reporting)
  // ============================================================================

  async getVerificationMetrics(timeRange: {
    start: Date;
    end: Date;
  }): Promise<VerificationMetrics> {
    try {
      const where = {
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      };

      const [totalAttempts, verified, rejected, pending, attempts] = await Promise.all([
        this.prisma.documentVerificationAttempt.count({ where }),
        this.prisma.documentVerificationAttempt.count({
          where: { ...where, status: 'VERIFIED' },
        }),
        this.prisma.documentVerificationAttempt.count({
          where: { ...where, status: 'REJECTED' },
        }),
        this.prisma.document.count({
          where: {
            createdAt: { gte: timeRange.start, lte: timeRange.end },
            status: 'PENDING_VERIFICATION',
            deletedAt: null,
          },
        }),
        this.prisma.documentVerificationAttempt.findMany({
          where: {
            ...where,
            status: { in: ['VERIFIED', 'REJECTED'] },
          },
          select: {
            createdAt: true,
            verifierId: true,
            status: true,
            document: {
              select: {
                createdAt: true,
              },
            },
          },
        }),
      ]);

      // Calculate average verification time
      const verificationTimes = attempts
        .filter((attempt) => attempt.document)
        .map(
          (attempt) =>
            (attempt.createdAt.getTime() - attempt.document.createdAt.getTime()) / (1000 * 60 * 60),
        );

      const averageVerificationTimeHours =
        verificationTimes.length > 0
          ? verificationTimes.reduce((a, b) => a + b, 0) / verificationTimes.length
          : 0;

      // Calculate by verifier
      const byVerifier: Record<string, { verified: number; rejected: number }> = {};
      attempts.forEach((attempt) => {
        if (attempt.verifierId) {
          if (!byVerifier[attempt.verifierId]) {
            byVerifier[attempt.verifierId] = { verified: 0, rejected: 0 };
          }
          if (attempt.status === 'VERIFIED') {
            byVerifier[attempt.verifierId].verified++;
          } else {
            byVerifier[attempt.verifierId].rejected++;
          }
        }
      });

      return {
        totalAttempts,
        totalVerified: verified,
        totalRejected: rejected,
        totalPending: pending,
        averageVerificationTimeHours,
        byVerifier,
      };
    } catch (error) {
      this.logger.error(`Failed to get verification metrics`, error);
      throw new VerificationQueryRepositoryError('Failed to get verification metrics', error);
    }
  }

  async getVerifierPerformance(
    verifierId: UserId,
    timeRange?: { start: Date; end: Date },
  ): Promise<VerifierPerformance> {
    try {
      const where: Prisma.DocumentVerificationAttemptWhereInput = { verifierId: verifierId.value };
      if (timeRange) {
        where.createdAt = {
          gte: timeRange.start,
          lte: timeRange.end,
        };
      }

      const [attempts, rejectedReasons, lastActivity] = await Promise.all([
        this.prisma.documentVerificationAttempt.findMany({
          where,
          select: {
            createdAt: true,
            status: true,
            document: {
              select: {
                createdAt: true,
              },
            },
          },
        }),
        this.prisma.documentVerificationAttempt.groupBy({
          by: ['reason'],
          where: {
            ...where,
            status: 'REJECTED',
            reason: { not: null },
          },
          _count: {
            _all: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
          take: 5,
        }),
        this.prisma.documentVerificationAttempt.findFirst({
          where: { verifierId: verifierId.value },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

      const totalAttempts = attempts.length;
      const verified = attempts.filter((a) => a.status === 'VERIFIED').length;
      const rejected = attempts.filter((a) => a.status === 'REJECTED').length;

      const processingTimes = attempts
        .filter((a) => a.document)
        .map((a) => (a.createdAt.getTime() - a.document.createdAt.getTime()) / (1000 * 60 * 60));

      const averageProcessingTimeHours =
        processingTimes.length > 0
          ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
          : 0;

      return {
        verifierId: verifierId.value,
        totalAttempts,
        verified,
        rejected,
        averageProcessingTimeHours,
        commonRejectionReasons: rejectedReasons.map((item) => ({
          reason: item.reason || 'Unknown',
          count: item._count?._all ?? 0,
        })),
        lastActive: lastActivity?.createdAt || new Date(0),
      };
    } catch (error) {
      this.logger.error(`Failed to get verifier performance for ${verifierId.value}`, error);
      throw new VerificationQueryRepositoryError('Failed to get verifier performance', error);
    }
  }

  async getDocumentVerificationHistory(
    documentId: DocumentId,
  ): Promise<DocumentVerificationHistory> {
    try {
      const [attempts, document] = await Promise.all([
        this.findAllForDocument(documentId, { sortBy: 'createdAt', sortOrder: 'asc' }),
        this.prisma.document.findUnique({
          where: { id: documentId.value },
          select: { filename: true, status: true },
        }),
      ]);

      if (!document) {
        throw new VerificationQueryRepositoryError(`Document ${documentId.value} not found`);
      }

      const verificationTimeline = attempts.map((attempt) => ({
        attemptId: attempt.id,
        verifierId: attempt.verifierId,
        status: attempt.status,
        reason: attempt.reason,
        createdAt: attempt.createdAt,
      }));

      const firstVerifiedAt = attempts.find((a) => a.status === 'VERIFIED')?.createdAt || null;
      const lastVerifiedAt =
        attempts
          .filter((a) => a.status === 'VERIFIED')
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt || null;

      return {
        documentId: documentId.value,
        documentName: document.filename,
        totalAttempts: attempts.length,
        currentStatus: document.status,
        verificationTimeline,
        firstVerifiedAt,
        lastVerifiedAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get verification history for document ${documentId.value}`,
        error,
      );
      throw new VerificationQueryRepositoryError(
        'Failed to get document verification history',
        error,
      );
    }
  }

  async getVerificationTimeline(timeRange: {
    start: Date;
    end: Date;
  }): Promise<VerificationTimelineEntry[]> {
    try {
      const attempts = await this.prisma.documentVerificationAttempt.findMany({
        where: {
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
        select: {
          createdAt: true,
          status: true,
        },
      });

      const timelineMap = new Map<string, { verified: number; rejected: number; total: number }>();

      attempts.forEach((attempt) => {
        const dateKey = attempt.createdAt.toISOString().split('T')[0];
        const existing = timelineMap.get(dateKey) || { verified: 0, rejected: 0, total: 0 };

        existing.total++;
        if (attempt.status === 'VERIFIED') existing.verified++;
        if (attempt.status === 'REJECTED') existing.rejected++;

        timelineMap.set(dateKey, existing);
      });

      return Array.from(timelineMap.entries())
        .map(([date, stats]) => ({
          date,
          verified: stats.verified,
          rejected: stats.rejected,
          total: stats.total,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      this.logger.error(`Failed to get verification timeline`, error);
      throw new VerificationQueryRepositoryError('Failed to get verification timeline', error);
    }
  }

  async getComplianceAudit(timeRange: {
    start: Date;
    end: Date;
  }): Promise<VerificationComplianceAudit> {
    try {
      const [totalDocuments, verifiedDocuments, pendingDocuments, attempts, verifiers] =
        await Promise.all([
          this.prisma.document.count({
            where: {
              createdAt: { gte: timeRange.start, lte: timeRange.end },
              deletedAt: null,
            },
          }),
          this.prisma.document.count({
            where: {
              createdAt: { gte: timeRange.start, lte: timeRange.end },
              status: 'VERIFIED',
              deletedAt: null,
            },
          }),
          this.prisma.document.count({
            where: {
              createdAt: { gte: timeRange.start, lte: timeRange.end },
              status: 'PENDING_VERIFICATION',
              deletedAt: null,
            },
          }),
          this.prisma.documentVerificationAttempt.findMany({
            where: {
              createdAt: { gte: timeRange.start, lte: timeRange.end },
              status: { in: ['VERIFIED', 'REJECTED'] },
            },
            select: {
              createdAt: true,
              document: {
                select: {
                  createdAt: true,
                },
              },
            },
          }),
          this.prisma.documentVerificationAttempt.groupBy({
            by: ['verifierId'],
            where: {
              createdAt: { gte: timeRange.start, lte: timeRange.end },
            },
            _count: {
              _all: true,
            },
          }),
        ]);

      // Calculate average verification time
      const verificationTimes = attempts
        .filter((attempt) => attempt.document)
        .map(
          (attempt) =>
            (attempt.createdAt.getTime() - attempt.document.createdAt.getTime()) / (1000 * 60 * 60),
        );

      const averageVerificationTime =
        verificationTimes.length > 0
          ? verificationTimes.reduce((a, b) => a + b, 0) / verificationTimes.length
          : 0;

      const complianceRate = totalDocuments > 0 ? (verifiedDocuments / totalDocuments) * 100 : 0;

      const verifierActivity = await Promise.all(
        verifiers.map(async (verifier) => {
          const lastActivity = await this.prisma.documentVerificationAttempt.findFirst({
            where: { verifierId: verifier.verifierId },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          });

          return {
            verifierId: verifier.verifierId,
            activityCount: verifier._count._all,
            lastActivity: lastActivity?.createdAt || new Date(0),
          };
        }),
      );

      return {
        timeRange,
        totalDocuments,
        verifiedDocuments,
        pendingDocuments,
        averageVerificationTime,
        complianceRate,
        verifierActivity: verifierActivity.sort((a, b) => b.activityCount - a.activityCount),
      };
    } catch (error) {
      this.logger.error(`Failed to get compliance audit`, error);
      throw new VerificationQueryRepositoryError('Failed to get compliance audit', error);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  private getVerificationDTOSelect(): Prisma.DocumentVerificationAttemptSelect {
    return {
      id: true,
      documentId: true,
      verifierId: true,
      status: true,
      reason: true,
      metadata: true,
      createdAt: true,
    };
  }

  private mapEntityToDTO(entity: VerificationDtoPayload): DocumentVerificationAttemptDTO {
    return {
      id: entity.id,
      documentId: entity.documentId,
      verifierId: entity.verifierId,
      status: entity.status,
      reason: entity.reason,
      metadata:
        entity.metadata && typeof entity.metadata === 'object'
          ? (entity.metadata as Record<string, any>)
          : null,
      createdAt: entity.createdAt,
    };
  }

  private buildWhereClause(
    filters: FindVerificationAttemptsFilters,
  ): Prisma.DocumentVerificationAttemptWhereInput {
    const where: Prisma.DocumentVerificationAttemptWhereInput = {};

    if (filters.documentId) where.documentId = filters.documentId.value;
    if (filters.verifierId) where.verifierId = filters.verifierId.value;
    if (filters.status) where.status = filters.status.value;

    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {
        ...(filters.createdAfter && { gte: filters.createdAfter }),
        ...(filters.createdBefore && { lte: filters.createdBefore }),
      };
    }

    if (filters.reason !== undefined) {
      if (filters.reason === null) {
        where.reason = null;
      } else {
        where.reason = { not: null };
      }
    }

    return where;
  }

  private buildOrderBy(
    options?: VerificationQueryOptions,
  ): Prisma.DocumentVerificationAttemptOrderByWithRelationInput {
    if (!options?.sortBy) {
      return { createdAt: 'desc' };
    }

    const sortOrder = options.sortOrder || 'desc';

    switch (options.sortBy) {
      case 'createdAt':
      default:
        return { createdAt: sortOrder };
    }
  }
}
