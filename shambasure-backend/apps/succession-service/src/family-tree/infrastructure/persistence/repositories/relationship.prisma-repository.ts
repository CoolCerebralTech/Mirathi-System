import { Injectable } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Relationship } from '../../../domain/entities/relationship.entity';
import { RelationshipRepositoryInterface } from '../../../domain/interfaces/relationship.repository.interface';
import { RelationshipMapper } from '../mappers/relationship.mapper';

@Injectable()
export class RelationshipPrismaRepository implements RelationshipRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  async save(relationship: Relationship): Promise<void> {
    await this.prisma.familyRelationship.upsert({
      where: { id: relationship.getId() },
      create: RelationshipMapper.toPrismaCreate(relationship, relationship.getFamilyId()),
      update: RelationshipMapper.toPrismaUpdate(relationship),
    });
  }

  async saveMany(relationships: Relationship[]): Promise<void> {
    const operations = relationships.map((relationship) => {
      return this.prisma.familyRelationship.upsert({
        where: { id: relationship.getId() },
        create: RelationshipMapper.toPrismaCreate(relationship, relationship.getFamilyId()),
        update: RelationshipMapper.toPrismaUpdate(relationship),
      });
    });

    await this.prisma.$transaction(operations);
  }

  async findById(id: string): Promise<Relationship | null> {
    const record = await this.prisma.familyRelationship.findUnique({
      where: { id },
    });
    return record ? RelationshipMapper.toDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.familyRelationship.delete({
      where: { id },
    });
  }

  // ---------------------------------------------------------
  // GRAPH TRAVERSAL
  // ---------------------------------------------------------

  async findByFromMemberId(memberId: string): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: { fromMemberId: memberId },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findByToMemberId(memberId: string): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: { toMemberId: memberId },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findByFamilyId(familyId: string): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: { familyId },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findByType(memberId: string, type: RelationshipType): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
        type: type,
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async exists(fromId: string, toId: string, type: RelationshipType): Promise<boolean> {
    const count = await this.prisma.familyRelationship.count({
      where: {
        fromMemberId: fromId,
        toMemberId: toId,
        type: type,
      },
    });
    return count > 0;
  }

  // ---------------------------------------------------------
  // KENYAN SUCCESSION LAW SPECIFIC QUERIES
  // ---------------------------------------------------------

  async findVerifiedRelationships(familyId: string): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        familyId,
        isVerified: true,
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findAdoptionRelationships(familyId: string): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        familyId,
        OR: [{ isAdopted: true }, { isCustomaryAdoption: true }],
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findUnverifiedRelationships(familyId: string): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        familyId,
        isVerified: false,
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findRelationshipsBornOutOfWedlock(familyId: string): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        familyId,
        bornOutOfWedlock: true,
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // FAMILY TREE ANALYSIS (COMPLEX QUERIES)
  // ---------------------------------------------------------

  async findAncestralLineage(memberId: string, generations: number): Promise<Relationship[]> {
    const lineage: Relationship[] = [];
    let currentGenerationIds = [memberId];
    const visited = new Set<string>();

    for (let i = 0; i < generations; i++) {
      if (currentGenerationIds.length === 0) break;

      const parentEdges = await this.prisma.familyRelationship.findMany({
        where: {
          toMemberId: { in: currentGenerationIds },
          type: RelationshipType.PARENT,
        },
      });

      if (parentEdges.length === 0) break;

      const mappedEdges = parentEdges.map((r) => RelationshipMapper.toDomain(r));
      lineage.push(...mappedEdges);

      const nextGenerationIds: string[] = [];
      for (const edge of mappedEdges) {
        const parentId = edge.getFromMemberId();
        if (!visited.has(parentId)) {
          visited.add(parentId);
          nextGenerationIds.push(parentId);
        }
      }
      currentGenerationIds = nextGenerationIds;
    }

    return lineage;
  }

  async findDescendants(memberId: string): Promise<Relationship[]> {
    const descendants: Relationship[] = [];
    let currentIds = [memberId];
    const visited = new Set<string>();

    while (currentIds.length > 0) {
      const childEdges = await this.prisma.familyRelationship.findMany({
        where: {
          fromMemberId: { in: currentIds },
          type: RelationshipType.PARENT,
        },
      });

      if (childEdges.length === 0) break;

      const mapped = childEdges.map((r) => RelationshipMapper.toDomain(r));
      descendants.push(...mapped);

      const nextIds: string[] = [];
      for (const edge of mapped) {
        const childId = edge.getToMemberId();
        if (!visited.has(childId)) {
          visited.add(childId);
          nextIds.push(childId);
        }
      }
      currentIds = nextIds;
    }

    return descendants;
  }

  async findSiblings(memberId: string): Promise<Relationship[]> {
    const parentEdges = await this.prisma.familyRelationship.findMany({
      where: {
        toMemberId: memberId,
        type: RelationshipType.PARENT,
      },
      select: { fromMemberId: true },
    });

    const parentIds = parentEdges.map((p) => p.fromMemberId);
    if (parentIds.length === 0) return [];

    const siblingEdges = await this.prisma.familyRelationship.findMany({
      where: {
        fromMemberId: { in: parentIds },
        type: RelationshipType.PARENT,
        toMemberId: { not: memberId },
      },
    });

    return siblingEdges.map((r) => RelationshipMapper.toDomain(r));
  }

  async findSpouseRelationships(memberId: string): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
        type: RelationshipType.SPOUSE,
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // BULK OPERATIONS
  // ---------------------------------------------------------

  async deleteByMember(memberId: string): Promise<void> {
    await this.prisma.familyRelationship.deleteMany({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
      },
    });
  }

  async bulkVerify(relationshipIds: string[], method: string, verifiedBy: string): Promise<void> {
    await this.prisma.familyRelationship.updateMany({
      where: { id: { in: relationshipIds } },
      data: {
        isVerified: true,
        verificationMethod: method,
        verifiedAt: new Date(),
        verifiedBy: verifiedBy,
        updatedAt: new Date(),
      },
    });
  }

  // ---------------------------------------------------------
  // ADDITIONAL UTILITY METHODS
  // ---------------------------------------------------------

  async findRelationshipsByInheritanceRights(inheritanceRights: string): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        inheritanceRights: inheritanceRights as any,
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findRelationshipsWithCourtOrders(): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        courtOrderNumber: {
          not: null,
        },
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findCustomaryAdoptions(familyId: string): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        familyId,
        isCustomaryAdoption: true,
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findRelationshipsByDependencyLevel(dependencyLevel: string): Promise<Relationship[]> {
    const records = await this.prisma.familyRelationship.findMany({
      where: {
        dependencyLevel: dependencyLevel as any,
      },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }

  async findRecentRelationships(days: number = 30): Promise<Relationship[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const records = await this.prisma.familyRelationship.findMany({
      where: {
        createdAt: {
          gte: cutoffDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => RelationshipMapper.toDomain(record));
  }
}
