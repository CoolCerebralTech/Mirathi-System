// infrastructure/persistence/prisma/guardianship.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, GuardianType as PrismaGuardianType } from '@prisma/client';

import { GuardianshipAggregate } from '../../../domain/aggregates/guardianship.aggregate';
import { DomainEvent } from '../../../domain/base/domain-event';
import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import {
  ComplianceDetail,
  ComplianceFilters,
  ComplianceReport,
  ComplianceStatistics,
  ConcurrencyError,
  CourtStationStatistics,
  EfilingData,
  GuardianshipNotFoundException,
  GuardianshipSearchFilters,
  GuardianshipSortOptions,
  GuardianshipSummary,
  GuardianshipVersion,
  IGuardianshipRepository,
  PaginatedResult,
  PaginationOptions,
  RepositoryException,
  TransactionException,
  VersionComparison,
} from '../../../domain/interfaces/repositories/iguardianship.repository';
import { GuardianshipMapper } from '../mappers/guardianship.mapper';

/**
 * Prisma-based implementation of IGuardianshipRepository
 *
 * TRANSACTION MANAGEMENT:
 * - Uses Prisma transactions for atomic operations
 * - Optimistic locking with version field
 * - Event sourcing support with separate event table
 */
@Injectable()
export class GuardianshipRepository implements IGuardianshipRepository {
  private readonly logger = new Logger(GuardianshipRepository.name);

  constructor(private prisma: PrismaClient) {}

  // ============================================================================
  // CREATE & UPDATE (Write Operations)
  // ============================================================================

  /**
   * Save guardianship aggregate (create or update)
   */
  async save(guardianship: GuardianshipAggregate): Promise<GuardianshipAggregate> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Get current state from database for optimistic locking
        const existing = await tx.guardianship.findUnique({
          where: { id: guardianship.id.toString() },
          include: { guardians: true },
        });

        // Check for concurrency conflict
        if (existing && existing.version !== guardianship.version - 1) {
          throw new ConcurrencyError(
            `Concurrent modification detected for guardianship ${guardianship.id.toString()}`,
            guardianship.id.toString(),
            guardianship.version - 1,
            existing.version,
          );
        }

        // Map domain to persistence
        const { guardianship: persistenceData, guardians: guardiansData } =
          GuardianshipMapper.toPersistence(guardianship);

        // Extract events for event store
        const events = GuardianshipMapper.extractEvents(guardianship);

        // Save or update guardianship
        const savedGuardianship = await tx.guardianship.upsert({
          where: { id: persistenceData.id },
          create: {
            ...persistenceData,
            id: persistenceData.id,
            // Prisma will handle the relations separately
          },
          update: {
            // Ward Information
            wardId: persistenceData.wardId,
            wardDateOfBirth: persistenceData.wardDateOfBirth,
            wardIsDeceased: persistenceData.wardIsDeceased,
            wardIsIncapacitated: persistenceData.wardIsIncapacitated,
            wardCurrentAge: persistenceData.wardCurrentAge,
            wardInfoUpdatedAt: persistenceData.wardInfoUpdatedAt,

            // Customary Law
            customaryLawApplies: persistenceData.customaryLawApplies,
            customaryDetails: persistenceData.customaryDetails,

            // Court Context
            courtOrderNumber: persistenceData.courtOrderNumber,
            courtStation: persistenceData.courtStation,
            courtOrderDate: persistenceData.courtOrderDate,
            courtOrderType: persistenceData.courtOrderType,

            // Guardianship Metadata
            establishedDate: persistenceData.establishedDate,
            isActive: persistenceData.isActive,
            dissolvedDate: persistenceData.dissolvedDate,
            dissolutionReason: persistenceData.dissolutionReason,

            // S.73 Compliance
            lastComplianceCheck: persistenceData.lastComplianceCheck,
            complianceWarnings: persistenceData.complianceWarnings,

            // Primary Guardian
            primaryGuardianId: persistenceData.primaryGuardianId,

            // Metadata
            version: persistenceData.version,
            updatedAt: new Date(),
            deletedAt: persistenceData.deletedAt,
          },
        });

        // Save guardians (delete and recreate for simplicity)
        await tx.guardian.deleteMany({
          where: { guardianshipId: persistenceData.id },
        });

