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
   * Identifies who in the tree qualifies as a "Dependant" of the Target Member
   * based on Section 29 of the Law of Succession Act.
   */
  identifyDependants(targetId: string, familyNodes: Node[]): string[] {
    const dependants: Set<string> = new Set();

    // 1. Find Direct Connections (Spouse, Child)
    const targetNode = familyNodes.find((n) => n.id === targetId);
    if (!targetNode) return [];

    // Outgoing relationships from Target
    targetNode.relationships.forEach((rel) => {
      // Spouse
      if (rel.type === 'SPOUSE' || rel.type === 'EX_SPOUSE') {
        // Note: Ex-spouse is usually NOT a dependant unless specific court order,
        // but standard logic captures "Current Spouse"
        if (rel.type === 'SPOUSE') dependants.add(rel.targetId);
      }

      // Children (Own + Adopted)
      if (rel.type === 'CHILD' || rel.type === 'ADOPTED_CHILD') {
        dependants.add(rel.targetId);
      }
    });

    // Incoming relationships to Target (e.g. "X is Child of Target")
    familyNodes.forEach((node) => {
      const link = node.relationships.find((r) => r.targetId === targetId);
      if (link) {
        // If node says "I am Child of Target", then Node is dependant
        if (link.type === 'PARENT') {
          // Inverse of Parent is Child
          dependants.add(node.id);
        }
      }
    });

    // 2. Section 29(2): Parents/Step-children/Siblings
    // These are dependants ONLY if "maintained by deceased".
    // The graph structure alone doesn't prove maintenance,
    // so the Policy returns them as "Potential" dependants for the Service to flag.
    // For this strict policy, we return the absolute biological connections.

    return Array.from(dependants);
  }
}
