// src/succession-automation/src/infrastructure/persistence/repositories/prisma-readiness-assessment.repository.ts
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@shamba/database';

import { ReadinessAssessment } from '../../../domain/aggregates/readiness-assessment.aggregate';
import {
  ResolutionMethod,
  RiskCategory,
  RiskSeverity,
  RiskStatus,
} from '../../../domain/entities/risk-flag.entity';
import {
  IReadinessRepository,
  IReadinessRepositoryPaginated,
  QueryOptions,
} from '../../../domain/repositories/i-readiness.repository';
import { ReadinessStatus } from '../../../domain/value-objects/readiness-score.vo';
import { ReadinessAssessmentMapper } from '../mappers/readiness-assessment.mapper';
import { RiskFlagMapper } from '../mappers/risk-flag.mapper';

@Injectable()
export class PrismaReadinessRepository
  implements IReadinessRepository, IReadinessRepositoryPaginated
{
  private readonly logger = new Logger(PrismaReadinessRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== CORE CRUD OPERATIONS ====================

  async save(assessment: ReadinessAssessment): Promise<void> {
    try {
      const persistenceData = ReadinessAssessmentMapper.toPersistenceCreate(assessment);
      const assessmentId = ReadinessAssessmentMapper.getPersistenceId(assessment);
      const version = ReadinessAssessmentMapper.getVersion(assessment);

      await this.prisma.$transaction(async (tx) => {
        if (assessmentId) {
          // Update existing assessment
          await tx.readinessAssessment.update({
            where: {
              id: assessmentId,
              version: version - 1, // Optimistic concurrency check
            },
            data: ReadinessAssessmentMapper.toPersistenceUpdate(assessment),
          });

          // Delete existing risks and recreate
          await tx.riskFlag.deleteMany({
            where: { assessmentId },
          });
        } else {
          // Create new assessment
          await tx.readinessAssessment.create({
            data: persistenceData.assessment,
          });
        }

        // Create all risk flags
        if (persistenceData.risks.length > 0) {
          await tx.riskFlag.createMany({
            data: persistenceData.risks,
            skipDuplicates: true,
          });
        }
      });

      this.logger.debug(`Assessment saved: ${assessmentId || 'new'}`);
    } catch (error) {
      this.logger.error(`Failed to save assessment: ${error.message}`, error.stack);
      throw new Error(`Failed to save readiness assessment: ${error.message}`);
    }
  }

  async findById(id: string): Promise<ReadinessAssessment | null> {
    try {
      const assessment = await this.prisma.readinessAssessment.findUnique({
        where: { id },
      });

      if (!assessment) {
        return null;
      }

      const risks = await this.prisma.riskFlag.findMany({
        where: { assessmentId: id },
      });

      return ReadinessAssessmentMapper.toDomain(assessment, risks);
    } catch (error) {
      this.logger.error(`Failed to find assessment by id ${id}: ${error.message}`);
      throw new Error(`Failed to find readiness assessment: ${error.message}`);
    }
  }

  async findByEstateId(estateId: string): Promise<ReadinessAssessment | null> {
    try {
      const assessment = await this.prisma.readinessAssessment.findFirst({
        where: { estateId },
      });

      if (!assessment) {
        return null;
      }

      const risks = await this.prisma.riskFlag.findMany({
        where: { assessmentId: assessment.id },
      });

      return ReadinessAssessmentMapper.toDomain(assessment, risks);
    } catch (error) {
      this.logger.error(`Failed to find assessment by estate ${estateId}: ${error.message}`);
      throw new Error(`Failed to find readiness assessment by estate: ${error.message}`);
    }
  }

  async existsByEstateId(estateId: string): Promise<boolean> {
    try {
      const count = await this.prisma.readinessAssessment.count({
        where: { estateId },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check existence for estate ${estateId}: ${error.message}`);
      throw new Error(`Failed to check assessment existence: ${error.message}`);
    }
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

      this.logger.debug(`Assessment deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete assessment ${id}: ${error.message}`);
      throw new Error(`Failed to delete readiness assessment: ${error.message}`);
    }
  }

  // ==================== QUERY OPERATIONS ====================

  async findByStatus(status: ReadinessStatus): Promise<ReadinessAssessment[]> {
    try {
      // Using Prisma JSON filter for readinessScore status
      const assessments = await this.prisma.readinessAssessment.findMany({
        where: {
          readinessScore: {
            contains: `"status":"${status}"`,
          },
        },
      });

      return await this.loadAssessmentsWithRisks(assessments);
    } catch (error) {
      this.logger.error(`Failed to find assessments by status ${status}: ${error.message}`);
      throw new Error(`Failed to find assessments by status: ${error.message}`);
    }
  }

  async findWithCriticalRisks(): Promise<ReadinessAssessment[]> {
    try {
      // Find assessments that have active critical risks
      const assessmentIds = await this.prisma.$queryRaw<{ assessmentId: string }[]>`
        SELECT DISTINCT "assessmentId"
        FROM "RiskFlag"
        WHERE severity = 'CRITICAL' 
        AND "riskStatus" = 'ACTIVE'
      `;

      if (assessmentIds.length === 0) {
        return [];
      }

      const ids = assessmentIds.map((r) => r.assessmentId);
      const assessments = await this.prisma.readinessAssessment.findMany({
        where: { id: { in: ids } },
      });

      return await this.loadAssessmentsWithRisks(assessments);
    } catch (error) {
      this.logger.error(`Failed to find assessments with critical risks: ${error.message}`);
      throw new Error(`Failed to find assessments with critical risks: ${error.message}`);
    }
  }

  async findByScoreRange(minScore: number, maxScore: number): Promise<ReadinessAssessment[]> {
    try {
      // Since readinessScore is stored as JSON, we need to filter differently
      const allAssessments = await this.prisma.readinessAssessment.findMany();

      const filteredAssessments = allAssessments.filter((assessment) => {
        try {
          if (assessment.readinessScore) {
            const scoreData = JSON.parse(assessment.readinessScore as string);
            const score = scoreData.score || 0;
            return score >= minScore && score <= maxScore;
          }
          return false;
        } catch {
          return false;
        }
      });

      return await this.loadAssessmentsWithRisks(filteredAssessments);
    } catch (error) {
      this.logger.error(
        `Failed to find assessments by score range ${minScore}-${maxScore}: ${error.message}`,
      );
      throw new Error(`Failed to find assessments by score range: ${error.message}`);
    }
  }

  async findStaleAssessments(staleHours: number): Promise<ReadinessAssessment[]> {
    try {
      const staleDate = new Date();
      staleDate.setHours(staleDate.getHours() - staleHours);

      const assessments = await this.prisma.readinessAssessment.findMany({
        where: {
          updatedAt: {
            lt: staleDate,
          },
          isComplete: false,
        },
      });

      return await this.loadAssessmentsWithRisks(assessments);
    } catch (error) {
      this.logger.error(`Failed to find stale assessments: ${error.message}`);
      throw new Error(`Failed to find stale assessments: ${error.message}`);
    }
  }

  async findReadyToComplete(): Promise<ReadinessAssessment[]> {
    try {
      const allAssessments = await this.prisma.readinessAssessment.findMany({
        where: {
          isComplete: false,
        },
      });

      // Filter by readiness score in application layer
      const readyAssessments = allAssessments.filter((assessment) => {
        try {
          if (assessment.readinessScore) {
            const scoreData = JSON.parse(assessment.readinessScore as string);
            return (
              (scoreData.status === 'READY_TO_FILE' || scoreData.status === 'READY') &&
              scoreData.score >= 85
            );
          }
          return false;
        } catch {
          return false;
        }
      });

      return await this.loadAssessmentsWithRisks(readyAssessments);
    } catch (error) {
      this.logger.error(`Failed to find ready to complete assessments: ${error.message}`);
      throw new Error(`Failed to find ready to complete assessments: ${error.message}`);
    }
  }

  async findByRiskCategory(category: RiskCategory): Promise<ReadinessAssessment[]> {
    try {
      // Need to create public mapping methods or use inline mapping
      const categoryMapping = this.getCategoryMapping();
      const prismaCategory = categoryMapping.toPrisma[category];

      if (!prismaCategory) {
        throw new Error(`Invalid RiskCategory: ${category}`);
      }

      const assessmentIds = await this.prisma.$queryRaw<{ assessmentId: string }[]>`
        SELECT DISTINCT "assessmentId"
        FROM "RiskFlag"
        WHERE category = ${prismaCategory}
        AND "riskStatus" = 'ACTIVE'
      `;

      if (assessmentIds.length === 0) {
        return [];
      }

      const ids = assessmentIds.map((r) => r.assessmentId);
      const assessments = await this.prisma.readinessAssessment.findMany({
        where: { id: { in: ids } },
      });

      return await this.loadAssessmentsWithRisks(assessments);
    } catch (error) {
      this.logger.error(
        `Failed to find assessments by risk category ${category}: ${error.message}`,
      );
      throw new Error(`Failed to find assessments by risk category: ${error.message}`);
    }
  }

  // ==================== AGGREGATE STATISTICS ====================

  async count(): Promise<number> {
    try {
      return await this.prisma.readinessAssessment.count();
    } catch (error) {
      this.logger.error(`Failed to count assessments: ${error.message}`);
      throw new Error(`Failed to count assessments: ${error.message}`);
    }
  }

  async countByStatus(status: ReadinessStatus): Promise<number> {
    try {
      // Count by JSON field
      const allAssessments = await this.prisma.readinessAssessment.findMany();
      const count = allAssessments.filter((assessment) => {
        try {
          if (assessment.readinessScore) {
            const scoreData = JSON.parse(assessment.readinessScore as string);
            return scoreData.status === status;
          }
          return false;
        } catch {
          return false;
        }
      }).length;

      return count;
    } catch (error) {
      this.logger.error(`Failed to count assessments by status ${status}: ${error.message}`);
      throw new Error(`Failed to count assessments by status: ${error.message}`);
    }
  }

  async getAverageScore(): Promise<number> {
    try {
      const allAssessments = await this.prisma.readinessAssessment.findMany();

      let totalScore = 0;
      let validCount = 0;

      allAssessments.forEach((assessment) => {
        try {
          if (assessment.readinessScore) {
            const scoreData = JSON.parse(assessment.readinessScore as string);
            if (typeof scoreData.score === 'number') {
              totalScore += scoreData.score;
              validCount++;
            }
          }
        } catch {
          // Skip invalid JSON
        }
      });

      return validCount > 0 ? totalScore / validCount : 0;
    } catch (error) {
      this.logger.error(`Failed to get average score: ${error.message}`);
      throw new Error(`Failed to get average readiness score: ${error.message}`);
    }
  }

  async getMostCommonRisks(
    limit: number,
  ): Promise<Array<{ category: RiskCategory; count: number }>> {
    try {
      const results = await this.prisma.$queryRaw<Array<{ category: string; count: bigint }>>`
        SELECT category, COUNT(*) as count
        FROM "RiskFlag"
        WHERE "riskStatus" = 'ACTIVE'
        GROUP BY category
        ORDER BY count DESC
        LIMIT ${limit}
      `;

      const categoryMapping = this.getCategoryMapping();
      return results.map((row) => ({
        category: categoryMapping.toDomain[row.category] || (row.category as RiskCategory),
        count: Number(row.count),
      }));
    } catch (error) {
      this.logger.error(`Failed to get most common risks: ${error.message}`);
      throw new Error(`Failed to get most common risks: ${error.message}`);
    }
  }

  // ==================== BATCH OPERATIONS ====================

  async saveAll(assessments: ReadinessAssessment[]): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const assessment of assessments) {
          const persistenceData = ReadinessAssessmentMapper.toPersistenceCreate(assessment);
          const assessmentId = ReadinessAssessmentMapper.getPersistenceId(assessment);
          const version = ReadinessAssessmentMapper.getVersion(assessment);

          if (assessmentId) {
            // Update existing
            await tx.readinessAssessment.update({
              where: {
                id: assessmentId,
                version: version - 1,
              },
              data: ReadinessAssessmentMapper.toPersistenceUpdate(assessment),
            });

            await tx.riskFlag.deleteMany({
              where: { assessmentId },
            });
          } else {
            // Create new
            await tx.readinessAssessment.create({
              data: persistenceData.assessment,
            });
          }

          // Create risks
          if (persistenceData.risks.length > 0) {
            await tx.riskFlag.createMany({
              data: persistenceData.risks,
              skipDuplicates: true,
            });
          }
        }
      });

      this.logger.debug(`Batch saved ${assessments.length} assessments`);
    } catch (error) {
      this.logger.error(`Failed to save batch of assessments: ${error.message}`);
      throw new Error(`Failed to save assessments batch: ${error.message}`);
    }
  }

  async findByEstateIds(estateIds: string[]): Promise<ReadinessAssessment[]> {
    try {
      const assessments = await this.prisma.readinessAssessment.findMany({
        where: {
          estateId: { in: estateIds },
        },
      });

      return await this.loadAssessmentsWithRisks(assessments);
    } catch (error) {
      this.logger.error(`Failed to find assessments by estate IDs: ${error.message}`);
      throw new Error(`Failed to find assessments by estate IDs: ${error.message}`);
    }
  }

  // ==================== RISK FLAG QUERIES ====================

  async findWithUnresolvedRisksBySeverity(severity: RiskSeverity): Promise<ReadinessAssessment[]> {
    try {
      const severityMapping = this.getSeverityMapping();
      const prismaSeverity = severityMapping.toPrisma[severity];

      if (!prismaSeverity) {
        throw new Error(`Invalid RiskSeverity: ${severity}`);
      }

      const assessmentIds = await this.prisma.$queryRaw<{ assessmentId: string }[]>`
        SELECT DISTINCT "assessmentId"
        FROM "RiskFlag"
        WHERE severity = ${prismaSeverity}
        AND "riskStatus" = 'ACTIVE'
      `;

      if (assessmentIds.length === 0) {
        return [];
      }

      const ids = assessmentIds.map((r) => r.assessmentId);
      const assessments = await this.prisma.readinessAssessment.findMany({
        where: { id: { in: ids } },
      });

      return await this.loadAssessmentsWithRisks(assessments);
    } catch (error) {
      this.logger.error(
        `Failed to find assessments with unresolved ${severity} risks: ${error.message}`,
      );
      throw new Error(`Failed to find assessments with unresolved risks: ${error.message}`);
    }
  }

  async findByRiskSource(
    sourceType: string,
    sourceEntityId: string,
  ): Promise<ReadinessAssessment[]> {
    try {
      const assessmentIds = await this.prisma.$queryRaw<{ assessmentId: string }[]>`
        SELECT DISTINCT "assessmentId"
        FROM "RiskFlag"
        WHERE "sourceEntityId" = ${sourceEntityId}
        AND "sourceType" = ${sourceType}
        AND "riskStatus" = 'ACTIVE'
      `;

      if (assessmentIds.length === 0) {
        return [];
      }

      const ids = assessmentIds.map((r) => r.assessmentId);
      const assessments = await this.prisma.readinessAssessment.findMany({
        where: { id: { in: ids } },
      });

      return await this.loadAssessmentsWithRisks(assessments);
    } catch (error) {
      this.logger.error(`Failed to find assessments by risk source: ${error.message}`);
      throw new Error(`Failed to find assessments by risk source: ${error.message}`);
    }
  }

  async countUnresolvedRisks(): Promise<number> {
    try {
      return await this.prisma.riskFlag.count({
        where: { riskStatus: 'ACTIVE' },
      });
    } catch (error) {
      this.logger.error(`Failed to count unresolved risks: ${error.message}`);
      throw new Error(`Failed to count unresolved risks: ${error.message}`);
    }
  }

  // ==================== ADVANCED QUERIES ====================

  async findRecentImprovements(days: number): Promise<ReadinessAssessment[]> {
    try {
      // This is complex with JSON fields - simplified implementation
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const assessments = await this.prisma.readinessAssessment.findMany({
        where: {
          updatedAt: {
            gte: dateThreshold,
          },
        },
      });

      // Filter in application layer
      const improvedAssessments = assessments.filter((assessment) => {
        // Simplified logic - in reality would need version history
        try {
          if (assessment.readinessScore) {
            const scoreData = JSON.parse(assessment.readinessScore as string);
            return scoreData.score > 50; // Simplified improvement check
          }
          return false;
        } catch {
          return false;
        }
      });

      return await this.loadAssessmentsWithRisks(improvedAssessments);
    } catch (error) {
      this.logger.error(`Failed to find recent improvements: ${error.message}`);
      throw new Error(`Failed to find recent improvements: ${error.message}`);
    }
  }

  async findLongestBlocked(limit: number): Promise<ReadinessAssessment[]> {
    try {
      // Find assessments with active critical risks (blocked)
      const assessmentIds = await this.prisma.$queryRaw<{ assessmentId: string }[]>`
        SELECT DISTINCT rf."assessmentId", ra."lastAssessedAt"
        FROM "RiskFlag" rf
        JOIN "ReadinessAssessment" ra ON rf."assessmentId" = ra.id
        WHERE rf.severity = 'CRITICAL'
        AND rf."riskStatus" = 'ACTIVE'
        AND ra."isComplete" = false
        ORDER BY ra."lastAssessedAt" ASC
        LIMIT ${limit}
      `;

      if (assessmentIds.length === 0) {
        return [];
      }

      const ids = assessmentIds.map((r) => r.assessmentId);
      const assessments = await this.prisma.readinessAssessment.findMany({
        where: { id: { in: ids } },
        orderBy: { lastAssessedAt: 'asc' },
      });

      return await this.loadAssessmentsWithRisks(assessments);
    } catch (error) {
      this.logger.error(`Failed to find longest blocked assessments: ${error.message}`);
      throw new Error(`Failed to find longest blocked assessments: ${error.message}`);
    }
  }

  async findByContextAttributes(filters: {
    regime?: string;
    marriageType?: string;
    religion?: string;
    hasMinors?: boolean;
  }): Promise<ReadinessAssessment[]> {
    try {
      const whereConditions: any[] = [];

      if (filters.regime) {
        whereConditions.push(`"successionContext"::jsonb @> '{"regime":"${filters.regime}"}'`);
      }

      if (filters.marriageType) {
        whereConditions.push(
          `"successionContext"::jsonb @> '{"marriageType":"${filters.marriageType}"}'`,
        );
      }

      if (filters.religion) {
        whereConditions.push(`"successionContext"::jsonb @> '{"religion":"${filters.religion}"}'`);
      }

      if (filters.hasMinors !== undefined) {
        whereConditions.push(`"isMinorInvolved" = ${filters.hasMinors}`);
      }

      if (whereConditions.length === 0) {
        return [];
      }

      const whereClause = whereConditions.join(' AND ');
      const assessments = await this.prisma.$queryRaw`
        SELECT * FROM "ReadinessAssessment"
        WHERE ${whereClause}
      `;

      return await this.loadAssessmentsWithRisks(assessments as any[]);
    } catch (error) {
      this.logger.error(`Failed to find assessments by context: ${error.message}`);
      throw new Error(`Failed to find assessments by context: ${error.message}`);
    }
  }

  // ==================== AUDIT & COMPLIANCE ====================

  async getHistory(assessmentId: string): Promise<
    Array<{
      version: number;
      eventType: string;
      occurredAt: Date;
      payload: any;
    }>
  > {
    try {
      // Implementation would depend on event sourcing setup
      // For now, return empty array
      return [];
    } catch (error) {
      this.logger.error(`Failed to get assessment history: ${error.message}`);
      throw new Error(`Failed to get assessment history: ${error.message}`);
    }
  }

  async findByModifiedBy(userId: string): Promise<ReadinessAssessment[]> {
    try {
      // This would require tracking modifiedBy in the schema
      // For now, return empty array
      this.logger.warn('findByModifiedBy not implemented - requires schema modification');
      return [];
    } catch (error) {
      this.logger.error(`Failed to find assessments by user ${userId}: ${error.message}`);
      throw new Error(`Failed to find assessments by user: ${error.message}`);
    }
  }

  async getSnapshotAt(assessmentId: string, timestamp: Date): Promise<ReadinessAssessment | null> {
    try {
      // This would typically query an event store for snapshot at timestamp
      // For now, return current state
      return await this.findById(assessmentId);
    } catch (error) {
      this.logger.error(`Failed to get snapshot for assessment ${assessmentId}: ${error.message}`);
      throw new Error(`Failed to get assessment snapshot: ${error.message}`);
    }
  }

  // ==================== PAGINATION METHODS ====================

  async findAll(options: QueryOptions): Promise<{
    items: ReadinessAssessment[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      const [assessments, total] = await Promise.all([
        this.prisma.readinessAssessment.findMany({
          skip,
          take: limit,
          orderBy: this.getSortOrder(options),
        }),
        this.prisma.readinessAssessment.count(),
      ]);

      const items = await this.loadAssessmentsWithRisks(assessments);
      const pages = Math.ceil(total / limit);

      return {
        items,
        total,
        page,
        pages,
      };
    } catch (error) {
      this.logger.error(`Failed to find all assessments: ${error.message}`);
      throw new Error(`Failed to find all assessments: ${error.message}`);
    }
  }

  async findByStatusPaginated(
    status: ReadinessStatus,
    options: QueryOptions,
  ): Promise<{
    items: ReadinessAssessment[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      // Count with JSON filter
      const allAssessments = await this.prisma.readinessAssessment.findMany();
      const filteredAssessments = allAssessments.filter((assessment) => {
        try {
          if (assessment.readinessScore) {
            const scoreData = JSON.parse(assessment.readinessScore as string);
            return scoreData.status === status;
          }
          return false;
        } catch {
          return false;
        }
      });

      const total = filteredAssessments.length;
      const paginatedAssessments = filteredAssessments.slice(skip, skip + limit);

      const items = await this.loadAssessmentsWithRisks(paginatedAssessments);
      const pages = Math.ceil(total / limit);

      return {
        items,
        total,
        page,
        pages,
      };
    } catch (error) {
      this.logger.error(`Failed to find assessments by status ${status}: ${error.message}`);
      throw new Error(`Failed to find assessments by status: ${error.message}`);
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private async loadAssessmentsWithRisks(assessments: any[]): Promise<ReadinessAssessment[]> {
    if (!assessments || assessments.length === 0) {
      return [];
    }

    const assessmentIds = assessments.map((a) => a.id);

    const allRisks = await this.prisma.riskFlag.findMany({
      where: {
        assessmentId: { in: assessmentIds },
      },
    });

    // Group risks by assessment ID
    const risksByAssessmentId = allRisks.reduce(
      (acc, risk) => {
        if (!acc[risk.assessmentId]) {
          acc[risk.assessmentId] = [];
        }
        acc[risk.assessmentId].push(risk);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Map to domain aggregates
    const domainAssessments: ReadinessAssessment[] = [];

    for (const assessment of assessments) {
      try {
        const risks = risksByAssessmentId[assessment.id] || [];
        const domainAssessment = ReadinessAssessmentMapper.toDomain(assessment, risks);
        domainAssessments.push(domainAssessment);
      } catch (error) {
        this.logger.warn(`Failed to convert assessment ${assessment.id}: ${error.message}`);
        // Skip invalid assessments
      }
    }

    return domainAssessments;
  }

  private getSortOrder(options: QueryOptions): any {
    const sortBy = options.sortBy || 'updatedAt';
    const sortOrder = options.sortOrder || 'desc';

    switch (sortBy) {
      case 'createdAt':
        return { createdAt: sortOrder };
      case 'lastAssessedAt':
        return { lastAssessedAt: sortOrder };
      case 'estateId':
        return { estateId: sortOrder };
      default:
        return { updatedAt: sortOrder };
    }
  }

  private getCategoryMapping() {
    const toPrisma: Record<RiskCategory, string> = {
      [RiskCategory.MISSING_DOCUMENT]: 'MISSING_DOCUMENT',
      [RiskCategory.INVALID_DOCUMENT]: 'INVALID_DOCUMENT',
      [RiskCategory.EXPIRED_DOCUMENT]: 'EXPIRED_DOCUMENT',
      [RiskCategory.FORGED_DOCUMENT]: 'FORGED_DOCUMENT',
      [RiskCategory.MINOR_WITHOUT_GUARDIAN]: 'MINOR_WITHOUT_GUARDIAN',
      [RiskCategory.UNDEFINED_POLYGAMOUS_STRUCTURE]: 'UNDEFINED_POLYGAMOUS_STRUCTURE',
      [RiskCategory.DISPUTED_RELATIONSHIP]: 'DISPUTED_RELATIONSHIP',
      [RiskCategory.COHABITATION_CLAIM]: 'COHABITATION_CLAIM',
      [RiskCategory.ILLEGITIMATE_CHILD_CLAIM]: 'ILLEGITIMATE_CHILD_CLAIM',
      [RiskCategory.ASSET_VERIFICATION_FAILED]: 'ASSET_VERIFICATION_FAILED',
      [RiskCategory.INSOLVENT_ESTATE]: 'INSOLVENT_ESTATE',
      [RiskCategory.MISSING_ASSET_VALUATION]: 'MISSING_ASSET_VALUATION',
      [RiskCategory.ENCUMBERED_ASSET]: 'ENCUMBERED_ASSET',
      [RiskCategory.FRAUDULENT_ASSET_TRANSFER]: 'FRAUDULENT_ASSET_TRANSFER',
      [RiskCategory.INVALID_WILL_SIGNATURE]: 'INVALID_WILL_SIGNATURE',
      [RiskCategory.MINOR_EXECUTOR]: 'MINOR_EXECUTOR',
      [RiskCategory.BENEFICIARY_AS_WITNESS]: 'BENEFICIARY_AS_WITNESS',
      [RiskCategory.CONTESTED_WILL]: 'CONTESTED_WILL',
      [RiskCategory.UNDUE_INFLUENCE]: 'UNDUE_INFLUENCE',
      [RiskCategory.WRONG_COURT]: 'WRONG_COURT',
      [RiskCategory.NON_RESIDENT_APPLICANT]: 'NON_RESIDENT_APPLICANT',
      [RiskCategory.FORUM_NON_CONVENIENS]: 'FORUM_NON_CONVENIENS',
      [RiskCategory.TAX_CLEARANCE_MISSING]: 'TAX_CLEARANCE_MISSING',
      [RiskCategory.KRA_PIN_MISSING]: 'KRA_PIN_MISSING',
      [RiskCategory.CAPITAL_GAINS_TAX_UNPAID]: 'CAPITAL_GAINS_TAX_UNPAID',
      [RiskCategory.STATUTE_BARRED_DEBT]: 'STATUTE_BARRED_DEBT',
      [RiskCategory.DELAYED_FILING]: 'DELAYED_FILING',
      [RiskCategory.FAMILY_DISPUTE]: 'FAMILY_DISPUTE',
      [RiskCategory.CRIMINAL_INVESTIGATION]: 'CRIMINAL_INVESTIGATION',
      [RiskCategory.BANKRUPTCY_PENDING]: 'BANKRUPTCY_PENDING',
      [RiskCategory.DATA_INCONSISTENCY]: 'DATA_INCONSISTENCY',
      [RiskCategory.EXTERNAL_API_FAILURE]: 'EXTERNAL_API_FAILURE',
    };

    const toDomain: Record<string, RiskCategory> = Object.entries(toPrisma).reduce(
      (acc, [domain, prisma]) => {
        acc[prisma] = domain as RiskCategory;
        return acc;
      },
      {} as Record<string, RiskCategory>,
    );

    return { toPrisma, toDomain };
  }

  private getSeverityMapping() {
    const toPrisma: Record<RiskSeverity, string> = {
      [RiskSeverity.CRITICAL]: 'CRITICAL',
      [RiskSeverity.HIGH]: 'HIGH',
      [RiskSeverity.MEDIUM]: 'MEDIUM',
      [RiskSeverity.LOW]: 'LOW',
    };

    const toDomain: Record<string, RiskSeverity> = Object.entries(toPrisma).reduce(
      (acc, [domain, prisma]) => {
        acc[prisma] = domain as RiskSeverity;
        return acc;
      },
      {} as Record<string, RiskSeverity>,
    );

    return { toPrisma, toDomain };
  }

  // ==================== TRANSACTION SUPPORT ====================

  /**
   * Execute operation within transaction
   */
  async withTransaction<T>(operation: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(operation);
  }

  /**
   * Get raw Prisma client for complex operations
   */
  getPrismaClient() {
    return this.prisma;
  }
}

// ==================== FACTORY FOR DEPENDENCY INJECTION ====================

export const PrismaReadinessRepositoryProvider = {
  provide: 'READINESS_REPOSITORY',
  useClass: PrismaReadinessRepository,
};

// ==================== HEALTH CHECK ====================

export interface RepositoryHealth {
  isConnected: boolean;
  assessmentCount: number;
  riskCount: number;
  lastOperation: Date;
}

export async function checkRepositoryHealth(prisma: PrismaService): Promise<RepositoryHealth> {
  try {
    const [assessmentCount, riskCount] = await Promise.all([
      prisma.readinessAssessment.count(),
      prisma.riskFlag.count(),
    ]);

    return {
      isConnected: true,
      assessmentCount,
      riskCount,
      lastOperation: new Date(),
    };
  } catch (error) {
    return {
      isConnected: false,
      assessmentCount: 0,
      riskCount: 0,
      lastOperation: new Date(),
    };
  }
}
