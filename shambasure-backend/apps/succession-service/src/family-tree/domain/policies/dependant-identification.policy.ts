import { Injectable } from '@nestjs/common';
import { DependencyLevel, RelationshipType } from '@prisma/client';

/**
 * Node representation matching the LegalGraphNode from dependant-calculator service
 */
export interface Node {
  id: string;
  isMinor: boolean;
  isDeceased: boolean;
  dependencyLevel: DependencyLevel;
  gender?: string;
  age: number | null;
  relationships: Array<{
    type: RelationshipType;
    targetId: string;
    metadata?: {
      isVerified?: boolean;
      isActive?: boolean;
    };
  }>;
  metadata?: any;
}

@Injectable()
export class DependantIdentificationPolicy {
  /**
   * Identifies who in the family tree qualifies as a "Dependant" of the Target Member
   * based on Section 29 of the Law of Succession Act (Cap 160).
   *
   * @param targetId - ID of the deceased or estate owner
   * @param familyNodes - Array of family nodes representing relationships
   * @returns Array of dependant node IDs
   */
  identifyDependants(targetId: string, familyNodes: Node[]): string[] {
    const dependants = new Set<string>();

    const targetNode = familyNodes.find((n) => n.id === targetId);
    if (!targetNode) return [];

    // 1. Analyze Outgoing relationships from Target (Target -> Others)
    for (const rel of targetNode.relationships) {
      const relatedNode = familyNodes.find((n) => n.id === rel.targetId);
      if (!relatedNode) continue;

      switch (rel.type) {
        case RelationshipType.SPOUSE:
          // Section 29(a): Wife/Wives (or Husband) are dependants
          if (rel.metadata?.isActive !== false) {
            dependants.add(rel.targetId);
          }
          break;

        case RelationshipType.CHILD:
        case RelationshipType.ADOPTED_CHILD:
          // Section 29(a): Children (irrespective of age/gender per current interpretation,
          // though technically "maintenance" often required for adults)
          // For safety, we include all children, logic downstream filters by need.
          dependants.add(rel.targetId);
          break;

        case RelationshipType.STEPCHILD:
          // Section 29(b): Step-children who were being maintained by deceased
          if (relatedNode.isMinor || relatedNode.dependencyLevel !== DependencyLevel.NONE) {
            dependants.add(rel.targetId);
          }
          break;
      }
    }

    // 2. Analyze Incoming relationships to Target (Others -> Target)
    // "My parent is Target" => "I am Target's child"
    for (const node of familyNodes) {
      // Find relationship FROM Node TO Target
      const link = node.relationships.find((r) => r.targetId === targetId);
      if (!link) continue;

      // Logic: If 'node' says 'target' is their PARENT => 'node' is a CHILD
      if (link.type === RelationshipType.PARENT) {
        // 'node' is the child
        dependants.add(node.id);
      }

      // Logic: If 'node' says 'target' is their SPOUSE => 'node' is a SPOUSE
      if (link.type === RelationshipType.SPOUSE) {
        if (link.metadata?.isActive !== false) {
          dependants.add(node.id);
        }
      }

      // Section 29(c): Parents, Step-parents, Grandparents, etc.
      // IF they were being maintained by the deceased.
      // Logic: If 'node' says 'target' is their CHILD => 'node' is a PARENT
      if (link.type === RelationshipType.CHILD || link.type === RelationshipType.ADOPTED_CHILD) {
        // 'node' is the parent
        if (node.dependencyLevel !== DependencyLevel.NONE) {
          dependants.add(node.id);
        }
      }

      // Section 29(c): Brothers and Sisters
      // IF they were being maintained by the deceased.
      // Logic: If 'node' says 'target' is their SIBLING
      if (link.type === RelationshipType.SIBLING || link.type === RelationshipType.HALF_SIBLING) {
        if (node.isMinor || node.dependencyLevel !== DependencyLevel.NONE) {
          dependants.add(node.id);
        }
      }
    }

    // Filter out deceased members (Deceased persons cannot inherit/be dependants)
    const livingDependants = Array.from(dependants).filter((id) => {
      const member = familyNodes.find((n) => n.id === id);
      return member && !member.isDeceased;
    });

    return livingDependants;
  }
}
