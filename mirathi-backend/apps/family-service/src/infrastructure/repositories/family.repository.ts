// apps/family-service/src/infrastructure/repositories/family.repository.ts
import { Injectable } from '@nestjs/common';
import { Family, FamilyMember, Prisma } from '@prisma/client';

import { PrismaService } from '@shamba/database';

@Injectable()
export class FamilyRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // FAMILY AGGREGATE OPERATIONS
  // ============================================================================

  async createFamily(data: Prisma.FamilyCreateInput): Promise<Family> {
    return this.prisma.family.create({
      data,
      include: { members: true },
    });
  }

  /**
   * Finds a family by the User ID (Creator).
   * Critical for the "My Family" dashboard view.
   */
  async findFamilyByCreatorId(creatorId: string) {
    return this.prisma.family.findFirst({
      where: { creatorId, deletedAt: null },
      include: {
        // Only fetch active members
        members: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findFamilyById(id: string) {
    return this.prisma.family.findUnique({
      where: { id },
      include: {
        // Filter out soft-deleted entities
        members: {
          where: { deletedAt: null },
        },
        marriages: {
          where: { status: 'ACTIVE' }, // Only active marriages usually matter for tree structure
          include: {
            spouse1: true,
            spouse2: true,
          },
        },
        houses: {
          where: { isActive: true },
          include: {
            children: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  }

  async updateFamilyStats(id: string, data: Prisma.FamilyUpdateInput) {
    return this.prisma.family.update({
      where: { id },
      data,
    });
  }

  // ============================================================================
  // FAMILY MEMBER OPERATIONS
  // ============================================================================

  async createFamilyMember(data: Prisma.FamilyMemberCreateInput): Promise<FamilyMember> {
    return this.prisma.familyMember.create({ data });
  }

  async findFamilyMemberById(id: string) {
    return this.prisma.familyMember.findUnique({
      where: { id },
      include: {
        // Include marriages to help build the tree nodes
        marriagesAsSpouse1: {
          where: { status: 'ACTIVE' },
          include: { spouse2: true },
        },
        marriagesAsSpouse2: {
          where: { status: 'ACTIVE' },
          include: { spouse1: true },
        },
        // Include guardianship info
        guardiansAssignedToMe: {
          where: { isActive: true },
        },
        guardiansIProvide: {
          where: { isActive: true },
        },
      },
    });
  }

  async findFamilyMembers(familyId: string) {
    return this.prisma.familyMember.findMany({
      where: { familyId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findFamilyMemberByName(familyId: string, firstName: string, lastName: string) {
    return this.prisma.familyMember.findFirst({
      where: {
        familyId,
        firstName: { equals: firstName, mode: 'insensitive' }, // Case insensitive check
        lastName: { equals: lastName, mode: 'insensitive' },
        deletedAt: null,
      },
    });
  }

  async updateFamilyMember(id: string, data: Prisma.FamilyMemberUpdateInput) {
    return this.prisma.familyMember.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete a member.
   * Important: We don't remove the row, we just mark deletedAt.
   */
  async deleteFamilyMember(id: string) {
    return this.prisma.familyMember.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async countMinors(familyId: string) {
    return this.prisma.familyMember.count({
      where: {
        familyId,
        isMinor: true,
        isAlive: true,
        deletedAt: null,
      },
    });
  }

  // ============================================================================
  // MARRIAGE OPERATIONS
  // ============================================================================

  async createMarriage(data: Prisma.MarriageCreateInput) {
    return this.prisma.marriage.create({ data });
  }

  async findMarriagesByFamily(familyId: string) {
    return this.prisma.marriage.findMany({
      where: { familyId, status: 'ACTIVE' },
      include: {
        spouse1: true,
        spouse2: true,
      },
    });
  }

  // ============================================================================
  // POLYGAMOUS HOUSE OPERATIONS (Section 40)
  // ============================================================================

  async createPolygamousHouse(data: Prisma.PolygamousHouseCreateInput) {
    return this.prisma.polygamousHouse.create({ data });
  }

  async findPolygamousHouses(familyId: string) {
    return this.prisma.polygamousHouse.findMany({
      where: { familyId, isActive: true },
      include: {
        // In African Customary Law, the House is defined by the Mother
        children: {
          where: { deletedAt: null },
        },
        // We might need to know which marriage created this house
        marriages: true,
      },
      orderBy: {
        houseOrder: 'asc', // House 1 (First Wife), House 2, etc.
      },
    });
  }

  async updateHouseChildCount(id: string, increment: number) {
    return this.prisma.polygamousHouse.update({
      where: { id },
      data: {
        childCount: { increment },
      },
    });
  }

  // ============================================================================
  // GUARDIANSHIP OPERATIONS
  // ============================================================================

  async createGuardianship(data: Prisma.GuardianshipCreateInput) {
    return this.prisma.guardianship.create({ data });
  }

  async findGuardianshipByWard(wardId: string) {
    return this.prisma.guardianship.findFirst({
      where: { wardId },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            guardian: true, // Need the person's details
          },
          orderBy: {
            priorityOrder: 'asc',
          },
        },
      },
    });
  }

  async updateGuardianship(id: string, data: Prisma.GuardianshipUpdateInput) {
    return this.prisma.guardianship.update({
      where: { id },
      data,
    });
  }

  async createGuardianAssignment(data: Prisma.GuardianAssignmentCreateInput) {
    return this.prisma.guardianAssignment.create({
      data,
      include: {
        guardian: true,
        ward: true,
      },
    });
  }

  async findGuardianAssignments(guardianshipId: string) {
    return this.prisma.guardianAssignment.findMany({
      where: { guardianshipId, isActive: true },
      include: {
        guardian: true,
        ward: true,
      },
      orderBy: {
        priorityOrder: 'asc',
      },
    });
  }
}
