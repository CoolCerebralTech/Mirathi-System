// apps/family-service/src/infrastructure/repositories/family.repository.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@shamba/database';

@Injectable()
export class FamilyRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // FAMILY OPERATIONS
  // ============================================================================

  async createFamily(data: Prisma.FamilyCreateInput) {
    return this.prisma.family.create({ data, include: { members: true } });
  }

  async findFamilyById(id: string) {
    return this.prisma.family.findUnique({
      where: { id },
      include: {
        members: true,
        marriages: {
          include: {
            spouse1: true,
            spouse2: true,
          },
        },
        houses: {
          include: {
            children: true,
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

  async createFamilyMember(data: Prisma.FamilyMemberCreateInput) {
    return this.prisma.familyMember.create({ data });
  }

  async findFamilyMemberById(id: string) {
    return this.prisma.familyMember.findUnique({
      where: { id },
      include: {
        marriagesAsSpouse1: {
          include: {
            spouse2: true,
          },
        },
        marriagesAsSpouse2: {
          include: {
            spouse1: true,
          },
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
        firstName,
        lastName,
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
      where: { familyId },
      include: {
        spouse1: true,
        spouse2: true,
      },
    });
  }

  // ============================================================================
  // POLYGAMOUS HOUSE OPERATIONS
  // ============================================================================

  async createPolygamousHouse(data: Prisma.PolygamousHouseCreateInput) {
    return this.prisma.polygamousHouse.create({ data });
  }

  async findPolygamousHouses(familyId: string) {
    return this.prisma.polygamousHouse.findMany({
      where: { familyId, isActive: true },
      include: {
        children: true,
        marriages: true,
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
          include: {
            guardian: true,
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
      where: { guardianshipId },
      include: {
        guardian: true,
        ward: true,
      },
    });
  }
}
