// domain/utils/family-tree-builder.ts
import {
  FamilyMember,
  FamilyRelationship,
  PolygamousHouse,
  RelationshipType,
} from '@prisma/client';

// =============================================================================
// INTERFACES
// =============================================================================

export interface FamilyTreeNode {
  memberId: string;
  member?: FamilyMember;

  // Graph Edges
  parents: FamilyTreeNode[];
  children: FamilyTreeNode[];
  spouses: FamilyTreeNode[];
  siblings: FamilyTreeNode[];

  // Legal Context
  houseId: string | null; // S.40 House Membership
  isHouseHead: boolean; // Is this member a head of a polygamous house?

  // Visualization / Tree Structure
  depth: number;
}

export interface HouseStructure {
  houseId: string;
  houseHeadId: string | null;
  houseName: string;
  livingChildrenIds: string[];
  // Per Stirpes: Dead child -> Living Grandkids
  deceasedChildrenWithIssue: Map<string, string[]>;
}

export interface SuccessionStructure {
  deceasedId: string;
  survivingSpouses: string[];

  // Monogamous / General Context (S.35/38)
  livingChildren: string[];
  deceasedChildrenWithIssue: Map<string, string[]>; // Dead Child ID -> [Living Grandchild IDs]
  livingParents: string[];

  // Polygamous Context (S.40)
  polygamousHouses: HouseStructure[];
}

// =============================================================================
// TREE BUILDER CLASS
// =============================================================================

export class FamilyTreeBuilder {
  /**
   * 1. BUILD GRAPH
   * Converts flat lists of members/relationships into a traversable graph.
   */
  static buildTree(
    members: FamilyMember[],
    relationships: FamilyRelationship[],
    houses: PolygamousHouse[] = [],
  ): Map<string, FamilyTreeNode> {
    const nodes = new Map<string, FamilyTreeNode>();

    // A. Initialize Nodes
    for (const member of members) {
      nodes.set(member.id, {
        memberId: member.id,
        member,
        parents: [],
        children: [],
        spouses: [],
        siblings: [],
        isHouseHead: houses.some((h) => h.houseHeadId === member.id),
        houseId: member.polygamousHouseId,
        depth: 0,
      });
    }

    // B. Build Edges (Strictly typed)
    for (const rel of relationships) {
      const fromNode = nodes.get(rel.fromMemberId);
      const toNode = nodes.get(rel.toMemberId);

      if (!fromNode || !toNode) continue;

      switch (rel.type) {
        case RelationshipType.PARENT:
          // FROM Parent TO Child
          toNode.parents.push(fromNode);
          fromNode.children.push(toNode);
          break;

        case RelationshipType.CHILD:
        case RelationshipType.ADOPTED_CHILD:
          // FROM Child TO Parent
          fromNode.parents.push(toNode);
          toNode.children.push(fromNode);
          break;

        case RelationshipType.SPOUSE:
          fromNode.spouses.push(toNode);
          toNode.spouses.push(fromNode);
          break;

        case RelationshipType.SIBLING:
        case RelationshipType.HALF_SIBLING:
          fromNode.siblings.push(toNode);
          toNode.siblings.push(fromNode);
          break;
      }
    }

    // C. Calculate Layout (Depth) for visualization/ordering
    this.calculateTreeDepth(nodes);

    return nodes;
  }

