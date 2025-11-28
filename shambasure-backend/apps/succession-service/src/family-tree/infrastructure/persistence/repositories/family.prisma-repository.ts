import { Injectable } from '@nestjs/common';
import { MarriageStatus, Prisma } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Family } from '../../../domain/entities/family.entity';
import { FamilyRepositoryInterface } from '../../../domain/interfaces/family.repository.interface';
import { FamilyMapper } from '../mappers/family.mapper';

/**
 * Prisma Implementation of the Family Repository
 *
 * Handles persistence for the HeirLink™ family tree module.
 * Leverages Relational Filtering for queries about minors and marriages.
 * Uses JSONB queries for metadata stored in treeData.
 */
@Injectable()
export class FamilyPrismaRepository implements FamilyRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  async save(family: Family): Promise<void> {
    const persistenceData = FamilyMapper.toPersistence(family);

    // We explicitly map fields to satisfy Prisma Input types
    // and handle the JsonNull logic for treeData.
    await this.prisma.family.upsert({
      where: { id: family.getId() },
      create: {
        id: persistenceData.id,
        creatorId: persistenceData.creatorId,
        name: persistenceData.name,
        description: persistenceData.description,
        // Handle JSON nullability for CreateInput
        treeData: persistenceData.treeData === null ? Prisma.JsonNull : persistenceData.treeData,
        createdAt: persistenceData.createdAt,
        updatedAt: persistenceData.updatedAt,
        deletedAt: persistenceData.deletedAt,
      },
      update: {
        name: persistenceData.name,
        description: persistenceData.description,
        // Handle JSON nullability for UpdateInput
        treeData: persistenceData.treeData === null ? Prisma.JsonNull : persistenceData.treeData,
        updatedAt: persistenceData.updatedAt,
        deletedAt: persistenceData.deletedAt,
      },
    });
  }

  async findById(id: string): Promise<Family | null> {
    const record = await this.prisma.family.findUnique({
      where: { id },
    });

    return record ? FamilyMapper.toDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.family.delete({
      where: { id },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.family.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async restore(id: string): Promise<void> {
    await this.prisma.family.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  // ---------------------------------------------------------
  // DOMAIN LOOKUPS
  // ---------------------------------------------------------

  async findByOwnerId(ownerId: string): Promise<Family[]> {
    const records = await this.prisma.family.findMany({
      where: {
        creatorId: ownerId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => FamilyMapper.toDomain(record));
  }

  async findByName(ownerId: string, name: string): Promise<Family | null> {
    const record = await this.prisma.family.findFirst({
      where: {
        creatorId: ownerId,
        name: {
          equals: name,
          mode: 'insensitive', // Case-insensitive search
        },
        deletedAt: null,
      },
    });

    return record ? FamilyMapper.toDomain(record) : null;
  }

  // ---------------------------------------------------------
  // KENYAN FAMILY LAW SPECIFIC QUERIES
  // ---------------------------------------------------------

  async findFamiliesWithCustomaryMarriages(): Promise<Family[]> {
    // Uses Relation Filtering: Find families that have at least one CUSTOMARY_MARRIAGE
    const records = await this.prisma.family.findMany({
      where: {
        deletedAt: null,
        marriages: {
          some: {
            marriageType: MarriageStatus.CUSTOMARY_MARRIAGE,
            isActive: true,
          },
        },
      },
    });

    return records.map((record) => FamilyMapper.toDomain(record));
  }

  async findFamiliesWithPolygamousMarriages(): Promise<Family[]> {
    // Since 'isPolygamous' isn't a direct column, we check the metadata in JSON
    // OR we could check families with > 1 active marriage (naive approach).
    // Here we query the JSON metadata path.
    const records = await this.prisma.family.findMany({
      where: {
        deletedAt: null,
        treeData: {
          path: ['metadata', 'hasPolygamousMarriage'],
          equals: true,
        },
      },
    });

    return records.map((record) => FamilyMapper.toDomain(record));
  }

  async findFamiliesWithMinors(): Promise<Family[]> {
    // Relation Filtering: Find families with at least one active Minor member
    const records = await this.prisma.family.findMany({
      where: {
        deletedAt: null,
        members: {
          some: {
            isMinor: true,
            isDeceased: false,
          },
        },
      },
    });

    return records.map((record) => FamilyMapper.toDomain(record));
  }

  async findByClan(clanName: string, subClan?: string): Promise<Family[]> {
    // 1. Define the base filters list using strict Prisma types
    const conditions: Prisma.FamilyWhereInput[] = [
      {
        treeData: {
          path: ['metadata', 'clanName'],
          string_contains: clanName,
        },
      },
    ];

    // 2. Conditionally add the subClan filter if provided
    if (subClan) {
      conditions.push({
        treeData: {
          path: ['metadata', 'subClan'],
          string_contains: subClan,
        },
      });
    }

    // 3. Execute query using the AND operator
    const records = await this.prisma.family.findMany({
      where: {
        deletedAt: null,
        AND: conditions,
      },
    });

    return records.map((record) => FamilyMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // ANALYTICS & REPORTING
  // ---------------------------------------------------------

  async getFamilyStatistics(familyId: string): Promise<{
    totalMembers: number;
    livingMembers: number;
    deceasedMembers: number;
    minorCount: number;
    marriageCount: number;
    customaryMarriageCount: number;
  }> {
    // Execute counts in parallel for performance
    const [
      totalMembers,
      livingMembers,
      deceasedMembers,
      minorCount,
      marriageCount,
      customaryMarriageCount,
    ] = await Promise.all([
      // Total
      this.prisma.familyMember.count({ where: { familyId } }),
      // Living
      this.prisma.familyMember.count({ where: { familyId, isDeceased: false } }),
      // Deceased
      this.prisma.familyMember.count({ where: { familyId, isDeceased: true } }),
      // Minors
      this.prisma.familyMember.count({ where: { familyId, isMinor: true } }),
      // Total Marriages
      this.prisma.marriage.count({ where: { familyId } }),
      // Customary Marriages
      this.prisma.marriage.count({
        where: { familyId, marriageType: MarriageStatus.CUSTOMARY_MARRIAGE },
      }),
    ]);

    return {
      totalMembers,
      livingMembers,
      deceasedMembers,
      minorCount,
      marriageCount,
      customaryMarriageCount,
    };
  }

  async countByOwner(ownerId: string): Promise<number> {
    return this.prisma.family.count({
      where: {
        creatorId: ownerId,
        deletedAt: null,
      },
    });
  }
}
