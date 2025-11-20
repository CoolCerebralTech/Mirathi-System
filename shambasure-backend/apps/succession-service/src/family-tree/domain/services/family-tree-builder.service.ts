import { Injectable, Inject } from '@nestjs/common';
import type { FamilyMemberRepositoryInterface } from '../repositories/family-member.repository.interface';
import type { RelationshipRepositoryInterface } from '../repositories/relationship.repository.interface';
import type { MarriageRepositoryInterface } from '../repositories/marriage.repository.interface';

export interface TreeGraph {
  nodes: {
    id: string;
    data: {
      label: string;
      role: string; // e.g., 'FATHER'
      isDeceased: boolean;
      image?: string;
    };
    position?: { x: number; y: number }; // Optional, frontend often calculates
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    label: string; // e.g., 'married', 'child_of'
    type: 'solid' | 'dashed'; // solid = blood, dashed = marriage
  }[];
}

@Injectable()
export class FamilyTreeBuilderService {
  constructor(
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepo: FamilyMemberRepositoryInterface,
    @Inject('RelationshipRepositoryInterface')
    private readonly relationshipRepo: RelationshipRepositoryInterface,
    @Inject('MarriageRepositoryInterface')
    private readonly marriageRepo: MarriageRepositoryInterface,
  ) {}

  /**
   * Builds the complete JSON graph for the UI.
   */
  async buildFullTree(familyId: string): Promise<TreeGraph> {
    // 1. Parallel Fetch
    const [members, relationships, marriages] = await Promise.all([
      this.memberRepo.findByFamilyId(familyId),
      this.relationshipRepo.findByFamilyId(familyId),
      this.marriageRepo.findByFamilyId(familyId),
    ]);

    const graph: TreeGraph = { nodes: [], edges: [] };

    // 2. Map Nodes (Members)
    graph.nodes = members.map((m) => ({
      id: m.getId(),
      data: {
        label: m.getFullName(),
        role: m.getRole(), // 'ROOT', 'SPOUSE', etc relative to creator
        isDeceased: m.getIsDeceased(),
        // image: m.getProfileUrl(),
      },
    }));

    // 3. Map Edges (Relationships - Blood)
    relationships.forEach((r) => {
      graph.edges.push({
        id: r.getId(),
        source: r.getFromMemberId(),
        target: r.getToMemberId(),
        label: r.getType().toLowerCase(),
        type: 'solid',
      });
    });

    // 4. Map Edges (Marriages)
    marriages
      .filter((m) => m.getIsActive())
      .forEach((m) => {
        graph.edges.push({
          id: m.getId(),
          source: m.getSpouse1Id(),
          target: m.getSpouse2Id(),
          label: 'married',
          type: 'dashed', // Visually distinct
        });
      });

    return graph;
  }

  /**
   * Builds a simplified tree (Spouse + Children + Parents only).
   * Used for the "Mobile View" or "Quick Add" context.
   */
  async buildImmediateFamily(memberId: string): Promise<TreeGraph> {
    // Logic involves fetching only direct connections
    // Implementation omitted for brevity, follows similar pattern but with filtered queries
    return { nodes: [], edges: [] };
  }
}
