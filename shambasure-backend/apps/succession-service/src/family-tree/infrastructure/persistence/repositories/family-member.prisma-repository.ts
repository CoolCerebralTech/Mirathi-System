import { Injectable } from '@nestjs/common';
import { Prisma, RelationshipType } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { FamilyMember } from '../../../domain/entities/family-member.entity';
import { FamilyMemberRepositoryInterface } from '../../../domain/interfaces/family-member.repository.interface';
import { FamilyMemberMapper } from '../mappers/family-member.mapper';

/**
 * Prisma Implementation of the Family Member Repository
 *
 * Handles persistence for individual nodes in the HeirLink™ family graph.
 * Implements Kenyan Succession Law specific lookups (Dependants, Heirs).
 *
 * NOTE: Some queries rely on In-Memory filtering because the current Prisma Schema
 * does not yet have dedicated columns for all Domain Metadata (e.g., disabilityStatus).
 */
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
        // familyId, id, addedBy are immutable
      },
    });
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

  async saveMany(members: FamilyMember[]): Promise<void> {
    // Execute multiple upserts in a transaction to ensure data integrity
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

  // ---------------------------------------------------------
  // GRAPH QUERIES
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

  async countByFamilyId(familyId: string): Promise<number> {
    return this.prisma.familyMember.count({
      where: { familyId, deletedAt: null },
    });
  }

  // ---------------------------------------------------------
  // KENYAN SUCCESSION LAW SPECIFIC QUERIES
  // ---------------------------------------------------------

  async findPotentialHeirs(familyId: string, excludeDeceasedId?: string): Promise<FamilyMember[]> {
    const records = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        id: excludeDeceasedId ? { not: excludeDeceasedId } : undefined,
        isDeceased: false, // Generally heirs must be alive (or represented)
        deletedAt: null,
      },
    });

    return records.map((record) => FamilyMemberMapper.toDomain(record));
  }

  async findDependants(familyId: string, deceasedMemberId: string): Promise<FamilyMember[]> {
    // Law of Succession Act Section 29 Dependants:
    // Spouses, Children, and sometimes Parents/Grandparents.
    // We filter by Role here. Logic for "dependency" status is usually domain-level,
    // but we can narrow the search by relationship type.
    const records = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        id: { not: deceasedMemberId },
        deletedAt: null,
        role: {
          in: [
            RelationshipType.SPOUSE,
            RelationshipType.EX_SPOUSE,
            RelationshipType.CHILD,
            RelationshipType.ADOPTED_CHILD,
            RelationshipType.STEPCHILD,
            RelationshipType.PARENT,
            RelationshipType.GRANDPARENT,
          ],
        },
      },
    });

    return records.map((record) => FamilyMemberMapper.toDomain(record));
  }

  async findByRelationshipType(
    familyId: string,
    relationshipType: string,
  ): Promise<FamilyMember[]> {
    // Need to cast string to Enum, assuming validation happened in service
    const roleEnum = relationshipType as RelationshipType;

    const records = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        role: roleEnum,
        deletedAt: null,
      },
    });

    return records.map((record) => FamilyMemberMapper.toDomain(record));
  }

  async findFamilyHeads(familyId: string): Promise<FamilyMember[]> {
    // LIMITATION: 'isFamilyHead' is inside Domain Metadata, not a DB column.
    // STRATEGY: Fetch all family members and filter in-memory.
    const allMembers = await this.findByFamilyId(familyId);
    return allMembers.filter((m) => m.getMetadata().isFamilyHead);
  }

  async findMembersWithDisabilities(familyId: string): Promise<FamilyMember[]> {
    // LIMITATION: 'disabilityStatus' is inside Domain Metadata.
    // STRATEGY: Fetch all family members and filter in-memory.
    const allMembers = await this.findByFamilyId(familyId);
    return allMembers.filter((m) => {
      const status = m.getMetadata().disabilityStatus;
      return status && status !== 'NONE';
    });
  }

  // ---------------------------------------------------------
  // SEARCH & IDENTIFICATION
  // ---------------------------------------------------------

  async findByNationalId(nationalId: string): Promise<FamilyMember | null> {
    // LIMITATION: No nationalId column.
    // STRATEGY: If nationalId is vital, we assume it might be stored in 'notes' as JSON or text
    // for now, or this method returns null until schema update.
    // Ideally, we would perform a global search.
    // Optimization: Check if we have userId linked (Users usually have National IDs).

    // 1. Try finding by User who has this National ID (Cross-service check? No, stay in boundary)
    // 2. Scan notes (expensive, but necessary if not columnized)
    const records = await this.prisma.familyMember.findMany({
      where: {
        notes: {
          contains: nationalId,
        },
        deletedAt: null,
      },
    });

    // We must verify the hit in Domain to ensure it wasn't just a random number in notes
    for (const record of records) {
      const entity = FamilyMemberMapper.toDomain(record);
      if (entity.getKenyanIdentification().nationalId === nationalId) {
        return entity;
      }
    }

    return null;
  }

  async searchByName(query: string, familyId?: string): Promise<FamilyMember[]> {
    const records = await this.prisma.familyMember.findMany({
      where: {
        familyId: familyId, // Optional filter
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
    const records = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        deletedAt: null,
        dateOfBirth: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return records.map((record) => FamilyMemberMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // BULK OPERATIONS
  // ---------------------------------------------------------

  async updateMany(members: FamilyMember[]): Promise<void> {
    // Reuse saveMany transaction logic
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
}
