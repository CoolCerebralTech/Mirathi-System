// src/succession-automation/src/infrastructure/persistence/repositories/prisma-readiness-assessment.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  ReadinessAssessment as PrismaReadinessAssessmentModelType,
  ReadinessStatus as PrismaReadinessStatus,
  RiskCategory as PrismaRiskCategory,
  RiskFlag as PrismaRiskFlagModelType,
  RiskSeverity as PrismaRiskSeverity,
  RiskSourceType as PrismaRiskSourceType,
  RiskStatus as PrismaRiskStatus,
  SuccessionMarriageType as PrismaSuccessionMarriageType,
  SuccessionRegime as PrismaSuccessionRegime,
  SuccessionReligion as PrismaSuccessionReligion,
} from '@prisma/client';

// Import Prisma types
import { PrismaService } from '@shamba/database';

import { ReadinessAssessment } from '../../../domain/aggregates/readiness-assessment.aggregate';
import { RiskCategory, RiskSeverity } from '../../../domain/entities/risk-flag.entity';
import {
  IReadinessRepository,
  PaginatedResult,
  RepositoryQueryOptions,
} from '../../../domain/repositories/i-readiness.repository';
// Corrected import
import { ReadinessStatus } from '../../../domain/value-objects/readiness-score.vo';
import {
  PrismaReadinessAssessmentModel,
  ReadinessAssessmentMapper,
} from '../mappers/readiness-assessment.mapper';
import { PrismaRiskFlagModel } from '../mappers/risk-flag.mapper';

// Used for consistency in loadAggregates helper

@Injectable()
export class PrismaReadinessRepository implements IReadinessRepository {
  private readonly logger = new Logger(PrismaReadinessRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== CORE CRUD OPERATIONS ====================

  async save(assessment: ReadinessAssessment): Promise<void> {
    try {
      const { assessment: assessmentPersistenceData, risks: riskPersistenceData } =
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
            // Cast to Prisma's generated type for safety
            data: assessmentPersistenceData as Prisma.ReadinessAssessmentUpdateInput,
          });

          // Replace RiskFlags (Full replacement strategy for aggregates)
          await tx.riskFlag.deleteMany({
            where: { assessmentId },
          });
        } else {
          // Create New Assessment
          await tx.readinessAssessment.create({
            // Cast to Prisma's generated type for safety
            data: assessmentPersistenceData as Prisma.ReadinessAssessmentCreateInput,
          });
        }

