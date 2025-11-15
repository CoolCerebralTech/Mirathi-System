import { Injectable } from '@nestjs/common';

// Define proper interfaces for input data
export interface FamilyMemberInput {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  isDeceased?: boolean;
  isMinor?: boolean;
  dateOfBirth?: Date;
  dateOfDeath?: Date;
  marriageDate?: Date;
  spouseIds?: string[];
  parentIds?: string[];
}

export interface FamilyTreeNode {
  id: string;
  name: string;
  relationship: string;
  isDeceased: boolean;
  isMinor: boolean;
  spouses: FamilyTreeNode[];
  children: FamilyTreeNode[];
  parents: FamilyTreeNode[];
  metadata?: {
    dateOfBirth?: Date;
    dateOfDeath?: Date;
    marriageDate?: Date;
  };
}

export interface FamilyTree {
  root: FamilyTreeNode;
  members: Map<string, FamilyTreeNode>;
  relationships: Map<string, string[]>;
}

// Define interfaces for tree visualization data
export interface TreeVisualizationNode {
  id: string;
  label: string;
  data: {
    relationship: string;
    isDeceased: boolean;
    isMinor: boolean;
  };
}

export interface TreeVisualizationEdge {
  from: string;
  to: string;
  label: string;
  type: 'marriage' | 'blood';
}

export interface TreeVisualizationData {
  nodes: TreeVisualizationNode[];
  edges: TreeVisualizationEdge[];
  rootId: string;
}

@Injectable()
export class FamilyTreeBuilder {
  buildTreeFromMembers(members: FamilyMemberInput[]): FamilyTree {
    const memberMap = new Map<string, FamilyTreeNode>();
    const relationships = new Map<string, string[]>();

    // Create nodes
    members.forEach((member) => {
      memberMap.set(member.id, {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        relationship: member.relationship,
        isDeceased: !!member.isDeceased,
        isMinor: !!member.isMinor,
        spouses: [],
        children: [],
        parents: [],
        metadata: {
          dateOfBirth: member.dateOfBirth,
          dateOfDeath: member.dateOfDeath,
          marriageDate: member.marriageDate,
        },
      });
    });

    // Build relationships
    members.forEach((member) => {
      const node = memberMap.get(member.id);
      if (!node) return;

      // Spouses
      if (member.spouseIds) {
        member.spouseIds.forEach((spouseId: string) => {
          const spouse = memberMap.get(spouseId);
          if (spouse && !node.spouses.includes(spouse)) {
            node.spouses.push(spouse);
          }
        });
      }

      // Parents and children
      if (member.parentIds) {
        member.parentIds.forEach((parentId: string) => {
          const parent = memberMap.get(parentId);
          if (parent) {
            if (!node.parents.includes(parent)) node.parents.push(parent);
            if (!parent.children.includes(node)) parent.children.push(node);
          }
        });
      }

      // Track relationship types
      this.trackRelationship(relationships, node.id, node.relationship);
    });

    // Find root node
    const root = this.findRootNode(memberMap);

    return { root, members: memberMap, relationships };
  }

  private findRootNode(memberMap: Map<string, FamilyTreeNode>): FamilyTreeNode {
    // Try to find testator first
    for (const node of memberMap.values()) {
      if (node.relationship === 'TESTATOR' || node.relationship === 'DECEASED') {
        return node;
      }
    }

    // Fallback: find someone with no parents
    for (const node of memberMap.values()) {
      if (node.parents.length === 0) {
        return node;
      }
    }

    // Final fallback: first member - using Array.from for type safety
    const membersArray = Array.from(memberMap.values());
    if (membersArray.length === 0) {
      throw new Error('Cannot build family tree: no members provided');
    }
    return membersArray[0];
  }

  private trackRelationship(
    relationships: Map<string, string[]>,
    memberId: string,
    relationship: string,
  ): void {
    if (!relationships.has(relationship)) {
      relationships.set(relationship, []);
    }
    relationships.get(relationship)!.push(memberId);
  }

  findDependants(tree: FamilyTree): FamilyTreeNode[] {
    const dependants: FamilyTreeNode[] = [];
    tree.members.forEach((member) => {
      if (this.isDependant(member, tree)) {
        dependants.push(member);
      }
    });
    return dependants;
  }

  private isDependant(member: FamilyTreeNode, tree: FamilyTree): boolean {
    return (
      ['SPOUSE', 'CHILD', 'ADOPTED_CHILD', 'STEPCHILD'].includes(member.relationship) ||
      (member.isMinor && this.wasMaintainedByDeceased(member, tree)) ||
      this.wasMaintainedByDeceased(member, tree)
    );
  }

  private wasMaintainedByDeceased(member: FamilyTreeNode, tree: FamilyTree): boolean {
    return member.parents.some(
      (parent) => parent.id === tree.root.id || parent.spouses.some((s) => s.id === tree.root.id),
    );
  }

  generateTreeData(tree: FamilyTree): TreeVisualizationData {
    const nodes: TreeVisualizationNode[] = [];
    const edges: TreeVisualizationEdge[] = [];

    tree.members.forEach((member) => {
      nodes.push({
        id: member.id,
        label: member.name,
        data: {
          relationship: member.relationship,
          isDeceased: member.isDeceased,
          isMinor: member.isMinor,
        },
      });

      member.spouses.forEach((spouse) => {
        edges.push({
          from: member.id,
          to: spouse.id,
          label: 'SPOUSE',
          type: 'marriage',
        });
      });

      member.children.forEach((child) => {
        edges.push({
          from: member.id,
          to: child.id,
          label: 'PARENT',
          type: 'blood',
        });
      });
    });

    return { nodes, edges, rootId: tree.root.id };
  }

  validateTreeIntegrity(tree: FamilyTree): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    if (this.hasCircularRelationships(tree)) {
      issues.push('Circular relationships detected');
    }
    if (this.hasDuplicateRelationships(tree)) {
      issues.push('Duplicate relationships detected');
    }

    const orphans = Array.from(tree.members.values()).filter(
      (member) => !member.spouses.length && !member.parents.length && !member.children.length,
    );
    if (orphans.length) {
      issues.push(`${orphans.length} members with no relationships`);
    }

    return { isValid: issues.length === 0, issues };
  }

  private hasCircularRelationships(tree: FamilyTree): boolean {
    const visited = new Set<string>();

    const dfs = (node: FamilyTreeNode, path: Set<string>): boolean => {
      if (path.has(node.id)) return true;
      if (visited.has(node.id)) return false;

      visited.add(node.id);
      path.add(node.id);

      for (const child of node.children) {
        if (dfs(child, new Set(path))) return true;
      }
      return false;
    };

    return dfs(tree.root, new Set());
  }

  private hasDuplicateRelationships(tree: FamilyTree): boolean {
    const pairs = new Set<string>();
    for (const node of tree.members.values()) {
      for (const spouse of node.spouses) {
        const pair = [node.id, spouse.id].sort().join('-');
        if (pairs.has(pair)) return true;
        pairs.add(pair);
      }
    }
    return false;
  }
}
