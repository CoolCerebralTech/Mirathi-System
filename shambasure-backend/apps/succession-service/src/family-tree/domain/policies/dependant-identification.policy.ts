import { Injectable } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';

/**
 * Simplified representation of a node for identification logic
 */
interface Node {
  id: string;
  isMinor: boolean;
  relationships: { type: RelationshipType; targetId: string }[];
}

@Injectable()
export class DependantIdentificationPolicy {
  /**
   * Identifies who in the family tree qualifies as a "Dependant" of the Target Member
   * based on Section 29 of the Law of Succession Act.
   *
   * @param targetId - ID of the deceased or estate owner
   * @param familyNodes - Array of family nodes representing relationships
   * @returns Array of dependant node IDs
   */
  identifyDependants(targetId: string, familyNodes: Node[]): string[] {
    const dependants = new Set<string>();

    const targetNode = familyNodes.find((n) => n.id === targetId);
    if (!targetNode) return [];

    // Outgoing relationships from Target
    for (const rel of targetNode.relationships) {
      switch (rel.type) {
        case 'SPOUSE':
          dependants.add(rel.targetId);
          break;
        case 'CHILD':
        case 'ADOPTED_CHILD':
          dependants.add(rel.targetId);
          break;
        case 'EX_SPOUSE':
          // Ex-spouses usually not dependants unless specified
          break;
      }
    }

    // Incoming relationships to Target
    for (const node of familyNodes) {
      const link = node.relationships.find((r) => r.targetId === targetId);
      if (!link) continue;

      // Inverse mapping: Parent -> Child
      if (link.type === 'PARENT') {
        dependants.add(node.id);
      }
    }

    // Section 29(2): Parents, Step-children, Siblings can be flagged separately if needed
    // This policy currently returns only direct, verifiable dependants

    return Array.from(dependants);
  }
}