        // 2. Insert Risk Flags
        if (riskPersistenceData.length > 0) {
          // Ensure assessmentId is set on all risks before creating
          const risksWithFK = riskPersistenceData.map((r: any) => ({
            ...r,
            assessmentId,
          }));

          await tx.riskFlag.createMany({
            // Cast to Prisma's generated type for safety
            data: risksWithFK as Prisma.RiskFlagCreateManyInput[],
            skipDuplicates: true,
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

      // Use the mapper's specific model interface for type safety
      return ReadinessAssessmentMapper.toDomain(
        assessmentModel as PrismaReadinessAssessmentModel,
        riskModels as PrismaRiskFlagModel[],
      );
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

      return ReadinessAssessmentMapper.toDomain(
        assessmentModel as PrismaReadinessAssessmentModel,
        riskModels as PrismaRiskFlagModel[],
      );
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
    // Map domain enum to Prisma enum
    const prismaStatus = this.mapToPrismaReadinessStatus(status);

    const assessments = await this.prisma.readinessAssessment.findMany({
      where: {
        status: prismaStatus,
      },
    });
    return this.loadAggregates(assessments);
  }

  async findWithCriticalRisks(): Promise<ReadinessAssessment[]> {
    // Find IDs where Critical Risks exist
    const assessmentIds = await this.prisma.riskFlag.findMany({
      where: {
        severity: PrismaRiskSeverity.CRITICAL,
        riskStatus: PrismaRiskStatus.ACTIVE,
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
    // Using the 'readinessScore' Int column from schema
    const assessments = await this.prisma.readinessAssessment.findMany({
      where: {
        readinessScore: {
          gte: minScore,
          lte: maxScore,
        },
      },
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
        isComplete: false,
      },
    });

    return this.loadAggregates(assessments);
  }

  async findReadyToComplete(): Promise<ReadinessAssessment[]> {
    const assessments = await this.prisma.readinessAssessment.findMany({
      where: {
        status: PrismaReadinessStatus.READY_TO_FILE,
        isComplete: false,
      },
    });

    return this.loadAggregates(assessments);
  }

  async findByRiskCategory(category: RiskCategory): Promise<ReadinessAssessment[]> {
    // Map domain enum to Prisma enum
    const prismaCategory = this.mapToPrismaRiskCategory(category);

    const assessmentIds = await this.prisma.riskFlag.findMany({
      where: {
        category: prismaCategory,
        riskStatus: PrismaRiskStatus.ACTIVE,
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

    const orderBy: Prisma.ReadinessAssessmentOrderByWithRelationInput = options.sortBy
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

    // Map domain enum to Prisma enum
    const prismaStatus = this.mapToPrismaReadinessStatus(status);

    const where: Prisma.ReadinessAssessmentWhereInput = {
      status: prismaStatus,
    };

    const orderBy: Prisma.ReadinessAssessmentOrderByWithRelationInput = options.sortBy
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
    const prismaStatus = this.mapToPrismaReadinessStatus(status);
    return await this.prisma.readinessAssessment.count({
      where: { status: prismaStatus },
    });
  }

  async getAverageScore(): Promise<number> {
    const aggregations = await this.prisma.readinessAssessment.aggregate({
      _avg: {
        readinessScore: true, // Using the Int column from schema
      },
    });
    // Use optional chaining and nullish coalescing for safety
    return aggregations._avg.readinessScore ?? 0;
  }

  async getMostCommonRisks(
    limit: number,
  ): Promise<Array<{ category: RiskCategory; count: number }>> {
    const groups = await this.prisma.riskFlag.groupBy({
      by: ['category'],
      where: { riskStatus: PrismaRiskStatus.ACTIVE },
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
      category: this.mapToDomainRiskCategory(g.category),
      count: g._count.category,
    }));
  }

  // ==================== BATCH OPERATIONS ====================

  async saveAll(assessments: ReadinessAssessment[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const assessment of assessments) {
        const { assessment: assessmentPersistenceData, risks: riskPersistenceData } =
          ReadinessAssessmentMapper.toPersistence(assessment);

        const existing = await tx.readinessAssessment.findUnique({
          where: { id: assessment.id.toString() },
          select: { version: true },
        });

        if (existing) {
          await tx.readinessAssessment.update({
            where: { id: assessment.id.toString() },
            data: assessmentPersistenceData as Prisma.ReadinessAssessmentUpdateInput,
          });
          await tx.riskFlag.deleteMany({ where: { assessmentId: assessment.id.toString() } });
        } else {
          await tx.readinessAssessment.create({
            data: assessmentPersistenceData as Prisma.ReadinessAssessmentCreateInput,
          });
        }

        if (riskPersistenceData.length > 0) {
          const risksWithFK = riskPersistenceData.map((r: any) => ({
            ...r,
            assessmentId: assessment.id.toString(),
          }));
          await tx.riskFlag.createMany({ data: risksWithFK as Prisma.RiskFlagCreateManyInput[] });
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
    const prismaSeverity = this.mapToPrismaRiskSeverity(severity);

    const assessmentIds = await this.prisma.riskFlag.findMany({
      where: {
        severity: prismaSeverity,
        riskStatus: PrismaRiskStatus.ACTIVE,
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
    // Validate and map sourceType to Prisma enum
    const prismaSourceType = this.mapToPrismaRiskSourceType(sourceType);

    const assessmentIds = await this.prisma.riskFlag.findMany({
      where: {
        sourceType: prismaSourceType,
        sourceEntityId: sourceEntityId,
        riskStatus: PrismaRiskStatus.ACTIVE,
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
        riskStatus: PrismaRiskStatus.ACTIVE,
      },
    });
  }

  // ==================== ADVANCED QUERIES ====================

  async findRecentImprovements(days: number): Promise<ReadinessAssessment[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const assessments = await this.prisma.readinessAssessment.findMany({
      where: {
        updatedAt: { gte: cutoff },
        readinessScore: { gte: 80 }, // Using the Int column
      },
    });

    return this.loadAggregates(assessments);
  }

  async findLongestBlocked(limit: number): Promise<ReadinessAssessment[]> {
    const assessments = await this.prisma.readinessAssessment.findMany({
      where: {
        status: PrismaReadinessStatus.BLOCKED,
        isComplete: false,
      },
      orderBy: {
        createdAt: 'asc', // Oldest blocked first
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

    // FIXED: Use top-level Enums, NOT Prisma.EnumName
    if (filters.regime) where.contextRegime = filters.regime as PrismaSuccessionRegime;

    if (filters.marriageType)
      where.contextMarriage = filters.marriageType as PrismaSuccessionMarriageType;

    if (filters.religion) where.contextReligion = filters.religion as PrismaSuccessionReligion;

    if (filters.hasMinors !== undefined) where.isMinorInvolved = filters.hasMinors;

    const assessments = await this.prisma.readinessAssessment.findMany({ where });
    return this.loadAggregates(assessments);
  }

  // ==================== AUDIT & COMPLIANCE ====================

  async getHistory(
    assessmentId: string,
  ): Promise<Array<{ version: number; eventType: string; occurredAt: Date; payload: any }>> {
    // Placeholder implementation for event sourcing/audit log.
    await Promise.resolve();
    this.logger.warn(
      `[ReadinessRepo] getHistory for ${assessmentId} is a placeholder and not fully implemented.`,
    );
    return [];
  }

  async findByModifiedBy(userId: string): Promise<ReadinessAssessment[]> {
    // Placeholder implementation.
    await Promise.resolve();
    this.logger.warn(
      `[ReadinessRepo] findByModifiedBy for ${userId} is a placeholder and not fully implemented.`,
    );
    return [];
  }

  async getSnapshotAt(assessmentId: string, timestamp: Date): Promise<ReadinessAssessment | null> {
    // Placeholder implementation for temporal queries.
    await Promise.resolve();
    this.logger.warn(
      `[ReadinessRepo] getSnapshotAt for ${assessmentId} at ${timestamp.toISOString()} is a placeholder and not fully implemented.`,
    );
    return null;
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Efficiently loads ReadinessAssessment aggregates by fetching related RiskFlags in batch.
   */
  private async loadAggregates(
    models: PrismaReadinessAssessmentModelType[],
  ): Promise<ReadinessAssessment[]> {
    if (models.length === 0) return [];

    const ids = models.map((m) => m.id);

    // Fetch all related risks in one query
    const allRisks = await this.prisma.riskFlag.findMany({
      where: { assessmentId: { in: ids } },
    });

    // Group risks by assessment ID
    const riskMap = new Map<string, PrismaRiskFlagModelType[]>();
    allRisks.forEach((risk) => {
      const existing = riskMap.get(risk.assessmentId) || [];
      existing.push(risk);
      riskMap.set(risk.assessmentId, existing);
    });

    // Reconstitute Aggregates
    return models.map((model) => {
      const risks = riskMap.get(model.id) || [];
      return ReadinessAssessmentMapper.toDomain(
        model as PrismaReadinessAssessmentModel,
        risks as PrismaRiskFlagModel[],
      );
    });
  }

  // ==================== ENUM MAPPING HELPERS ====================

  /**
   * Map domain ReadinessStatus to Prisma ReadinessStatus
   */
  private mapToPrismaReadinessStatus(status: ReadinessStatus): PrismaReadinessStatus {
    const mapping: Record<ReadinessStatus, PrismaReadinessStatus> = {
      [ReadinessStatus.IN_PROGRESS]: PrismaReadinessStatus.IN_PROGRESS,
      [ReadinessStatus.READY_TO_FILE]: PrismaReadinessStatus.READY_TO_FILE,
      [ReadinessStatus.BLOCKED]: PrismaReadinessStatus.BLOCKED,
      [ReadinessStatus.NEARLY_READY]: PrismaReadinessStatus.IN_PROGRESS, // Map to closest match
      [ReadinessStatus.NEEDS_WORK]: PrismaReadinessStatus.IN_PROGRESS, // Map to closest match
    };
    return mapping[status] || PrismaReadinessStatus.IN_PROGRESS;
  }

  /**
   * Map domain RiskSeverity to Prisma RiskSeverity
   */
  private mapToPrismaRiskSeverity(severity: RiskSeverity): PrismaRiskSeverity {
    const mapping: Record<RiskSeverity, PrismaRiskSeverity> = {
      [RiskSeverity.CRITICAL]: PrismaRiskSeverity.CRITICAL,
      [RiskSeverity.HIGH]: PrismaRiskSeverity.HIGH,
      [RiskSeverity.MEDIUM]: PrismaRiskSeverity.MEDIUM,
      [RiskSeverity.LOW]: PrismaRiskSeverity.LOW,
    };
    return mapping[severity];
  }

  /**
   * Map domain RiskCategory to Prisma RiskCategory
   */
  private mapToPrismaRiskCategory(category: RiskCategory): PrismaRiskCategory {
    // Direct mapping since they have the same values
    return category as unknown as PrismaRiskCategory;
  }

  /**
   * Map Prisma RiskCategory to domain RiskCategory
   */
  private mapToDomainRiskCategory(category: PrismaRiskCategory): RiskCategory {
    // Direct mapping since they have the same values
    return category as unknown as RiskCategory;
  }

  /**
   * Map string sourceType to Prisma RiskSourceType
   */
  private mapToPrismaRiskSourceType(sourceType: string): PrismaRiskSourceType {
    // Validate that the sourceType is a valid Prisma enum value
    if (Object.values(PrismaRiskSourceType).includes(sourceType as PrismaRiskSourceType)) {
      return sourceType as PrismaRiskSourceType;
    }
    // Default fallback
    this.logger.warn(`Unknown sourceType: ${sourceType}, defaulting to SYSTEM_VALIDATION`);
    return PrismaRiskSourceType.SYSTEM_VALIDATION;
  }
}
