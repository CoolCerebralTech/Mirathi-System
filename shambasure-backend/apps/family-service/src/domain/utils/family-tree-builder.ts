// domain/utils/family-tree-builder.ts
import { FamilyMember } from '../entities/family-member.entity';
import { FamilyRelationship } from '../entities/family-relationship.entity';
import { PolygamousHouse } from '../entities/polygamous-house.entity';

// --- Legal Interfaces ---

export interface FamilyTreeNode {
  memberId: string;
  member?: FamilyMember;

  // Graph Edges
  parents: FamilyTreeNode[];
  children: FamilyTreeNode[];
  spouses: FamilyTreeNode[];
  siblings: FamilyTreeNode[]; // Full or Half (tracked in relationship obj)

  // Legal Context
  houseId?: string; // S.40 House Membership
  isHouseHead: boolean; // Is this a wife heading a house?

  // Visualization / Tree Structure
  depth: number;
  position: number;
}

export interface HouseStructure {
  houseId: string;
  houseHeadId: string;
  houseName: string;
  children: string[]; // IDs of children in this house
  grandChildrenPerChild: Map<string, string[]>; // Map<ChildId, GrandChildId[]> (Per Stirpes)
}

export interface LsaSuccessionStructure {
  survivingSpouses: string[];
  children: string[]; // Direct living children
  deceasedChildrenWithIssue: string[]; // Dead children who left grandkids (Per Stirpes)
  parents: string[]; // Dependent parents (S.39)
  polygamousHouses: HouseStructure[]; // S.40 Structure
}

export class FamilyTreeBuilder {
  /**
   * Builds the core graph map from flat lists.
   */
  static buildTree(
    members: FamilyMember[],
    relationships: FamilyRelationship[],
    houses: PolygamousHouse[] = [],
  ): Map<string, FamilyTreeNode> {
    const nodes = new Map<string, FamilyTreeNode>();

    // 1. Initialize Nodes
    for (const member of members) {
      nodes.set(member.id, {
        memberId: member.id,
        member,
        parents: [],
        children: [],
        spouses: [],
        siblings: [],
        // Check if member is a house head (Wife)
        isHouseHead: houses.some((h) => h.houseHeadId === member.id),
        // Check if member belongs to a house (Child)
        houseId: member.polygamousHouseId,
        depth: 0,
        position: 0,
      });
    }

    // 2. Build Edges
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

    // 3. Calculate Layout (Depth)
    this.calculateTreeLayout(nodes);

    return nodes;
  }

  /**
   * Analyzes the family tree to determine the LSA Succession Structure.
   * This is the "Engine" for Section 35, 38, 40 logic.
   */
  static analyzeSuccessionStructure(
    deceasedId: string,
    nodes: Map<string, FamilyTreeNode>,
    houses: PolygamousHouse[],
  ): LsaSuccessionStructure {
    const deceasedNode = nodes.get(deceasedId);
    if (!deceasedNode) {
      throw new Error('Deceased member not found in tree.');
    }

    const structure: LsaSuccessionStructure = {
      survivingSpouses: [],
      children: [],
      deceasedChildrenWithIssue: [],
      parents: [],
      polygamousHouses: [],
    };

    // 1. Find Surviving Spouses
    structure.survivingSpouses = deceasedNode.spouses
      .filter((s) => s.member && !s.member.isDeceased)
      .map((s) => s.memberId);

    // 2. Find Children (Living)
    structure.children = deceasedNode.children
      .filter((c) => c.member && !c.member.isDeceased)
      .map((c) => c.memberId);

    // 3. Find Deceased Children with Issue (Per Stirpes - Section 41 LSA)
    const deadChildren = deceasedNode.children.filter((c) => c.member && c.member.isDeceased);

    for (const deadChild of deadChildren) {
      // Check if they have living children (Grandkids of deceased)
      const grandkids = deadChild.children.filter((gc) => gc.member && !gc.member.isDeceased);

      if (grandkids.length > 0) {
        structure.deceasedChildrenWithIssue.push(deadChild.memberId);
      }
    }

    // 4. Find Parents (Living) - Relevant for S.39 if no wife/kids
    structure.parents = deceasedNode.parents
      .filter((p) => p.member && !p.member.isDeceased)
      .map((p) => p.memberId);

    // 5. Structure S.40 Polygamous Houses
    if (houses.length > 0) {
      for (const house of houses) {
        const houseHeadNode = nodes.get(house.houseHeadId);

        // Filter children belonging to this house
        const houseChildren = deceasedNode.children
          .filter((child) => child.houseId === house.id)
          .map((c) => c.memberId);

        // Map grandkids for Per Stirpes within the house
        const grandKidsMap = new Map<string, string[]>();

        const deadHouseChildren = deceasedNode.children.filter(
          (c) => c.houseId === house.id && c.member?.isDeceased,
        );

        for (const dc of deadHouseChildren) {
          const gcIds = dc.children
            .filter((gc) => gc.member && !gc.member.isDeceased)
            .map((gc) => gc.memberId);

          if (gcIds.length > 0) {
            grandKidsMap.set(dc.memberId, gcIds);
          }
        }

        structure.polygamousHouses.push({
          houseId: house.id,
          houseHeadId: house.houseHeadId,
          houseName: house.houseName,
          children: houseChildren,
          grandChildrenPerChild: grandKidsMap,
        });
      }
    }

    return structure;
  }

  // --- Layout Helper (BFS) ---

  private static calculateTreeLayout(nodes: Map<string, FamilyTreeNode>): void {
    const roots: FamilyTreeNode[] = [];

    for (const node of nodes.values()) {
      // Root = No parents recorded OR Parents are deceased/unknown
      const hasLivingParent = node.parents.some(
        (parent) => parent.member && !parent.member.isDeceased,
      );

      if (node.parents.length === 0 || !hasLivingParent) {
        roots.push(node);
      }
    }

    const queue: { node: FamilyTreeNode; depth: number }[] = roots.map((node) => ({
      node,
      depth: 0,
    }));

    const visited = new Set<string>();

    while (queue.length > 0) {
      const { node, depth } = queue.shift()!;
      if (visited.has(node.memberId)) continue;
      visited.add(node.memberId);

      node.depth = depth;

      // Spouses are same depth
      for (const spouse of node.spouses) {
        if (!visited.has(spouse.memberId)) {
          queue.push({ node: spouse, depth: depth });
        }
      }

      // Children are depth + 1
      for (const child of node.children) {
        if (!visited.has(child.memberId)) {
          queue.push({ node: child, depth: depth + 1 });
        }
      }
    }
  }
}
