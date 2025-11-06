import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { Prisma } from '@prisma/client';

import {
  IDocumentVerificationAttemptRepository,
  FindVerificationAttemptsFilters,
  VerificationQueryOptions,
  VerifierPerformanceStats,
  DocumentVerificationHistory,
  VerificationMetrics,
  DailyVerificationStats,
} from '../../3_domain/interfaces';
import { DocumentVerificationAttempt } from '../../3_domain/models/document-verification-attempt.model';
import { VerificationAttemptId, DocumentId, UserId } from '../../3_domain/value-objects';
import { DocumentVerificationAttemptMapper } from '../mappers/verification-attempt.mapper';
import { DocumentVerificationAttemptEntity } from '../entities/verification-attempt.entity';

/**
 * Repository-specific errors
 */
export class VerificationRepositoryError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'VerificationRepositoryError';
  }
}

export class VerificationAttemptNotFoundError extends VerificationRepositoryError {
  constructor(attemptId: VerificationAttemptId) {
    super(`Verification attempt not found: ${attemptId.value}`);
    this.name = 'VerificationAttemptNotFoundError';
  }
}

@Injectable()
export class PrismaDocumentVerificationAttemptRepository
  implements IDocumentVerificationAttemptRepository
{
  private readonly logger = new Logger(PrismaDocumentVerificationAttemptRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // CORE PERSISTENCE
  // ============================================================================

  async save(attempt: DocumentVerificationAttempt): Promise<void> {
    try {
      const entity = DocumentVerificationAttemptMapper.toPersistence(attempt);

      // 'entity' now has the correct types, satisfying Prisma Client
      await this.prisma.documentVerificationAttempt.create({
        data: entity,
      });

      this.logger.debug(
        `Verification attempt saved: ${attempt.id.value} for document ${attempt.documentId.value}`,
      );
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to save verification attempt: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to save verification attempt', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while saving a verification attempt',
      );
    }
  }

  async saveMany(attempts: DocumentVerificationAttempt[]): Promise<void> {
    try {
      const entities = DocumentVerificationAttemptMapper.toPersistenceMany(attempts);

      await this.prisma.$transaction(
        entities.map((entity, index) =>
          this.prisma.documentVerificationAttempt.create({
            data: {
              ...entity,
              createdAt: attempts[index].createdAt,
            },
          }),
        ),
      );

      this.logger.log(`Saved ${attempts.length} verification attempts in transaction`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to save verification attempts: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to save verification attempts', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while saving verification attempts',
      );
    }
  }

  // ============================================================================
  // CORE FINDERS
  // ============================================================================

  async findById(id: VerificationAttemptId): Promise<DocumentVerificationAttempt | null> {
    try {
      const entity = await this.prisma.documentVerificationAttempt.findUnique({
        where: { id: id.value },
      });

      if (!entity) return null;

      return DocumentVerificationAttemptMapper.toDomain(
        entity as DocumentVerificationAttemptEntity,
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find verification attempt: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to find verification attempt', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while finding a verification attempt',
      );
    }
  }

  async findLatestForDocument(documentId: DocumentId): Promise<DocumentVerificationAttempt | null> {
    try {
      const entity = await this.prisma.documentVerificationAttempt.findFirst({
        where: { documentId: documentId.value },
        orderBy: { createdAt: 'desc' },
      });

      if (!entity) return null;

      return DocumentVerificationAttemptMapper.toDomain(
        entity as DocumentVerificationAttemptEntity,
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find latest attempt: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to find latest attempt', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while finding the latest attempt',
      );
    }
  }

  async findFirstForDocument(documentId: DocumentId): Promise<DocumentVerificationAttempt | null> {
    try {
      const entity = await this.prisma.documentVerificationAttempt.findFirst({
        where: { documentId: documentId.value },
        orderBy: { createdAt: 'asc' },
      });

      if (!entity) return null;

      return DocumentVerificationAttemptMapper.toDomain(
        entity as DocumentVerificationAttemptEntity,
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find first attempt: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to find first attempt', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while finding the first attempt',
      );
    }
  }

  async findAllForDocument(
    documentId: DocumentId,
    options?: VerificationQueryOptions,
  ): Promise<DocumentVerificationAttempt[]> {
    try {
      const entities = await this.prisma.documentVerificationAttempt.findMany({
        where: { documentId: documentId.value },
        orderBy: this.buildOrderBy(options),
        take: options?.limit,
        skip: options?.offset,
      });

      return DocumentVerificationAttemptMapper.toDomainMany(
        entities as DocumentVerificationAttemptEntity[],
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find attempts for document: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to find attempts for document', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while finding attempts for a document',
      );
    }
  }

  async findMany(
    filters: FindVerificationAttemptsFilters,
    options?: VerificationQueryOptions,
  ): Promise<DocumentVerificationAttempt[]> {
    try {
      const where = this.buildWhereClause(filters);

      const entities = await this.prisma.documentVerificationAttempt.findMany({
        where,
        orderBy: this.buildOrderBy(options),
        take: options?.limit,
        skip: options?.offset,
      });

      return DocumentVerificationAttemptMapper.toDomainMany(
        entities as DocumentVerificationAttemptEntity[],
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find verification attempts: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to find verification attempts', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while finding verification attempts',
      );
    }
  }

  async findByVerifier(
    verifierId: UserId,
    options?: VerificationQueryOptions,
  ): Promise<DocumentVerificationAttempt[]> {
    try {
      const entities = await this.prisma.documentVerificationAttempt.findMany({
        where: { verifierId: verifierId.value },
        orderBy: this.buildOrderBy(options),
        take: options?.limit,
        skip: options?.offset,
      });

      return DocumentVerificationAttemptMapper.toDomainMany(
        entities as DocumentVerificationAttemptEntity[],
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find attempts by verifier: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to find attempts by verifier', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while finding attempts by verifier',
      );
    }
  }

  async findByIds(ids: VerificationAttemptId[]): Promise<DocumentVerificationAttempt[]> {
    try {
      const entities = await this.prisma.documentVerificationAttempt.findMany({
        where: {
          id: { in: ids.map((id) => id.value) },
        },
      });

      // Preserve order of requested IDs
      const attemptMap = new Map(
        entities.map((entity) => [
          entity.id,
          DocumentVerificationAttemptMapper.toDomain(entity as DocumentVerificationAttemptEntity),
        ]),
      );

      return ids
        .map((id) => attemptMap.get(id.value))
        .filter((attempt): attempt is DocumentVerificationAttempt => attempt !== undefined);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find attempts by IDs: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to find attempts by IDs', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while finding attempts by IDs',
      );
    }
  }

  async findSuccessfulAttempts(
    timeRange: { start: Date; end: Date },
    options?: VerificationQueryOptions,
  ): Promise<DocumentVerificationAttempt[]> {
    try {
      const entities = await this.prisma.documentVerificationAttempt.findMany({
        where: {
          status: 'VERIFIED',
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
        orderBy: this.buildOrderBy(options),
        take: options?.limit,
        skip: options?.offset,
      });

      return DocumentVerificationAttemptMapper.toDomainMany(
        entities as DocumentVerificationAttemptEntity[],
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find successful attempts: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to find successful attempts', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while finding successful attempts',
      );
    }
  }

  async findRejectedAttempts(
    timeRange: { start: Date; end: Date },
    options?: VerificationQueryOptions,
  ): Promise<DocumentVerificationAttempt[]> {
    try {
      const entities = await this.prisma.documentVerificationAttempt.findMany({
        where: {
          status: 'REJECTED',
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
        orderBy: this.buildOrderBy(options),
        take: options?.limit,
        skip: options?.offset,
      });

      return DocumentVerificationAttemptMapper.toDomainMany(
        entities as DocumentVerificationAttemptEntity[],
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find rejected attempts: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to find rejected attempts', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while finding rejected attempts',
      );
    }
  }

  async findDocumentsWithMultipleAttempts(): Promise<
    Array<{ documentId: DocumentId; attemptCount: number }>
  > {
    try {
      const results = await this.prisma.documentVerificationAttempt.groupBy({
        by: ['documentId'],
        _count: true,
        having: {
          documentId: {
            _count: {
              gt: 1,
            },
          },
        },
        orderBy: {
          _count: {
            documentId: 'desc',
          },
        },
      });

      return results.map((result) => ({
        documentId: new DocumentId(result.documentId),
        attemptCount: result._count,
      }));
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to find documents with multiple attempts: ${error.message}`,
          error.stack,
        );
        throw new VerificationRepositoryError(
          'Failed to find documents with multiple attempts',
          error,
        );
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while finding documents with multiple attempts',
      );
    }
  }

  async findRecentAttempts(withinHours: number): Promise<DocumentVerificationAttempt[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - withinHours);

      const entities = await this.prisma.documentVerificationAttempt.findMany({
        where: {
          createdAt: { gte: cutoffDate },
        },
        orderBy: { createdAt: 'desc' },
      });

      return DocumentVerificationAttemptMapper.toDomainMany(
        entities as DocumentVerificationAttemptEntity[],
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find recent attempts: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to find recent attempts', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while finding recent attempts',
      );
    }
  }

  // ============================================================================
  // VALIDATION & CHECKS
  // ============================================================================

  async exists(id: VerificationAttemptId): Promise<boolean> {
    try {
      const count = await this.prisma.documentVerificationAttempt.count({
        where: { id: id.value },
      });
      return count > 0;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to check attempt existence: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to check attempt existence', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while checking attempt existence',
      );
    }
  }

  async hasBeenVerified(documentId: DocumentId): Promise<boolean> {
    try {
      const count = await this.prisma.documentVerificationAttempt.count({
        where: {
          documentId: documentId.value,
          status: 'VERIFIED',
        },
      });
      return count > 0;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to check verification status: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to check verification status', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while checking verification status',
      );
    }
  }

  async hasBeenRejected(documentId: DocumentId): Promise<boolean> {
    try {
      const count = await this.prisma.documentVerificationAttempt.count({
        where: {
          documentId: documentId.value,
          status: 'REJECTED',
        },
      });
      return count > 0;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to check rejection status: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to check rejection status', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while checking rejection status',
      );
    }
  }

  async hasMultipleAttempts(documentId: DocumentId): Promise<boolean> {
    try {
      const count = await this.prisma.documentVerificationAttempt.count({
        where: { documentId: documentId.value },
      });
      return count > 1;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to check multiple attempts: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to check multiple attempts', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while checking for multiple attempts',
      );
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
      if (error instanceof Error) {
        this.logger.error(`Failed to check verifier attempt: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to check verifier attempt', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while checking verifier attempt',
      );
    }
  }

  // ============================================================================
  // STATISTICS & ANALYTICS
  // ============================================================================

  async countForDocument(documentId: DocumentId): Promise<number> {
    try {
      return await this.prisma.documentVerificationAttempt.count({
        where: { documentId: documentId.value },
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to count attempts: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to count attempts', error);
      }
      throw new VerificationRepositoryError('An unknown error occurred while counting attempts');
    }
  }

  async countSuccessfulForDocument(documentId: DocumentId): Promise<number> {
    try {
      return await this.prisma.documentVerificationAttempt.count({
        where: {
          documentId: documentId.value,
          status: 'VERIFIED',
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to count successful attempts: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to count successful attempts', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while counting successful attempts',
      );
    }
  }

  async countRejectionsForDocument(documentId: DocumentId): Promise<number> {
    try {
      return await this.prisma.documentVerificationAttempt.count({
        where: {
          documentId: documentId.value,
          status: 'REJECTED',
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to count rejections: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to count rejections', error);
      }
      throw new VerificationRepositoryError('An unknown error occurred while counting rejections');
    }
  }

  async getDocumentHistory(documentId: DocumentId): Promise<DocumentVerificationHistory> {
    try {
      const [attempts, latest, first] = await Promise.all([
        this.findAllForDocument(documentId),
        this.findLatestForDocument(documentId),
        this.findFirstForDocument(documentId),
      ]);

      let currentStatus: 'VERIFIED' | 'REJECTED' | 'PENDING' | 'MULTIPLE_ATTEMPTS' = 'PENDING';

      if (attempts.length === 0) {
        currentStatus = 'PENDING';
      } else if (attempts.length === 1) {
        currentStatus = attempts[0].isSuccessful() ? 'VERIFIED' : 'REJECTED';
      } else {
        currentStatus = 'MULTIPLE_ATTEMPTS';
      }

      const wasReverified =
        attempts.length > 1 &&
        attempts.some((a) => a.isRejection()) &&
        attempts.some((a) => a.isSuccessful());

      return {
        documentId: documentId.value,
        totalAttempts: attempts.length,
        latestAttempt: latest,
        firstAttempt: first,
        attempts,
        currentStatus,
        wasReverified,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get document history: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to get document history', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while getting document history',
      );
    }
  }

  async getPerformanceStatsForVerifier(
    verifierId: UserId,
    timeRange: { start: Date; end: Date },
  ): Promise<VerifierPerformanceStats> {
    try {
      const where = {
        verifierId: verifierId.value,
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      };

      const [total, verified, rejected, attempts] = await Promise.all([
        this.prisma.documentVerificationAttempt.count({ where }),
        this.prisma.documentVerificationAttempt.count({
          where: { ...where, status: 'VERIFIED' },
        }),
        this.prisma.documentVerificationAttempt.count({
          where: { ...where, status: 'REJECTED' },
        }),
        this.prisma.documentVerificationAttempt.findMany({
          where,
          select: {
            createdAt: true,
            document: {
              select: {
                createdAt: true,
              },
            },
          },
        }),
      ]);

      const verificationTimes = attempts
        .filter((a) => a.document)
        .map((a) => (a.createdAt.getTime() - a.document.createdAt.getTime()) / (1000 * 60 * 60));

      const averageTimeToVerifyHours =
        verificationTimes.length > 0
          ? verificationTimes.reduce((a, b) => a + b, 0) / verificationTimes.length
          : 0;

      const daysDiff =
        Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24)) ||
        1;

      return {
        verifierId: verifierId.value,
        totalAttempts: total,
        totalVerified: verified,
        totalRejected: rejected,
        verificationRate: total > 0 ? (verified / total) * 100 : 0,
        averageTimeToVerifyHours,
        documentsVerifiedPerDay: verified / daysDiff,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get verifier performance: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to get verifier performance', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while getting verifier performance',
      );
    }
  }

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

      const [total, verified, rejected, documents, verifiers, multipleAttempts, rejectionReasons] =
        await Promise.all([
          this.prisma.documentVerificationAttempt.count({ where }),
          this.prisma.documentVerificationAttempt.count({
            where: { ...where, status: 'VERIFIED' },
          }),
          this.prisma.documentVerificationAttempt.count({
            where: { ...where, status: 'REJECTED' },
          }),
          this.prisma.documentVerificationAttempt.findMany({
            where,
            distinct: ['documentId'],
            select: { documentId: true },
          }),
          this.prisma.documentVerificationAttempt.findMany({
            where,
            distinct: ['verifierId'],
            select: { verifierId: true },
          }),
          this.prisma.documentVerificationAttempt.groupBy({
            by: ['documentId'],
            where,
            _count: true,
            having: {
              documentId: {
                _count: {
                  gt: 1,
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
            _count: true,
            orderBy: {
              _count: {
                reason: 'desc',
              },
            },
            take: 10,
          }),
        ]);

      return {
        totalAttempts: total,
        totalVerified: verified,
        totalRejected: rejected,
        uniqueDocuments: documents.length,
        uniqueVerifiers: verifiers.length,
        averageAttemptsPerDocument: documents.length > 0 ? total / documents.length : 0,
        documentsWithMultipleAttempts: multipleAttempts.length,
        topRejectionReasons: rejectionReasons.map((item) => ({
          reason: item.reason || 'Unknown',
          count: item._count,
        })),
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get verification metrics: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to get verification metrics', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while getting verification metrics',
      );
    }
  }

  async getDailyStats(timeRange: { start: Date; end: Date }): Promise<DailyVerificationStats[]> {
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
          verifierId: true,
          documentId: true,
        },
      });

      const dailyMap = new Map<
        string,
        {
          total: number;
          verified: number;
          rejected: number;
          verifiers: Set<string>;
          documents: Set<string>;
        }
      >();

      attempts.forEach((attempt) => {
        const dateKey = attempt.createdAt.toISOString().split('T')[0];
        const existing = dailyMap.get(dateKey) || {
          total: 0,
          verified: 0,
          rejected: 0,
          verifiers: new Set<string>(),
          documents: new Set<string>(),
        };

        existing.total++;
        if (attempt.status === 'VERIFIED') existing.verified++;
        if (attempt.status === 'REJECTED') existing.rejected++;
        existing.verifiers.add(attempt.verifierId);
        existing.documents.add(attempt.documentId);

        dailyMap.set(dateKey, existing);
      });

      return Array.from(dailyMap.entries())
        .map(([date, stats]) => ({
          date,
          totalAttempts: stats.total,
          verified: stats.verified,
          rejected: stats.rejected,
          uniqueVerifiers: stats.verifiers.size,
          uniqueDocuments: stats.documents.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get daily stats: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to get daily stats', error);
      }
      throw new VerificationRepositoryError('An unknown error occurred while getting daily stats');
    }
  }

  async getTopVerifiers(
    limit: number,
    timeRange?: { start: Date; end: Date },
  ): Promise<Array<VerifierPerformanceStats>> {
    try {
      const where = timeRange
        ? {
            createdAt: {
              gte: timeRange.start,
              lte: timeRange.end,
            },
          }
        : {};

      const verifiers = await this.prisma.documentVerificationAttempt.groupBy({
        by: ['verifierId'],
        where,
        _count: true,
        orderBy: {
          _count: {
            verifierId: 'desc',
          },
        },
        take: limit,
      });

      const stats = await Promise.all(
        verifiers.map(async (v) => {
          const userId = new UserId(v.verifierId);
          return timeRange
            ? this.getPerformanceStatsForVerifier(userId, timeRange)
            : this.getPerformanceStatsForVerifier(userId, {
                start: new Date(0),
                end: new Date(),
              });
        }),
      );

      return stats;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get top verifiers: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to get top verifiers', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while getting top verifiers',
      );
    }
  }

  async getTopRejectionReasons(
    limit: number,
    timeRange?: { start: Date; end: Date },
  ): Promise<Array<{ reason: string; count: number; percentage: number }>> {
    try {
      const where: Prisma.DocumentVerificationAttemptWhereInput = {
        status: 'REJECTED',
        reason: { not: null },
      };

      if (timeRange) {
        where.createdAt = {
          gte: timeRange.start,
          lte: timeRange.end,
        };
      }

      const [reasons, total] = await this.prisma.$transaction([
        this.prisma.documentVerificationAttempt.groupBy({
          by: ['reason'],
          where,
          // FIX: Use _all to count all records in the group. This is the correct pattern.
          _count: {
            _all: true,
          },
          orderBy: {
            // This remains correct: order the groups by the count of items in them.
            _count: {
              reason: 'desc',
            },
          },
          take: limit,
        }),
        this.prisma.documentVerificationAttempt.count({ where }),
      ]);

      return reasons.map((item) => {
        // Narrow `_count` to the correct object type
        const countValue =
          typeof item._count === 'object' && item._count !== null && '_all' in item._count
            ? (item._count._all ?? 0)
            : 0;

        return {
          reason: item.reason || 'Unknown',
          count: countValue,
          percentage: total > 0 ? (countValue / total) * 100 : 0,
        };
      });
    } catch (error) {
      // Apply robust, type-safe error handling
      if (error instanceof Error) {
        this.logger.error(`Failed to get top rejection reasons: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to get top rejection reasons', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while getting top rejection reasons',
      );
    }
  }

  async getTurnaroundTimeStats(timeRange: { start: Date; end: Date }): Promise<{
    averageHours: number;
    medianHours: number;
    minHours: number;
    maxHours: number;
  }> {
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
          document: {
            select: {
              createdAt: true,
            },
          },
        },
      });

      const turnaroundTimes = attempts
        .filter((a) => a.document)
        .map((a) => (a.createdAt.getTime() - a.document.createdAt.getTime()) / (1000 * 60 * 60))
        .sort((a, b) => a - b);

      if (turnaroundTimes.length === 0) {
        return {
          averageHours: 0,
          medianHours: 0,
          minHours: 0,
          maxHours: 0,
        };
      }

      const sum = turnaroundTimes.reduce((a, b) => a + b, 0);
      const median =
        turnaroundTimes.length % 2 === 0
          ? (turnaroundTimes[turnaroundTimes.length / 2 - 1] +
              turnaroundTimes[turnaroundTimes.length / 2]) /
            2
          : turnaroundTimes[Math.floor(turnaroundTimes.length / 2)];

      return {
        averageHours: sum / turnaroundTimes.length,
        medianHours: median,
        minHours: turnaroundTimes[0],
        maxHours: turnaroundTimes[turnaroundTimes.length - 1],
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get turnaround time stats: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to get turnaround time stats', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while getting turnaround time stats',
      );
    }
  }

  async getVerifierWorkload(timeRange?: { start: Date; end: Date }): Promise<
    Array<{
      verifierId: string;
      totalAttempts: number;
      verified: number;
      rejected: number;
      workloadPercentage: number;
    }>
  > {
    try {
      const where = timeRange
        ? {
            createdAt: {
              gte: timeRange.start,
              lte: timeRange.end,
            },
          }
        : {};

      const [verifierStats, totalAttempts] = await Promise.all([
        this.prisma.documentVerificationAttempt.groupBy({
          by: ['verifierId', 'status'],
          where,
          _count: true,
        }),
        this.prisma.documentVerificationAttempt.count({ where }),
      ]);

      const workloadMap = new Map<string, { total: number; verified: number; rejected: number }>();

      verifierStats.forEach((stat) => {
        const existing = workloadMap.get(stat.verifierId) || {
          total: 0,
          verified: 0,
          rejected: 0,
        };

        existing.total += stat._count;
        if (stat.status === 'VERIFIED') existing.verified += stat._count;
        if (stat.status === 'REJECTED') existing.rejected += stat._count;

        workloadMap.set(stat.verifierId, existing);
      });

      return Array.from(workloadMap.entries())
        .map(([verifierId, stats]) => ({
          verifierId,
          totalAttempts: stats.total,
          verified: stats.verified,
          rejected: stats.rejected,
          workloadPercentage: totalAttempts > 0 ? (stats.total / totalAttempts) * 100 : 0,
        }))
        .sort((a, b) => b.totalAttempts - a.totalAttempts);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get verifier workload: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to get verifier workload', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while getting verifier workload',
      );
    }
  }

  // ============================================================================
  // MAINTENANCE OPERATIONS
  // ============================================================================

  async deleteAllForDocument(documentId: DocumentId): Promise<number> {
    try {
      const result = await this.prisma.documentVerificationAttempt.deleteMany({
        where: { documentId: documentId.value },
      });

      this.logger.log(
        `Deleted ${result.count} verification attempts for document ${documentId.value}`,
      );
      return result.count;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to delete attempts for document: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to delete attempts for document', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while deleting attempts for a document',
      );
    }
  }

  async deleteOlderThan(date: Date): Promise<number> {
    try {
      const result = await this.prisma.documentVerificationAttempt.deleteMany({
        where: {
          createdAt: { lt: date },
        },
      });

      this.logger.log(
        `Deleted ${result.count} verification attempts older than ${date.toISOString()}`,
      );
      return result.count;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to delete old attempts: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to delete old attempts', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while deleting old attempts',
      );
    }
  }

  async archiveOldAttempts(olderThan: Date): Promise<number> {
    try {
      // In production, this would move records to an archive table
      const count = await this.prisma.documentVerificationAttempt.count({
        where: {
          createdAt: { lt: olderThan },
        },
      });

      this.logger.log(
        `Would archive ${count} verification attempts older than ${olderThan.toISOString()}`,
      );
      return count;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to archive old attempts: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to archive old attempts', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while archiving old attempts',
      );
    }
  }

  async deleteMany(ids: VerificationAttemptId[]): Promise<number> {
    try {
      const result = await this.prisma.documentVerificationAttempt.deleteMany({
        where: {
          id: { in: ids.map((id) => id.value) },
        },
      });

      this.logger.log(`Deleted ${result.count} verification attempts`);
      return result.count;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to delete many attempts: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to delete many attempts', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while deleting many attempts',
      );
    }
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  async findForDocuments(
    documentIds: DocumentId[],
  ): Promise<Map<string, DocumentVerificationAttempt[]>> {
    try {
      const entities = await this.prisma.documentVerificationAttempt.findMany({
        where: {
          documentId: { in: documentIds.map((id) => id.value) },
        },
        orderBy: { createdAt: 'desc' },
      });

      const attemptsByDoc = new Map<string, DocumentVerificationAttempt[]>();

      entities.forEach((entity) => {
        const attempt = DocumentVerificationAttemptMapper.toDomain(
          entity as DocumentVerificationAttemptEntity,
        );
        const docId = entity.documentId;

        if (!attemptsByDoc.has(docId)) {
          attemptsByDoc.set(docId, []);
        }
        attemptsByDoc.get(docId)!.push(attempt);
      });

      return attemptsByDoc;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find attempts for documents: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to find attempts for documents', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while finding attempts for documents',
      );
    }
  }

  async getAttemptCountsForDocuments(documentIds: DocumentId[]): Promise<Map<string, number>> {
    try {
      const counts = await this.prisma.documentVerificationAttempt.groupBy({
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
        this.logger.error(`Failed to get attempt counts: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to get attempt counts', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while getting attempt counts',
      );
    }
  }

  async getLatestAttemptsForDocuments(
    documentIds: DocumentId[],
  ): Promise<Map<string, DocumentVerificationAttempt | null>> {
    try {
      const latestAttempts = new Map<string, DocumentVerificationAttempt | null>();

      // Initialize all with null
      documentIds.forEach((id) => {
        latestAttempts.set(id.value, null);
      });

      // Get latest attempt for each document
      const entities = await this.prisma.documentVerificationAttempt.findMany({
        where: {
          documentId: { in: documentIds.map((id) => id.value) },
        },
        orderBy: { createdAt: 'desc' },
        distinct: ['documentId'],
      });

      entities.forEach((entity) => {
        const attempt = DocumentVerificationAttemptMapper.toDomain(
          entity as DocumentVerificationAttemptEntity,
        );
        latestAttempts.set(entity.documentId, attempt);
      });

      return latestAttempts;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get latest attempts: ${error.message}`, error.stack);
        throw new VerificationRepositoryError('Failed to get latest attempts', error);
      }
      throw new VerificationRepositoryError(
        'An unknown error occurred while getting latest attempts',
      );
    }
  }

  // ============================================================================
  // PRIVATE QUERY BUILDERS
  // ============================================================================

  private buildWhereClause(
    filters: FindVerificationAttemptsFilters,
  ): Prisma.DocumentVerificationAttemptWhereInput {
    const where: Prisma.DocumentVerificationAttemptWhereInput = {};

    if (filters.documentId) where.documentId = filters.documentId.value;
    if (filters.verifierId) where.verifierId = filters.verifierId.value;

    // Handle status filters carefully to avoid conflicts
    if (filters.status) {
      where.status = filters.status.value;
    } else if (filters.isSuccessful === true) {
      where.status = 'VERIFIED';
    } else if (filters.isSuccessful === false) {
      where.status = 'REJECTED';
    } else if (filters.isRejection === true) {
      where.status = 'REJECTED';
    } else if (filters.isRejection === false) {
      where.status = 'VERIFIED';
    }

    if (filters.createdAfter || filters.createdBefore) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filters.createdAfter) dateFilter.gte = filters.createdAfter;
      if (filters.createdBefore) dateFilter.lte = filters.createdBefore;
      where.createdAt = dateFilter;
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
      case 'verifierId':
        return { verifierId: sortOrder };
      case 'createdAt':
      default:
        return { createdAt: sortOrder };
    }
  }
}
