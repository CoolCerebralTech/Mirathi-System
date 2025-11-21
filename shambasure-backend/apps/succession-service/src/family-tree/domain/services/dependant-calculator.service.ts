import { Injectable, Inject } from '@nestjs/common';
import type { FamilyMemberRepositoryInterface } from '../interfaces/family-member.repository.interface';
import type { RelationshipRepositoryInterface } from '../interfaces/relationship.repository.interface';
import type { MarriageRepositoryInterface } from '../interfaces/marriage.repository.interface';
import { DependantIdentificationPolicy } from '../policies/dependant-identification.policy';
import { RelationshipType } from '@prisma/client';

export interface IdentifiedDependant {
  id: string;
  fullName: string;
  relationshipToTestator: string; // 'SPOUSE', 'CHILD', 'PARENT'
  isMinor: boolean;
  priority: number; // 1 = High (Section 29 Primary), 2 = Secondary
}

@Injectable()
export class DependantCalculatorService {
  constructor(
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepo: FamilyMemberRepositoryInterface,
    @Inject('RelationshipRepositoryInterface')
    private readonly relationshipRepo: RelationshipRepositoryInterface,
    @Inject('MarriageRepositoryInterface')
    private readonly marriageRepo: MarriageRepositoryInterface,
    private readonly identificationPolicy: DependantIdentificationPolicy,
  ) {}

  /**
   * Identifies all potential legal dependants for a specific user (Testator).
   */
  async identifyLegalDependants(
    familyId: string,
    testatorMemberId: string, // The node representing the user in the tree
  ): Promise<IdentifiedDependant[]> {
    // 1. Fetch Graph Data needed for Policy
    const [members, relationships, marriages] = await Promise.all([
      this.memberRepo.findByFamilyId(familyId),
      this.relationshipRepo.findByFamilyId(familyId),
      this.marriageRepo.findByFamilyId(familyId),
    ]);

    // 2. Transform to Policy-Friendly Structure (Simplified Node Graph)
    const nodesForPolicy = members.map((m) => ({
      id: m.getId(),
      isMinor: m.getIsMinor(),
      relationships: this.buildRelationshipList(m.getId(), relationships, marriages),
    }));

    // 3. Execute Policy Logic (Graph Traversal)
    // This returns IDs of people who qualify under Section 29
    const dependantIds = this.identificationPolicy.identifyDependants(
      testatorMemberId,
      nodesForPolicy,
    );

    // 4. Enrich Results
    const results: IdentifiedDependant[] = [];

    for (const id of dependantIds) {
      const member = members.find((m) => m.getId() === id);
      if (!member) continue;

      // Determine Relationship String for UI
      const relType = this.determineRelationshipType(
        testatorMemberId,
        id,
        relationships,
        marriages,
      );

      results.push({
        id: member.getId(),
        fullName: member.getFullName(),
        isMinor: member.getIsMinor(),
        relationshipToTestator: relType,
        priority: this.getPriority(relType),
      });
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------

  private buildRelationshipList(
    memberId: string,
    allRels: any[],
    allMarriages: any[],
  ): { type: any; targetId: string }[] {
    const list: { type: any; targetId: string }[] = [];

    // Add Blood Rels
    allRels
      .filter((r) => r.getFromMemberId() === memberId)
      .forEach((r) => list.push({ type: r.getType(), targetId: r.getToMemberId() }));

    // Add Marriages
    allMarriages
      .filter(
        (m) => m.getIsActive() && (m.getSpouse1Id() === memberId || m.getSpouse2Id() === memberId),
      )
      .forEach((m) => {
        const target = m.getSpouse1Id() === memberId ? m.getSpouse2Id() : m.getSpouse1Id();
        list.push({ type: 'SPOUSE', targetId: target }); // Injecting 'SPOUSE' as pseudo-type
      });

    return list;
  }

  private determineRelationshipType(
    sourceId: string,
    targetId: string,
    rels: any[],
    marriages: any[],
  ): string {
    // Check Marriage
    const marriage = marriages.find(
      (m) =>
        (m.getSpouse1Id() === sourceId && m.getSpouse2Id() === targetId) ||
        (m.getSpouse2Id() === sourceId && m.getSpouse1Id() === targetId),
    );
    if (marriage) return 'SPOUSE';

    // Check Direct Link
    const link = rels.find(
      (r) => r.getFromMemberId() === sourceId && r.getToMemberId() === targetId,
    );
    if (link) return link.getType();

    const inverseLink = rels.find(
      (r) => r.getToMemberId() === sourceId && r.getFromMemberId() === targetId,
    );
    if (inverseLink) {
      if (inverseLink.getType() === 'PARENT') return 'CHILD';
      if (inverseLink.getType() === 'CHILD') return 'PARENT';
    }

    return 'EXTENDED_FAMILY';
  }

  private getPriority(relType: string): number {
    if (['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(relType)) return 1; // Section 29(1)
    if (['PARENT'].includes(relType)) return 2; // Section 29(2)
    return 3;
  }
}