        await tx.guardian.createMany({
          data: guardiansData.map((guardian) => ({
            id: guardian.id,
            guardianshipId: guardian.guardianshipId,
            wardId: guardian.wardId,
            guardianId: guardian.guardianId,
            type: guardian.type,
            courtOrderNumber: guardian.courtOrderNumber,
            courtStation: guardian.courtStation,
            appointmentDate: guardian.appointmentDate,
            validUntil: guardian.validUntil,
            powers: guardian.powers,
            bondRequired: guardian.bondRequired,
            bondProvider: guardian.bondProvider,
            bondPolicyNumber: guardian.bondPolicyNumber,
            bondAmountKES: guardian.bondAmountKES,
            bondIssuedDate: guardian.bondIssuedDate,
            bondExpiryDate: guardian.bondExpiryDate,
            reportingSchedule: guardian.reportingSchedule,
            annualAllowanceKES: guardian.annualAllowanceKES,
            allowanceApprovedBy: guardian.allowanceApprovedBy,
            isActive: guardian.isActive,
            terminationDate: guardian.terminationDate,
            terminationReason: guardian.terminationReason,
            customaryLawApplies: guardian.customaryLawApplies,
            customaryDetails: guardian.customaryDetails,
            version: guardian.version,
            createdAt: guardian.createdAt,
            updatedAt: guardian.updatedAt,
            deletedAt: guardian.deletedAt,
          })),
        });

        // Save domain events
        if (events.length > 0) {
          await tx.domainEvent.createMany({
            data: events.map((event) => ({
              id: event.id,
              aggregateId: event.aggregateId,
              aggregateType: event.aggregateType,
              eventType: event.eventType,
              eventData: event.eventData,
              version: event.version,
              occurredAt: event.occurredAt,
              metadata: event.metadata,
            })),
          });
        }

        // Clear events from aggregate
        GuardianshipMapper.clearEvents(guardianship);

        this.logger.log(
          `Saved guardianship ${guardianship.id.toString()} with version ${guardianship.version}`,
        );