  /**
   * 2. ANALYZE SUCCESSION STRUCTURE
   * Extracts the legal hierarchy for S.35 (Intestacy) and S.40 (Polygamy).
   * Handles "Per Stirpes" (S.41) automatically.
   */
  static analyzeSuccessionStructure(
    deceasedId: string,
    nodes: Map<string, FamilyTreeNode>,
    houses: PolygamousHouse[],
  ): SuccessionStructure {
    const deceasedNode = nodes.get(deceasedId);
    if (!deceasedNode) {
      throw new Error(`Deceased member (ID: ${deceasedId}) not found in the provided family tree.`);
    }

    const structure: SuccessionStructure = {
      deceasedId,
      survivingSpouses: [],
      livingChildren: [],
      deceasedChildrenWithIssue: new Map(),
      livingParents: [],
      polygamousHouses: [],
    };

    // A. Find Surviving Spouses
    structure.survivingSpouses = deceasedNode.spouses
      .filter((s) => s.member && !s.member.isDeceased)
      .map((s) => s.memberId);

    // B. Find Direct Descendants (General/Monogamous Context)
    // 1. Living Children
    structure.livingChildren = deceasedNode.children
      .filter((c) => c.member && !c.member.isDeceased)
      .map((c) => c.memberId);

    // 2. Dead Children with Issue (S.41 Per Stirpes)
    const deadChildren = deceasedNode.children.filter((c) => c.member && c.member.isDeceased);

    for (const deadChild of deadChildren) {
      const livingGrandkids = deadChild.children
        .filter((gc) => gc.member && !gc.member.isDeceased)
        .map((gc) => gc.memberId);

      if (livingGrandkids.length > 0) {
        structure.deceasedChildrenWithIssue.set(deadChild.memberId, livingGrandkids);
      }
    }

    // C. Find Parents (S.39 Fallback)
    structure.livingParents = deceasedNode.parents
      .filter((p) => p.member && !p.member.isDeceased)
      .map((p) => p.memberId);

    // D. Structure S.40 Polygamous Houses
    if (houses.length > 0) {
      for (const house of houses) {
        // Filter direct children belonging to this house
        const houseLivingChildren = deceasedNode.children
          .filter((c) => c.houseId === house.id && c.member && !c.member.isDeceased)
          .map((c) => c.memberId);

        // Filter dead children of this house with issue
        const houseIssueMap = new Map<string, string[]>();

        const houseDeadChildren = deceasedNode.children.filter(
          (c) => c.houseId === house.id && c.member && c.member.isDeceased,
        );

        for (const dc of houseDeadChildren) {
          const gcIds = dc.children
            .filter((gc) => gc.member && !gc.member.isDeceased)
            .map((gc) => gc.memberId);

          if (gcIds.length > 0) {
            houseIssueMap.set(dc.memberId, gcIds);
          }
        }

        // Only add house if it has surviving beneficiaries (Head, Child, or Grandchild)
        const houseHeadAlive = structure.survivingSpouses.includes(house.houseHeadId || '');
        const hasBeneficiaries =
          houseHeadAlive || houseLivingChildren.length > 0 || houseIssueMap.size > 0;

        if (hasBeneficiaries) {
          structure.polygamousHouses.push({
            houseId: house.id,
            houseHeadId: house.houseHeadId,
            houseName: house.houseName,
            livingChildrenIds: houseLivingChildren,
            deceasedChildrenWithIssue: houseIssueMap,
          });
        }
      }
    }

    return structure;
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Helper to calculate generations relative to roots.
   * Useful for UI visualization (e.g. Generation 1, 2, 3).
   */
  private static calculateTreeDepth(nodes: Map<string, FamilyTreeNode>): void {
    const visited = new Set<string>();
    const queue: { node: FamilyTreeNode; depth: number }[] = [];

    // 1. Identify "Roots" (Oldest generation or those without parents in tree)
    for (const node of nodes.values()) {
      const hasParentsInTree = node.parents.some((p) => nodes.has(p.memberId));
      if (!hasParentsInTree) {
        queue.push({ node, depth: 0 });
        visited.add(node.memberId);
      }
    }

    // 2. BFS Traverse
    while (queue.length > 0) {
      const { node, depth } = queue.shift()!;
      node.depth = depth;

      // Spouses stay on same level
      for (const spouse of node.spouses) {
        if (!visited.has(spouse.memberId)) {
          visited.add(spouse.memberId);
          queue.push({ node: spouse, depth: depth });
        }
      }

      // Children go down a level
      for (const child of node.children) {
        if (!visited.has(child.memberId)) {
          visited.add(child.memberId);
          queue.push({ node: child, depth: depth + 1 });
        }
      }
    }
  }
}
