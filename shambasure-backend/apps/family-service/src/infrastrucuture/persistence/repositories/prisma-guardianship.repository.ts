// src/guardianship-service/src/infrastructure/persistence/prisma-guardianship.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { GuardianshipAggregate } from '../../../domain/aggregates/guardianship.aggregate';
import { DomainEvent } from '../../../domain/base/domain-event';
import {
  BulkOperationResult,
  ComplianceStatistics,
  ConcurrencyException,
  GUARDIANSHIP_REPOSITORY,
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

  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------

  async save(guardianship: GuardianshipAggregate): Promise<GuardianshipAggregate> {
    const startTime = Date.now();
    const guardianshipId = guardianship.id.toString();
    const version = guardianship.getVersion();

    try {
      // Check concurrency if version > 1
      if (version > 1) {
        const existing = await this.prisma.guardianship.findUnique({
          where: { id: guardianshipId },
          select: { version: true },
        });

        if (existing && existing.version !== version - 1) {
          throw new ConcurrencyException(guardianshipId, version - 1, existing.version);
        }
      }

      // Convert aggregate to persistence format
      const persistenceData = GuardianshipMapper.toPersistence(guardianship);

      // Use transaction to ensure all-or-nothing save
      const savedGuardianship = await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // 1. Upsert guardianship (root)
          await tx.guardianship.upsert({
            where: { id: guardianshipId },
            create: persistenceData.guardianship,
            update: {
              ...persistenceData.guardianship,
              version: { increment: 1 },
            },
          });

          // 2. Delete existing child entities to handle removals
          await this.deleteChildEntities(tx, guardianshipId);

          // 3. Create/update all child entities
          if (persistenceData.guardianAssignments.length > 0) {
            await tx.guardianAssignment.createMany({
              data: persistenceData.guardianAssignments,
              skipDuplicates: true,
            });
          }

          if (persistenceData.complianceChecks.length > 0) {
            await tx.complianceCheck.createMany({
              data: persistenceData.complianceChecks,
              skipDuplicates: true,
            });
          }

          // 4. Return the complete saved guardianship
          return tx.guardianship.findUniqueOrThrow({
            where: { id: guardianshipId },
            include: {
              guardianAssignments: true,
              complianceChecks: true,
            },
          });
        },
        {
          maxWait: 5000,
          timeout: 30000,
        },
      );

      // Map back to domain
      const savedAggregate = GuardianshipMapper.toDomain(savedGuardianship);

      this.logger.log(
        `Successfully saved guardianship ${guardianshipId} (version: ${version}) in ${
          Date.now() - startTime
        }ms`,
      );

      return savedAggregate;
    } catch (error) {
      this.logger.error(`Failed to save guardianship ${guardianshipId}:`, error);

      if (error instanceof ConcurrencyException) {
        throw error;
      }

      throw new Error(`Failed to save guardianship: ${error.message}`);
    }
  }

  async saveMany(guardianships: GuardianshipAggregate[]): Promise<BulkOperationResult> {
    const errors: Array<{ id: string; error: string }> = [];
    let processed = 0;
    let failed = 0;

    this.logger.log(`Starting bulk save of ${guardianships.length} guardianships`);

    for (const guardianship of guardianships) {
      try {
        await this.save(guardianship);
        processed++;
      } catch (error) {
        failed++;
        errors.push({
          id: guardianship.id.toString(),
          error: error.message || 'Unknown error',
        });

        this.logger.warn(
          `Failed to save guardianship ${guardianship.id.toString()}: ${error.message}`,
        );
      }
    }

    const result: BulkOperationResult = {
      success: failed === 0,
      processed,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };

    this.logger.log(`Bulk save completed: ${processed} succeeded, ${failed} failed`);

    return result;
  }

  async softDelete(id: string, deletedBy: string, reason: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Check if guardianship exists
      const existing = await this.prisma.guardianship.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!existing) {
        throw new GuardianshipNotFoundException(id);
      }

      // Use transaction to archive the guardianship
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Update guardianship status to terminated with termination reason
        await tx.guardianship.update({
          where: { id },
          data: {
            status: 'TERMINATED',
            terminationReason: `System deletion by ${deletedBy}: ${reason}`,
            version: { increment: 1 },
          },
        });

        // 2. Terminate all active guardian assignments
        await tx.guardianAssignment.updateMany({
          where: { guardianshipId: id, status: 'ACTIVE' },
          data: {
            status: 'TERMINATED',
            deactivationReason: `Guardianship deleted by system: ${reason}`,
            deactivationDate: new Date(),
          },
        });

        // 3. Mark compliance checks as waived
        await tx.complianceCheck.updateMany({
          where: { guardianshipId: id },
          data: {
            status: 'WAIVED',
          },
        });

        this.logger.log(
          `Soft deleted guardianship ${id} by ${deletedBy} in ${
            Date.now() - startTime
          }ms. Reason: ${reason}`,
        );
      });
    } catch (error) {
      this.logger.error(`Failed to soft delete guardianship ${id}:`, error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Core Queries
  // --------------------------------------------------------------------------

  async findById(id: string): Promise<GuardianshipAggregate | null> {
    try {
      const rawGuardianship = await this.prisma.guardianship.findUnique({
        where: { id },
        include: {
          guardianAssignments: true,
          complianceChecks: true,
        },
      });

      if (!rawGuardianship) {
        return null;
      }

      return GuardianshipMapper.toDomain(rawGuardianship);
    } catch (error) {
      this.logger.error(`Error finding guardianship by ID ${id}:`, error);
      throw error;
    }
  }

  async findActiveByWardId(wardId: string): Promise<GuardianshipAggregate | null> {
    try {
      const rawGuardianship = await this.prisma.guardianship.findFirst({
        where: {
          wardId,
          status: 'ACTIVE',
        },
        include: {
          guardianAssignments: true,
          complianceChecks: true,
        },
      });

      if (!rawGuardianship) {
        return null;
      }

      return GuardianshipMapper.toDomain(rawGuardianship);
    } catch (error) {
      this.logger.error(`Error finding active guardianship for ward ${wardId}:`, error);
      throw error;
    }
  }

  async findAllByWardId(wardId: string): Promise<GuardianshipAggregate[]> {
    try {
      const rawGuardianships = await this.prisma.guardianship.findMany({
        where: { wardId },
        include: {
          guardianAssignments: true,
          complianceChecks: true,
        },
        orderBy: { establishedDate: 'desc' },
      });

      return rawGuardianships.map((raw) => GuardianshipMapper.toDomain(raw));
    } catch (error) {
      this.logger.error(`Error finding guardianships for ward ${wardId}:`, error);
      throw error;
    }
  }

  async findByGuardianId(
    guardianId: string,
    activeOnly: boolean = true,
  ): Promise<GuardianshipAggregate[]> {
    try {
      const whereClause: Prisma.GuardianshipWhereInput = {
        assignments: {
          some: {
            guardianId,
            ...(activeOnly ? { status: 'ACTIVE' } : {}),
          },
        },
      };

      const rawGuardianships = await this.prisma.guardianship.findMany({
        where: whereClause,
        include: {
          assignments: {
            where: {
              guardianId,
              ...(activeOnly ? { status: 'ACTIVE' } : {}),
            },
          },
          complianceChecks: true,
        },
        orderBy: { establishedDate: 'desc' },
      });

      // Transform each result to match the mapper's expected structure
      const transformedGuardianships = rawGuardianships.map((raw) => ({
        ...raw,
        // Add guardianAssignments field that the mapper expects
        guardianAssignments: raw.assignments,
        // Keep assignments field for backward compatibility
      }));

      return transformedGuardianships.map((raw) => GuardianshipMapper.toDomain(raw));
    } catch (error) {
      this.logger.error(`Error finding guardianships for guardian ${guardianId}:`, error);
      throw error;
    }
  }

  async findByCourtCaseNumber(caseNumber: string): Promise<GuardianshipAggregate | null> {
    try {
      const rawGuardianship = await this.prisma.guardianship.findFirst({
        where: {
          OR: [{ caseNumber }, { courtOrder: { path: ['caseNumber'], equals: caseNumber } }],
        },
        include: {
          guardianAssignments: true,
          complianceChecks: true,
        },
      });

      if (!rawGuardianship) {
        return null;
      }

      return GuardianshipMapper.toDomain(rawGuardianship);
    } catch (error) {
      this.logger.error(`Error finding guardianship by case number ${caseNumber}:`, error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Search & Reporting
  // --------------------------------------------------------------------------

  async search(
    filters: GuardianshipSearchFilters,
    pagination: PaginationOptions,
    sort?: GuardianshipSortOptions,
  ): Promise<PaginatedResult<GuardianshipAggregate>> {
    try {
      const { page, pageSize, includeCount = true } = pagination;
      const skip = (page - 1) * pageSize;

      // Build where clause
      const where = this.buildSearchWhereClause(filters);

      // Build orderBy clause
      const orderBy = this.buildSortOrderBy(sort);

      // Execute query
      const [guardianships, total] = await Promise.all([
        this.prisma.guardianship.findMany({
          where,
          include: {
            guardianAssignments: true,
            complianceChecks: true,
          },
          orderBy,
          skip,
          take: pageSize,
        }),
        includeCount ? this.prisma.guardianship.count({ where }) : 0,
      ]);

      const items = guardianships.map((raw) => GuardianshipMapper.toDomain(raw));

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      this.logger.error('Error searching guardianships:', error);
      throw error;
    }
  }

  async count(filters: GuardianshipSearchFilters): Promise<number> {
    try {
      const where = this.buildSearchWhereClause(filters);
      return await this.prisma.guardianship.count({ where });
    } catch (error) {
      this.logger.error('Error counting guardianships:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Compliance & Risk Analysis
  // --------------------------------------------------------------------------

  async findWithOverdueCompliance(): Promise<GuardianshipAggregate[]> {
    try {
      const now = new Date();

      const rawGuardianships = await this.prisma.guardianship.findMany({
        where: {
          status: 'ACTIVE',
          complianceChecks: {
            some: {
              dueDate: { lt: now },
              status: {
                in: ['DRAFT', 'PENDING_SUBMISSION'],
              },
            },
          },
        },
        include: {
          guardianAssignments: true,
          complianceChecks: {
            where: {
              dueDate: { lt: now },
              status: {
                in: ['DRAFT', 'PENDING_SUBMISSION'],
              },
            },
          },
        },
        orderBy: { establishedDate: 'desc' },
      });

      return rawGuardianships.map((raw) => GuardianshipMapper.toDomain(raw));
    } catch (error) {
      this.logger.error('Error finding guardianships with overdue compliance:', error);
      throw error;
    }
  }

  async findWithBondIssues(): Promise<GuardianshipAggregate[]> {
    try {
      const rawGuardianships = await this.prisma.guardianship.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            {
              requiresPropertyManagement: true,
              bondStatus: 'REQUIRED_PENDING',
            },
            {
              requiresPropertyManagement: true,
              bondStatus: 'FORFEITED',
            },
          ],
        },
        include: {
          guardianAssignments: true,
          complianceChecks: true,
        },
        orderBy: { establishedDate: 'desc' },
      });

      return rawGuardianships.map((raw) => GuardianshipMapper.toDomain(raw));
    } catch (error) {
      this.logger.error('Error finding guardianships with bond issues:', error);
      throw error;
    }
  }

  async findHighRiskGuardianships(
    _riskThreshold: 'HIGH' | 'CRITICAL' = 'HIGH',
  ): Promise<GuardianshipAggregate[]> {
    try {
      // This would typically integrate with a risk assessment service
      // For now, we'll define high risk as:
      // - Overdue compliance AND bond issues
      // - No active primary guardian
      // - Approaching majority with property management

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const rawGuardianships = await this.prisma.guardianship.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            // Overdue compliance + bond issues
            {
              requiresPropertyManagement: true,
              bondStatus: { in: ['REQUIRED_PENDING', 'FORFEITED'] },
              complianceChecks: {
                some: {
                  dueDate: { lt: now },
                  status: { in: ['DRAFT', 'PENDING_SUBMISSION'] },
                },
              },
            },
            // No active primary guardian
            {
              guardianAssignments: {
                none: {
                  isPrimary: true,
                  status: 'ACTIVE',
                },
              },
            },
            // Approaching majority with property
            {
              requiresPropertyManagement: true,
              wardDateOfBirth: {
                gt: new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
                lte: thirtyDaysFromNow,
              },
            },
          ],
        },
        include: {
          guardianAssignments: true,
          complianceChecks: true,
        },
        orderBy: { establishedDate: 'desc' },
      });

      return rawGuardianships.map((raw) => GuardianshipMapper.toDomain(raw));
    } catch (error) {
      this.logger.error('Error finding high risk guardianships:', error);
      throw error;
    }
  }

  async findWardsApproachingMajority(withinDays: number): Promise<GuardianshipAggregate[]> {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + withinDays);

      // Calculate 18th birthday
      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

      const rawGuardianships = await this.prisma.guardianship.findMany({
        where: {
          status: 'ACTIVE',
          wardDateOfBirth: {
            lte: eighteenYearsAgo, // Born at least 18 years ago
            gte: new Date(targetDate.getTime() - 365 * 24 * 60 * 60 * 1000), // Within 365+withinDays days of 18th birthday
          },
        },
        include: {
          guardianAssignments: true,
          complianceChecks: true,
        },
        orderBy: { wardDateOfBirth: 'desc' },
      });

      return rawGuardianships.map((raw) => GuardianshipMapper.toDomain(raw));
    } catch (error) {
      this.logger.error(
        `Error finding wards approaching majority within ${withinDays} days:`,
        error,
      );
      throw error;
    }
  }

  async getComplianceStatistics(courtStation?: string): Promise<ComplianceStatistics> {
    try {
      const whereClause: Prisma.GuardianshipWhereInput = courtStation
        ? { courtOrder: { path: ['courtStation'], equals: courtStation } }
        : {};

      const [
        totalGuardianships,
        activeGuardianships,
        terminatedGuardianships,
        bondCompliance,
        reportCompliance,
        overdueChecks,
        riskDistribution,
      ] = await Promise.all([
        // Total guardianships
        this.prisma.guardianship.count({ where: whereClause }),

        // Active guardianships
        this.prisma.guardianship.count({
          where: { ...whereClause, status: 'ACTIVE' },
        }),

        // Terminated guardianships
        this.prisma.guardianship.count({
          where: { ...whereClause, status: 'TERMINATED' },
        }),

        // Bond compliance rate
        this.prisma.guardianship
          .findMany({
            where: { ...whereClause, status: 'ACTIVE', requiresPropertyManagement: true },
            select: { bondStatus: true },
          })
          .then((results) => {
            const total = results.length;
            const compliant = results.filter((g) => g.bondStatus === 'POSTED').length;
            return total > 0 ? (compliant / total) * 100 : 100;
          }),

        // Report compliance rate
        this.prisma.$queryRaw<{ rate: number }>`
          SELECT 
            COALESCE(
              AVG(
                CASE 
                  WHEN cc.status IN ('ACCEPTED', 'SUBMITTED') THEN 1
                  ELSE 0
                END
              ) * 100, 
              100
            ) as rate
          FROM guardianships g
          LEFT JOIN compliance_checks cc ON g.id = cc.guardianship_id
          WHERE g.status = 'ACTIVE'
            ${courtStation ? Prisma.sql`AND g.court_order->>'courtStation' = ${courtStation}` : Prisma.empty}
            AND cc.due_date >= DATE_TRUNC('year', NOW()) - INTERVAL '1 year'
        `,

        // Overdue count
        this.prisma.complianceCheck.count({
          where: {
            dueDate: { lt: new Date() },
            status: { in: ['DRAFT', 'PENDING_SUBMISSION'] },
            guardianship: {
              status: 'ACTIVE',
              ...(courtStation
                ? { courtOrder: { path: ['courtStation'], equals: courtStation } }
                : {}),
            },
          },
        }),

        // Risk distribution (simplified)
        this.getRiskDistribution(whereClause),
      ]);

      const statistics: ComplianceStatistics = {
        totalGuardianships,
        activeCount: activeGuardianships,
        terminatedCount: terminatedGuardianships,
        bondComplianceRate: parseFloat(bondCompliance.toFixed(2)),
        reportComplianceRate: parseFloat((reportCompliance[0]?.rate || 100).toFixed(2)),
        overdueCount: overdueChecks,
        riskDistribution,
      };

      return statistics;
    } catch (error) {
      this.logger.error('Error getting compliance statistics:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Event Sourcing & Audit
  // --------------------------------------------------------------------------

  async getEventHistory(id: string): Promise<DomainEvent[]> {
    try {
      // Since we're not using event sourcing directly with Prisma,
      // we can reconstruct from history field or audit logs
      const guardianship = await this.prisma.guardianship.findUnique({
        where: { id },
        select: { history: true },
      });

      if (!guardianship) {
        throw new GuardianshipNotFoundException(id);
      }

      // Convert history entries to DomainEvent objects
      // This is a simplification - you'd need to map your history to actual DomainEvent instances
      this.logger.warn(`Event history requested for guardianship ${id}, returning history entries`);

      return [];
    } catch (error) {
      this.logger.error(`Error getting event history for guardianship ${id}:`, error);
      throw error;
    }
  }

  async rebuildFromEvents(id: string, _version?: number): Promise<GuardianshipAggregate | null> {
    try {
      // If using event sourcing, this would replay events to rebuild aggregate
      // For now, fall back to regular find by ID
      this.logger.warn(
        `Rebuild from events requested for guardianship ${id}, falling back to regular load`,
      );
      return await this.findById(id);
    } catch (error) {
      this.logger.error(`Error rebuilding guardianship ${id} from events:`, error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Private Helper Methods
  // --------------------------------------------------------------------------

  private async deleteChildEntities(
    tx: Prisma.TransactionClient,
    guardianshipId: string,
  ): Promise<void> {
    // Delete child entities in correct order
    await Promise.all([
      tx.complianceCheck.deleteMany({ where: { guardianshipId } }),
      tx.guardianAssignment.deleteMany({ where: { guardianshipId } }),
    ]);
  }

  private buildSearchWhereClause(
    filters: GuardianshipSearchFilters,
  ): Prisma.GuardianshipWhereInput {
    const where: Prisma.GuardianshipWhereInput = {};

    // Ward filters
    if (filters.wardId) {
      where.wardId = filters.wardId;
    }

    if (filters.wardIds && filters.wardIds.length > 0) {
      where.wardId = { in: filters.wardIds };
    }

    // Guardian filters
    if (filters.guardianId) {
      where.guardianAssignments = {
        some: {
          guardianId: filters.guardianId,
          ...(filters.guardianIsPrimary !== undefined
            ? { isPrimary: filters.guardianIsPrimary }
            : {}),
        },
      };
    }

    // Status filters
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        where.status = { in: filters.status };
      } else {
        where.status = filters.status;
      }
    }

    // Date filters
    if (filters.establishedDate) {
      where.establishedDate = {
        ...(filters.establishedDate.from ? { gte: filters.establishedDate.from } : {}),
        ...(filters.establishedDate.to ? { lte: filters.establishedDate.to } : {}),
      };
    }

    if (filters.terminationDate) {
      where.terminatedDate = {
        ...(filters.terminationDate.from ? { gte: filters.terminationDate.from } : {}),
        ...(filters.terminationDate.to ? { lte: filters.terminationDate.to } : {}),
      };
    }

    // Bond status filters
    if (filters.bondStatus) {
      if (Array.isArray(filters.bondStatus)) {
        where.bondStatus = { in: filters.bondStatus };
      } else {
        where.bondStatus = filters.bondStatus;
      }
    }

    // Compliance filters
    if (filters.hasOverdueCompliance !== undefined) {
      const now = new Date();
      where.complianceChecks = filters.hasOverdueCompliance
        ? {
            some: {
              dueDate: { lt: now },
              status: { in: ['DRAFT', 'PENDING_SUBMISSION'] },
            },
          }
        : {
            none: {
              dueDate: { lt: now },
              status: { in: ['DRAFT', 'PENDING_SUBMISSION'] },
            },
          };
    }

    // Legal filters
    if (filters.courtOrderExists !== undefined) {
      if (filters.courtOrderExists) {
        where.courtOrder = { not: Prisma.DbNull };
      } else {
        where.courtOrder = Prisma.DbNull;
      }
    }

    if (filters.caseNumber) {
      where.OR = [
        { caseNumber: { contains: filters.caseNumber, mode: 'insensitive' } },
        { courtOrder: { path: ['caseNumber'], string_contains: filters.caseNumber } },
      ];
    }

    if (filters.jurisdiction) {
      where.jurisdiction = filters.jurisdiction;
    }

    if (filters.courtStation) {
      where.courtOrder = { path: ['courtStation'], equals: filters.courtStation };
    }

    // Text search
    if (filters.searchText) {
      where.OR = [
        { wardFullName: { contains: filters.searchText, mode: 'insensitive' } },
        { caseNumber: { contains: filters.searchText, mode: 'insensitive' } },
        { legalNotes: { contains: filters.searchText, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildSortOrderBy(
    sort?: GuardianshipSortOptions,
  ): Prisma.GuardianshipOrderByWithRelationInput {
    if (!sort) {
      return { establishedDate: 'desc' };
    }

    const direction = sort.direction.toLowerCase() as 'asc' | 'desc';

    switch (sort.field) {
      case 'establishedDate':
        return { establishedDate: direction };
      case 'wardName':
        return { wardFullName: direction };
      case 'status':
        return { status: direction };
      case 'nextComplianceDue':
        // Complex sorting would require a join or computed field
        return { establishedDate: 'desc' };
      default:
        return { establishedDate: 'desc' };
    }
  }

  private async getRiskDistribution(
    whereClause: Prisma.GuardianshipWhereInput,
  ): Promise<{ low: number; medium: number; high: number; critical: number }> {
    try {
      // Simplified risk calculation
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const guardianships = await this.prisma.guardianship.findMany({
        where: whereClause,
        include: {
          guardianAssignments: true,
          complianceChecks: {
            where: {
              dueDate: { lt: now },
              status: { in: ['DRAFT', 'PENDING_SUBMISSION'] },
            },
          },
        },
      });

      let low = 0;
      let medium = 0;
      let high = 0;
      let critical = 0;

      for (const g of guardianships) {
        const hasOverdue = g.complianceChecks.length > 0;
        const hasBondIssue = g.requiresPropertyManagement && g.bondStatus !== 'POSTED';
        const hasPrimaryGuardian = g.guardianAssignments.some(
          (ga) => ga.isPrimary && ga.status === 'ACTIVE',
        );

        // Simple risk scoring
        let riskScore = 0;
        if (hasOverdue) riskScore += 1;
        if (hasBondIssue) riskScore += 2;
        if (!hasPrimaryGuardian) riskScore += 3;

        // Determine risk level
        if (riskScore >= 5) critical++;
        else if (riskScore >= 3) high++;
        else if (riskScore >= 1) medium++;
        else low++;
      }

      return { low, medium, high, critical };
    } catch (error) {
      this.logger.error('Error calculating risk distribution:', error);
      return { low: 0, medium: 0, high: 0, critical: 0 };
    }
  }

  // --------------------------------------------------------------------------
  // Health Check & Maintenance
  // --------------------------------------------------------------------------

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.guardianship.count({
        where: { status: 'ACTIVE' },
        take: 1,
      });
      return true;
    } catch (error) {
      this.logger.error('Repository health check failed:', error);
      return false;
    }
  }

  async cleanupOrphanedRecords(): Promise<number> {
    try {
      // Find all existing family member IDs (wards)
      const existingWardIds = await this.prisma.familyMember
        .findMany({
          where: { isArchived: false },
          select: { id: true },
        })
        .then((wards) => wards.map((w) => w.id));

      if (existingWardIds.length === 0) {
        this.logger.log('No existing wards found');
        return 0;
      }

      // Clean up guardianships where ward doesn't exist
      const results = await this.prisma.$transaction(async (tx) => {
        const deletions: number[] = [];

        // Delete orphaned guardianships
        const orphanedGuardianships = await tx.guardianship.deleteMany({
          where: {
            wardId: {
              notIn: existingWardIds,
            },
          },
        });
        deletions.push(orphanedGuardianships.count);

        return deletions.reduce((sum, count) => sum + count, 0);
      });

      this.logger.log(`Cleaned up ${results} orphaned guardianship records`);
      return results;
    } catch (error) {
      this.logger.error('Error cleaning up orphaned guardianship records:', error);
      throw error;
    }
  }
}

// Export token for dependency injection
export const GuardianshipRepositoryProvider = {
  provide: GUARDIANSHIP_REPOSITORY,
  useClass: PrismaGuardianshipRepository,
};
