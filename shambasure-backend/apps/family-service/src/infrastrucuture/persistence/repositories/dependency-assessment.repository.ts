// infrastructure/persistence/repositories/dependency-assessment.repository.ts
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@shamba/database';

import { DependencyAssessmentAggregate } from '../../../domain/aggregates/dependency-assessment.aggregate';
import { DomainEvent } from '../../../domain/base/domain-event';
import {
  DependencyRelationship,
  LegalDependant,
} from '../../../domain/entities/legal-dependant.entity';
import {
  AssessmentFinalizedException,
  AssessmentSummary,
  AssessmentVersion,
  ComplianceReport,
  CourtStationStatistics,
  DependantSummary,
  DependencyAssessmentNotFoundException,
  DependencySearchFilters,
  DependencySortOptions,
  DependencyStatistics,
  DistributionFilters,
  DistributionReport,
  DuplicateDependantException,
  EfilingData,
  HotchpotStatistics,
  IDependencyAssessmentRepository,
  PaginatedResult,
  PaginationOptions,
  RelationshipStatistics,
  RepositoryException,
  S26ClaimStatistics,
  StatisticsFilters,
  VersionComparison,
} from '../../../domain/interfaces/repositories/idependency-assessment.repository';
import { DependencyAssessmentMapper } from '../mappers/dependency-assessment.mapper';

// Define the event payload type
interface DomainEventPayload {
  [key: string]: any;
}

// Define concrete domain event class for reconstruction
class GenericDomainEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    private readonly payload: DomainEventPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, occurredAt);
  }

  protected getPayload(): DomainEventPayload {
    return this.payload;
  }
}

@Injectable()
export class DependencyAssessmentRepository implements IDependencyAssessmentRepository {
  private readonly logger = new Logger(DependencyAssessmentRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: DependencyAssessmentMapper,
  ) {}

  // ============================================================================
  // CREATE & UPDATE (Write Operations)
  // ============================================================================

  async save(assessment: DependencyAssessmentAggregate): Promise<DependencyAssessmentAggregate> {
    try {
      const {
        assessment: assessmentData,
        dependants,
        gifts,
        distributionCalculations,
        events,
      } = this.mapper.toPersistence(assessment);

      return await this.prisma.$transaction(async (tx: any) => {
        // 1. Save or update assessment
        const savedAssessment = await tx.dependencyAssessment.upsert({
          where: { id: assessmentData.id },
          create: assessmentData,
          update: {
            ...assessmentData,
            version: { increment: 1 },
          },
        });

        // 2. Delete existing dependants and recreate (simplified approach)
        await tx.legalDependant.deleteMany({
          where: { assessmentId: assessmentData.id },
        });

        if (dependants.length > 0) {
          await tx.legalDependant.createMany({
            data: dependants,
          });
        }

        // 3. Delete existing gifts and recreate
        await tx.giftInterVivos.deleteMany({
          where: { assessmentId: assessmentData.id },
        });

        if (gifts.length > 0) {
          await tx.giftInterVivos.createMany({
            data: gifts,
          });
        }

        // 4. Delete existing calculations and recreate
        await tx.distributionCalculation.deleteMany({
          where: { assessmentId: assessmentData.id },
        });

        if (distributionCalculations.length > 0) {
          await tx.distributionCalculation.createMany({
            data: distributionCalculations,
          });
        }

        // 5. Save domain events to event store
        if (events.length > 0) {
          await tx.domainEvent.createMany({
            data: events,
          });
        }

        // 6. Clear uncommitted events from aggregate
        assessment.clearEvents();

        return assessment;
      });
    } catch (error: any) {
      this.logger.error(`Failed to save assessment ${assessment._id.toString()}`, error.stack);

      if (error.code === 'P2002') {
        throw new RepositoryException(
          `Duplicate entry for assessment ${assessment._id.toString()}`,
          'DUPLICATE_ENTRY',
          error,
        );
      }

      if (error.code === 'P2003') {
        throw new RepositoryException(
          `Foreign key constraint violation for assessment ${assessment._id.toString()}`,
          'FOREIGN_KEY_VIOLATION',
          error,
        );
      }

      throw new RepositoryException(
        `Failed to save assessment ${assessment._id.toString()}: ${error.message}`,
        'SAVE_ERROR',
        error,
      );
    }
  }

  async saveMany(
    assessments: DependencyAssessmentAggregate[],
  ): Promise<DependencyAssessmentAggregate[]> {
    try {
      return await this.prisma.$transaction(async (tx: any) => {
        const savedAssessments: DependencyAssessmentAggregate[] = [];

        for (const assessment of assessments) {
          const saved = await this.save(assessment);
          savedAssessments.push(saved);
        }

        return savedAssessments;
      });
    } catch (error: any) {
      this.logger.error('Failed to save multiple assessments', error.stack);
      throw new RepositoryException(
        `Failed to save multiple assessments: ${error.message}`,
        'BATCH_SAVE_ERROR',
        error,
      );
    }
  }

  // ============================================================================
  // READ (Query Operations)
  // ============================================================================

  async findById(id: string): Promise<DependencyAssessmentAggregate | null> {
    try {
      const assessment = await this.prisma.dependencyAssessment.findUnique({
        where: { id },
        include: {
          dependants: true,
          giftsInterVivos: true,
          distributionCalculations: true,
        },
      });

      if (!assessment) {
        return null;
      }

      return this.mapper.toDomain(
        assessment,
        assessment.dependants,
        assessment.giftsInterVivos,
        assessment.distributionCalculations,
      );
    } catch (error: any) {
      this.logger.error(`Failed to find assessment ${id}`, error.stack);
      throw new RepositoryException(
        `Failed to find assessment ${id}: ${error.message}`,
        'FIND_ERROR',
        error,
      );
    }
  }

  async findByDeceasedId(deceasedId: string): Promise<DependencyAssessmentAggregate | null> {
    try {
      const assessment = await this.prisma.dependencyAssessment.findFirst({
        where: {
          deceasedId,
          deletedAt: null,
        },
        include: {
          dependants: true,
          giftsInterVivos: true,
          distributionCalculations: true,
        },
      });

      if (!assessment) {
        return null;
      }

      return this.mapper.toDomain(
        assessment,
        assessment.dependants,
        assessment.giftsInterVivos,
        assessment.distributionCalculations,
      );
    } catch (error: any) {
      this.logger.error(`Failed to find assessment for deceased ${deceasedId}`, error.stack);
      throw new RepositoryException(
        `Failed to find assessment for deceased ${deceasedId}: ${error.message}`,
        'FIND_ERROR',
        error,
      );
    }
  }

  async findByDependantId(dependantId: string): Promise<DependencyAssessmentAggregate[]> {
    try {
      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: {
          dependants: {
            some: {
              dependantId,
              deletedAt: null,
            },
          },
          deletedAt: null,
        },
        include: {
          dependants: {
            where: { deletedAt: null },
          },
          giftsInterVivos: {
            where: { deletedAt: null },
          },
          distributionCalculations: true,
        },
      });

