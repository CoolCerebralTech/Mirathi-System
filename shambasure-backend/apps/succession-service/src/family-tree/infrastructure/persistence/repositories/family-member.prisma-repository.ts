import { Injectable } from '@nestjs/common';
import { Prisma, RelationshipType } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { FamilyMember } from '../../../domain/entities/family-member.entity';
import { FamilyMemberRepositoryInterface } from '../../../domain/interfaces/family-member.repository.interface';
import { FamilyMemberMapper } from '../mappers/family-member.mapper';

@Injectable()
export class FamilyMemberPrismaRepository implements FamilyMemberRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  async save(member: FamilyMember): Promise<void> {
    const persistenceData = FamilyMemberMapper.toPersistence(member);

    await this.prisma.familyMember.upsert({
      where: { id: member.getId() },
      create: {
        id: persistenceData.id,
        familyId: persistenceData.familyId,
        userId: persistenceData.userId,
        firstName: persistenceData.firstName,
        lastName: persistenceData.lastName,
        email: persistenceData.email,
        phone: persistenceData.phone,
        dateOfBirth: persistenceData.dateOfBirth,
        dateOfDeath: persistenceData.dateOfDeath,
        relationshipTo: persistenceData.relationshipTo,
        role: persistenceData.role,
        isMinor: persistenceData.isMinor,
        isDeceased: persistenceData.isDeceased,
        notes: persistenceData.notes,
        addedBy: persistenceData.addedBy,
        createdAt: persistenceData.createdAt,
        updatedAt: persistenceData.updatedAt,
        deletedAt: persistenceData.deletedAt,
      },
      update: {
        firstName: persistenceData.firstName,
        lastName: persistenceData.lastName,
        email: persistenceData.email,
        phone: persistenceData.phone,
        dateOfBirth: persistenceData.dateOfBirth,
        dateOfDeath: persistenceData.dateOfDeath,
        relationshipTo: persistenceData.relationshipTo,
        role: persistenceData.role,
        isMinor: persistenceData.isMinor,
        isDeceased: persistenceData.isDeceased,
        notes: persistenceData.notes,
        updatedAt: persistenceData.updatedAt,
        deletedAt: persistenceData.deletedAt,
      },
    });
  }

  async saveMany(members: FamilyMember[]): Promise<void> {
    const operations = members.map((member) => {
      const data = FamilyMemberMapper.toPersistence(member);
      return this.prisma.familyMember.upsert({
        where: { id: data.id },
        create: data as Prisma.FamilyMemberUncheckedCreateInput,
        update: data as Prisma.FamilyMemberUncheckedUpdateInput,
      });
    });

    await this.prisma.$transaction(operations);
  }

  async findById(id: string): Promise<FamilyMember | null> {
    const record = await this.prisma.familyMember.findUnique({
      where: { id },
    });

    return record ? FamilyMemberMapper.toDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.familyMember.delete({
      where: { id },
    });
  }

  // ---------------------------------------------------------
  // GRAPH & CONTEXT QUERIES
  // ---------------------------------------------------------

  async findByFamilyId(familyId: string): Promise<FamilyMember[]> {
    const records = await this.prisma.familyMember.findMany({
      where: { familyId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record) => FamilyMemberMapper.toDomain(record));
  }

  async findByUserId(userId: string): Promise<FamilyMember | null> {
    const record = await this.prisma.familyMember.findFirst({
      where: { userId, deletedAt: null },
    });

    return record ? FamilyMemberMapper.toDomain(record) : null;
  }

  async findMinors(familyId: string): Promise<FamilyMember[]> {
    const records = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        isMinor: true,
        isDeceased: false,
        deletedAt: null,
      },
    });

    return records.map((record) => FamilyMemberMapper.toDomain(record));
  }

  async findDeceased(familyId: string): Promise<FamilyMember[]> {
    const records = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        isDeceased: true,
        deletedAt: null,
      },
    });

    return records.map((record) => FamilyMemberMapper.toDomain(record));
  }

  async findLivingMembers(familyId: string): Promise<FamilyMember[]> {
    const records = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        isDeceased: false,
        deletedAt: null,
      },
    });

    return records.map((record) => FamilyMemberMapper.toDomain(record));
  }

  async countByFamilyId(familyId: string): Promise<number> {
    return this.prisma.familyMember.count({
      where: { familyId, deletedAt: null },
    });
  }

  // ---------------------------------------------------------
  // KENYAN SUCCESSION LAW SPECIFIC QUERIES
  // ---------------------------------------------------------

  async findDependants(familyId: string): Promise<FamilyMember[]> {
    // Section 29 Dependants: Spouses, Children, and sometimes Parents
    const records = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        isDeceased: false,
        deletedAt: null,
        role: {
          in: [
            RelationshipType.SPOUSE,
            RelationshipType.CHILD,
            RelationshipType.ADOPTED_CHILD,
            RelationshipType.STEPCHILD,
            RelationshipType.PARENT,
          ],
        },
      },
    });

    return records.map((record) => FamilyMemberMapper.toDomain(record));
  }

  async findByRole(familyId: string, role: RelationshipType): Promise<FamilyMember[]> {
    const records = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        role,
        deletedAt: null,
      },
    });

    return records.map((record) => FamilyMemberMapper.toDomain(record));
  }

  async findFamilyHeads(familyId: string): Promise<FamilyMember[]> {
    // This requires joining with Family table to check familyHeadId
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: { familyHeadId: true },
    });

    if (!family || !family.familyHeadId) {
      return [];
    }

    const headMember = await this.findById(family.familyHeadId);
    return headMember ? [headMember] : [];
  }

  // ---------------------------------------------------------
  // SEARCH & IDENTIFICATION
  // ---------------------------------------------------------

  async searchByName(query: string, familyId: string): Promise<FamilyMember[]> {
    const records = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        deletedAt: null,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    return records.map((record) => FamilyMemberMapper.toDomain(record));
  }

  async findByBirthDateRange(
    startDate: Date,
    endDate: Date,
    familyId?: string,
  ): Promise<FamilyMember[]> {
    const whereClause: Prisma.FamilyMemberWhereInput = {
      deletedAt: null,
      dateOfBirth: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (familyId) {
      whereClause.familyId = familyId;
    }

    const records = await this.prisma.familyMember.findMany({
      where: whereClause,
    });

    return records.map((record) => FamilyMemberMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // BULK OPERATIONS
  // ---------------------------------------------------------

  async updateMany(members: FamilyMember[]): Promise<void> {
    await this.saveMany(members);
  }

  async softDeleteMany(memberIds: string[]): Promise<void> {
    await this.prisma.familyMember.updateMany({
      where: {
        id: { in: memberIds },
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  // ---------------------------------------------------------
  // ADDITIONAL UTILITY METHODS
  // ---------------------------------------------------------

  async findMembersByAgeRange(
    familyId: string,
    minAge: number,
    maxAge: number,
  ): Promise<FamilyMember[]> {
    const today = new Date();
    const maxBirthDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
    const minBirthDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());

    const records = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        isDeceased: false,
        deletedAt: null,
        dateOfBirth: {
          gte: minBirthDate,
          lte: maxBirthDate,
        },
      },
    });

    return records.map((record) => FamilyMemberMapper.toDomain(record));
  }

  async findMembersWithoutUserAccounts(familyId: string): Promise<FamilyMember[]> {
    const records = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        userId: null,
        deletedAt: null,
      },
    });

    return records.map((record) => FamilyMemberMapper.toDomain(record));
  }

  async findRecentMembers(familyId: string, days: number = 30): Promise<FamilyMember[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const records = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        createdAt: {
          gte: cutoffDate,
        },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => FamilyMemberMapper.toDomain(record));
  }
}