        // Return the aggregate (which now has cleared events)
        return guardianship;
      });
    } catch (error) {
      if (error instanceof ConcurrencyError) {
        throw error;
      }
      this.logger.error(`Failed to save guardianship ${guardianship.id.toString()}:`, error);
      throw new RepositoryException(
        `Failed to save guardianship: ${error.message}`,
        'SAVE_ERROR',
        error,
      );
    }
  }

  /**
   * Save multiple guardianships in single transaction
   */
  async saveMany(guardianships: GuardianshipAggregate[]): Promise<GuardianshipAggregate[]> {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const guardianship of guardianships) {
          // Similar logic to save() but batched
          const { guardianship: persistenceData, guardians: guardiansData } =
            GuardianshipMapper.toPersistence(guardianship);

          // Update each guardianship
          await tx.guardianship.upsert({
            where: { id: persistenceData.id },
            create: { ...persistenceData },
            update: {
              // ... update fields similar to save()
              wardCurrentAge: persistenceData.wardCurrentAge,
              isActive: persistenceData.isActive,
              complianceWarnings: persistenceData.complianceWarnings,
              version: persistenceData.version,
              updatedAt: new Date(),
            },
          });

          // Update guardians
          await tx.guardian.deleteMany({
            where: { guardianshipId: persistenceData.id },
          });

          if (guardiansData.length > 0) {
            await tx.guardian.createMany({
              data: guardiansData.map((g) => ({
                ...g,
                type: g.type,
              })),
            });
          }

          // Save events
          const events = GuardianshipMapper.extractEvents(guardianship);
          if (events.length > 0) {
            await tx.domainEvent.createMany({
              data: events.map((e) => ({
                ...e,
              })),
            });
          }

          GuardianshipMapper.clearEvents(guardianship);
        }
      });

      return guardianships;
    } catch (error) {
      this.logger.error('Failed to save multiple guardianships:', error);
      throw new TransactionException('Batch save failed', error);
    }
  }

  // ============================================================================
  // READ (Query Operations)
  // ============================================================================

  /**
   * Find guardianship by ID
   */
  async findById(id: string): Promise<GuardianshipAggregate | null> {
    try {
      const guardianshipData = await this.prisma.guardianship.findUnique({
        where: { id, deletedAt: null },
        include: {
          guardians: {
            where: { deletedAt: null },
          },
        },
      });

      if (!guardianshipData) {
        return null;
      }

      // Map to domain
      return GuardianshipMapper.toDomain(guardianshipData, guardianshipData.guardians);
    } catch (error) {
      this.logger.error(`Failed to find guardianship ${id}:`, error);
      throw new RepositoryException(
        `Failed to find guardianship: ${error.message}`,
        'FIND_ERROR',
        error,
      );
    }
  }

  /**
   * Find active guardianship by ward ID
   */
  async findActiveByWardId(wardId: string): Promise<GuardianshipAggregate | null> {
    try {
      const guardianshipData = await this.prisma.guardianship.findFirst({
        where: {
          wardId,
          isActive: true,
          deletedAt: null,
        },
        include: {
          guardians: {
            where: { deletedAt: null, isActive: true },
          },
        },
      });

      if (!guardianshipData) {
        return null;
      }

      return GuardianshipMapper.toDomain(guardianshipData, guardianshipData.guardians);
    } catch (error) {
      this.logger.error(`Failed to find active guardianship for ward ${wardId}:`, error);
      throw new RepositoryException(
        `Failed to find active guardianship: ${error.message}`,
        'FIND_ERROR',
        error,
      );
    }
  }

  /**
   * Find all guardianships for a ward
   */
  async findAllByWardId(wardId: string): Promise<GuardianshipAggregate[]> {
    try {
      const guardianshipsData = await this.prisma.guardianship.findMany({
        where: {
          wardId,
          deletedAt: null,
        },
        include: {
          guardians: {
            where: { deletedAt: null },
          },
        },
        orderBy: { establishedDate: 'desc' },
      });

      return guardianshipsData.map((data) => GuardianshipMapper.toDomain(data, data.guardians));
    } catch (error) {
      this.logger.error(`Failed to find guardianships for ward ${wardId}:`, error);
      throw new RepositoryException(
        `Failed to find guardianships: ${error.message}`,
        'FIND_ERROR',
        error,
      );
    }
  }

  /**
   * Find guardianships where person is a guardian
   */
  async findByGuardianId(guardianId: string, activeOnly = true): Promise<GuardianshipAggregate[]> {
    try {
      const guardianshipsData = await this.prisma.guardianship.findMany({
        where: {
          guardians: {
            some: {
              guardianId,
              deletedAt: null,
              ...(activeOnly ? { isActive: true } : {}),
            },
          },
          deletedAt: null,
          ...(activeOnly ? { isActive: true } : {}),
        },
        include: {
          guardians: {
            where: { deletedAt: null },
          },
        },
        orderBy: { establishedDate: 'desc' },
      });

      return guardianshipsData.map((data) => GuardianshipMapper.toDomain(data, data.guardians));
    } catch (error) {
      this.logger.error(`Failed to find guardianships for guardian ${guardianId}:`, error);
      throw new RepositoryException(
        `Failed to find guardianships: ${error.message}`,
        'FIND_ERROR',
        error,
      );
    }
  }

  /**
   * Search guardianships with filters and pagination
   */
  async search(
    filters: GuardianshipSearchFilters,
    pagination: PaginationOptions,
    sort?: GuardianshipSortOptions,
  ): Promise<PaginatedResult<GuardianshipAggregate>> {
    try {
      // Build where clause
      const where: any = {
        deletedAt: null,
      };

      // Apply filters
      if (filters.wardId) {
        where.wardId = filters.wardId;
      }

      if (filters.guardianId) {
        where.guardians = {
          some: {
            guardianId: filters.guardianId,
            deletedAt: null,
          },
        };
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.wardIsMinor !== undefined) {
        where.wardCurrentAge = filters.wardIsMinor ? { lt: 18 } : { gte: 18 };
      }

      if (filters.wardIsIncapacitated !== undefined) {
        where.wardIsIncapacitated = filters.wardIsIncapacitated;
      }

      if (filters.guardianType) {
        where.guardians = {
          some: {
            type: filters.guardianType as PrismaGuardianType,
            deletedAt: null,
          },
        };
      }

      if (filters.establishedAfter) {
        where.establishedDate = { gte: filters.establishedAfter };
      }

      if (filters.establishedBefore) {
        where.establishedDate = where.establishedDate
          ? { ...where.establishedDate, lte: filters.establishedBefore }
          : { lte: filters.establishedBefore };
      }

      if (filters.courtStation) {
        where.courtStation = filters.courtStation;
      }

      if (filters.customaryLawApplies !== undefined) {
        where.customaryLawApplies = filters.customaryLawApplies;
      }

      if (filters.customaryEthnicGroup) {
        where.customaryDetails = {
          path: ['ethnicGroup'],
          equals: filters.customaryEthnicGroup,
        };
      }

      // Compliance filters require checking guardian subqueries
      if (filters.hasExpiredBonds) {
        where.guardians = {
          ...where.guardians,
          some: {
            bondExpiryDate: { lt: new Date() },
            bondRequired: true,
            deletedAt: null,
          },
        };
      }

      // Count total
      const total = await this.prisma.guardianship.count({ where });

      // Apply sorting
      const orderBy = sort ? { [sort.field]: sort.direction } : { establishedDate: 'desc' };

      // Get paginated results
      const guardianshipsData = await this.prisma.guardianship.findMany({
        where,
        include: {
          guardians: {
            where: { deletedAt: null },
          },
        },
        orderBy,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      });

      // Map to domain
      const items = guardianshipsData.map((data) =>
        GuardianshipMapper.toDomain(data, data.guardians),
      );

      return {
        items,
        total,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: Math.ceil(total / pagination.pageSize),
        hasNext: pagination.page * pagination.pageSize < total,
        hasPrevious: pagination.page > 1,
      };
    } catch (error) {
      this.logger.error('Failed to search guardianships:', error);
      throw new RepositoryException(`Search failed: ${error.message}`, 'SEARCH_ERROR', error);
    }
  }

  /**
   * Count guardianships matching filters
   */
  async count(filters: GuardianshipSearchFilters): Promise<number> {
    try {
      const where: any = {
        deletedAt: null,
      };

      // Apply filters (similar to search)
      if (filters.wardId) where.wardId = filters.wardId;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
      if (filters.courtStation) where.courtStation = filters.courtStation;

      return await this.prisma.guardianship.count({ where });
    } catch (error) {
      this.logger.error('Failed to count guardianships:', error);
      throw new RepositoryException(`Count failed: ${error.message}`, 'COUNT_ERROR', error);
    }
  }

  // ============================================================================
  // COMPLIANCE QUERIES (S.72 & S.73 LSA)
  // ============================================================================

  /**
   * Find guardianships with expired bonds (S.72 violation)
   */
  async findWithExpiredBonds(): Promise<GuardianshipAggregate[]> {
    try {
      const guardianshipsData = await this.prisma.guardianship.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          guardians: {
            some: {
              bondRequired: true,
              bondExpiryDate: { lt: new Date() },
              isActive: true,
              deletedAt: null,
            },
          },
        },
        include: {
          guardians: {
            where: { deletedAt: null },
          },
        },
      });

      return guardianshipsData.map((data) => GuardianshipMapper.toDomain(data, data.guardians));
    } catch (error) {
      this.logger.error('Failed to find guardianships with expired bonds:', error);
      throw new RepositoryException(
        `Failed to find expired bonds: ${error.message}`,
        'QUERY_ERROR',
        error,
      );
    }
  }

  /**
   * Find guardianships with overdue reports (S.73 violation)
   */
  async findWithOverdueReports(gracePeriodExpired = true): Promise<GuardianshipAggregate[]> {
    try {
      // This query is complex because reporting schedule is stored as JSON
      // We need to parse JSON in the database query
      // For PostgreSQL with Prisma, we might need a raw query

      // Simplified approach: get all and filter in memory
      const guardianshipsData = await this.prisma.guardianship.findMany({
        where: {
          isActive: true,
          deletedAt: null,
        },
        include: {
          guardians: {
            where: {
              isActive: true,
              deletedAt: null,
              reportingSchedule: {
                not: null,
              },
            },
          },
        },
      });

      // Filter in memory (not ideal for large datasets)
      return guardianshipsData
        .map((data) => GuardianshipMapper.toDomain(data, data.guardians))
        .filter((aggregate) => {
          const activeGuardians = aggregate.getActiveGuardians();
          return activeGuardians.some((guardian) => guardian.isReportOverdue());
        });
    } catch (error) {
      this.logger.error('Failed to find guardianships with overdue reports:', error);
      throw new RepositoryException(
        `Failed to find overdue reports: ${error.message}`,
        'QUERY_ERROR',
        error,
      );
    }
  }

  /**
   * Find guardianships requiring immediate action
   */
  async findRequiringAction(): Promise<GuardianshipAggregate[]> {
    try {
      // Get guardianships with expired bonds or overdue reports
      const [expiredBonds, overdueReports, approachingMajority] = await Promise.all([
        this.findWithExpiredBonds(),
        this.findWithOverdueReports(),
        this.findWardsApproachingMajority(90), // 90 days notice
      ]);

      // Combine and deduplicate
      const allIds = new Set<string>();
      const allGuardianships: GuardianshipAggregate[] = [];

      const addIfNotExists = (guardianship: GuardianshipAggregate) => {
        if (!allIds.has(guardianship.id.toString())) {
          allIds.add(guardianship.id.toString());
          allGuardianships.push(guardianship);
        }
      };

      [...expiredBonds, ...overdueReports, ...approachingMajority].forEach(addIfNotExists);

      return allGuardianships;
    } catch (error) {
      this.logger.error('Failed to find guardianships requiring action:', error);
      throw new RepositoryException(
        `Failed to find action-required guardianships: ${error.message}`,
        'QUERY_ERROR',
        error,
      );
    }
  }

  /**
   * Find guardianships with bonds expiring soon
   */
  async findAllWithExpiringBonds(withinDays: number): Promise<GuardianshipAggregate[]> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + withinDays);

      // Using raw query for JSON date comparison
      const results = await this.prisma.$queryRaw<any[]>`
        SELECT DISTINCT gs.*
        FROM "Guardianship" gs
        INNER JOIN "Guardian" g ON gs.id = g."guardianshipId"
        WHERE gs."deletedAt" IS NULL
          AND gs."isActive" = true
          AND g."deletedAt" IS NULL
          AND g."isActive" = true
          AND g."bondRequired" = true
          AND g."bondExpiryDate" IS NOT NULL
          AND g."bondExpiryDate" <= ${expiryDate}
          AND g."bondExpiryDate" > NOW()
      `;

      // Fetch full data for each result
      const guardianships: GuardianshipAggregate[] = [];
      for (const result of results) {
        const fullData = await this.prisma.guardianship.findUnique({
          where: { id: result.id },
          include: { guardians: { where: { deletedAt: null } } },
        });
        if (fullData) {
          guardianships.push(GuardianshipMapper.toDomain(fullData, fullData.guardians));
        }
      }

      return guardianships;
    } catch (error) {
      this.logger.error('Failed to find guardianships with expiring bonds:', error);
      throw new RepositoryException(
        `Failed to find expiring bonds: ${error.message}`,
        'QUERY_ERROR',
        error,
      );
    }
  }

  /**
   * Find wards approaching majority (turning 18)
   */
  async findWardsApproachingMajority(withinDays: number): Promise<GuardianshipAggregate[]> {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + withinDays);

      // Calculate 18th birthday from date of birth
      const results = await this.prisma.$queryRaw<any[]>`
        SELECT gs.*
        FROM "Guardianship" gs
        WHERE gs."deletedAt" IS NULL
          AND gs."isActive" = true
          AND DATE_PART('year', AGE(gs."wardDateOfBirth")) = 17
          AND DATE_PART('year', AGE(gs."wardDateOfBirth", ${targetDate})) = 18
      `;

      const guardianships: GuardianshipAggregate[] = [];
      for (const result of results) {
        const fullData = await this.prisma.guardianship.findUnique({
          where: { id: result.id },
          include: { guardians: { where: { deletedAt: null } } },
        });
        if (fullData) {
          guardianships.push(GuardianshipMapper.toDomain(fullData, fullData.guardians));
        }
      }

      return guardianships;
    } catch (error) {
      this.logger.error('Failed to find wards approaching majority:', error);
      throw new RepositoryException(
        `Failed to find wards approaching majority: ${error.message}`,
        'QUERY_ERROR',
        error,
      );
    }
  }

  /**
   * Check if ward has active guardianship
   */
  async hasActiveGuardianship(wardId: string): Promise<boolean> {
    try {
      const count = await this.prisma.guardianship.count({
        where: {
          wardId,
          isActive: true,
          deletedAt: null,
        },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check active guardianship for ward ${wardId}:`, error);
      throw new RepositoryException(
        `Failed to check active guardianship: ${error.message}`,
        'QUERY_ERROR',
        error,
      );
    }
  }

  // ============================================================================
  // STATISTICS & REPORTING
  // ============================================================================

  /**
   * Get compliance statistics
   */
  async getComplianceStatistics(): Promise<ComplianceStatistics> {
    try {
      const [totalActive, totalDissolved, allGuardianships, guardianshipsWithBonds] =
        await Promise.all([
          this.prisma.guardianship.count({
            where: { isActive: true, deletedAt: null },
          }),
          this.prisma.guardianship.count({
            where: { isActive: false, deletedAt: null },
          }),
          this.prisma.guardianship.findMany({
            where: { isActive: true, deletedAt: null },
            include: { guardians: { where: { deletedAt: null, isActive: true } } },
          }),
          this.prisma.guardianship.findMany({
            where: {
              isActive: true,
              deletedAt: null,
              guardians: {
                some: {
                  bondRequired: true,
                  isActive: true,
                  deletedAt: null,
                },
              },
            },
            include: { guardians: { where: { deletedAt: null, isActive: true } } },
          }),
        ]);

      // Calculate compliance metrics
      const s72Compliant = guardianshipsWithBonds.filter((data) => {
        const aggregate = GuardianshipMapper.toDomain(data, data.guardians);
        return aggregate.isS72Compliant();
      }).length;

      const s72NonCompliant = guardianshipsWithBonds.length - s72Compliant;

      // For S.73, we need to check each guardianship
      const s73Compliant = allGuardianships.filter((data) => {
        const aggregate = GuardianshipMapper.toDomain(data, data.guardians);
        return aggregate.isS73Compliant();
      }).length;

      const s73NonCompliant = allGuardianships.length - s73Compliant;

      // Count expired bonds
      const expiredBondsCount = await this.prisma.guardian.count({
        where: {
          bondRequired: true,
          bondExpiryDate: { lt: new Date() },
          isActive: true,
          deletedAt: null,
        },
      });

      // Calculate compliance rate (simplified)
      const complianceRate =
        totalActive > 0 ? Math.round(((s72Compliant + s73Compliant) / (totalActive * 2)) * 100) : 0;

      return {
        totalActive,
        totalDissolved,
        s72Compliant,
        s72NonCompliant,
        s73Compliant,
        s73NonCompliant,
        expiredBondsCount,
        overdueReportsCount: 0, // Would need actual calculation
        complianceRate,
      };
    } catch (error) {
      this.logger.error('Failed to get compliance statistics:', error);
      throw new RepositoryException(
        `Failed to get compliance statistics: ${error.message}`,
        'STATS_ERROR',
        error,
      );
    }
  }

  /**
   * Get guardianship summary (lightweight projection)
   */
  async getGuardianshipSummary(id: string): Promise<GuardianshipSummary> {
    try {
      const guardianshipData = await this.prisma.guardianship.findUnique({
        where: { id, deletedAt: null },
        include: {
          guardians: {
            where: { deletedAt: null, isActive: true },
            select: { guardianId: true },
          },
        },
      });

      if (!guardianshipData) {
        throw new GuardianshipNotFoundException(id);
      }

      // Get ward name from user service (placeholder)
      const wardName = `Ward ${guardianshipData.wardId.slice(0, 8)}`;

      // Get aggregate for compliance check
      const fullData = await this.prisma.guardianship.findUnique({
        where: { id },
        include: { guardians: { where: { deletedAt: null } } },
      });

      let s72Compliant = false;
      let s73Compliant = false;

      if (fullData) {
        const aggregate = GuardianshipMapper.toDomain(fullData, fullData.guardians);
        s72Compliant = aggregate.isS72Compliant();
        s73Compliant = aggregate.isS73Compliant();
      }

      return {
        id: guardianshipData.id,
        wardId: guardianshipData.wardId,
        wardName,
        wardAge: guardianshipData.wardCurrentAge,
        guardianCount: guardianshipData.guardians.length,
        status: guardianshipData.isActive ? 'ACTIVE' : 'DISSOLVED',
        establishedDate: guardianshipData.establishedDate,
        lastComplianceCheck: guardianshipData.lastComplianceCheck || new Date(),
        s72Compliant,
        s73Compliant,
        // These would be calculated from guardian data
        nextActionDue: undefined,
        nextActionType: undefined,
      };
    } catch (error) {
      if (error instanceof GuardianshipNotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get summary for guardianship ${id}:`, error);
      throw new RepositoryException(
        `Failed to get guardianship summary: ${error.message}`,
        'QUERY_ERROR',
        error,
      );
    }
  }

  /**
   * Generate compliance report
   */
  async getComplianceReport(filters: ComplianceFilters): Promise<ComplianceReport> {
    try {
      const where: any = {
        deletedAt: null,
        isActive: true,
      };

      if (filters.courtStation) {
        where.courtStation = filters.courtStation;
      }

      if (filters.startDate) {
        where.establishedDate = { gte: filters.startDate };
      }

      if (filters.endDate) {
        where.establishedDate = where.establishedDate
          ? { ...where.establishedDate, lte: filters.endDate }
          : { lte: filters.endDate };
      }

      const guardianshipsData = await this.prisma.guardianship.findMany({
        where,
        include: {
          guardians: {
            where: { deletedAt: null, isActive: true },
          },
        },
      });

      const details: ComplianceDetail[] = [];
      let compliant = 0;
      let partiallyCompliant = 0;
      let nonCompliant = 0;

      for (const data of guardianshipsData) {
        const aggregate = GuardianshipMapper.toDomain(data, data.guardians);
        const compliance = aggregate.getComplianceStatus();

        // Calculate compliance score
        let complianceScore = 100;
        const issues: string[] = [];

        if (!compliance.s72Compliant) {
          complianceScore -= 50;
          issues.push('S.72 Bond non-compliance');
        }

        if (!compliance.s73Compliant) {
          complianceScore -= 50;
          issues.push('S.73 Reporting non-compliance');
        }

        // Categorize
        if (complianceScore === 100) {
          compliant++;
        } else if (complianceScore >= 50) {
          partiallyCompliant++;
        } else {
          nonCompliant++;
        }

        // Get guardian names (placeholder)
        const guardianNames = data.guardians.map((g) => `Guardian ${g.guardianId.slice(0, 8)}`);

        details.push({
          guardianshipId: data.id,
          wardName: `Ward ${data.wardId.slice(0, 8)}`,
          wardId: data.wardId,
          guardianNames,
          issues,
          lastActionDate: data.updatedAt,
          complianceScore,
        });
      }

      return {
        generatedAt: new Date(),
        periodStart: filters.startDate || new Date(0),
        periodEnd: filters.endDate || new Date(),
        totalGuardianships: guardianshipsData.length,
        compliant,
        partiallyCompliant,
        nonCompliant,
        details,
      };
    } catch (error) {
      this.logger.error('Failed to generate compliance report:', error);
      throw new RepositoryException(
        `Failed to generate compliance report: ${error.message}`,
        'REPORT_ERROR',
        error,
      );
    }
  }

  // ============================================================================
  // SOFT DELETE & ARCHIVING
  // ============================================================================

  /**
   * Soft delete guardianship
   */
  async softDelete(id: string, deletedBy: string, reason: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Check if exists
        const existing = await tx.guardianship.findUnique({
          where: { id, deletedAt: null },
        });

        if (!existing) {
          throw new GuardianshipNotFoundException(id);
        }

        // Soft delete guardianship
        await tx.guardianship.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            version: { increment: 1 },
          },
        });

        // Soft delete all guardians
        await tx.guardian.updateMany({
          where: { guardianshipId: id },
          data: {
            deletedAt: new Date(),
            version: { increment: 1 },
          },
        });

        // Create audit event
        await tx.domainEvent.create({
          data: {
            id: new UniqueEntityID().toString(),
            aggregateId: id,
            aggregateType: 'GuardianshipAggregate',
            eventType: 'GuardianshipSoftDeleted',
            eventData: {
              deletedBy,
              reason,
              deletedAt: new Date(),
            },
            version: existing.version + 1,
            occurredAt: new Date(),
          },
        });
      });
    } catch (error) {
      if (error instanceof GuardianshipNotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to soft delete guardianship ${id}:`, error);
      throw new RepositoryException(
        `Failed to soft delete guardianship: ${error.message}`,
        'DELETE_ERROR',
        error,
      );
    }
  }

  /**
   * Restore soft-deleted guardianship
   */
  async restore(id: string, restoredBy: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const existing = await tx.guardianship.findUnique({
          where: { id },
        });

        if (!existing) {
          throw new GuardianshipNotFoundException(id);
        }

        if (!existing.deletedAt) {
          throw new RepositoryException('Guardianship is not deleted', 'NOT_DELETED');
        }

        await tx.guardianship.update({
          where: { id },
          data: {
            deletedAt: null,
            version: { increment: 1 },
          },
        });

        await tx.guardian.updateMany({
          where: { guardianshipId: id },
          data: {
            deletedAt: null,
            version: { increment: 1 },
          },
        });

        await tx.domainEvent.create({
          data: {
            id: new UniqueEntityID().toString(),
            aggregateId: id,
            aggregateType: 'GuardianshipAggregate',
            eventType: 'GuardianshipRestored',
            eventData: { restoredBy, restoredAt: new Date() },
            version: existing.version + 1,
            occurredAt: new Date(),
          },
        });
      });
    } catch (error) {
      if (error instanceof GuardianshipNotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to restore guardianship ${id}:`, error);
      throw new RepositoryException(
        `Failed to restore guardianship: ${error.message}`,
        'RESTORE_ERROR',
        error,
      );
    }
  }

  /**
   * Find soft-deleted guardianships
   */
  async findDeleted(
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<GuardianshipAggregate>> {
    try {
      const where = { deletedAt: { not: null } };

      const total = await this.prisma.guardianship.count({ where });

      const guardianshipsData = await this.prisma.guardianship.findMany({
        where,
        include: {
          guardians: true,
        },
        orderBy: { deletedAt: 'desc' },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      });

      const items = guardianshipsData.map((data) =>
        GuardianshipMapper.toDomain(data, data.guardians),
      );

      return {
        items,
        total,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: Math.ceil(total / pagination.pageSize),
        hasNext: pagination.page * pagination.pageSize < total,
        hasPrevious: pagination.page > 1,
      };
    } catch (error) {
      this.logger.error('Failed to find deleted guardianships:', error);
      throw new RepositoryException(
        `Failed to find deleted guardianships: ${error.message}`,
        'QUERY_ERROR',
        error,
      );
    }
  }

  // ============================================================================
  // VERSION CONTROL & AUDIT
  // ============================================================================

  /**
   * Get version history of guardianship
   */
  async getVersionHistory(id: string): Promise<GuardianshipVersion[]> {
    try {
      // Get events for this aggregate
      const events = await this.prisma.domainEvent.findMany({
        where: { aggregateId: id },
        orderBy: { version: 'asc' },
      });

      // Reconstruct version snapshots
      const versions: GuardianshipVersion[] = [];
      let currentState: any = {};

      for (const event of events) {
        // Apply event to reconstruct state
        currentState = { ...currentState, ...event.eventData };

        versions.push({
          version: event.version,
          updatedAt: event.occurredAt,
          updatedBy: event.metadata?.['userId'],
          changes: event.eventData,
        });
      }

      return versions;
    } catch (error) {
      this.logger.error(`Failed to get version history for guardianship ${id}:`, error);
      throw new RepositoryException(
        `Failed to get version history: ${error.message}`,
        'HISTORY_ERROR',
        error,
      );
    }
  }

  /**
   * Rebuild aggregate from event stream
   */
  async rebuildFromEvents(id: string, upToDate?: Date): Promise<GuardianshipAggregate | null> {
    try {
      const where: any = { aggregateId: id };
      if (upToDate) {
        where.occurredAt = { lte: upToDate };
      }

      const events = await this.prisma.domainEvent.findMany({
        where,
        orderBy: { version: 'asc' },
      });

      if (events.length === 0) {
        return null;
      }

      // Convert persistence events to domain events
      const domainEvents = events.map((event) => GuardianshipMapper.eventFromPersistence(event));

      // Recreate aggregate by applying events
      // This requires an empty aggregate and applying events in order
      // For simplicity, we'll load current state and validate against events
      const current = await this.findById(id);
      if (!current) {
        return null;
      }

      // Verify event stream matches current state
      const lastEventVersion = Math.max(...events.map((e) => e.version));
      if (current.version !== lastEventVersion) {
        this.logger.warn(`Event stream version mismatch for guardianship ${id}`);
      }

      return current;
    } catch (error) {
      this.logger.error(`Failed to rebuild guardianship ${id} from events:`, error);
      throw new RepositoryException(
        `Failed to rebuild from events: ${error.message}`,
        'EVENT_SOURCING_ERROR',
        error,
      );
    }
  }

  /**
   * Get all domain events for guardianship
   */
  async getEventHistory(id: string): Promise<DomainEvent[]> {
    try {
      const events = await this.prisma.domainEvent.findMany({
        where: { aggregateId: id },
        orderBy: { occurredAt: 'asc' },
      });

      return events.map((event) => GuardianshipMapper.eventFromPersistence(event));
    } catch (error) {
      this.logger.error(`Failed to get event history for guardianship ${id}:`, error);
      throw new RepositoryException(
        `Failed to get event history: ${error.message}`,
        'EVENT_HISTORY_ERROR',
        error,
      );
    }
  }

  // ============================================================================
  // UNIMPLEMENTED METHODS (Placeholders)
  // ============================================================================

  async findByCourtCaseNumber(courtCaseNumber: string): Promise<GuardianshipAggregate[]> {
    // Implementation depends on court case number storage
    throw new RepositoryException('Not implemented: findByCourtCaseNumber');
  }

  async findByCourtRegistryNumber(registryNumber: string): Promise<GuardianshipAggregate[]> {
    throw new RepositoryException('Not implemented: findByCourtRegistryNumber');
  }

  async getStatisticsByCourtStation(courtStation: string): Promise<CourtStationStatistics> {
    throw new RepositoryException('Not implemented: getStatisticsByCourtStation');
  }

  async getGuardianshipsForEfiling(courtStation: string): Promise<EfilingData[]> {
    throw new RepositoryException('Not implemented: getGuardianshipsForEfiling');
  }

  async bulkUpdateGuardianshipStatus(
    ids: string[],
    status: boolean,
    updatedBy: string,
  ): Promise<void> {
    throw new RepositoryException('Not implemented: bulkUpdateGuardianshipStatus');
  }

  async bulkSoftDelete(ids: string[], deletedBy: string, reason: string): Promise<void> {
    throw new RepositoryException('Not implemented: bulkSoftDelete');
  }

  async compareVersions(
    id: string,
    version1: number,
    version2: number,
  ): Promise<VersionComparison> {
    throw new RepositoryException('Not implemented: compareVersions');
  }

  async findGuardianshipsWithUpcomingDeadlines(
    deadlineType: 'BOND_EXPIRY' | 'REPORT_DUE',
    withinDays: number,
  ): Promise<GuardianshipAggregate[]> {
    throw new RepositoryException('Not implemented: findGuardianshipsWithUpcomingDeadlines');
  }

  async findGuardianshipsNeedingDissolution(): Promise<GuardianshipAggregate[]> {
    throw new RepositoryException('Not implemented: findGuardianshipsNeedingDissolution');
  }
}

// Export the repository token for dependency injection
export const GUARDIANSHIP_REPOSITORY = 'IGuardianshipRepository';
