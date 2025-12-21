import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Family } from '../../../domain/aggregates/family.aggregate';
import { IFamilyRepository } from '../../../domain/interfaces/repositories/ifamily.repository';
import { FamilyMapper } from '../mappers/family.mapper';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class FamilyRepository implements IFamilyRepository {
  private readonly logger = new Logger(FamilyRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelations = {
    members: {
      select: { id: true },
      where: { deletedAt: null }, // Only include non-deleted members
    },
    marriages: { select: { id: true } },
    polygamousHouses: { select: { id: true } },
  };

  // ============ CORE CRUD OPERATIONS ============
  async create(family: Family): Promise<Family> {
    try {
      const persistenceData = FamilyMapper.toPersistence(family);
      const savedFamily = await this.prisma.family.create({
        data: persistenceData,
        include: this.includeRelations,
      });
      return FamilyMapper.fromPrisma(savedFamily);
    } catch (error) {
      this.logger.error(`Failed to create family ${family.id}:`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<Family | null> {
    const family = await this.prisma.family.findUnique({
      where: { id },
      include: this.includeRelations,
    });
    return family ? FamilyMapper.fromPrisma(family) : null;
  }

  async update(family: Family): Promise<Family> {
    try {
      const persistence = FamilyMapper.toPersistence(family);
      const { id, ...updateData } = persistence;

      const savedFamily = await this.prisma.family.update({
        where: { id },
        data: updateData,
        include: this.includeRelations,
      });
      return FamilyMapper.fromPrisma(savedFamily);
    } catch (error) {
      this.logger.error(`Failed to update family ${family.id}:`, error);
      throw error;
    }
  }

  async delete(id: string, deletedBy: string, reason: string): Promise<void> {
    try {
      // Hard delete - only use for testing or admin operations
      await this.prisma.family.delete({
        where: { id },
      });
      this.logger.log(`Family ${id} deleted by ${deletedBy}. Reason: ${reason}`);
    } catch (error) {
      this.logger.error(`Failed to delete family ${id}:`, error);
      throw error;
    }
  }

  async archive(id: string, deletedBy: string, reason: string): Promise<void> {
    try {
      await this.prisma.family.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });
      this.logger.log(`Family ${id} archived by ${deletedBy}. Reason: ${reason}`);
    } catch (error) {
      this.logger.error(`Failed to archive family ${id}:`, error);
      throw error;
    }
  }

  async unarchive(id: string): Promise<void> {
    try {
      await this.prisma.family.update({
        where: { id },
        data: {
          deletedAt: null,
        },
      });
      this.logger.log(`Family ${id} unarchived`);
    } catch (error) {
      this.logger.error(`Failed to unarchive family ${id}:`, error);
      throw error;
    }
  }

  // ============ QUERY OPERATIONS CRITICAL FOR BUSINESS LOGIC ============
  async findByCreatorId(creatorId: string): Promise<Family[]> {
    const families = await this.prisma.family.findMany({
      where: { creatorId },
      include: this.includeRelations,
    });
    return families
      .map((family) => FamilyMapper.fromPrisma(family))
      .filter((family): family is Family => family !== null);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.family.count({
      where: { id },
    });
    return count > 0;
  }

  // ============ ADVANCED SEARCH & FILTERING ============
  async findAll(criteria: Record<string, any>): Promise<Family[]> {
    try {
      // Convert criteria to Prisma where clause
      const whereClause = this.buildWhereClause(criteria);

      const families = await this.prisma.family.findMany({
        where: whereClause,
        include: this.includeRelations,
        orderBy: criteria.sort ? this.buildOrderBy(criteria.sort) : { createdAt: 'desc' },
        skip: criteria.skip || 0,
        take: criteria.take || 100,
      });

      return families
        .map((family) => FamilyMapper.fromPrisma(family))
        .filter((family): family is Family => family !== null);
    } catch (error) {
      this.logger.error(
        `Failed to find families with criteria ${JSON.stringify(criteria)}:`,
        error,
      );
      throw error;
    }
  }

  async count(criteria: Record<string, any>): Promise<number> {
    try {
      const whereClause = this.buildWhereClause(criteria);
      return await this.prisma.family.count({
        where: whereClause,
      });
    } catch (error) {
      this.logger.error(
        `Failed to count families with criteria ${JSON.stringify(criteria)}:`,
        error,
      );
      throw error;
    }
  }

  // ============ MEMBER MANAGEMENT OPERATIONS ============
  async addMember(familyId: string, memberId: string): Promise<void> {
    await this.prisma.familyMember.update({
      where: { id: memberId },
      data: {
        familyId,
        deletedAt: null, // Ensure member is active
      },
    });
    await this.recalculateFamilyCounts(familyId);
  }

  async removeMember(familyId: string, memberId: string): Promise<void> {
    // Soft delete the member
    await this.prisma.familyMember.update({
      where: { id: memberId, familyId },
      data: {
        deletedAt: new Date(),
        familyId, // Keep reference but mark as deleted
      },
    });
    await this.recalculateFamilyCounts(familyId);
  }

  async getMemberIds(familyId: string): Promise<string[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        deletedAt: null, // Only active members
      },
      select: { id: true },
    });
    return members.map((member) => member.id);
  }

  // ============ MARRIAGE MANAGEMENT OPERATIONS ============
  async addMarriage(familyId: string, marriageId: string): Promise<void> {
    await this.prisma.marriage.update({
      where: { id: marriageId },
      data: { familyId },
    });
  }

  async removeMarriage(familyId: string, marriageId: string): Promise<void> {
    await this.prisma.marriage.delete({
      where: { id: marriageId, familyId },
    });
  }

  // ============ POLYGAMOUS HOUSE MANAGEMENT (S.40 COMPLIANCE) ============
  async addPolygamousHouse(familyId: string, houseId: string): Promise<void> {
    await this.prisma.polygamousHouse.update({
      where: { id: houseId },
      data: { familyId },
    });

    // Update family's polygamous status
    await this.prisma.family.update({
      where: { id: familyId },
      data: {
        isPolygamous: true,
        polygamousHouseCount: { increment: 1 },
      },
    });
  }

  async removePolygamousHouse(familyId: string, houseId: string): Promise<void> {
    await this.prisma.polygamousHouse.delete({
      where: { id: houseId, familyId },
    });

    const remainingHouses = await this.prisma.polygamousHouse.count({
      where: { familyId },
    });

    await this.prisma.family.update({
      where: { id: familyId },
      data: {
        isPolygamous: remainingHouses > 0,
        polygamousHouseCount: remainingHouses,
      },
    });
  }

  // ============ SEARCH OPERATIONS ============
  async searchByName(name: string): Promise<Family[]> {
    const families = await this.prisma.family.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' },
      },
      include: this.includeRelations,
    });
    return families
      .map((family) => FamilyMapper.fromPrisma(family))
      .filter((family): family is Family => family !== null);
  }

  async findByCounty(county: string): Promise<Family[]> {
    const families = await this.prisma.family.findMany({
      where: { homeCounty: county as any },
      include: this.includeRelations,
    });
    return families
      .map((family) => FamilyMapper.fromPrisma(family))
      .filter((family): family is Family => family !== null);
  }

  // ============ CONCURRENCY CONTROL ============
  async saveWithOptimisticLocking(family: Family, expectedVersion: number): Promise<Family> {
    const persistence = FamilyMapper.toPersistence(family);
    const { id, ...updateData } = persistence;

    try {
      const savedFamily = await this.prisma.family.update({
        where: {
          id,
          version: expectedVersion,
        },
        data: updateData,
        include: this.includeRelations,
      });
      return FamilyMapper.fromPrisma(savedFamily);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new Error(
          `Optimistic locking conflict for family ${id}. Expected version: ${expectedVersion}, Current version may have changed.`,
        );
      }
      throw error;
    }
  }

  // ============ BULK OPERATIONS FOR PERFORMANCE ============
  async recalculateFamilyCounts(familyId: string): Promise<void> {
    const [members, dependants] = await Promise.all([
      this.prisma.familyMember.findMany({
        where: {
          familyId,
          deletedAt: null, // Only non-deleted members
        },
        select: {
          id: true,
          isDeceased: true,
          dateOfBirth: true,
        },
      }),
      // S.29 dependants calculation
      this.prisma.familyMember.count({
        where: {
          familyId,
          deletedAt: null,
          isDeceased: false,
          OR: [
            {
              dateOfBirth: { gte: new Date(new Date().setFullYear(new Date().getFullYear() - 18)) },
            }, // Minors
            { disabilityStatus: { not: null } }, // Disabled
          ],
        },
      }),
    ]);

    // Calculate age for minors
    const calculateAge = (birthDate: Date | null): number => {
      if (!birthDate) return 0;
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    const livingMembers = members.filter((m) => !m.isDeceased);
    const deceasedMembers = members.filter((m) => m.isDeceased);
    const minorMembers = livingMembers.filter((m) => {
      const age = calculateAge(m.dateOfBirth);
      return age < 18;
    });

    await this.prisma.family.update({
      where: { id: familyId },
      data: {
        memberCount: members.length,
        livingMemberCount: livingMembers.length,
        deceasedMemberCount: deceasedMembers.length,
        minorCount: minorMembers.length,
        dependantCount: dependants,
      },
    });
  }

  async batchUpdateMemberStatus(
    familyId: string,
    updates: Array<{ memberId: string; isDeceased: boolean }>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const update of updates) {
        await tx.familyMember.update({
          where: {
            id: update.memberId,
            familyId,
            deletedAt: null, // Only update active members
          },
          data: {
            isDeceased: update.isDeceased,
            ...(update.isDeceased && { dateOfDeath: new Date() }),
          },
        });
      }
      await this.recalculateFamilyCounts(familyId);
    });
  }

  // ============ TRANSACTION SUPPORT ============
  async withTransaction<T>(transactionFn: (client: TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return transactionFn(tx as TransactionClient);
    });
  }

  // ============ HEALTH & VALIDATION ============
  async validateFamilyConsistency(familyId: string): Promise<boolean> {
    const [family, members, marriages, houses] = await Promise.all([
      this.prisma.family.findUnique({
        where: { id: familyId },
        include: {
          ...this.includeRelations,
          members: true, // Get full member objects for validation
        },
      }),
      this.prisma.familyMember.findMany({
        where: {
          familyId,
          deletedAt: null,
        },
      }),
      this.prisma.marriage.findMany({ where: { familyId } }),
      this.prisma.polygamousHouse.findMany({ where: { familyId } }),
    ]);

    if (!family) return false;

    // Use the included relationships for validation
    const validation = {
      memberCountValid: family.memberCount === members.length,
      marriageCountValid: family.marriages?.length === marriages.length,
      houseCountValid: family.polygamousHouseCount === houses.length,
      livingCountValid: family.livingMemberCount === members.filter((m) => !m.isDeceased).length,
      deceasedCountValid: family.deceasedMemberCount === members.filter((m) => m.isDeceased).length,
      minorCountValid:
        family.minorCount ===
        members.filter((m) => {
          if (!m.dateOfBirth) return false;
          const age = this.calculateAge(new Date(m.dateOfBirth));
          return age < 18;
        }).length,
    };

    const allValid = Object.values(validation).every((v) => v);

    if (!allValid) {
      this.logger.warn(`Family ${familyId} consistency issues:`, validation);
    }

    return allValid;
  }

  // Helper method for age calculation
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // ============ HELPER METHODS ============
  private buildWhereClause(criteria: Record<string, any>): any {
    const where: any = {};

    // Map common criteria to Prisma where conditions
    if (criteria.id) where.id = criteria.id;
    if (criteria.ids) where.id = { in: criteria.ids };
    if (criteria.name) where.name = { contains: criteria.name, mode: 'insensitive' };
    if (criteria.creatorId) where.creatorId = criteria.creatorId;
    if (criteria.homeCounty) where.homeCounty = criteria.homeCounty;
    if (criteria.isPolygamous !== undefined) where.isPolygamous = criteria.isPolygamous;
    if (criteria.createdAfter) where.createdAt = { gte: new Date(criteria.createdAfter) };
    if (criteria.createdBefore) where.createdAt = { lte: new Date(criteria.createdBefore) };

    // Handle archived/active filter
    if (criteria.archived === true) {
      where.deletedAt = { not: null };
    } else if (criteria.archived === false) {
      where.deletedAt = null;
    }

    // Custom filters can be passed directly
    if (criteria.where) {
      Object.assign(where, criteria.where);
    }

    return where;
  }

  private buildOrderBy(sort: any): any {
    if (typeof sort === 'string') {
      return { [sort]: 'asc' };
    }

    if (Array.isArray(sort)) {
      return sort.reduce((orderBy, sortItem) => {
        if (typeof sortItem === 'string') {
          orderBy[sortItem] = 'asc';
        } else if (typeof sortItem === 'object') {
          Object.assign(orderBy, sortItem);
        }
        return orderBy;
      }, {});
    }

    return sort;
  }
}
