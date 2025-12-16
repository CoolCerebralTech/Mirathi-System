import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, RelationshipType } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { FamilyRelationship } from '../../../domain/entities/family-relationship.entity';
import { IFamilyRelationshipRepository } from '../../../domain/interfaces/repositories/ifamily-relationship.repository';
import { InheritanceRights } from '../../../domain/value-objects/legal/inheritance-rights.vo';
import { FamilyRelationshipMapper } from '../mappers/family-relationship.mapper';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class FamilyRelationshipRepository implements IFamilyRelationshipRepository {
  private readonly logger = new Logger(FamilyRelationshipRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly relationshipMapper: FamilyRelationshipMapper,
  ) {}

  // ============ CORE CRUD OPERATIONS ============
  async create(relationship: FamilyRelationship): Promise<FamilyRelationship> {
    try {
      const persistenceData = this.relationshipMapper.toPersistence(relationship);
      const savedRelationship = await this.prisma.familyRelationship.create({
        data: persistenceData,
      });
      return this.relationshipMapper.toDomain(savedRelationship)!;
    } catch (error) {
      this.logger.error(`Failed to create family relationship ${relationship.id}:`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<FamilyRelationship | null> {
    const relationship = await this.prisma.familyRelationship.findUnique({
      where: { id },
    });
    return this.relationshipMapper.toDomain(relationship);
  }

  async update(relationship: FamilyRelationship): Promise<FamilyRelationship> {
    try {
      const persistenceData = this.relationshipMapper.toPersistence(relationship);
      const { id, ...updateData } = persistenceData;

      const savedRelationship = await this.prisma.familyRelationship.update({
        where: { id },
        data: updateData,
      });
      return this.relationshipMapper.toDomain(savedRelationship)!;
    } catch (error) {
      this.logger.error(`Failed to update family relationship ${relationship.id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.familyRelationship.delete({
        where: { id },
      });
      this.logger.log(`Family relationship ${id} deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete family relationship ${id}:`, error);
      throw error;
    }
  }

  // ============ RELATIONSHIP EXISTENCE & VALIDATION ============
  async findByMembersAndType(
    fromMemberId: string,
    toMemberId: string,
    type: RelationshipType,
  ): Promise<FamilyRelationship | null> {
    const relationship = await this.prisma.familyRelationship.findUnique({
      where: {
        fromMemberId_toMemberId_type: { fromMemberId, toMemberId, type },
      },
    });
    return this.relationshipMapper.toDomain(relationship);
  }

  async existsBetweenMembers(memberId1: string, memberId2: string): Promise<boolean> {
    const count = await this.prisma.familyRelationship.count({
      where: {
        OR: [
          { fromMemberId: memberId1, toMemberId: memberId2 },
          { fromMemberId: memberId2, toMemberId: memberId1 },
        ],
      },
    });
    return count > 0;
  }

  async validateRelationshipUniqueness(
    familyId: string,
    fromMemberId: string,
    toMemberId: string,
    type: RelationshipType,
  ): Promise<boolean> {
    const existing = await this.prisma.familyRelationship.findUnique({
      where: {
        fromMemberId_toMemberId_type: { fromMemberId, toMemberId, type },
        familyId,
      },
    });
    return existing === null;
  }

  // ============ FAMILY GRAPH QUERIES ============
  async findAllByFromMemberId(fromMemberId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: { fromMemberId },
      orderBy: { type: 'asc' },
    });
    return this.toDomainBatch(relationships);
  }

  async findAllByToMemberId(toMemberId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: { toMemberId },
      orderBy: { type: 'asc' },
    });
    return this.toDomainBatch(relationships);
  }

  async findAllByFamilyId(familyId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
    });
    return this.toDomainBatch(relationships);
  }

  async findAllByFamilyMemberId(memberId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
      },
      orderBy: { type: 'asc' },
    });
    return this.toDomainBatch(relationships);
  }

  // ============ RELATIONSHIP TYPE QUERIES ============
  async findAllByType(familyId: string, type: RelationshipType): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: { familyId, type },
      orderBy: { createdAt: 'desc' },
    });
    return this.toDomainBatch(relationships);
  }

  async findParentsOfMember(memberId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        toMemberId: memberId,
        OR: [
          { type: 'PARENT' },
          { type: 'ADOPTED_CHILD', isAdopted: true, fromMemberId: memberId },
        ],
      },
    });
    return this.toDomainBatch(relationships);
  }

  async findChildrenOfMember(memberId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        fromMemberId: memberId,
        OR: [{ type: 'CHILD' }, { type: 'ADOPTED_CHILD' }, { type: 'STEPCHILD' }],
      },
      orderBy: { type: 'asc' },
    });
    return this.toDomainBatch(relationships);
  }

  async findSpousesOfMember(memberId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [
          { fromMemberId: memberId, type: 'SPOUSE' },
          { toMemberId: memberId, type: 'SPOUSE' },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.toDomainBatch(relationships);
  }

  async findSiblingsOfMember(memberId: string): Promise<FamilyRelationship[]> {
    // First find parents of the member
    const parentRelationships = await this.findParentsOfMember(memberId);
    const parentIds = parentRelationships.map((rel) => rel.fromMemberId);

    if (parentIds.length === 0) {
      return [];
    }

    // Find all children of the parents (excluding the member themselves)
    const siblingRelationships = await this.prisma.familyRelationship.findMany({
      where: {
        fromMemberId: { in: parentIds },
        type: 'CHILD',
        toMemberId: { not: memberId },
      },
    });
    return this.toDomainBatch(siblingRelationships);
  }

  // ============ INHERITANCE RIGHTS QUERIES ============
  async findWithInheritanceRights(memberId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
        inheritanceRights: { not: 'NONE' },
      },
      orderBy: { inheritanceRights: 'desc' },
    });
    return this.toDomainBatch(relationships);
  }

  async findWithFullInheritanceRights(memberId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
        inheritanceRights: 'FULL',
      },
    });
    return this.toDomainBatch(relationships);
  }

  async findWithPartialInheritanceRights(memberId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
        inheritanceRights: 'PARTIAL',
      },
    });
    return this.toDomainBatch(relationships);
  }

  async findExcludedFromInheritance(memberId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
        inheritanceRights: 'NONE',
      },
    });
    return this.toDomainBatch(relationships);
  }

  // ============ NEXT OF KIN QUERIES ============
  async findNextOfKinForMember(memberId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
        isNextOfKin: true,
      },
      orderBy: { nextOfKinPriority: 'asc' },
    });
    return this.toDomainBatch(relationships);
  }

  async findPrimaryNextOfKin(memberId: string): Promise<FamilyRelationship | null> {
    const relationship = await this.prisma.familyRelationship.findFirst({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
        isNextOfKin: true,
      },
      orderBy: { nextOfKinPriority: 'asc' },
    });
    return this.relationshipMapper.toDomain(relationship);
  }

  async updateNextOfKinPriorities(
    memberId: string,
    priorities: Map<string, number>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const [relationshipId, priority] of priorities.entries()) {
        await tx.familyRelationship.update({
          where: {
            id: relationshipId,
            OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
          },
          data: { nextOfKinPriority: priority },
        });
      }
    });
    this.logger.log(`Updated NOK priorities for member ${memberId}`);
  }

  // ============ LEGAL STATUS QUERIES ============
  async findVerifiedRelationships(familyId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: { familyId, isVerified: true },
    });
    return this.toDomainBatch(relationships);
  }

  async findUnverifiedRelationships(familyId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: { familyId, isVerified: false },
    });
    return this.toDomainBatch(relationships);
  }

  async findContestedRelationships(familyId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: { familyId, isContested: true },
    });
    return this.toDomainBatch(relationships);
  }

  async findCourtValidatedRelationships(familyId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: { familyId, courtValidated: true },
    });
    return this.toDomainBatch(relationships);
  }

  // ============ BIOLOGICAL VS LEGAL QUERIES ============
  async findBiologicalRelationships(memberId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
        isBiological: true,
      },
    });
    return this.toDomainBatch(relationships);
  }

  async findAdoptedRelationships(memberId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
        isAdopted: true,
      },
    });
    return this.toDomainBatch(relationships);
  }

  async findStepRelationships(memberId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
        strength: 'STEP',
      },
    });
    return this.toDomainBatch(relationships);
  }

  async findCustomaryAdoptionRelationships(familyId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: { familyId, isCustomaryAdoption: true },
    });
    return this.toDomainBatch(relationships);
  }

  // ============ S.29 DEPENDANT IDENTIFICATION QUERIES ============
  async findPotentialDependants(deceasedId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: deceasedId }, { toMemberId: deceasedId }],
        type: {
          in: ['CHILD', 'ADOPTED_CHILD', 'STEPCHILD', 'SPOUSE', 'PARENT'],
        },
        inheritanceRights: { not: 'NONE' },
      },
    });
    return this.toDomainBatch(relationships);
  }

  async findS29QualifyingRelationships(deceasedId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: deceasedId }, { toMemberId: deceasedId }],
        type: {
          in: ['CHILD', 'ADOPTED_CHILD', 'STEPCHILD', 'SPOUSE', 'PARENT'],
        },
        inheritanceRights: { not: 'NONE' },
        isVerified: true,
      },
    });
    return this.toDomainBatch(relationships);
  }

  async findDependantChildren(deceasedId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        fromMemberId: deceasedId,
        type: {
          in: ['CHILD', 'ADOPTED_CHILD', 'STEPCHILD'],
        },
        inheritanceRights: { not: 'NONE' },
      },
    });
    return this.toDomainBatch(relationships);
  }

  async findDependantSpouses(deceasedId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [
          { fromMemberId: deceasedId, type: 'SPOUSE' },
          { toMemberId: deceasedId, type: 'SPOUSE' },
        ],
        inheritanceRights: { not: 'NONE' },
      },
    });
    return this.toDomainBatch(relationships);
  }

  async findDependantParents(deceasedId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        toMemberId: deceasedId,
        type: 'PARENT',
        inheritanceRights: { not: 'NONE' },
      },
    });
    return this.toDomainBatch(relationships);
  }

  // ============ BULK OPERATIONS ============
  async batchCreate(relationships: FamilyRelationship[]): Promise<FamilyRelationship[]> {
    if (relationships.length === 0) {
      return [];
    }

    const savedRelationships: FamilyRelationship[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const relationship of relationships) {
        const persistenceData = this.relationshipMapper.toPersistence(relationship);
        const saved = await tx.familyRelationship.create({
          data: persistenceData,
        });
        savedRelationships.push(this.relationshipMapper.toDomain(saved)!);
      }
    });

    return savedRelationships;
  }

  async batchDeleteByFamilyId(familyId: string): Promise<void> {
    await this.prisma.familyRelationship.deleteMany({
      where: { familyId },
    });
    this.logger.log(`All family relationships for family ${familyId} deleted`);
  }

  async batchUpdateInheritanceRights(
    familyId: string,
    updates: Array<{ relationshipId: string; rights: InheritanceRights }>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const update of updates) {
        await tx.familyRelationship.update({
          where: {
            id: update.relationshipId,
            familyId,
          },
          data: {
            inheritanceRights: update.rights.rightsType,
          },
        });
      }
    });
    this.logger.log(
      `Updated inheritance rights for ${updates.length} relationships in family ${familyId}`,
    );
  }

  // ============ VERIFICATION & VALIDATION ============
  async verifyRelationship(id: string, verifierId: string, method: string): Promise<void> {
    await this.prisma.familyRelationship.update({
      where: { id },
      data: {
        isVerified: true,
        verifiedBy: verifierId,
        verificationMethod: method,
        verifiedAt: new Date(),
      },
    });
  }

  async contestRelationship(id: string, caseNumber: string): Promise<void> {
    await this.prisma.familyRelationship.update({
      where: { id },
      data: {
        isContested: true,
        contestationCaseNumber: caseNumber,
        inheritanceRights: 'PENDING', // Note: Ensure this matches your enum
      },
    });
  }

  async resolveContest(id: string, isValid: boolean): Promise<void> {
    await this.prisma.familyRelationship.update({
      where: { id },
      data: {
        isContested: false,
        courtValidated: isValid,
        contestationCaseNumber: null,
        inheritanceRights: isValid ? 'FULL' : 'NONE',
      },
    });
  }

  // ============ STATISTICS & REPORTING ============
  async getFamilyGraphStatistics(familyId: string) {
    const [
      totalRelationships,
      verifiedCount,
      contestedCount,
      nextOfKinCount,
      biologicalCount,
      adoptedCount,
      stepCount,
      inheritanceEligibleCount,
    ] = await Promise.all([
      this.prisma.familyRelationship.count({ where: { familyId } }),
      this.prisma.familyRelationship.count({ where: { familyId, isVerified: true } }),
      this.prisma.familyRelationship.count({ where: { familyId, isContested: true } }),
      this.prisma.familyRelationship.count({ where: { familyId, isNextOfKin: true } }),
      this.prisma.familyRelationship.count({ where: { familyId, isBiological: true } }),
      this.prisma.familyRelationship.count({ where: { familyId, isAdopted: true } }),
      this.prisma.familyRelationship.count({ where: { familyId, strength: 'STEP' } }),
      this.prisma.familyRelationship.count({
        where: {
          familyId,
          inheritanceRights: { in: ['FULL', 'PARTIAL'] },
        },
      }),
    ]);

    return {
      totalRelationships,
      verifiedCount,
      contestedCount,
      nextOfKinCount,
      biologicalCount,
      adoptedCount,
      stepCount,
      inheritanceEligibleCount,
      verificationRate: totalRelationships > 0 ? (verifiedCount / totalRelationships) * 100 : 0,
    };
  }

  // ============ COMPLEX RELATIONSHIP ANALYSIS ============
  async findRelationshipPath(member1Id: string, member2Id: string): Promise<FamilyRelationship[]> {
    // This is a simplified BFS implementation for relationship paths
    // In production, you might want to use a graph database or more sophisticated algorithm
    console.warn(
      'findRelationshipPath: Simplified BFS implementation. Consider optimization for large families.',
    );

    const visited = new Set<string>();
    const queue: Array<{ memberId: string; path: FamilyRelationship[] }> = [];

    queue.push({ memberId: member1Id, path: [] });

    while (queue.length > 0) {
      const { memberId, path } = queue.shift()!;

      if (visited.has(memberId)) continue;
      visited.add(memberId);

      if (memberId === member2Id) {
        return path;
      }

      // Get all relationships for this member
      const relationships = await this.prisma.familyRelationship.findMany({
        where: {
          OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
        },
      });

      for (const rel of relationships) {
        const otherMemberId = rel.fromMemberId === memberId ? rel.toMemberId : rel.fromMemberId;

        if (!visited.has(otherMemberId)) {
          const domainRel = this.relationshipMapper.toDomain(rel);
          if (domainRel) {
            queue.push({
              memberId: otherMemberId,
              path: [...path, domainRel],
            });
          }
        }
      }
    }

    return []; // No path found
  }

  async findCommonAncestors(member1Id: string, member2Id: string): Promise<string[]> {
    const ancestors1 = await this.getAncestors(member1Id);
    const ancestors2 = await this.getAncestors(member2Id);

    const common = ancestors1.filter((ancestor) => ancestors2.includes(ancestor));
    return Array.from(new Set(common)); // Remove duplicates
  }

  async calculateDegreesOfSeparation(member1Id: string, member2Id: string): Promise<number | null> {
    const path = await this.findRelationshipPath(member1Id, member2Id);
    return path.length > 0 ? path.length : null;
  }

  private async getAncestors(memberId: string): Promise<string[]> {
    const ancestors = new Set<string>();
    const queue = [memberId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      const parentRelations = await this.prisma.familyRelationship.findMany({
        where: {
          toMemberId: currentId,
          type: 'PARENT',
        },
      });

      for (const rel of parentRelations) {
        ancestors.add(rel.fromMemberId);
        queue.push(rel.fromMemberId);
      }
    }

    return Array.from(ancestors);
  }

  // ============ S.40 POLYGAMY SUPPORT QUERIES ============
  async findPolygamousRelationships(familyId: string): Promise<FamilyRelationship[]> {
    // Count spouses for each member
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        familyId,
        type: 'SPOUSE',
      },
    });

    // Group by member
    const spouseCount = new Map<string, number>();
    for (const rel of relationships) {
      [rel.fromMemberId, rel.toMemberId].forEach((memberId) => {
        if (memberId !== 'SPOUSE') {
          spouseCount.set(memberId, (spouseCount.get(memberId) || 0) + 1);
        }
      });
    }

    // Return relationships for members with multiple spouses
    const polygamousMembers = Array.from(spouseCount.entries())
      .filter(([_, count]) => count > 1)
      .map(([memberId, _]) => memberId);

    const polygamousRels = relationships.filter(
      (rel) =>
        polygamousMembers.includes(rel.fromMemberId) || polygamousMembers.includes(rel.toMemberId),
    );

    return this.toDomainBatch(polygamousRels);
  }

  async findPolygamousSpouses(memberId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [
          { fromMemberId: memberId, type: 'SPOUSE' },
          { toMemberId: memberId, type: 'SPOUSE' },
        ],
      },
    });

    // Return if member has more than one spouse
    return relationships.length > 1 ? this.toDomainBatch(relationships) : [];
  }

  // ============ S.35 LSA INTESTATE SUCCESSION QUERIES ============
  async findSurvivingSpouseAndChildren(deceasedId: string): Promise<{
    spouse?: FamilyRelationship;
    children: FamilyRelationship[];
  }> {
    const [spouseRel, childrenRels] = await Promise.all([
      this.prisma.familyRelationship.findFirst({
        where: {
          OR: [
            { fromMemberId: deceasedId, type: 'SPOUSE' },
            { toMemberId: deceasedId, type: 'SPOUSE' },
          ],
        },
      }),
      this.prisma.familyRelationship.findMany({
        where: {
          fromMemberId: deceasedId,
          type: {
            in: ['CHILD', 'ADOPTED_CHILD', 'STEPCHILD'],
          },
        },
      }),
    ]);

    const mappedSpouse = spouseRel ? this.relationshipMapper.toDomain(spouseRel) : undefined;
    return {
      spouse: mappedSpouse ?? undefined,
      children: this.toDomainBatch(childrenRels),
    };
  }

  async findSurvivingParents(deceasedId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        toMemberId: deceasedId,
        type: 'PARENT',
      },
    });
    return this.toDomainBatch(relationships);
  }

  async findSurvivingSiblings(deceasedId: string): Promise<FamilyRelationship[]> {
    return await this.findSiblingsOfMember(deceasedId);
  }

  async findOtherRelatives(deceasedId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: deceasedId }, { toMemberId: deceasedId }],
        type: {
          in: ['GRANDCHILD', 'GRANDPARENT', 'AUNT_UNCLE', 'NIECE_NEPHEW', 'COUSIN', 'OTHER'],
        },
      },
    });
    return this.toDomainBatch(relationships);
  }

  // ============ CUSTOMARY LAW QUERIES ============
  async findCustomaryLawRecognized(familyId: string): Promise<FamilyRelationship[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        familyId,
        recognizedUnderCustomaryLaw: true,
      },
    });
    return this.toDomainBatch(relationships);
  }

  async updateCustomaryCeremonyDetails(id: string, details: any): Promise<void> {
    await this.prisma.familyRelationship.update({
      where: { id },
      data: {
        customaryCeremonyDetails: details,
        recognizedUnderCustomaryLaw: true,
      },
    });
  }

  // ============ HELPER METHODS ============
  private toDomainBatch(relationships: any[]): FamilyRelationship[] {
    return relationships
      .map((rel) => this.relationshipMapper.toDomain(rel))
      .filter((rel): rel is FamilyRelationship => rel !== null);
  }

  async withTransaction<T>(transactionFn: (client: TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return transactionFn(tx as TransactionClient);
    });
  }

  // ============ ADDITIONAL UTILITY METHODS ============
  async findInheritanceEligibleMembers(familyId: string): Promise<string[]> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        familyId,
        inheritanceRights: { in: ['FULL', 'PARTIAL'] },
      },
      select: { fromMemberId: true, toMemberId: true },
    });

    const memberIds = new Set<string>();
    relationships.forEach((rel) => {
      memberIds.add(rel.fromMemberId);
      memberIds.add(rel.toMemberId);
    });

    return Array.from(memberIds);
  }

  async calculateInheritanceShare(memberId: string): Promise<number> {
    const relationships = await this.prisma.familyRelationship.findMany({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
      },
    });

    let totalShare = 0;
    relationships.forEach((rel) => {
      if (rel.inheritanceRights === 'FULL') {
        totalShare += 100;
      } else if (rel.inheritanceRights === 'PARTIAL') {
        totalShare += 50; // Default partial share
      }
    });

    return totalShare;
  }
}