      return assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );
    } catch (error: any) {
      this.logger.error(`Failed to find assessments for dependant ${dependantId}`, error.stack);
      throw new RepositoryException(
        `Failed to find assessments for dependant ${dependantId}: ${error.message}`,
        'FIND_ERROR',
        error,
      );
    }
  }

  async findByCourtCaseNumber(courtCaseNumber: string): Promise<DependencyAssessmentAggregate[]> {
    try {
      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: {
          dependants: {
            some: {
              s26CourtOrder: {
                path: ['caseNumber'],
                equals: courtCaseNumber,
              },
            },
          },
          deletedAt: null,
        },
        include: {
          dependants: {
            where: { deletedAt: null },
          },
          giftsInterVivos: {
            where: { deletedAt: null },
          },
          distributionCalculations: true,
        },
      });

      return assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to find assessments for court case ${courtCaseNumber}`,
        error.stack,
      );
      throw new RepositoryException(
        `Failed to find assessments for court case ${courtCaseNumber}: ${error.message}`,
        'FIND_ERROR',
        error,
      );
    }
  }

  async findByCourtOrderNumber(courtOrderNumber: string): Promise<DependencyAssessmentAggregate[]> {
    try {
      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: {
          dependants: {
            some: {
              s26CourtOrder: {
                path: ['orderNumber'],
                equals: courtOrderNumber,
              },
            },
          },
          deletedAt: null,
        },
        include: {
          dependants: {
            where: { deletedAt: null },
          },
          giftsInterVivos: {
            where: { deletedAt: null },
          },
          distributionCalculations: true,
        },
      });

      return assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to find assessments for court order ${courtOrderNumber}`,
        error.stack,
      );
      throw new RepositoryException(
        `Failed to find assessments for court order ${courtOrderNumber}: ${error.message}`,
        'FIND_ERROR',
        error,
      );
    }
  }

  async search(
    filters: DependencySearchFilters,
    pagination: PaginationOptions,
    sort?: DependencySortOptions,
  ): Promise<PaginatedResult<DependencyAssessmentAggregate>> {
    try {
      const prismaFilter = this.mapper.toPrismaFilter(filters);
      const prismaSort = this.mapper.toPrismaSort(sort);

      const [assessments, total] = await Promise.all([
        this.prisma.dependencyAssessment.findMany({
          where: {
            ...prismaFilter,
            deletedAt: null,
          },
          include: {
            dependants: {
              where: { deletedAt: null },
            },
            giftsInterVivos: {
              where: { deletedAt: null },
            },
            distributionCalculations: true,
          },
          orderBy: prismaSort,
          skip: (pagination.page - 1) * pagination.pageSize,
          take: pagination.pageSize,
        }),
        this.prisma.dependencyAssessment.count({
          where: {
            ...prismaFilter,
            deletedAt: null,
          },
        }),
      ]);

      const items = assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );

      const totalPages = Math.ceil(total / pagination.pageSize);

      return {
        items,
        total,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrevious: pagination.page > 1,
      };
    } catch (error: any) {
      this.logger.error('Failed to search assessments', error.stack);
      throw new RepositoryException(
        `Failed to search assessments: ${error.message}`,
        'SEARCH_ERROR',
        error,
      );
    }
  }

  async count(filters: DependencySearchFilters): Promise<number> {
    try {
      const prismaFilter = this.mapper.toPrismaFilter(filters);

      return await this.prisma.dependencyAssessment.count({
        where: {
          ...prismaFilter,
          deletedAt: null,
        },
      });
    } catch (error: any) {
      this.logger.error('Failed to count assessments', error.stack);
      throw new RepositoryException(
        `Failed to count assessments: ${error.message}`,
        'COUNT_ERROR',
        error,
      );
    }
  }

  // ============================================================================
  // S.26 COURT PROVISION QUERIES
  // ============================================================================

  async findWithPendingS26Claims(): Promise<DependencyAssessmentAggregate[]> {
    try {
      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: {
          dependants: {
            some: {
              isS26Claimant: true,
              s26ClaimStatus: 'PENDING',
              deletedAt: null,
            },
          },
          deletedAt: null,
          isFinalized: false,
        },
        include: {
          dependants: {
            where: { deletedAt: null },
          },
          giftsInterVivos: {
            where: { deletedAt: null },
          },
          distributionCalculations: true,
        },
      });

      return assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );
    } catch (error: any) {
      this.logger.error('Failed to find assessments with pending S.26 claims', error.stack);
      throw new RepositoryException(
        'Failed to find assessments with pending S.26 claims',
        'FIND_ERROR',
        error,
      );
    }
  }

  async findWithApprovedS26Claims(): Promise<DependencyAssessmentAggregate[]> {
    try {
      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: {
          dependants: {
            some: {
              isS26Claimant: true,
              s26ClaimStatus: 'APPROVED',
              deletedAt: null,
            },
          },
          deletedAt: null,
        },
        include: {
          dependants: {
            where: { deletedAt: null },
          },
          giftsInterVivos: {
            where: { deletedAt: null },
          },
          distributionCalculations: true,
        },
      });

      return assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );
    } catch (error: any) {
      this.logger.error('Failed to find assessments with approved S.26 claims', error.stack);
      throw new RepositoryException(
        'Failed to find assessments with approved S.26 claims',
        'FIND_ERROR',
        error,
      );
    }
  }

  async findRequiringCourtReview(): Promise<DependencyAssessmentAggregate[]> {
    try {
      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: {
          OR: [
            {
              dependants: {
                some: {
                  isS26Claimant: true,
                  s26ClaimStatus: 'PENDING',
                  deletedAt: null,
                },
              },
            },
            {
              totalEstateValue: {
                gt: 10000000, // KES 10M threshold for court review
              },
              isFinalized: false,
            },
            {
              totalDependants: {
                gt: 10, // Large family threshold
              },
              isFinalized: false,
            },
          ],
          deletedAt: null,
        },
        include: {
          dependants: {
            where: { deletedAt: null },
          },
          giftsInterVivos: {
            where: { deletedAt: null },
          },
          distributionCalculations: true,
        },
      });

      return assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );
    } catch (error: any) {
      this.logger.error('Failed to find assessments requiring court review', error.stack);
      throw new RepositoryException(
        'Failed to find assessments requiring court review',
        'FIND_ERROR',
        error,
      );
    }
  }

  async findS26ClaimsByAmountRange(
    minAmount: number,
    maxAmount?: number,
  ): Promise<DependencyAssessmentAggregate[]> {
    try {
      const amountFilter: any = { gt: minAmount };
      if (maxAmount !== undefined) {
        amountFilter.lt = maxAmount;
      }

      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: {
          dependants: {
            some: {
              isS26Claimant: true,
              s26ClaimAmount: amountFilter,
              deletedAt: null,
            },
          },
          deletedAt: null,
        },
        include: {
          dependants: {
            where: { deletedAt: null },
          },
          giftsInterVivos: {
            where: { deletedAt: null },
          },
          distributionCalculations: true,
        },
      });

      return assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );
    } catch (error: any) {
      this.logger.error('Failed to find S.26 claims by amount range', error.stack);
      throw new RepositoryException(
        'Failed to find S.26 claims by amount range',
        'FIND_ERROR',
        error,
      );
    }
  }

  // ============================================================================
  // HOTCHPOT QUERIES (S.35(3) LSA)
  // ============================================================================

  async findWithGiftsInterVivos(): Promise<DependencyAssessmentAggregate[]> {
    try {
      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: {
          giftsInterVivos: {
            some: {
              deletedAt: null,
            },
          },
          deletedAt: null,
        },
        include: {
          dependants: {
            where: { deletedAt: null },
          },
          giftsInterVivos: {
            where: { deletedAt: null },
          },
          distributionCalculations: true,
        },
      });

      return assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );
    } catch (error: any) {
      this.logger.error('Failed to find assessments with gifts inter vivos', error.stack);
      throw new RepositoryException(
        'Failed to find assessments with gifts inter vivos',
        'FIND_ERROR',
        error,
      );
    }
  }

  async findWithSignificantGifts(minValue: number): Promise<DependencyAssessmentAggregate[]> {
    try {
      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: {
          giftsInterVivos: {
            some: {
              valueAtGiftTime: { gte: minValue },
              deletedAt: null,
            },
          },
          deletedAt: null,
        },
        include: {
          dependants: {
            where: { deletedAt: null },
          },
          giftsInterVivos: {
            where: { deletedAt: null },
          },
          distributionCalculations: true,
        },
      });

      return assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );
    } catch (error: any) {
      this.logger.error('Failed to find assessments with significant gifts', error.stack);
      throw new RepositoryException(
        'Failed to find assessments with significant gifts',
        'FIND_ERROR',
        error,
      );
    }
  }

  // ============================================================================
  // FINALIZATION & DISTRIBUTION QUERIES
  // ============================================================================

  async findReadyToFinalize(): Promise<DependencyAssessmentAggregate[]> {
    try {
      // Criteria for readiness:
      // 1. Has dependants
      // 2. No pending S.26 claims
      // 3. Has estate value
      // 4. Not already finalized

      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: {
          dependants: {
            some: { deletedAt: null },
          },
          totalEstateValue: { not: null },
          isFinalized: false,
          deletedAt: null,
          NOT: {
            dependants: {
              some: {
                isS26Claimant: true,
                s26ClaimStatus: 'PENDING',
                deletedAt: null,
              },
            },
          },
        },
        include: {
          dependants: {
            where: { deletedAt: null },
          },
          giftsInterVivos: {
            where: { deletedAt: null },
          },
          distributionCalculations: true,
        },
      });

      return assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );
    } catch (error: any) {
      this.logger.error('Failed to find assessments ready to finalize', error.stack);
      throw new RepositoryException(
        'Failed to find assessments ready to finalize',
        'FIND_ERROR',
        error,
      );
    }
  }

  async findPendingDistribution(): Promise<DependencyAssessmentAggregate[]> {
    try {
      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: {
          isFinalized: true,
          totalEstateValue: { not: null },
          distributionCalculations: {
            none: {}, // Has no distribution calculations yet
          },
          deletedAt: null,
        },
        include: {
          dependants: {
            where: { deletedAt: null },
          },
          giftsInterVivos: {
            where: { deletedAt: null },
          },
          distributionCalculations: true,
        },
      });

      return assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );
    } catch (error: any) {
      this.logger.error('Failed to find assessments pending distribution', error.stack);
      throw new RepositoryException(
        'Failed to find assessments pending distribution',
        'FIND_ERROR',
        error,
      );
    }
  }

  async findWithDistributionCalculations(
    filters?: DistributionFilters,
  ): Promise<DependencyAssessmentAggregate[]> {
    try {
      const whereClause: any = {
        distributionCalculations: {
          some: {},
        },
        deletedAt: null,
      };

      if (filters?.minNetEntitlement) {
        whereClause.distributionCalculations.some.netEntitlement = {
          gte: filters.minNetEntitlement,
        };
      }

      if (filters?.maxNetEntitlement) {
        whereClause.distributionCalculations.some.netEntitlement = {
          ...whereClause.distributionCalculations.some.netEntitlement,
          lte: filters.maxNetEntitlement,
        };
      }

      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: whereClause,
        include: {
          dependants: {
            where: { deletedAt: null },
          },
          giftsInterVivos: {
            where: { deletedAt: null },
          },
          distributionCalculations: true,
        },
      });

      return assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );
    } catch (error: any) {
      this.logger.error('Failed to find assessments with distribution calculations', error.stack);
      throw new RepositoryException(
        'Failed to find assessments with distribution calculations',
        'FIND_ERROR',
        error,
      );
    }
  }

  // ============================================================================
  // COMPLIANCE & EVIDENCE QUERIES
  // ============================================================================

  async findWithMissingEvidence(): Promise<DependencyAssessmentAggregate[]> {
    try {
      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: {
          dependants: {
            some: {
              evidenceDocuments: { equals: [] },
              deletedAt: null,
            },
          },
          isFinalized: false,
          deletedAt: null,
        },
        include: {
          dependants: {
            where: { deletedAt: null },
          },
          giftsInterVivos: {
            where: { deletedAt: null },
          },
          distributionCalculations: true,
        },
      });

      return assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );
    } catch (error: any) {
      this.logger.error('Failed to find assessments with missing evidence', error.stack);
      throw new RepositoryException(
        'Failed to find assessments with missing evidence',
        'FIND_ERROR',
        error,
      );
    }
  }

  async findWithUnverifiedDependants(): Promise<DependencyAssessmentAggregate[]> {
    try {
      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: {
          dependants: {
            some: {
              verifiedAt: null,
              deletedAt: null,
            },
          },
          isFinalized: false,
          deletedAt: null,
        },
        include: {
          dependants: {
            where: { deletedAt: null },
          },
          giftsInterVivos: {
            where: { deletedAt: null },
          },
          distributionCalculations: true,
        },
      });

      return assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );
    } catch (error: any) {
      this.logger.error('Failed to find assessments with unverified dependants', error.stack);
      throw new RepositoryException(
        'Failed to find assessments with unverified dependants',
        'FIND_ERROR',
        error,
      );
    }
  }

  async findExceedingTimeLimits(maxDays: number): Promise<DependencyAssessmentAggregate[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxDays);

      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: {
          createdAt: { lt: cutoffDate },
          isFinalized: false,
          deletedAt: null,
        },
        include: {
          dependants: {
            where: { deletedAt: null },
          },
          giftsInterVivos: {
            where: { deletedAt: null },
          },
          distributionCalculations: true,
        },
      });

      return assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );
    } catch (error: any) {
      this.logger.error('Failed to find assessments exceeding time limits', error.stack);
      throw new RepositoryException(
        'Failed to find assessments exceeding time limits',
        'FIND_ERROR',
        error,
      );
    }
  }

  // ============================================================================
  // STATISTICS & REPORTING
  // ============================================================================

  async getStatistics(filters?: StatisticsFilters): Promise<DependencyStatistics> {
    try {
      const whereClause: any = { deletedAt: null };

      if (filters?.startDate) {
        whereClause.createdAt = { gte: filters.startDate };
      }

      if (filters?.endDate) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          lte: filters.endDate,
        };
      }

      if (filters?.isFinalized !== undefined) {
        whereClause.isFinalized = filters.isFinalized;
      }

      const [
        totalAssessments,
        finalizedAssessments,
        dependantsAggregate,
        s26ClaimantsAggregate,
        giftsAggregate,
      ] = await Promise.all([
        this.prisma.dependencyAssessment.count({ where: whereClause }),
        this.prisma.dependencyAssessment.count({
          where: { ...whereClause, isFinalized: true },
        }),
        this.prisma.dependencyAssessment.aggregate({
          where: whereClause,
          _sum: { totalDependants: true },
          _avg: { totalDependencyPercentage: true },
        }),
        this.prisma.legalDependant.aggregate({
          where: {
            assessment: whereClause,
            isS26Claimant: true,
            deletedAt: null,
          },
          _count: true,
          _sum: { s26ClaimAmount: true },
        }),
        this.prisma.giftInterVivos.aggregate({
          where: {
            assessment: whereClause,
            deletedAt: null,
          },
          _sum: { valueAtGiftTime: true },
        }),
      ]);

      // Get priority dependants count
      const priorityDependants = await this.prisma.legalDependant.count({
        where: {
          assessment: whereClause,
          relationship: {
            in: ['SPOUSE', 'CHILD', 'ADOPTED_CHILD'],
          },
          deletedAt: null,
        },
      });

      // Get pending S.26 claims
      const pendingS26Claims = await this.prisma.legalDependant.count({
        where: {
          assessment: whereClause,
          isS26Claimant: true,
          s26ClaimStatus: 'PENDING',
          deletedAt: null,
        },
      });

      // Get approved S.26 claims
      const approvedS26Claims = await this.prisma.legalDependant.count({
        where: {
          assessment: whereClause,
          isS26Claimant: true,
          s26ClaimStatus: 'APPROVED',
          deletedAt: null,
        },
      });

      return {
        totalAssessments,
        finalizedAssessments,
        pendingAssessments: totalAssessments - finalizedAssessments,
        totalDependants: dependantsAggregate._sum.totalDependants || 0,
        priorityDependants,
        conditionalDependants: (dependantsAggregate._sum.totalDependants || 0) - priorityDependants,
        s26Claimants: s26ClaimantsAggregate._count || 0,
        pendingS26Claims,
        approvedS26Claims,
        totalGiftsValue: giftsAggregate._sum.valueAtGiftTime || 0,
        averageDependantsPerAssessment:
          totalAssessments > 0
            ? (dependantsAggregate._sum.totalDependants || 0) / totalAssessments
            : 0,
        averageDependencyPercentage: dependantsAggregate._avg.totalDependencyPercentage || 0,
      };
    } catch (error: any) {
      this.logger.error('Failed to get statistics', error.stack);
      throw new RepositoryException('Failed to get statistics', 'STATISTICS_ERROR', error);
    }
  }

  async getStatisticsByCourtStation(): Promise<CourtStationStatistics[]> {
    try {
      // This query requires grouping by court station from dependant's court orders
      // Using Prisma raw query for complex grouping
      const rawStats = await this.prisma.$queryRaw<any[]>`
        SELECT 
          COALESCE(
            JSON_UNQUOTE(JSON_EXTRACT(ld.s26CourtOrder, '$.courtStation')), 
            'UNSPECIFIED'
          ) as courtStation,
          COUNT(DISTINCT da.id) as totalAssessments,
          COUNT(DISTINCT CASE WHEN da.isFinalized = true THEN da.id END) as finalizedAssessments,
          COUNT(DISTINCT ld.id) as totalDependants,
          COUNT(DISTINCT CASE WHEN ld.isS26Claimant = true THEN ld.id END) as s26ClaimsFiled,
          COUNT(DISTINCT CASE WHEN ld.isS26Claimant = true AND ld.s26ClaimStatus = 'APPROVED' THEN ld.id END) as s26ClaimsApproved,
          AVG(CASE WHEN da.isFinalized = true THEN DATEDIFF(da.finalizedAt, da.createdAt) END) as averageProcessingDays,
          COUNT(DISTINCT g.id) as hotchpotApplications,
          COALESCE(SUM(g.valueAtGiftTime), 0) as totalHotchpotValue
        FROM DependencyAssessment da
        LEFT JOIN LegalDependant ld ON da.id = ld.assessmentId AND ld.deletedAt IS NULL
        LEFT JOIN GiftInterVivos g ON da.id = g.assessmentId AND g.deletedAt IS NULL
        WHERE da.deletedAt IS NULL
        GROUP BY courtStation
      `;

      return rawStats.map((stat) => ({
        courtStation: stat.courtStation,
        totalAssessments: Number(stat.totalAssessments),
        finalizedAssessments: Number(stat.finalizedAssessments),
        totalDependants: Number(stat.totalDependants),
        s26ClaimsFiled: Number(stat.s26ClaimsFiled),
        s26ClaimsApproved: Number(stat.s26ClaimsApproved),
        averageProcessingDays: Number(stat.averageProcessingDays) || 0,
        hotchpotApplications: Number(stat.hotchpotApplications),
        totalHotchpotValue: Number(stat.totalHotchpotValue),
      }));
    } catch (error: any) {
      this.logger.error('Failed to get statistics by court station', error.stack);
      throw new RepositoryException(
        'Failed to get statistics by court station',
        'STATISTICS_ERROR',
        error,
      );
    }
  }

  async getRelationshipStatistics(): Promise<RelationshipStatistics[]> {
    try {
      const rawStats = await this.prisma.$queryRaw<any[]>`
        SELECT 
          ld.relationship,
          COUNT(DISTINCT ld.id) as count,
          AVG(ld.dependencyPercentage) as averageDependencyPercentage,
          AVG(dc.netEntitlement) as averageEntitlement
        FROM LegalDependant ld
        LEFT JOIN DependencyAssessment da ON ld.assessmentId = da.id
        LEFT JOIN DistributionCalculation dc ON da.id = dc.assessmentId AND ld.dependantId = dc.dependantId
        WHERE ld.deletedAt IS NULL AND da.deletedAt IS NULL
        GROUP BY ld.relationship
      `;

      const totalCount = await this.prisma.legalDependant.count({
        where: { deletedAt: null },
      });

      return rawStats.map((stat) => ({
        relationship: stat.relationship,
        count: Number(stat.count),
        averageDependencyPercentage: Number(stat.averageDependencyPercentage) || 0,
        averageEntitlement: Number(stat.averageEntitlement) || 0,
        percentageOfTotal: totalCount > 0 ? (Number(stat.count) / totalCount) * 100 : 0,
      }));
    } catch (error: any) {
      this.logger.error('Failed to get relationship statistics', error.stack);
      throw new RepositoryException(
        'Failed to get relationship statistics',
        'STATISTICS_ERROR',
        error,
      );
    }
  }

  async getS26ClaimStatistics(): Promise<S26ClaimStatistics> {
    try {
      const claims = await this.prisma.legalDependant.groupBy({
        by: ['s26ClaimStatus'],
        where: {
          isS26Claimant: true,
          deletedAt: null,
        },
        _count: true,
        _sum: {
          s26ClaimAmount: true,
          s26ProvisionAmount: true,
        },
      });

      const totalClaims = claims.reduce((sum, claim) => sum + claim._count, 0);
      const approvedClaims = claims.find((c) => c.s26ClaimStatus === 'APPROVED')?._count || 0;
      const totalClaimedAmount = claims.reduce(
        (sum, claim) => sum + (claim._sum.s26ClaimAmount || 0),
        0,
      );
      const totalApprovedAmount = claims.reduce(
        (sum, claim) => sum + (claim._sum.s26ProvisionAmount || 0),
        0,
      );

      return {
        totalClaims,
        pendingClaims: claims.find((c) => c.s26ClaimStatus === 'PENDING')?._count || 0,
        approvedClaims,
        partiallyApprovedClaims:
          claims.find((c) => c.s26ClaimStatus === 'PARTIALLY_APPROVED')?._count || 0,
        deniedClaims: claims.find((c) => c.s26ClaimStatus === 'DENIED')?._count || 0,
        withdrawnClaims: claims.find((c) => c.s26ClaimStatus === 'WITHDRAWN')?._count || 0,
        totalClaimedAmount,
        totalApprovedAmount,
        approvalRate: totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0,
        averageClaimAmount: totalClaims > 0 ? totalClaimedAmount / totalClaims : 0,
        averageApprovedAmount: approvedClaims > 0 ? totalApprovedAmount / approvedClaims : 0,
      };
    } catch (error: any) {
      this.logger.error('Failed to get S.26 claim statistics', error.stack);
      throw new RepositoryException(
        'Failed to get S.26 claim statistics',
        'STATISTICS_ERROR',
        error,
      );
    }
  }

  async getHotchpotStatistics(): Promise<HotchpotStatistics> {
    try {
      const gifts = await this.prisma.giftInterVivos.findMany({
        where: { deletedAt: null },
      });

      if (gifts.length === 0) {
        return {
          totalGifts: 0,
          totalValue: 0,
          averageGiftValue: 0,
          giftsPerDependant: 0,
          mostCommonRecipient: 'CHILD' as DependencyRelationship,
        };
      }

      // Find most common recipient type
      const recipientRelationships = await this.prisma.$queryRaw<any[]>`
        SELECT ld.relationship, COUNT(g.id) as count
        FROM GiftInterVivos g
        JOIN LegalDependant ld ON g.recipientId = ld.dependantId AND ld.assessmentId = g.assessmentId
        WHERE g.deletedAt IS NULL
        GROUP BY ld.relationship
        ORDER BY count DESC
        LIMIT 1
      `;

      const totalValue = gifts.reduce((sum, gift) => sum + gift.valueAtGiftTime, 0);
      const uniqueRecipients = new Set(gifts.map((g) => g.recipientId)).size;

      return {
        totalGifts: gifts.length,
        totalValue,
        averageGiftValue: totalValue / gifts.length,
        giftsPerDependant: uniqueRecipients > 0 ? gifts.length / uniqueRecipients : 0,
        mostCommonRecipient:
          (recipientRelationships?.[0]?.relationship as DependencyRelationship) || 'CHILD',
      };
    } catch (error: any) {
      this.logger.error('Failed to get hotchpot statistics', error.stack);
      throw new RepositoryException('Failed to get hotchpot statistics', 'STATISTICS_ERROR', error);
    }
  }

  async getAssessmentSummary(id: string): Promise<AssessmentSummary> {
    try {
      const assessment = await this.prisma.dependencyAssessment.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              dependants: {
                where: { deletedAt: null },
              },
            },
          },
          dependants: {
            where: {
              deletedAt: null,
              relationship: {
                in: ['SPOUSE', 'CHILD', 'ADOPTED_CHILD'],
              },
            },
            select: { id: true },
          },
        },
      });

      if (!assessment) {
        throw new DependencyAssessmentNotFoundException(id);
      }

      const s26Claimants = await this.prisma.legalDependant.count({
        where: {
          assessmentId: id,
          isS26Claimant: true,
          deletedAt: null,
        },
      });

      const totalGiftsValue = await this.prisma.giftInterVivos.aggregate({
        where: {
          assessmentId: id,
          deletedAt: null,
        },
        _sum: { valueAtGiftTime: true },
      });

      return this.mapper.toAssessmentSummary(
        assessment,
        assessment._count.dependants,
        assessment.dependants.length,
        s26Claimants,
      );
    } catch (error: any) {
      if (error instanceof DependencyAssessmentNotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get assessment summary ${id}`, error.stack);
      throw new RepositoryException(
        `Failed to get assessment summary ${id}: ${error.message}`,
        'SUMMARY_ERROR',
        error,
      );
    }
  }

  async getDependantSummaries(assessmentId: string): Promise<DependantSummary[]> {
    try {
      const dependants = await this.prisma.legalDependant.findMany({
        where: {
          assessmentId,
          deletedAt: null,
        },
      });

      return dependants.map((d) => this.mapper.toDependantSummary(d));
    } catch (error: any) {
      this.logger.error(
        `Failed to get dependant summaries for assessment ${assessmentId}`,
        error.stack,
      );
      throw new RepositoryException(
        `Failed to get dependant summaries for assessment ${assessmentId}: ${error.message}`,
        'SUMMARY_ERROR',
        error,
      );
    }
  }

  async generateDistributionReport(assessmentId: string): Promise<DistributionReport> {
    try {
      const assessment = await this.prisma.dependencyAssessment.findUnique({
        where: { id: assessmentId },
      });

      if (!assessment) {
        throw new DependencyAssessmentNotFoundException(assessmentId);
      }

      const calculations = await this.prisma.distributionCalculation.findMany({
        where: { assessmentId },
      });

      const totalGiftsValue = await this.prisma.giftInterVivos.aggregate({
        where: {
          assessmentId,
          deletedAt: null,
        },
        _sum: { valueAtGiftTime: true },
      });

      const hotchpotTotal =
        (assessment.totalEstateValue || 0) + (totalGiftsValue._sum.valueAtGiftTime || 0);

      return this.mapper.toDistributionReport(assessment, calculations);
    } catch (error: any) {
      if (error instanceof DependencyAssessmentNotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to generate distribution report ${assessmentId}`, error.stack);
      throw new RepositoryException(
        `Failed to generate distribution report ${assessmentId}: ${error.message}`,
        'REPORT_ERROR',
        error,
      );
    }
  }

  async generateComplianceReport(filters: StatisticsFilters): Promise<ComplianceReport> {
    try {
      const whereClause: any = { deletedAt: null };

      if (filters?.startDate) {
        whereClause.createdAt = { gte: filters.startDate };
      }

      if (filters?.endDate) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          lte: filters.endDate,
        };
      }

      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              dependants: {
                where: {
                  verifiedAt: null,
                  deletedAt: null,
                },
              },
            },
          },
        },
      });

      const details = await Promise.all(
        assessments.map(async (assessment) => {
          const issues: string[] = [];

          // Check for unverified dependants
          if (assessment._count.dependants > 0) {
            issues.push(`${assessment._count.dependants} unverified dependants`);
          }

          // Check for pending S.26 claims
          const pendingClaims = await this.prisma.legalDependant.count({
            where: {
              assessmentId: assessment.id,
              isS26Claimant: true,
              s26ClaimStatus: 'PENDING',
              deletedAt: null,
            },
          });

          if (pendingClaims > 0) {
            issues.push(`${pendingClaims} pending S.26 claims`);
          }

          // Check for missing estate value
          if (!assessment.totalEstateValue) {
            issues.push('Missing estate value');
          }

          // Calculate compliance score (0-100)
          const complianceScore = Math.max(0, 100 - issues.length * 25);

          return {
            assessmentId: assessment.id,
            deceasedName: assessment.deceasedName,
            issues,
            missingEvidence: assessment._count.dependants,
            pendingActions: pendingClaims + (assessment.totalEstateValue ? 0 : 1),
            lastActionDate: assessment.updatedAt,
            nextDeadline: assessment.isFinalized
              ? undefined
              : new Date(assessment.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000),
            complianceScore,
          };
        }),
      );

      const totalAssessments = assessments.length;
      const compliant = details.filter((d) => d.complianceScore >= 75).length;
      const partiallyCompliant = details.filter(
        (d) => d.complianceScore >= 50 && d.complianceScore < 75,
      ).length;
      const nonCompliant = details.filter((d) => d.complianceScore < 50).length;

      return {
        generatedAt: new Date(),
        periodStart: filters?.startDate || new Date(0),
        periodEnd: filters?.endDate || new Date(),
        totalAssessments,
        compliant,
        partiallyCompliant,
        nonCompliant,
        details,
      } as ComplianceReport;
    } catch (error: any) {
      this.logger.error('Failed to generate compliance report', error.stack);
      throw new RepositoryException('Failed to generate compliance report', 'REPORT_ERROR', error);
    }
  }

  async getAssessmentsForEfiling(courtStation: string): Promise<EfilingData[]> {
    try {
      const assessments = await this.prisma.dependencyAssessment.findMany({
        where: {
          dependants: {
            some: {
              s26CourtOrder: {
                path: ['courtStation'],
                equals: courtStation,
              },
            },
          },
          deletedAt: null,
        },
        include: {
          dependants: {
            where: {
              deletedAt: null,
              s26CourtOrder: {
                path: ['courtStation'],
                equals: courtStation,
              },
            },
          },
        },
      });

      return assessments.map((assessment) => ({
        caseNumber: assessment.dependants[0]?.s26CourtOrder?.caseNumber || 'N/A',
        courtStation,
        filingDate: new Date(),
        assessmentId: assessment.id,
        deceasedName: assessment.deceasedName,
        dependantCount: assessment.dependants.length,
        s26ClaimCount: assessment.dependants.filter((d) => d.isS26Claimant).length,
        documents: [
          {
            documentType: 'DEPENDENCY_ASSESSMENT',
            documentId: assessment.id,
            required: true,
            uploaded: true,
            uploadDate: assessment.updatedAt,
          },
          {
            documentType: 'COURT_ORDER',
            documentId: `${assessment.id}_ORDER`,
            required: true,
            uploaded: !!assessment.dependants[0]?.s26CourtOrder,
            uploadDate: assessment.dependants[0]?.s26CourtOrder
              ? new Date(assessment.dependants[0].s26CourtOrder.orderDate)
              : undefined,
          },
        ],
      }));
    } catch (error: any) {
      this.logger.error(
        `Failed to get assessments for e-filing for court station ${courtStation}`,
        error.stack,
      );
      throw new RepositoryException(
        `Failed to get assessments for e-filing for court station ${courtStation}: ${error.message}`,
        'EFILING_ERROR',
        error,
      );
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async bulkUpdateAssessmentStatus(
    ids: string[],
    status: string,
    updatedBy: string,
  ): Promise<void> {
    try {
      await this.prisma.dependencyAssessment.updateMany({
        where: {
          id: { in: ids },
          deletedAt: null,
        },
        data: {
          isFinalized: status === 'FINALIZED',
          finalizedAt: status === 'FINALIZED' ? new Date() : undefined,
          finalizedBy: updatedBy,
          updatedAt: new Date(),
        },
      });
    } catch (error: any) {
      this.logger.error('Failed to bulk update assessment status', error.stack);
      throw new RepositoryException(
        'Failed to bulk update assessment status',
        'BULK_UPDATE_ERROR',
        error,
      );
    }
  }

  async bulkFinalizeAssessments(ids: string[], finalizedBy: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx: any) => {
        // Check if all assessments are ready to finalize
        const assessments = await tx.dependencyAssessment.findMany({
          where: {
            id: { in: ids },
            deletedAt: null,
            isFinalized: false,
          },
          include: {
            _count: {
              select: {
                dependants: {
                  where: {
                    isS26Claimant: true,
                    s26ClaimStatus: 'PENDING',
                    deletedAt: null,
                  },
                },
              },
            },
          },
        });

        // Verify no assessments have pending S.26 claims
        const problematicAssessments = assessments.filter((a) => a._count.dependants > 0);
        if (problematicAssessments.length > 0) {
          throw new RepositoryException(
            `Cannot finalize assessments with pending S.26 claims: ${problematicAssessments.map((a) => a.id).join(', ')}`,
            'VALIDATION_ERROR',
          );
        }

        // Update all assessments
        await tx.dependencyAssessment.updateMany({
          where: {
            id: { in: ids },
            deletedAt: null,
          },
          data: {
            isFinalized: true,
            finalizedAt: new Date(),
            finalizedBy,
            updatedAt: new Date(),
          },
        });
      });
    } catch (error: any) {
      this.logger.error('Failed to bulk finalize assessments', error.stack);
      throw new RepositoryException(
        'Failed to bulk finalize assessments',
        'BULK_FINALIZE_ERROR',
        error,
      );
    }
  }

  async bulkSoftDelete(ids: string[], deletedBy: string, reason: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx: any) => {
        // Soft delete assessments
        await tx.dependencyAssessment.updateMany({
          where: {
            id: { in: ids },
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Soft delete dependants
        await tx.legalDependant.updateMany({
          where: {
            assessmentId: { in: ids },
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Soft delete gifts
        await tx.giftInterVivos.updateMany({
          where: {
            assessmentId: { in: ids },
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Log deletion reason
        // Assuming there's an auditLog table
        await tx.auditLog.createMany({
          data: ids.map((id) => ({
            entityId: id,
            entityType: 'DEPENDENCY_ASSESSMENT',
            action: 'SOFT_DELETE',
            performedBy: deletedBy,
            details: JSON.stringify({ reason }),
            createdAt: new Date(),
          })),
        });
      });
    } catch (error: any) {
      this.logger.error('Failed to bulk soft delete', error.stack);
      throw new RepositoryException('Failed to bulk soft delete', 'BULK_DELETE_ERROR', error);
    }
  }

  // ============================================================================
  // DEPENDANT-SPECIFIC QUERIES (Within Aggregate)
  // ============================================================================

  async findDependantInAssessment(
    assessmentId: string,
    dependantId: string,
  ): Promise<LegalDependant | null> {
    try {
      const dependantData = await this.prisma.legalDependant.findFirst({
        where: {
          assessmentId,
          dependantId,
          deletedAt: null,
        },
      });

      if (!dependantData) {
        return null;
      }

      // Need assessment to get deceased info
      const assessment = await this.prisma.dependencyAssessment.findUnique({
        where: { id: assessmentId },
      });

      if (!assessment) {
        return null;
      }

      // Use mapper to create dependant
      return this.mapper.mapDependantFromPersistence(dependantData);
    } catch (error: any) {
      this.logger.error(
        `Failed to find dependant ${dependantId} in assessment ${assessmentId}`,
        error.stack,
      );
      throw new RepositoryException(
        `Failed to find dependant ${dependantId} in assessment ${assessmentId}: ${error.message}`,
        'FIND_ERROR',
        error,
      );
    }
  }

  async isPersonAlreadyDependant(assessmentId: string, dependantId: string): Promise<boolean> {
    try {
      const count = await this.prisma.legalDependant.count({
        where: {
          assessmentId,
          dependantId,
          deletedAt: null,
        },
      });

      return count > 0;
    } catch (error: any) {
      this.logger.error(
        `Failed to check if person ${dependantId} is already a dependant in assessment ${assessmentId}`,
        error.stack,
      );
      throw new RepositoryException(
        `Failed to check if person ${dependantId} is already a dependant in assessment ${assessmentId}: ${error.message}`,
        'CHECK_ERROR',
        error,
      );
    }
  }

  async getDependantsByRelationship(
    assessmentId: string,
    relationship: DependencyRelationship,
  ): Promise<LegalDependant[]> {
    try {
      const dependantsData = await this.prisma.legalDependant.findMany({
        where: {
          assessmentId,
          relationship,
          deletedAt: null,
        },
      });

      // Use mapper to create dependants
      return dependantsData.map((data) => this.mapper.mapDependantFromPersistence(data));
    } catch (error: any) {
      this.logger.error(
        `Failed to get dependants by relationship ${relationship} in assessment ${assessmentId}`,
        error.stack,
      );
      throw new RepositoryException(
        `Failed to get dependants by relationship ${relationship} in assessment ${assessmentId}: ${error.message}`,
        'FIND_ERROR',
        error,
      );
    }
  }

  async getDependantsRequiringVerification(assessmentId: string): Promise<LegalDependant[]> {
    try {
      const dependantsData = await this.prisma.legalDependant.findMany({
        where: {
          assessmentId,
          verifiedAt: null,
          deletedAt: null,
        },
      });

      // Use mapper to create dependants
      return dependantsData.map((data) => this.mapper.mapDependantFromPersistence(data));
    } catch (error: any) {
      this.logger.error(
        `Failed to get dependants requiring verification in assessment ${assessmentId}`,
        error.stack,
      );
      throw new RepositoryException(
        `Failed to get dependants requiring verification in assessment ${assessmentId}: ${error.message}`,
        'FIND_ERROR',
        error,
      );
    }
  }

  // ============================================================================
  // SOFT DELETE & ARCHIVING
  // ============================================================================

  async softDelete(id: string, deletedBy: string, reason: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx: any) => {
        // Check if assessment exists
        const assessment = await tx.dependencyAssessment.findUnique({
          where: { id, deletedAt: null },
        });

        if (!assessment) {
          throw new DependencyAssessmentNotFoundException(id);
        }

        // Check if finalized (cannot delete finalized assessments without court order)
        if (assessment.isFinalized) {
          throw new AssessmentFinalizedException(id);
        }

        // Soft delete assessment
        await tx.dependencyAssessment.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Soft delete dependants
        await tx.legalDependant.updateMany({
          where: { assessmentId: id, deletedAt: null },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Soft delete gifts
        await tx.giftInterVivos.updateMany({
          where: { assessmentId: id, deletedAt: null },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Log deletion
        await tx.auditLog.create({
          data: {
            entityId: id,
            entityType: 'DEPENDENCY_ASSESSMENT',
            action: 'SOFT_DELETE',
            performedBy: deletedBy,
            details: JSON.stringify({ reason }),
            createdAt: new Date(),
          },
        });
      });
    } catch (error: any) {
      if (
        error instanceof DependencyAssessmentNotFoundException ||
        error instanceof AssessmentFinalizedException
      ) {
        throw error;
      }
      this.logger.error(`Failed to soft delete assessment ${id}`, error.stack);
      throw new RepositoryException(
        `Failed to soft delete assessment ${id}: ${error.message}`,
        'DELETE_ERROR',
        error,
      );
    }
  }

  async restore(id: string, restoredBy: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx: any) => {
        // Restore assessment
        await tx.dependencyAssessment.update({
          where: { id },
          data: {
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

        // Restore dependants
        await tx.legalDependant.updateMany({
          where: { assessmentId: id },
          data: {
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

        // Restore gifts
        await tx.giftInterVivos.updateMany({
          where: { assessmentId: id },
          data: {
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

        // Log restoration
        await tx.auditLog.create({
          data: {
            entityId: id,
            entityType: 'DEPENDENCY_ASSESSMENT',
            action: 'RESTORE',
            performedBy: restoredBy,
            createdAt: new Date(),
          },
        });
      });
    } catch (error: any) {
      this.logger.error(`Failed to restore assessment ${id}`, error.stack);
      throw new RepositoryException(
        `Failed to restore assessment ${id}: ${error.message}`,
        'RESTORE_ERROR',
        error,
      );
    }
  }

  async findDeleted(
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<DependencyAssessmentAggregate>> {
    try {
      const [assessments, total] = await Promise.all([
        this.prisma.dependencyAssessment.findMany({
          where: {
            deletedAt: { not: null },
          },
          include: {
            dependants: true,
            giftsInterVivos: true,
            distributionCalculations: true,
          },
          orderBy: { deletedAt: 'desc' },
          skip: (pagination.page - 1) * pagination.pageSize,
          take: pagination.pageSize,
        }),
        this.prisma.dependencyAssessment.count({
          where: { deletedAt: { not: null } },
        }),
      ]);

      const items = assessments.map((assessment) =>
        this.mapper.toDomain(
          assessment,
          assessment.dependants,
          assessment.giftsInterVivos,
          assessment.distributionCalculations,
        ),
      );

      const totalPages = Math.ceil(total / pagination.pageSize);

      return {
        items,
        total,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrevious: pagination.page > 1,
      };
    } catch (error: any) {
      this.logger.error('Failed to find deleted assessments', error.stack);
      throw new RepositoryException('Failed to find deleted assessments', 'FIND_ERROR', error);
    }
  }

  // ============================================================================
  // VERSION CONTROL & AUDIT
  // ============================================================================

  async getVersionHistory(id: string): Promise<AssessmentVersion[]> {
    try {
      const events = await this.prisma.domainEvent.findMany({
        where: {
          aggregateId: id,
          aggregateType: 'DependencyAssessmentAggregate',
        },
        orderBy: { version: 'asc' },
      });

      return events.map((event) => ({
        version: event.version,
        updatedAt: event.occurredAt,
        updatedBy: event.eventData?.performedBy || event.eventData?.updatedBy,
        changes: event.eventData,
      }));
    } catch (error: any) {
      this.logger.error(`Failed to get version history for assessment ${id}`, error.stack);
      throw new RepositoryException(
        `Failed to get version history for assessment ${id}: ${error.message}`,
        'VERSION_ERROR',
        error,
      );
    }
  }

  async compareVersions(
    id: string,
    version1: number,
    version2: number,
  ): Promise<VersionComparison> {
    try {
      const [event1, event2] = await Promise.all([
        this.prisma.domainEvent.findFirst({
          where: {
            aggregateId: id,
            version: version1,
          },
        }),
        this.prisma.domainEvent.findFirst({
          where: {
            aggregateId: id,
            version: version2,
          },
        }),
      ]);

      if (!event1 || !event2) {
        throw new RepositoryException(
          `Cannot find versions ${version1} or ${version2} for assessment ${id}`,
          'VERSION_NOT_FOUND',
        );
      }

      // Simple comparison of event data
      const differences: Array<{
        field: string;
        oldValue: any;
        newValue: any;
      }> = [];

      // Compare top-level fields
      const fieldsToCompare = Object.keys(event1.eventData || {});
      for (const field of fieldsToCompare) {
        if (event1.eventData[field] !== event2.eventData[field]) {
          differences.push({
            field,
            oldValue: event1.eventData[field],
            newValue: event2.eventData[field],
          });
        }
      }

      return {
        version1,
        version2,
        differences,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to compare versions ${version1} and ${version2} for assessment ${id}`,
        error.stack,
      );
      throw new RepositoryException(
        `Failed to compare versions ${version1} and ${version2} for assessment ${id}: ${error.message}`,
        'COMPARE_ERROR',
        error,
      );
    }
  }

  // ============================================================================
  // EVENT SOURCING SUPPORT
  // ============================================================================

  async rebuildFromEvents(
    id: string,
    upToDate?: Date,
  ): Promise<DependencyAssessmentAggregate | null> {
    try {
      const whereClause: any = {
        aggregateId: id,
        aggregateType: 'DependencyAssessmentAggregate',
      };

      if (upToDate) {
        whereClause.occurredAt = { lte: upToDate };
      }

      const events = await this.prisma.domainEvent.findMany({
        where: whereClause,
        orderBy: { version: 'asc' },
      });

      if (events.length === 0) {
        return null;
      }

      // Get the initial assessment state from the first event
      const firstEvent = events[0];

      // This is a simplified rebuild - in a real system, you would replay all events
      // to reconstruct the aggregate state
      const assessment = await this.findById(id);

      if (!assessment) {
        return null;
      }

      // Apply events in sequence (simplified)
      // In a real event-sourced system, you would have an apply() method
      // for each event type to rebuild the aggregate state

      return assessment;
    } catch (error: any) {
      this.logger.error(`Failed to rebuild aggregate ${id} from events`, error.stack);
      throw new RepositoryException(
        `Failed to rebuild aggregate ${id} from events: ${error.message}`,
        'REBUILD_ERROR',
        error,
      );
    }
  }

  async getEventHistory(id: string): Promise<DomainEvent[]> {
    try {
      const events = await this.prisma.domainEvent.findMany({
        where: {
          aggregateId: id,
          aggregateType: 'DependencyAssessmentAggregate',
        },
        orderBy: { version: 'asc' },
      });

      // Convert persistence events to DomainEvent objects
      return events.map(
        (event) =>
          new GenericDomainEvent(
            event.aggregateId,
            event.aggregateType,
            event.version,
            event.eventData,
            event.occurredAt,
          ),
      );
    } catch (error: any) {
      this.logger.error(`Failed to get event history for assessment ${id}`, error.stack);
      throw new RepositoryException(
        `Failed to get event history for assessment ${id}: ${error.message}`,
        'EVENT_ERROR',
        error,
      );
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private handlePrismaError(error: any, operation: string, id?: string): never {
    this.logger.error(`Prisma error during ${operation}${id ? ` for ${id}` : ''}`, error.stack);

    if (error.code === 'P2002') {
      throw new DuplicateDependantException(id || 'unknown', error.meta?.target?.[0] || 'unknown');
    }

    if (error.code === 'P2025') {
      throw new DependencyAssessmentNotFoundException(id || 'unknown');
    }

    throw new RepositoryException(
      `Database error during ${operation}: ${error.message}`,
      'DATABASE_ERROR',
      error,
    );
  }

  // Add the missing method from mapper
  private mapDependantFromPersistence(data: any): LegalDependant {
    // This is a proxy to the mapper's method
    return (this.mapper as any).mapDependantFromPersistence(data);
  }
}
