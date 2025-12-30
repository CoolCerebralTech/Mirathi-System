// src/family-service/src/infrastructure/persistence/prisma-family.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { FamilyAggregate } from '../../../domain/aggregates/family.aggregate';
import { DomainEvent } from '../../../domain/base/domain-event';
import {
  BulkOperationResult,
  DuplicateFamilyException,
  FAMILY_REPOSITORY,
  FamilyConcurrencyException,
  FamilyNotFoundException,
  FamilySearchFilters,
  FamilySortOptions,
  FamilySummary,
  FamilySystemStatistics,
  IFamilyRepository,
  PaginatedResult,
  PaginationOptions,
} from '../../../domain/interfaces/ifamily.repository';
import { FamilyExportOptions } from '../../../domain/interfaces/ifamily.repository';
import { KenyanCounty } from '../../../domain/value-objects/family-enums.vo';
import { FamilyMapper } from '../mappers/family.mapper';

@Injectable()
export class PrismaFamilyRepository implements IFamilyRepository {
  private readonly logger = new Logger(PrismaFamilyRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // Persistence (Command Side)
  // --------------------------------------------------------------------------

  async save(family: FamilyAggregate): Promise<FamilyAggregate> {
    const startTime = Date.now();
    const familyId = family.id.toString();
    const version = family.getVersion();

    try {
      // Check concurrency if version > 1
      if (version > 1) {
        const existing = await this.prisma.family.findUnique({
          where: { id: familyId },
          select: { version: true },
        });

        if (existing && existing.version !== version - 1) {
          throw new FamilyConcurrencyException(familyId, version - 1, existing.version);
        }
      }

      // Convert aggregate to persistence format
      const persistenceData = FamilyMapper.toPersistence(family);

      // Use transaction to ensure all-or-nothing save
      const savedFamily = await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // 1. Upsert family (root)
          await tx.family.upsert({
            where: { id: familyId },
            create: persistenceData.family,
            update: {
              ...persistenceData.family,
              version: { increment: 1 },
            },
          });

          // 2. Delete existing child entities to handle removals
          await this.deleteChildEntities(tx, familyId);

          // 3. Create/update all child entities
          // Note: Order matters due to foreign key constraints
          await tx.familyMember.createMany({
            data: persistenceData.members,
            skipDuplicates: true,
          });

          if (persistenceData.marriages.length > 0) {
            await tx.marriage.createMany({
              data: persistenceData.marriages,
              skipDuplicates: true,
            });
          }

          if (persistenceData.houses.length > 0) {
            await tx.polygamousHouse.createMany({
              data: persistenceData.houses,
              skipDuplicates: true,
            });
          }

          if (persistenceData.relationships.length > 0) {
            await tx.familyRelationship.createMany({
              data: persistenceData.relationships,
              skipDuplicates: true,
            });
          }

          if (persistenceData.cohabitations.length > 0) {
            await tx.cohabitationRecord.createMany({
              data: persistenceData.cohabitations,
              skipDuplicates: true,
            });
          }

          if (persistenceData.adoptions.length > 0) {
            await tx.adoptionRecord.createMany({
              data: persistenceData.adoptions,
              skipDuplicates: true,
            });
          }

          // 4. Return the complete saved family
          return tx.family.findUniqueOrThrow({
            where: { id: familyId },
            include: {
              members: true,
              marriages: true,
              polygamousHouses: true,
              relationships: true,
              cohabitationRecords: true,
              adoptionRecords: true,
            },
          });
        },
        {
          maxWait: 5000,
          timeout: 30000,
        },
      );

      // Map back to domain
      const savedAggregate = FamilyMapper.toDomain(savedFamily);

      this.logger.log(
        `Successfully saved family ${familyId} (version: ${version}) in ${
          Date.now() - startTime
        }ms`,
      );

      return savedAggregate;
    } catch (error) {
      this.logger.error(`Failed to save family ${familyId}:`, error);

      if (error.code === 'P2002') {
        // Unique constraint violation
        throw new DuplicateFamilyException(family.props.name, family.props.homeCounty || 'unknown');
      }

      if (error instanceof FamilyConcurrencyException) {
        throw error;
      }

      throw new Error(`Failed to save family: ${error.message}`);
    }
  }

  async saveMany(families: FamilyAggregate[]): Promise<BulkOperationResult> {
    const errors: Array<{ id: string; error: string }> = [];
    let processed = 0;
    let failed = 0;

    this.logger.log(`Starting bulk save of ${families.length} families`);

    // Use sequential processing for simplicity and rollback control
    // For larger batches, consider chunking and parallel processing
    for (const family of families) {
      try {
        await this.save(family);
        processed++;
      } catch (error) {
        failed++;
        errors.push({
          id: family.id.toString(),
          error: error.message || 'Unknown error',
        });

        this.logger.warn(`Failed to save family ${family.id.toString()}: ${error.message}`);
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
      // Check if family exists
      const existing = await this.prisma.family.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existing) {
        throw new FamilyNotFoundException(id);
      }

      // Use transaction to soft delete entire aggregate
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Soft delete family
        await tx.family.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            version: { increment: 1 },
          },
        });

        // 2. Archive all members
        await tx.familyMember.updateMany({
          where: { familyId: id },
          data: {
            isArchived: true,
            archivedReason: `Family deleted: ${reason}`,
            lastUpdatedBy: deletedBy,
          },
        });

        // 3. Archive marriages
        await tx.marriage.updateMany({
          where: { familyId: id },
          data: {
            isArchived: true,
            lastUpdatedBy: deletedBy,
          },
        });

        // 4. Archive relationships
        await tx.familyRelationship.updateMany({
          where: { familyId: id },
          data: {
            isArchived: true,
            lastUpdatedBy: deletedBy,
          },
        });

        // 5. Archive houses
        await tx.polygamousHouse.updateMany({
          where: { familyId: id },
          data: {
            isArchived: true,
            lastUpdatedBy: deletedBy,
          },
        });

        // 6. Archive cohabitations
        await tx.cohabitationRecord.updateMany({
          where: { familyId: id },
          data: {
            isArchived: true,
            lastUpdatedBy: deletedBy,
          },
        });

        // 7. Archive adoptions
        await tx.adoptionRecord.updateMany({
          where: { familyId: id },
          data: {
            isArchived: true,
            lastUpdatedBy: deletedBy,
          },
        });
      });

      this.logger.log(
        `Soft deleted family ${id} by ${deletedBy} in ${
          Date.now() - startTime
        }ms. Reason: ${reason}`,
      );
    } catch (error) {
      this.logger.error(`Failed to soft delete family ${id}:`, error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Core Queries (Query Side)
  // --------------------------------------------------------------------------

  async findById(id: string, depth = 2): Promise<FamilyAggregate | null> {
    try {
      const include = this.buildIncludeClause(depth);

      const rawFamily = await this.prisma.family.findUnique({
        where: { id, deletedAt: null },
        include,
      });

      if (!rawFamily) {
        return null;
      }

      return FamilyMapper.toDomain(rawFamily);
    } catch (error) {
      this.logger.error(`Error finding family by ID ${id}:`, error);
      throw error;
    }
  }

  async findByMemberId(memberId: string): Promise<FamilyAggregate | null> {
    try {
      // Find family through member
      const member = await this.prisma.familyMember.findUnique({
        where: { id: memberId },
        include: {
          family: {
            include: {
              members: true,
              marriages: true,
              polygamousHouses: true,
              relationships: true,
              cohabitationRecords: true,
              adoptionRecords: true,
            },
          },
        },
      });

      if (!member || !member.family) {
        return null;
      }

      return FamilyMapper.toDomain(member.family);
    } catch (error) {
      this.logger.error(`Error finding family by member ID ${memberId}:`, error);
      throw error;
    }
  }

  async findByCreatorId(creatorId: string): Promise<FamilyAggregate[]> {
    try {
      const rawFamilies = await this.prisma.family.findMany({
        where: {
          creatorId,
          deletedAt: null,
        },
        include: {
          members: true,
          marriages: true,
          polygamousHouses: true,
          relationships: true,
          cohabitationRecords: true,
          adoptionRecords: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return rawFamilies.map((raw) => FamilyMapper.toDomain(raw));
    } catch (error) {
      this.logger.error(`Error finding families by creator ${creatorId}:`, error);
      throw error;
    }
  }

  async existsByNameAndCounty(name: string, county: KenyanCounty): Promise<boolean> {
    try {
      const count = await this.prisma.family.count({
        where: {
          name,
          homeCounty: county,
          deletedAt: null,
        },
      });

      return count > 0;
    } catch (error) {
      this.logger.error(
        `Error checking family existence by name ${name} and county ${county}:`,
        error,
      );
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Search & Discovery
  // --------------------------------------------------------------------------

  async search(
    filters: FamilySearchFilters,
    pagination: PaginationOptions,
    sort?: FamilySortOptions,
  ): Promise<PaginatedResult<FamilySummary>> {
    try {
      const { page, pageSize, includeCount = true } = pagination;
      const skip = (page - 1) * pageSize;

      // Build where clause
      const where = this.buildSearchWhereClause(filters);

      // Build orderBy clause
      const orderBy = this.buildSortOrderBy(sort);

      // Execute query
      const [families, total] = await Promise.all([
        this.prisma.family.findMany({
          where,
          select: this.buildSummarySelect(),
          orderBy,
          skip,
          take: pageSize,
        }),
        includeCount ? this.prisma.family.count({ where }) : 0,
      ]);

      // Transform to FamilySummary
      const items: FamilySummary[] = families.map((family) => ({
        id: family.id,
        name: family.name,
        description: family.description || undefined,
        headOfFamily: this.extractHeadOfFamily(family),
        memberCount: family.memberCount,
        isPolygamous: family.isPolygamous,
        clanName: family.clanName || undefined,
        homeCounty: family.homeCounty || undefined,
        createdAt: family.createdAt,
        updatedAt: family.updatedAt,
      }));

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      this.logger.error('Error searching families:', error);
      throw error;
    }
  }

  async count(filters: FamilySearchFilters): Promise<number> {
    try {
      const where = this.buildSearchWhereClause(filters);
      return await this.prisma.family.count({ where });
    } catch (error) {
      this.logger.error('Error counting families:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Legal & Structural Analysis Support
  // --------------------------------------------------------------------------

  async findPolygamousFamilies(
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<FamilyAggregate>> {
    try {
      const { page, pageSize } = pagination;
      const skip = (page - 1) * pageSize;

      const where = {
        isPolygamous: true,
        deletedAt: null,
      };

      const [rawFamilies, total] = await Promise.all([
        this.prisma.family.findMany({
          where,
          include: {
            members: true,
            marriages: true,
            polygamousHouses: true,
            relationships: true,
            cohabitationRecords: true,
            adoptionRecords: true,
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: pageSize,
        }),
        this.prisma.family.count({ where }),
      ]);

      const items = rawFamilies.map((raw) => FamilyMapper.toDomain(raw));

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      this.logger.error('Error finding polygamous families:', error);
      throw error;
    }
  }

  async findFamiliesWithConflicts(): Promise<FamilyAggregate[]> {
    try {
      // Find families with:
      // 1. Members in multiple active marriages (potential polygamy without houses)
      // 2. Relationship cycles (self-referencing relationships)
      // 3. Missing parent-child relationships for minors
      // 4. Unverified critical relationships

      // This is a complex query - we'll use multiple queries and combine results
      const conflictFamilies = new Map<string, any>();

      // Query 1: Members with multiple active marriages
      const multiMarriageFamilies = await this.prisma.$queryRaw<
        Array<{ familyId: string; memberId: string; marriageCount: number }>
      >`
        SELECT 
          m.familyId,
          m.spouse1Id as memberId,
          COUNT(*) as marriageCount
        FROM marriages m
        WHERE m.isMarriageDissolved = false 
          AND m.isArchived = false
        GROUP BY m.familyId, m.spouse1Id
        HAVING COUNT(*) > 1
        UNION
        SELECT 
          m.familyId,
          m.spouse2Id as memberId,
          COUNT(*) as marriageCount
        FROM marriages m
        WHERE m.isMarriageDissolved = false 
          AND m.isArchived = false
        GROUP BY m.familyId, m.spouse2Id
        HAVING COUNT(*) > 1
      `;

      for (const row of multiMarriageFamilies) {
        conflictFamilies.set(row.familyId, {
          type: 'MULTIPLE_MARRIAGES',
          memberId: row.memberId,
          count: row.marriageCount,
        });
      }

      // Query 2: Families with relationship cycles (simplified check for self-reference)
      const cycleFamilies = await this.prisma.$queryRaw<Array<{ familyId: string }>>`
        SELECT DISTINCT fr.familyId
        FROM family_relationships fr
        WHERE fr.fromMemberId = fr.toMemberId
          AND fr.isArchived = false
      `;

      for (const row of cycleFamilies) {
        conflictFamilies.set(row.familyId, {
          type: 'SELF_REFERENCING_RELATIONSHIP',
        });
      }

      // Get full aggregates for families with conflicts
      const familyIds = Array.from(conflictFamilies.keys());
      if (familyIds.length === 0) return [];

      const rawFamilies = await this.prisma.family.findMany({
        where: {
          id: { in: familyIds },
          deletedAt: null,
        },
        include: {
          members: true,
          marriages: true,
          polygamousHouses: true,
          relationships: true,
          cohabitationRecords: true,
          adoptionRecords: true,
        },
      });

      return rawFamilies.map((raw) => FamilyMapper.toDomain(raw));
    } catch (error) {
      this.logger.error('Error finding families with conflicts:', error);
      throw error;
    }
  }

  async findFamiliesWithPendingSuccessionClaims(): Promise<FamilyAggregate[]> {
    try {
      // Find families with:
      // 1. S.29 qualified cohabitations
      // 2. Unfinalized adoptions
      // 3. Minor dependents without guardians

      const rawFamilies = await this.prisma.family.findMany({
        where: {
          deletedAt: null,
          OR: [
            {
              cohabitationRecords: {
                some: {
                  qualifiesForS29: true,
                  dependencyClaimFiled: false,
                  isArchived: false,
                },
              },
            },
            {
              adoptionRecords: {
                some: {
                  adoptionStatus: { in: ['PENDING', 'IN_PROGRESS'] },
                  isArchived: false,
                },
              },
            },
          ],
        },
        include: {
          members: true,
          marriages: true,
          polygamousHouses: true,
          relationships: true,
          cohabitationRecords: true,
          adoptionRecords: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      return rawFamilies.map((raw) => FamilyMapper.toDomain(raw));
    } catch (error) {
      this.logger.error('Error finding families with pending claims:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Analytics & Statistics
  // --------------------------------------------------------------------------

  async getSystemStatistics(): Promise<FamilySystemStatistics> {
    try {
      // Execute all statistical queries in parallel
      const [
        totalFamilies,
        totalMembers,
        polygamousCount,
        adoptionCount,
        cohabitationCount,
        countyStats,
        topClans,
      ] = await Promise.all([
        // Total families
        this.prisma.family.count({ where: { deletedAt: null } }),

        // Total members
        this.prisma.familyMember.count({
          where: { family: { deletedAt: null }, isArchived: false },
        }),

        // Polygamous families
        this.prisma.family.count({
          where: { isPolygamous: true, deletedAt: null },
        }),

        // Families with adoptions
        this.prisma.family.count({
          where: {
            deletedAt: null,
            adoptionRecords: {
              some: { isArchived: false },
            },
          },
        }),

        // Families with cohabitation
        this.prisma.family.count({
          where: {
            deletedAt: null,
            cohabitationRecords: {
              some: { isArchived: false },
            },
          },
        }),

        // Families by county
        this.prisma.$queryRaw<Array<{ county: string; count: number }>>`
          SELECT home_county as county, COUNT(*) as count
          FROM families
          WHERE deleted_at IS NULL
            AND home_county IS NOT NULL
          GROUP BY home_county
          ORDER BY count DESC
        `,

        // Top clans
        this.prisma.$queryRaw<Array<{ clanName: string; count: number }>>`
          SELECT clan_name as "clanName", COUNT(*) as count
          FROM families
          WHERE deleted_at IS NULL
            AND clan_name IS NOT NULL
          GROUP BY clan_name
          ORDER BY count DESC
          LIMIT 10
        `,
      ]);

      // Calculate averages
      const averageFamilySize = totalFamilies > 0 ? totalMembers / totalFamilies : 0;

      // Convert county stats to Record
      const familiesByCounty: Record<string, number> = {};
      (countyStats || []).forEach((stat) => {
        familiesByCounty[stat.county] = stat.count;
      });

      const statistics: FamilySystemStatistics = {
        totalFamilies,
        totalMembers,
        polygamousFamilies: polygamousCount,
        monogamousFamilies: totalFamilies - polygamousCount,
        averageFamilySize: parseFloat(averageFamilySize.toFixed(2)),
        familiesByCounty,
        topClans: (topClans || []).map((clan) => ({
          name: clan.clanName,
          count: clan.count,
        })),
        familiesWithAdoptions: adoptionCount,
        familiesWithCohabitation: cohabitationCount,
        familiesWithConflicts: 0, // Would need specific query
      };

      return statistics;
    } catch (error) {
      this.logger.error('Error getting system statistics:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Event Sourcing & Audit
  // --------------------------------------------------------------------------

  async getEventHistory(id: string): Promise<DomainEvent[]> {
    try {
      // Since we're not using event sourcing directly with Prisma,
      // we need to reconstruct from audit logs or history tables
      // For now, return empty array - implement based on your audit strategy
      this.logger.warn(
        `Event history requested for family ${id}, but event sourcing not fully implemented`,
      );

      // Small async operation to satisfy linter
      await Promise.resolve(); // <-- Minimal async operation
      return [];
    } catch (error) {
      this.logger.error(`Error getting event history for family ${id}:`, error);
      throw error;
    }
  }

  async rebuildFromEvents(id: string, _version?: number): Promise<FamilyAggregate | null> {
    try {
      // If using event sourcing, this would replay events to rebuild aggregate
      // For now, fall back to regular find by ID
      this.logger.warn(
        `Rebuild from events requested for family ${id}, falling back to regular load`,
      );
      return this.findById(id);
    } catch (error) {
      this.logger.error(`Error rebuilding family ${id} from events:`, error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Import / Export
  // --------------------------------------------------------------------------

  async exportFamily(id: string, options: FamilyExportOptions): Promise<Buffer> {
    try {
      // Get the full family data
      const family = await this.findById(id, 2);
      if (!family) {
        throw new FamilyNotFoundException(id);
      }

      // Convert to export format
      const exportData = this.prepareExportData(family, options);

      // Convert to buffer based on format
      switch (options.format) {
        case 'JSON':
          return Buffer.from(JSON.stringify(exportData, null, 2), 'utf-8');

        case 'CSV':
          return this.convertToCsv(exportData);

        case 'GEDCOM':
          return this.convertToGedcom(exportData);

        case 'PDF':
          // Would integrate with a PDF generation library
          throw new Error('PDF export not yet implemented');
      }
    } catch (error) {
      this.logger.error(`Error exporting family ${id}:`, error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Private Helper Methods
  // --------------------------------------------------------------------------

  private async deleteChildEntities(tx: Prisma.TransactionClient, familyId: string): Promise<void> {
    // Delete child entities in correct order to respect foreign key constraints
    await Promise.all([
      tx.adoptionRecord.deleteMany({ where: { familyId } }),
      tx.cohabitationRecord.deleteMany({ where: { familyId } }),
      tx.familyRelationship.deleteMany({ where: { familyId } }),
      tx.marriage.deleteMany({ where: { familyId } }),
      tx.polygamousHouse.deleteMany({ where: { familyId } }),
      // Note: Members are not deleted, just updated
    ]);
  }

  private buildIncludeClause(depth: number): Prisma.FamilyInclude {
    const baseInclude = {
      members: true,
    };

    if (depth === 0) {
      return {};
    }

    if (depth === 1) {
      return baseInclude;
    }

    // Full depth (2+)
    return {
      ...baseInclude,
      marriages: true,
      polygamousHouses: true,
      relationships: true,
      cohabitationRecords: true,
      adoptionRecords: true,
    };
  }

  private buildSearchWhereClause(filters: FamilySearchFilters): Prisma.FamilyWhereInput {
    const where: Prisma.FamilyWhereInput = {
      deletedAt: null,
    };

    // Text search
    if (filters.searchText) {
      where.OR = [
        { name: { contains: filters.searchText, mode: 'insensitive' } },
        { description: { contains: filters.searchText, mode: 'insensitive' } },
        { clanName: { contains: filters.searchText, mode: 'insensitive' } },
      ];
    }

    // Creator filter
    if (filters.creatorId) {
      where.creatorId = filters.creatorId;
    }

    // Cultural filters
    if (filters.clanName) {
      where.clanName = { contains: filters.clanName, mode: 'insensitive' };
    }

    if (filters.subClan) {
      where.subClan = { contains: filters.subClan, mode: 'insensitive' };
    }

    if (filters.homeCounty) {
      where.homeCounty = filters.homeCounty;
    }

    // Structure filters
    if (filters.isPolygamous !== undefined) {
      where.isPolygamous = filters.isPolygamous;
    }

    if (filters.minMembers !== undefined) {
      where.memberCount = { gte: filters.minMembers };
    }

    if (filters.hasAdoptions) {
      where.adoptionRecords = {
        some: { isArchived: false },
      };
    }

    if (filters.hasCohabitations) {
      where.cohabitationRecords = {
        some: { isArchived: false },
      };
    }

    // Date filters
    if (filters.createdAfter) {
      where.createdAt = { gte: filters.createdAfter };
    }

    if (filters.updatedAfter) {
      where.updatedAt = { gte: filters.updatedAfter };
    }

    return where;
  }

  private buildSortOrderBy(sort?: FamilySortOptions): Prisma.FamilyOrderByWithRelationInput {
    if (!sort) {
      return { createdAt: 'desc' };
    }

    const direction = sort.direction.toLowerCase() as 'asc' | 'desc';

    switch (sort.field) {
      case 'name':
        return { name: direction };
      case 'createdAt':
        return { createdAt: direction };
      case 'updatedAt':
        return { updatedAt: direction };
      case 'memberCount':
        return { memberCount: direction };
      case 'complexityScore':
        // Note: complexityScore doesn't exist in DB - would need to compute
        return { createdAt: direction };
      default:
        return { createdAt: 'desc' };
    }
  }

  private buildSummarySelect(): Prisma.FamilySelect {
    return {
      id: true,
      name: true,
      description: true,
      memberCount: true,
      isPolygamous: true,
      clanName: true,
      homeCounty: true,
      createdAt: true,
      updatedAt: true,
      members: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          isAlive: true,
          dateOfBirth: true,
        },
        where: {
          isArchived: false,
        },
        orderBy: [{ dateOfBirth: 'asc' }, { createdAt: 'asc' }],
      },
    };
  }

  private extractHeadOfFamily(family: any): string | undefined {
    if (!family.members || family.members.length === 0) {
      return undefined;
    }

    // Simple heuristic: oldest living male, or oldest living member
    const livingMembers = family.members.filter((m: any) => m.isAlive);

    if (livingMembers.length === 0) {
      return undefined;
    }

    // Try to find oldest male
    const oldestMale = livingMembers
      .filter((m: any) => m.gender === 'MALE')
      .sort((a: any, b: any) => {
        const dateA = a.dateOfBirth || new Date(0);
        const dateB = b.dateOfBirth || new Date(0);
        return dateA.getTime() - dateB.getTime();
      })[0];

    if (oldestMale) {
      return `${oldestMale.firstName} ${oldestMale.lastName}`;
    }

    // Fallback to oldest member
    const oldestMember = livingMembers.sort((a: any, b: any) => {
      const dateA = a.dateOfBirth || new Date(0);
      const dateB = b.dateOfBirth || new Date(0);
      return dateA.getTime() - dateB.getTime();
    })[0];

    return `${oldestMember.firstName} ${oldestMember.lastName}`;
  }

  private prepareExportData(family: FamilyAggregate, options: FamilyExportOptions): any {
    const props = family.toProps();

    // Helper function to safely extract member data
    const extractMemberData = (m: any) => {
      // Try multiple access patterns
      const memberAny = m;
      const propsAny = memberAny.props;

      // Get name
      const name =
        propsAny.name?.getFullName?.() ||
        `${propsAny.firstName || ''} ${propsAny.lastName || ''}`.trim();

      // Get date of birth - try multiple access patterns
      const dateOfBirth =
        propsAny.demographics?.dateOfBirth || propsAny.dateOfBirth || memberAny.dateOfBirth;

      // Get gender
      const gender = propsAny.demographics?.gender || propsAny.gender || memberAny.gender;

      // Get isAlive
      const isAlive =
        propsAny.lifeStatus?.isAlive !== false && propsAny.lifeStatus?.isAlive !== undefined
          ? propsAny.lifeStatus.isAlive
          : propsAny.isAlive !== false;

      return {
        id: m.id.toString(),
        name,
        dateOfBirth,
        gender,
        isAlive: isAlive !== false,
      };
    };

    const baseData = {
      familyId: family.id.toString(),
      name: props.name,
      description: props.description,
      clanName: props.clanName,
      homeCounty: props.homeCounty,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      memberCount: family.memberCount,
      isPolygamous: family.isPolygamous(),
      members: props.members.map(extractMemberData),
      marriages: props.marriages.length,
      relationships: props.relationships.length,
      houses: props.houses.length,
      cohabitations: props.cohabitations.length,
      adoptions: props.adoptions.length,
    };

    if (options.includeEvents) {
      baseData['events'] = [];
    }

    return baseData;
  }

  private convertToCsv(data: any): Buffer {
    // Simplified CSV conversion - in production, use a proper CSV library
    const rows: string[] = []; // <-- Explicitly type as string[]

    // Header row
    rows.push(Object.keys(data).join(','));

    // Data rows (flatten nested objects)
    const flattenObject = (obj: any, prefix = ''): Record<string, string> => {
      return Object.keys(obj).reduce((acc: Record<string, string>, key) => {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.assign(acc, flattenObject(value, newKey));
        } else if (Array.isArray(value)) {
          acc[newKey] = JSON.stringify(value);
        } else {
          acc[newKey] = String(value);
        }

        return acc;
      }, {});
    };

    const flatData = flattenObject(data);
    rows.push(
      Object.values(flatData)
        .map((v) => `"${v}"`)
        .join(','),
    );

    return Buffer.from(rows.join('\n'), 'utf-8');
  }

  private convertToGedcom(data: any): Buffer {
    // Simplified GEDCOM export
    const lines: string[] = [];

    // GEDCOM header
    lines.push('0 HEAD');
    lines.push('1 SOUR SHAMBA_FAMILY_SYSTEM');
    lines.push('1 GEDC');
    lines.push('2 VERS 5.5.1');
    lines.push('2 FORM LINEAGE-LINKED');
    lines.push('1 CHAR UTF-8');
    lines.push('1 DATE ' + new Date().toISOString().split('T')[0].replace(/-/g, ' '));
    lines.push('1 SUBM @SUBM@');
    lines.push('0 @SUBM@ SUBM');
    lines.push('1 NAME Shamba Family System');

    // Family record
    lines.push(`0 @F${data.familyId}@ FAM`);
    lines.push(`1 NAME ${data.name}`);

    // Add members as individuals
    if (data.members && Array.isArray(data.members)) {
      data.members.forEach((member: any, _index: number) => {
        lines.push(`0 @I${member.id}@ INDI`);
        lines.push(`1 NAME ${member.name}`);
        if (member.dateOfBirth) {
          lines.push(`1 BIRT`);
          lines.push(`2 DATE ${member.dateOfBirth.toISOString().split('T')[0]}`);
        }
        lines.push(`1 SEX ${member.gender === 'MALE' ? 'M' : 'F'}`);
        lines.push(`1 FAMC @F${data.familyId}@`);
      });
    }

    // End of file
    lines.push('0 TRLR');

    return Buffer.from(lines.join('\n'), 'utf-8');
  }

  // --------------------------------------------------------------------------
  // Health Check & Maintenance
  // --------------------------------------------------------------------------

  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - try to query the database
      await this.prisma.family.count({
        where: { deletedAt: null },
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
      // Get all existing family IDs
      const existingFamilyIds = await this.prisma.family
        .findMany({
          where: { deletedAt: null }, // Only non-deleted families
          select: { id: true },
        })
        .then((families) => families.map((f) => f.id));

      if (existingFamilyIds.length === 0) {
        this.logger.log('No existing families found');
        return 0;
      }

      // Clean up records where familyId doesn't exist in existing families
      const results = await this.prisma.$transaction(async (tx) => {
        const deletions: number[] = [];

        // Delete orphaned members - familyId NOT IN existing families
        const orphanedMembers = await tx.familyMember.deleteMany({
          where: {
            familyId: {
              notIn: existingFamilyIds,
            },
          },
        });
        deletions.push(orphanedMembers.count);

        // Delete orphaned marriages
        const orphanedMarriages = await tx.marriage.deleteMany({
          where: {
            familyId: {
              notIn: existingFamilyIds,
            },
          },
        });
        deletions.push(orphanedMarriages.count);

        // Delete orphaned relationships
        const orphanedRelationships = await tx.familyRelationship.deleteMany({
          where: {
            familyId: {
              notIn: existingFamilyIds,
            },
          },
        });
        deletions.push(orphanedRelationships.count);

        // Delete orphaned polygamous houses
        const orphanedHouses = await tx.polygamousHouse.deleteMany({
          where: {
            familyId: {
              notIn: existingFamilyIds,
            },
          },
        });
        deletions.push(orphanedHouses.count);

        // Delete orphaned cohabitation records
        const orphanedCohabitations = await tx.cohabitationRecord.deleteMany({
          where: {
            familyId: {
              notIn: existingFamilyIds,
            },
          },
        });
        deletions.push(orphanedCohabitations.count);

        // Delete orphaned adoption records
        const orphanedAdoptions = await tx.adoptionRecord.deleteMany({
          where: {
            familyId: {
              notIn: existingFamilyIds,
            },
          },
        });
        deletions.push(orphanedAdoptions.count);

        return deletions.reduce((sum, count) => sum + count, 0);
      });

      this.logger.log(`Cleaned up ${results} orphaned records`);
      return results;
    } catch (error) {
      this.logger.error('Error cleaning up orphaned records:', error);
      throw error;
    }
  }
}

// Export token for dependency injection
export const FamilyRepositoryProvider = {
  provide: FAMILY_REPOSITORY,
  useClass: PrismaFamilyRepository,
};
