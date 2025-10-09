// ============================================================================
// families.repository.ts - Family/HeirLink™ Data Access Layer
// ============================================================================

import {
  Injectable as FamilyInjectable,
  NotFoundException as FamilyNotFoundException,
} from '@nestjs/common';
import {
  Prisma as FamilyPrisma,
  PrismaService as FamilyPrismaService,
  Family,
  FamilyMember,
  RelationshipType,
} from '@shamba/database';

/**
 * FamiliesRepository - Pure data access for families and family members
 *
 * RESPONSIBILITIES:
 * - CRUD operations for families (HeirLink™)
 * - Manage family member relationships
 * - Query families by creator or member
 */
@FamilyInjectable()
export class FamiliesRepository {
  constructor(private readonly prisma: FamilyPrismaService) {}

  // ========================================================================
  // FAMILY OPERATIONS
  // ========================================================================

  async create(data: FamilyPrisma.FamilyCreateInput): Promise<Family> {
    return this.prisma.family.create({ data });
  }

  async findById(id: string): Promise<Family | null> {
    return this.prisma.family.findUnique({ where: { id } });
  }

  async findByIdWithMembers(id: string): Promise<(Family & { members: FamilyMember[] }) | null> {
    return this.prisma.family.findUnique({
      where: { id },
      include: { members: true },
    });
  }

  async findOneOrFail(
    where: FamilyPrisma.FamilyWhereUniqueInput,
  ): Promise<Family & { members: FamilyMember[] }> {
    const family = await this.prisma.family.findUnique({
      where,
      include: { members: true },
    });
    if (!family) {
      const identifier = where.id || 'unknown';
      throw new FamilyNotFoundException(`Family with ID '${identifier}' not found`);
    }
    return family;
  }

  async findByCreator(creatorId: string): Promise<Family[]> {
    return this.prisma.family.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByMember(userId: string): Promise<Family[]> {
    return this.prisma.family.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: FamilyPrisma.FamilyUpdateInput): Promise<Family> {
    return this.prisma.family.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Family> {
    // Cascading delete of members handled by Prisma schema
    return this.prisma.family.delete({ where: { id } });
  }

  // ========================================================================
  // FAMILY MEMBER OPERATIONS
  // ========================================================================

  async addMember(data: FamilyPrisma.FamilyMemberUncheckedCreateInput): Promise<FamilyMember> {
    return this.prisma.familyMember.create({ data });
  }

  async findMember(userId: string, familyId: string): Promise<FamilyMember | null> {
    return this.prisma.familyMember.findUnique({
      where: { userId_familyId: { userId, familyId } },
    });
  }

  async findMemberOrFail(userId: string, familyId: string): Promise<FamilyMember> {
    const member = await this.findMember(userId, familyId);
    if (!member) {
      throw new FamilyNotFoundException(`Member ${userId} not found in family ${familyId}`);
    }
    return member;
  }

  async updateMember(
    where: FamilyPrisma.FamilyMemberWhereUniqueInput,
    data: FamilyPrisma.FamilyMemberUpdateInput,
  ): Promise<FamilyMember> {
    return this.prisma.familyMember.update({ where, data });
  }

  async removeMember(where: FamilyPrisma.FamilyMemberWhereUniqueInput): Promise<FamilyMember> {
    return this.prisma.familyMember.delete({ where });
  }

  async getMembersByFamily(familyId: string): Promise<FamilyMember[]> {
    return this.prisma.familyMember.findMany({
      where: { familyId },
    });
  }

  async getMembersByRelationship(
    familyId: string,
    role: RelationshipType,
  ): Promise<FamilyMember[]> {
    return this.prisma.familyMember.findMany({
      where: { familyId, role },
    });
  }

  async isMemberOf(userId: string, familyId: string): Promise<boolean> {
    const count = await this.prisma.familyMember.count({
      where: { userId, familyId },
    });
    return count > 0;
  }

  async getMemberCount(familyId: string): Promise<number> {
    return this.prisma.familyMember.count({
      where: { familyId },
    });
  }
}
