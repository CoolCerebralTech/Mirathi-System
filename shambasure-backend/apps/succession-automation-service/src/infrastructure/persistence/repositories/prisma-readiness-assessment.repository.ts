// src/succession-automation/src/infrastructure/persistence/repositories/prisma-readiness-assessment.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { ReadinessAssessment } from '../../../domain/aggregates/readiness-assessment.aggregate';
import { RiskCategory, RiskSeverity } from '../../../domain/entities/risk-flag.entity';
import {
  IReadinessRepository,
  IReadinessRepositoryPaginated,
  PaginatedResult,
  RepositoryQueryOptions,
} from '../../../domain/repositories/i-readiness.repository';
import { ReadinessStatus } from '../../../domain/value-objects/readiness-score.vo';
import { ReadinessAssessmentMapper } from '../mappers/readiness-assessment.mapper';

@Injectable()
export class PrismaReadinessRepository
  implements IReadinessRepository, IReadinessRepositoryPaginated
{
  private readonly logger = new Logger(PrismaReadinessRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== CORE CRUD OPERATIONS ====================

  async save(assessment: ReadinessAssessment): Promise<void> {
    try {
      const { assessment: assessmentData, risks: riskData } =
        ReadinessAssessmentMapper.toPersistence(assessment);

      const assessmentId = assessment.id.toString();
      const version = assessment.version;

      await this.prisma.$transaction(async (tx) => {
        // 1. Check existence to determine Create vs Update
        const existing = await tx.readinessAssessment.findUnique({
          where: { id: assessmentId },
          select: { version: true },
        });

        if (existing) {
          // Optimistic Concurrency Check
          if (existing.version !== version - 1 && version > 1) {
            throw new Error(
              `Concurrency conflict: ReadinessAssessment ${assessmentId} has been modified by another process. Expected v${version - 1}, found v${existing.version}`,
            );
          }

          // Update Assessment
          await tx.readinessAssessment.update({
            where: { id: assessmentId },
            data: assessmentData,
          });

          // Replace RiskFlags (Full replacement strategy for aggregates)
          // First, delete existing
          await tx.riskFlag.deleteMany({
            where: { assessmentId },
          });
        } else {
          // Create New Assessment
          await tx.readinessAssessment.create({
            data: assessmentData,
          });
        }

        // 2. Insert Risk Flags
        if (riskData.length > 0) {
          // Ensure assessmentId is set on all risks
          const risksWithFK = riskData.map((r: any) => ({
            ...r,
            assessmentId,
          }));

          await tx.riskFlag.createMany({
            data: risksWithFK,
            skipDuplicates: true, // Idempotency
          });
        }
      });

      this.logger.debug(`[ReadinessRepo] Saved assessment ${assessmentId} v${version}`);
    } catch (error) {
      this.logger.error(`Failed to save assessment: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<ReadinessAssessment | null> {
    try {
      const assessmentModel = await this.prisma.readinessAssessment.findUnique({
        where: { id },
      });

      if (!assessmentModel) return null;

      const riskModels = await this.prisma.riskFlag.findMany({
        where: { assessmentId: id },
      });

      return ReadinessAssessmentMapper.toDomain(assessmentModel, riskModels);
    } catch (error) {
      this.logger.error(`Error finding assessment by ID ${id}: ${error.message}`);
      throw error;
    }
  }

  async findByEstateId(estateId: string): Promise<ReadinessAssessment | null> {
    try {
      const assessmentModel = await this.prisma.readinessAssessment.findFirst({
        where: { estateId },
      });

      if (!assessmentModel) return null;

      const riskModels = await this.prisma.riskFlag.findMany({
        where: { assessmentId: assessmentModel.id },
      });

      return ReadinessAssessmentMapper.toDomain(assessmentModel, riskModels);
    } catch (error) {
      this.logger.error(`Error finding assessment for estate ${estateId}: ${error.message}`);
      throw error;
    }
  }

  async existsByEstateId(estateId: string): Promise<boolean> {
    const count = await this.prisma.readinessAssessment.count({
      where: { estateId },
    });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Delete children first (though cascade might handle this, explicit is safer in code)
        await tx.riskFlag.deleteMany({
          where: { assessmentId: id },
        });

        await tx.readinessAssessment.delete({
          where: { id },
        });
      });
    } catch (error) {
      this.logger.error(`Error deleting assessment ${id}: ${error.message}`);
      throw error;
    }
  }

  // ==================== QUERY OPERATIONS ====================

  async findByStatus(status: ReadinessStatus): Promise<ReadinessAssessment[]> {
    // Leveraging the denormalized 'status' column mapped in mapper
    const assessments = await this.prisma.readinessAssessment.findMany({
      where: {
        status: status as string,
      },
    });
    return this.loadAggregates(assessments);
  }

  async findWithCriticalRisks(): Promise<ReadinessAssessment[]> {
    // Find IDs where Critical Risks exist
    const assessmentIds = await this.prisma.riskFlag.findMany({
      where: {
        severity: 'CRITICAL',
        riskStatus: 'ACTIVE',
      },
      select: { assessmentId: true },
      distinct: ['assessmentId'],
    });

    if (assessmentIds.length === 0) return [];

    const ids = assessmentIds.map((a) => a.assessmentId);

    const assessments = await this.prisma.readinessAssessment.findMany({
      where: { id: { in: ids } },
    });

    return this.loadAggregates(assessments);
  }

  async findByScoreRange(minScore: number, maxScore: number): Promise<ReadinessAssessment[]> {
    // Leveraging the denormalized 'readinessScore' column (Int)
    const assessments = await this.prisma.readinessAssessment.findMany({
      where: {
        // Note: The schema definition had 'readinessScore Int'.
        // If it's stored as Int column:
        readinessScoreValue: {
          gte: minScore,
          lte: maxScore,
        },
      } as any, // Casting because Prisma types generated might differ slightly depending on schema updates
    });

    return this.loadAggregates(assessments);
  }

  async findStaleAssessments(staleHours: number): Promise<ReadinessAssessment[]> {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - staleHours);

    const assessments = await this.prisma.readinessAssessment.findMany({
      where: {
        lastAssessedAt: {
          lt: cutoff,
        },
        isComplete: false, // Completed ones don't need recalculation
      },
    });

    return this.loadAggregates(assessments);
  }

  async findReadyToComplete(): Promise<ReadinessAssessment[]> {
    // Logic: Status is READY_TO_FILE and not yet complete
    const assessments = await this.prisma.readinessAssessment.findMany({
      where: {
        status: 'READY_TO_FILE',
        isComplete: false,
      },
    });

    return this.loadAggregates(assessments);
  }

  async findByRiskCategory(category: RiskCategory): Promise<ReadinessAssessment[]> {
    const assessmentIds = await this.prisma.riskFlag.findMany({
      where: {
        category: category as string, // Enum match
        riskStatus: 'ACTIVE',
      },
      select: { assessmentId: true },
      distinct: ['assessmentId'],
    });

    const ids = assessmentIds.map((a) => a.assessmentId);

    const assessments = await this.prisma.readinessAssessment.findMany({
      where: { id: { in: ids } },
    });

    return this.loadAggregates(assessments);
  }

  // ==================== PAGINATION SUPPORT ====================

  async findAllPaginated(
    options: RepositoryQueryOptions,
  ): Promise<PaginatedResult<ReadinessAssessment>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const orderBy = options.sortBy
      ? { [options.sortBy]: options.sortOrder || 'desc' }
      : { updatedAt: 'desc' };

    const [total, items] = await Promise.all([
      this.prisma.readinessAssessment.count(),
      this.prisma.readinessAssessment.findMany({
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    const domainItems = await this.loadAggregates(items);

    return {
      items: domainItems,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  async findByStatusPaginated(
    status: ReadinessStatus,
    options: RepositoryQueryOptions,
  ): Promise<PaginatedResult<ReadinessAssessment>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where = { status: status as string };
    const orderBy = options.sortBy
      ? { [options.sortBy]: options.sortOrder || 'desc' }
      : { updatedAt: 'desc' };

    const [total, items] = await Promise.all([
      this.prisma.readinessAssessment.count({ where }),
      this.prisma.readinessAssessment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    const domainItems = await this.loadAggregates(items);

    return {
      items: domainItems,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  // ==================== STATISTICS ====================

  async count(): Promise<number> {
    return await this.prisma.readinessAssessment.count();
  }

  async countByStatus(status: ReadinessStatus): Promise<number> {
    return await this.prisma.readinessAssessment.count({
      where: { status: status as string },
    });
  }

  async getAverageScore(): Promise<number> {
    const aggregations = await this.prisma.readinessAssessment.aggregate({
      _avg: {
        readinessScoreValue: true,
      },
    });
    return aggregations._avg.readinessScoreValue || 0;
  }

  async getMostCommonRisks(
    limit: number,
  ): Promise<Array<{ category: RiskCategory; count: number }>> {
    // Group by category on RiskFlag table
    const groups = await this.prisma.riskFlag.groupBy({
      by: ['category'],
      where: { riskStatus: 'ACTIVE' },
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
      take: limit,
    });

    return groups.map((g) => ({
      category: g.category as RiskCategory,
      count: g._count.category,
    }));
  }

  // ==================== BATCH OPERATIONS ====================

  async saveAll(assessments: ReadinessAssessment[]): Promise<void> {
    // Saving Aggregates in batch is complex because of child relationships.
    // We execute sequentially inside a transaction to ensure integrity.
    await this.prisma.$transaction(async (tx) => {
      for (const assessment of assessments) {
        // Reuse logic from single save, but using the transaction client 'tx'
        // Ideally refactor 'save' to accept a tx, but for now we inline logic or just loop.
        // For performance, we loop `save` but wrapped in one transaction block.

        // Note: Calling this.save() inside here won't use the transaction.
        // We implement the save logic directly here.

        const { assessment: data, risks } = ReadinessAssessmentMapper.toPersistence(assessment);

        // Upsert Assessment
        await tx.readinessAssessment.upsert({
          where: { id: assessment.id.toString() },
          update: data,
          create: data,
        });

        // Replace Risks
        await tx.riskFlag.deleteMany({ where: { assessmentId: assessment.id.toString() } });
        if (risks.length > 0) {
          const risksWithFK = risks.map((r: any) => ({
            ...r,
            assessmentId: assessment.id.toString(),
          }));
          await tx.riskFlag.createMany({ data: risksWithFK });
        }
      }
    });
  }

  async findByEstateIds(estateIds: string[]): Promise<ReadinessAssessment[]> {
    const assessments = await this.prisma.readinessAssessment.findMany({
      where: {
        estateId: { in: estateIds },
      },
    });
    return this.loadAggregates(assessments);
  }

  // ==================== RISK FLAG QUERIES ====================

  async findWithUnresolvedRisksBySeverity(severity: RiskSeverity): Promise<ReadinessAssessment[]> {
    const assessmentIds = await this.prisma.riskFlag.findMany({
      where: {
        severity: severity as string,
        riskStatus: 'ACTIVE',
      },
      select: { assessmentId: true },
      distinct: ['assessmentId'],
    });

    const ids = assessmentIds.map((a) => a.assessmentId);
    const assessments = await this.prisma.readinessAssessment.findMany({
      where: { id: { in: ids } },
    });

    return this.loadAggregates(assessments);
  }

  async findByRiskSource(
    sourceType: string,
    sourceEntityId: string,
  ): Promise<ReadinessAssessment[]> {
    const assessmentIds = await this.prisma.riskFlag.findMany({
      where: {
        sourceType: sourceType,
        sourceEntityId: sourceEntityId,
      },
      select: { assessmentId: true },
      distinct: ['assessmentId'],
    });

    const ids = assessmentIds.map((a) => a.assessmentId);
    const assessments = await this.prisma.readinessAssessment.findMany({
      where: { id: { in: ids } },
    });

    return this.loadAggregates(assessments);
  }

  async countUnresolvedRisks(): Promise<number> {
    return await this.prisma.riskFlag.count({
      where: {
        riskStatus: 'ACTIVE',
      },
    });
  }

  // ==================== ADVANCED QUERIES ====================

  async findRecentImprovements(days: number): Promise<ReadinessAssessment[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Finding items updated recently where score is high is a heuristic
    // True improvement tracking requires history table/event store.
    // Here we return active, high scoring assessments updated recently.
    const assessments = await this.prisma.readinessAssessment.findMany({
      where: {
        updatedAt: { gte: cutoff },
        readinessScoreValue: { gte: 80 }, // Assuming improvement implies crossing threshold
      },
    });

    return this.loadAggregates(assessments);
  }

  async findLongestBlocked(limit: number): Promise<ReadinessAssessment[]> {
    // Assessments blocked and created longest ago
    const assessments = await this.prisma.readinessAssessment.findMany({
      where: {
        status: 'BLOCKED',
        isComplete: false,
      },
      orderBy: {
        createdAt: 'asc', // Oldest first
      },
      take: limit,
    });

    return this.loadAggregates(assessments);
  }

  async findByContextAttributes(filters: {
    regime?: string;
    marriageType?: string;
    religion?: string;
    hasMinors?: boolean;
  }): Promise<ReadinessAssessment[]> {
    const where: Prisma.ReadinessAssessmentWhereInput = {};

    if (filters.regime) where.contextRegime = filters.regime as any; // Enum
    if (filters.marriageType) where.contextMarriage = filters.marriageType as any;
    if (filters.religion) where.contextReligion = filters.religion as any;
    if (filters.hasMinors !== undefined) where.isMinorInvolved = filters.hasMinors;

    const assessments = await this.prisma.readinessAssessment.findMany({ where });
    return this.loadAggregates(assessments);
  }

  // ==================== AUDIT & COMPLIANCE ====================

  async getHistory(
    assessmentId: string,
  ): Promise<Array<{ version: number; eventType: string; occurredAt: Date; payload: any }>> {
    // This requires an Event Store or Audit Log table.
    // Returning empty array as strict placeholder for now, assuming Audit service handles this separately.
    return [];
  }

  async findByModifiedBy(userId: string): Promise<ReadinessAssessment[]> {
    // Schema doesn't currently store 'lastModifiedBy' on root, relying on Audit logs.
    // If needed, we would add that column.
    return [];
  }

  async getSnapshotAt(assessmentId: string, timestamp: Date): Promise<ReadinessAssessment | null> {
    // Requires Temporal Tables or Event Sourcing.
    // Fallback: Return current if close enough, or null.
    return null;
  }

  // ==================== HELPER METHODS ====================

  /**
   * Efficiently loads Aggregate Roots by fetching children in batch
   */
  private async loadAggregates(models: any[]): Promise<ReadinessAssessment[]> {
    if (models.length === 0) return [];

    const ids = models.map((m) => m.id);

    // Fetch all related risks in one query
    const allRisks = await this.prisma.riskFlag.findMany({
      where: { assessmentId: { in: ids } },
    });

    // Group risks by assessment ID
    const riskMap = new Map<string, any[]>();
    allRisks.forEach((risk) => {
      const existing = riskMap.get(risk.assessmentId) || [];
      existing.push(risk);
      riskMap.set(risk.assessmentId, existing);
    });

    // Reconstitute Aggregates
    return models.map((model) => {
      const risks = riskMap.get(model.id) || [];
      return ReadinessAssessmentMapper.toDomain(model, risks);
    });
  }
}
