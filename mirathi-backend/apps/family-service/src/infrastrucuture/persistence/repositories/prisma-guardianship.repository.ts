// src/guardianship-service/src/infrastructure/persistence/prisma-guardianship.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  ComplianceCheckStatus as PrismaComplianceCheckStatus,
  GuardianshipStatus as PrismaGuardianshipStatus,
} from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { GuardianshipAggregate } from '../../../domain/aggregates/guardianship.aggregate';
import { GuardianshipRiskService } from '../../../domain/aggregates/guardianship.aggregate';
import { DomainEvent } from '../../../domain/base/domain-event';
import {
  BulkOperationResult,
  ComplianceStatistics,
  ConcurrencyException,
  GuardianshipNotFoundException,
  GuardianshipSearchFilters,
  GuardianshipSortOptions,
  IGuardianshipRepository,
  PaginatedResult,
  PaginationOptions,
} from '../../../domain/interfaces/iguardianship.repository';
import { GuardianshipMapper } from '../mappers/guardianship.mapper';

@Injectable()
export class PrismaGuardianshipRepository implements IGuardianshipRepository {
  private readonly logger = new Logger(PrismaGuardianshipRepository.name);
  private readonly CHUNK_SIZE = 10;

  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------

  async save(guardianship: GuardianshipAggregate): Promise<GuardianshipAggregate> {
    const guardianshipId = guardianship.id.toString();
    const currentVersion = guardianship.getVersion();

    const persistenceData = GuardianshipMapper.toPersistence(guardianship);

    try {
      const savedGuardianship = await this.prisma.$transaction(
        async (tx) => {
          // 1. Check existence for versioning logic
          const exists = await tx.guardianship.findUnique({
            where: { id: guardianshipId },
            select: { version: true },
          });

          if (!exists) {
            // CREATE: We just await the creation, no need to store the result
            await tx.guardianship.create({
              data: {
                ...persistenceData.guardianship,
                version: 1,
              },
            });
          } else {
            // UPDATE: Optimistic Concurrency Control
            const expectedDbVersion = currentVersion > 1 ? currentVersion - 1 : 1;

            try {
              // We just await the update, no need to store the result
              await tx.guardianship.update({
                where: {
                  id: guardianshipId,
                  version: expectedDbVersion,
                },
                data: {
                  ...persistenceData.guardianship,
                  version: { increment: 1 },
                },
              });
            } catch (error) {
              if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                const actual = await tx.guardianship.findUnique({ where: { id: guardianshipId } });
                throw new ConcurrencyException(
                  guardianshipId,
                  expectedDbVersion,
                  actual ? actual.version : -1,
                );
              }
              throw error;
            }
          }

          // 2. Sync Child Entities
          await this.syncGuardianAssignments(
            tx,
            guardianshipId,
            persistenceData.guardianAssignments,
          );
          await this.syncComplianceChecks(tx, guardianshipId, persistenceData.complianceChecks);

          // 3. Return fresh state (Root + Relations)
          // We fetch the complete entity graph here, which is why 'result' was unused above
          return tx.guardianship.findUniqueOrThrow({
            where: { id: guardianshipId },
            include: {
              assignments: true,
              complianceChecks: true,
            },
          });
        },
        { timeout: 10000, maxWait: 5000 },
      );

      // Mapper expects 'guardianAssignments' property.
      // Ensure the mapper handles the aliased 'assignments' relation from Prisma.
      return GuardianshipMapper.toDomain(savedGuardianship as any);
    } catch (error) {
      if (error instanceof ConcurrencyException) throw error;

      this.logger.error(
        `Failed to save guardianship ${guardianshipId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new Error(`Repository save failed: ${(error as Error).message}`);
    }
  }

  async saveMany(guardianships: GuardianshipAggregate[]): Promise<BulkOperationResult> {
    const errors: Array<{ id: string; error: string }> = [];
    let processed = 0;
    let failed = 0;

    const chunks = this.chunkArray(guardianships, this.CHUNK_SIZE);

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (guardianship) => {
          try {
            await this.save(guardianship);
            processed++;
          } catch (error) {
            failed++;
            errors.push({
              id: guardianship.id.toString(),
              error: (error as Error).message || 'Unknown error',
            });
            this.logger.warn(
              `Bulk save failed for ${guardianship.id.toString()}: ${(error as Error).message}`,
            );
          }
        }),
      );
    }

    return {
      success: failed === 0,
      processed,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async softDelete(id: string, deletedBy: string, reason: string): Promise<void> {
    const exists = await this.prisma.guardianship.findUnique({ where: { id } });
    if (!exists) throw new GuardianshipNotFoundException(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.guardianship.update({
        where: { id },
        data: {
          status: 'TERMINATED',
          terminationReason: `System deletion by ${deletedBy}: ${reason}`,
          terminatedDate: new Date(),
          version: { increment: 1 },
        },
      });

      await tx.guardianAssignment.updateMany({
        where: { guardianshipId: id, status: 'ACTIVE' },
        data: {
          status: 'TERMINATED',
          deactivationReason: `Cascading deletion: ${reason}`,
          deactivationDate: new Date(),
        },
      });

      await tx.complianceCheck.updateMany({
        where: { guardianshipId: id, status: { in: ['DRAFT', 'PENDING_SUBMISSION', 'OVERDUE'] } },
        data: { status: 'WAIVED' },
      });
    });
  }

  // --------------------------------------------------------------------------
  // Core Queries
  // --------------------------------------------------------------------------

  async findById(id: string): Promise<GuardianshipAggregate | null> {
    const raw = await this.prisma.guardianship.findUnique({
      where: { id },
      include: { assignments: true, complianceChecks: true },
    });

    return raw ? GuardianshipMapper.toDomain(raw as any) : null;
  }

  async findActiveByWardId(wardId: string): Promise<GuardianshipAggregate | null> {
    const raw = await this.prisma.guardianship.findFirst({
      where: { wardId, status: 'ACTIVE' },
      include: { assignments: true, complianceChecks: true },
    });

    return raw ? GuardianshipMapper.toDomain(raw as any) : null;
  }

  async findAllByWardId(wardId: string): Promise<GuardianshipAggregate[]> {
    const rows = await this.prisma.guardianship.findMany({
      where: { wardId },
      include: { assignments: true, complianceChecks: true },
      orderBy: { establishedDate: 'desc' },
    });

    // Fix: Use arrow function to avoid unbound method
    return rows.map((r) => GuardianshipMapper.toDomain(r as any));
  }

  async findByGuardianId(
    guardianId: string,
    activeOnly: boolean = true,
  ): Promise<GuardianshipAggregate[]> {
    // Fix: Property is 'assignments' in Prisma schema, not 'guardianAssignments'
    const rows = await this.prisma.guardianship.findMany({
      where: {
        assignments: {
          some: {
            guardianId,
            ...(activeOnly ? { status: 'ACTIVE' } : {}),
          },
        },
      },
      include: {
        assignments: true,
        complianceChecks: true,
      },
      orderBy: { establishedDate: 'desc' },
    });

    return rows.map((r) => GuardianshipMapper.toDomain(r as any));
  }

  async findByCourtCaseNumber(caseNumber: string): Promise<GuardianshipAggregate | null> {
    const raw = await this.prisma.guardianship.findFirst({
      where: {
        OR: [
          { caseNumber: { equals: caseNumber, mode: 'insensitive' } },
          { courtOrder: { path: ['caseNumber'], equals: caseNumber } },
        ],
      },
      include: { assignments: true, complianceChecks: true },
    });

    return raw ? GuardianshipMapper.toDomain(raw as any) : null;
  }

  // --------------------------------------------------------------------------
  // Search & Reporting
  // --------------------------------------------------------------------------

  async search(
    filters: GuardianshipSearchFilters,
    pagination: PaginationOptions,
    sort?: GuardianshipSortOptions,
  ): Promise<PaginatedResult<GuardianshipAggregate>> {
    const { page, pageSize, includeCount = true } = pagination;
    const skip = (page - 1) * pageSize;
    const where = this.buildSearchWhereClause(filters);
    const orderBy = this.buildSortOrderBy(sort);

    const [rows, total] = await Promise.all([
      this.prisma.guardianship.findMany({
        where,
        include: { assignments: true, complianceChecks: true },
        orderBy,
        skip,
        take: pageSize,
      }),
      includeCount ? this.prisma.guardianship.count({ where }) : 0,
    ]);

    return {
      items: rows.map((r) => GuardianshipMapper.toDomain(r as any)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async count(filters: GuardianshipSearchFilters): Promise<number> {
    const where = this.buildSearchWhereClause(filters);
    return this.prisma.guardianship.count({ where });
  }

  // --------------------------------------------------------------------------
  // Compliance & Risk Analysis
  // --------------------------------------------------------------------------

  async findWithOverdueCompliance(): Promise<GuardianshipAggregate[]> {
    const now = new Date();
    // Fix: Explicitly cast status array to expected Enum type
    const overdueStatuses = [
      'DRAFT',
      'PENDING_SUBMISSION',
      'OVERDUE',
    ] as PrismaComplianceCheckStatus[];

    const rows = await this.prisma.guardianship.findMany({
      where: {
        status: 'ACTIVE',
        complianceChecks: {
          some: {
            dueDate: { lt: now },
            status: { in: overdueStatuses },
          },
        },
      },
      include: { assignments: true, complianceChecks: true },
    });
    return rows.map((r) => GuardianshipMapper.toDomain(r as any));
  }

  async findWithBondIssues(): Promise<GuardianshipAggregate[]> {
    const rows = await this.prisma.guardianship.findMany({
      where: {
        status: 'ACTIVE',
        requiresPropertyManagement: true,
        bondStatus: { in: ['REQUIRED_PENDING', 'FORFEITED'] },
      },
      include: { assignments: true, complianceChecks: true },
    });
    return rows.map((r) => GuardianshipMapper.toDomain(r as any));
  }

  async findHighRiskGuardianships(
    riskThreshold: 'HIGH' | 'CRITICAL' = 'HIGH',
  ): Promise<GuardianshipAggregate[]> {
    const candidates = await this.prisma.guardianship.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          {
            requiresPropertyManagement: true,
            bondStatus: { not: 'POSTED' },
          },
          {
            complianceChecks: { some: { status: 'OVERDUE' } },
          },
          {
            // Fix: 'assignments' instead of 'guardianAssignments'
            assignments: {
              none: { isPrimary: true, status: 'ACTIVE' },
            },
          },
        ],
      },
      include: { assignments: true, complianceChecks: true },
    });

    const aggregates = candidates.map((r) => GuardianshipMapper.toDomain(r as any));

    return aggregates.filter((agg) => {
      const assessment = GuardianshipRiskService.assessRisk(agg);
      if (riskThreshold === 'CRITICAL') return assessment.level === 'CRITICAL';
      return assessment.level === 'HIGH' || assessment.level === 'CRITICAL';
    });
  }

  async findWardsApproachingMajority(withinDays: number): Promise<GuardianshipAggregate[]> {
    const eighteenYearsAgoToday = new Date();
    eighteenYearsAgoToday.setFullYear(eighteenYearsAgoToday.getFullYear() - 18);

    const eighteenYearsAgoTarget = new Date(eighteenYearsAgoToday);
    eighteenYearsAgoTarget.setDate(eighteenYearsAgoTarget.getDate() + withinDays);

    const rows = await this.prisma.guardianship.findMany({
      where: {
        status: 'ACTIVE',
        wardDateOfBirth: {
          gte: eighteenYearsAgoToday,
          lte: eighteenYearsAgoTarget,
        },
      },
      include: { assignments: true, complianceChecks: true },
    });

    return rows.map((r) => GuardianshipMapper.toDomain(r as any));
  }

  async getComplianceStatistics(courtStation?: string): Promise<ComplianceStatistics> {
    const whereBase: Prisma.GuardianshipWhereInput = courtStation
      ? { courtOrder: { path: ['courtStation'], equals: courtStation } }
      : {};

    const [
      totalGuardianships,
      activeCount,
      terminatedCount,
      bondStats,
      complianceStats,
      overdueCount,
    ] = await Promise.all([
      this.prisma.guardianship.count({ where: whereBase }),
      this.prisma.guardianship.count({ where: { ...whereBase, status: 'ACTIVE' } }),
      this.prisma.guardianship.count({ where: { ...whereBase, status: 'TERMINATED' } }),

      this.prisma.guardianship.groupBy({
        by: ['bondStatus'],
        where: { ...whereBase, status: 'ACTIVE', requiresPropertyManagement: true },
        _count: true,
      }),

      this.prisma.complianceCheck.groupBy({
        by: ['status'],
        where: {
          guardianship: { ...whereBase, status: 'ACTIVE' },
          dueDate: { gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
        },
        _count: true,
      }),

      this.prisma.complianceCheck.count({
        where: {
          guardianship: { ...whereBase, status: 'ACTIVE' },
          dueDate: { lt: new Date() },
          status: { notIn: ['ACCEPTED', 'SUBMITTED', 'WAIVED'] },
        },
      }),
    ]);

    // Fix: Safely handle _count whether it returns a number or an object
    const getCount = (c: any): number => {
      if (typeof c === 'number') return c;
      if (c && typeof c._all === 'number') return c._all;
      return 0;
    };

    const totalBondRequired = bondStats.reduce((acc, curr) => acc + getCount(curr._count), 0);
    const bondPostedObj = bondStats.find((s) => s.bondStatus === 'POSTED');
    const bondPosted = bondPostedObj ? getCount(bondPostedObj._count) : 0;
    const bondComplianceRate = totalBondRequired > 0 ? (bondPosted / totalBondRequired) * 100 : 100;

    const totalReports = complianceStats.reduce((acc, curr) => acc + getCount(curr._count), 0);
    const submittedReports = complianceStats
      .filter((s) => ['SUBMITTED', 'ACCEPTED', 'UNDER_REVIEW'].includes(s.status))
      .reduce((acc, curr) => acc + getCount(curr._count), 0);
    const reportComplianceRate = totalReports > 0 ? (submittedReports / totalReports) * 100 : 100;

    const riskDistribution = await this.getOptimizedRiskDistribution(whereBase);

    return {
      totalGuardianships,
      activeCount,
      terminatedCount,
      bondComplianceRate: Number(bondComplianceRate.toFixed(2)),
      reportComplianceRate: Number(reportComplianceRate.toFixed(2)),
      overdueCount,
      riskDistribution,
    };
  }

  // --------------------------------------------------------------------------
  // Event Sourcing
  // --------------------------------------------------------------------------

  getEventHistory(_id: string): Promise<DomainEvent[]> {
    // Fix: Remove 'async' keyword or await something. Returning resolve directly.
    return Promise.resolve([]);
  }

  async rebuildFromEvents(id: string, _version?: number): Promise<GuardianshipAggregate | null> {
    return this.findById(id);
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  private async syncGuardianAssignments(
    tx: Prisma.TransactionClient,
    guardianshipId: string,
    inputs: Prisma.GuardianAssignmentUncheckedCreateInput[],
  ): Promise<void> {
    const existing = await tx.guardianAssignment.findMany({
      where: { guardianshipId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((e) => e.id));
    const inputIds = new Set(inputs.map((i) => i.id).filter((id) => id));

    const toDelete = [...existingIds].filter((id) => !inputIds.has(id));
    if (toDelete.length > 0) {
      await tx.guardianAssignment.deleteMany({
        where: { id: { in: toDelete } },
      });
    }

    for (const input of inputs) {
      await tx.guardianAssignment.upsert({
        where: { id: input.id },
        create: input,
        update: input,
      });
    }
  }

  private async syncComplianceChecks(
    tx: Prisma.TransactionClient,
    guardianshipId: string,
    inputs: Prisma.ComplianceCheckUncheckedCreateInput[],
  ): Promise<void> {
    const existing = await tx.complianceCheck.findMany({
      where: { guardianshipId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((e) => e.id));
    const inputIds = new Set(inputs.map((i) => i.id).filter((id) => id));

    const toDelete = [...existingIds].filter((id) => !inputIds.has(id));
    if (toDelete.length > 0) {
      await tx.complianceCheck.deleteMany({
        where: { id: { in: toDelete } },
      });
    }

    for (const input of inputs) {
      await tx.complianceCheck.upsert({
        where: { id: input.id },
        create: input,
        update: input,
      });
    }
  }

  private buildSearchWhereClause(
    filters: GuardianshipSearchFilters,
  ): Prisma.GuardianshipWhereInput {
    const where: Prisma.GuardianshipWhereInput = {};

    if (filters.wardId) where.wardId = filters.wardId;
    if (filters.wardIds?.length) where.wardId = { in: filters.wardIds };

    if (filters.guardianId) {
      // Fix: 'assignments' instead of 'guardianAssignments'
      where.assignments = {
        some: {
          guardianId: filters.guardianId,
          ...(filters.guardianIsPrimary !== undefined
            ? { isPrimary: filters.guardianIsPrimary }
            : {}),
        },
      };
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      // Note: Assuming logic to map domain status to prisma status exists here or in caller
      // For safety, we can use the reverse map if available or cast
      where.status = { in: statuses as any as PrismaGuardianshipStatus[] };
    }

    if (filters.caseNumber) {
      where.OR = [
        { caseNumber: { contains: filters.caseNumber, mode: 'insensitive' } },
        { courtOrder: { path: ['caseNumber'], string_contains: filters.caseNumber } },
      ];
    }

    if (filters.searchText) {
      where.OR = [
        { wardFullName: { contains: filters.searchText, mode: 'insensitive' } },
        { caseNumber: { contains: filters.searchText, mode: 'insensitive' } },
        { courtOrder: { path: ['caseNumber'], string_contains: filters.searchText } },
      ];
    }

    if (filters.hasOverdueCompliance !== undefined) {
      const now = new Date();
      // Fix: Explicitly cast statuses
      const overdueStatuses = [
        'DRAFT',
        'PENDING_SUBMISSION',
        'OVERDUE',
      ] as PrismaComplianceCheckStatus[];
      const complianceCondition = {
        some: {
          dueDate: { lt: now },
          status: { in: overdueStatuses },
        },
      };
      where.complianceChecks = filters.hasOverdueCompliance
        ? complianceCondition
        : { none: complianceCondition.some };
    }

    return where;
  }

  private buildSortOrderBy(
    sort?: GuardianshipSortOptions,
  ): Prisma.GuardianshipOrderByWithRelationInput {
    if (!sort) return { establishedDate: 'desc' };
    const dir = sort.direction.toLowerCase() as 'asc' | 'desc';

    switch (sort.field) {
      case 'wardName':
        return { wardFullName: dir };
      case 'status':
        return { status: dir };
      default:
        return { establishedDate: dir };
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  }

  private async getOptimizedRiskDistribution(baseWhere: Prisma.GuardianshipWhereInput) {
    const lowRiskCount = await this.prisma.guardianship.count({
      where: {
        ...baseWhere,
        status: 'ACTIVE',
        bondStatus: { in: ['POSTED', 'NOT_REQUIRED'] },
        complianceChecks: { none: { status: 'OVERDUE' } },
      },
    });

    const criticalRiskCount = await this.prisma.guardianship.count({
      where: {
        ...baseWhere,
        status: 'ACTIVE',
        OR: [
          {
            bondStatus: { in: ['FORFEITED', 'REQUIRED_PENDING'] },
            requiresPropertyManagement: true,
          },
        ],
      },
    });

    const totalActive = await this.prisma.guardianship.count({
      where: { ...baseWhere, status: 'ACTIVE' },
    });
    const mediumHigh = Math.max(0, totalActive - lowRiskCount - criticalRiskCount);

    return {
      low: lowRiskCount,
      critical: criticalRiskCount,
      medium: Math.floor(mediumHigh / 2),
      high: Math.ceil(mediumHigh / 2),
    };
  }
}
