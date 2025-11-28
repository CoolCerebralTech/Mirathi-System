import { Injectable } from '@nestjs/common';

/**
 * Node representation matching the LegalGraphNode from dependant-calculator service
 */
export interface Node {
  id: string;
  isMinor: boolean;
  isDeceased: boolean;
  isDisabled: boolean;
  dependencyLevel: 'INDEPENDENT' | 'PARTIAL' | 'FULL';
  gender: string;
  age: number | null;
  relationships: Array<{
    type: string;
    targetId: string;
    metadata?: {
      isVerified?: boolean;
      isBiological?: boolean;
      isAdopted?: boolean;
      bornOutOfWedlock?: boolean;
      adoptionOrderNumber?: string;
      marriageType?: string;
      isActive?: boolean;
      marriageDate?: Date;
      divorceDate?: Date | null;
      isCustomary?: boolean;
      guardianType?: string;
      appointmentDate?: Date;
      validUntil?: Date | null;
    };
  }>;
  metadata: {
    clan?: string;
    subClan?: string;
    birthOrder?: number;
    isFamilyHead: boolean;
    isElder: boolean;
    traditionalTitle?: string;
    educationLevel?: 'NONE' | 'PRIMARY' | 'SECONDARY' | 'COLLEGE' | 'UNIVERSITY';
    occupation?: string;
    disabilityStatus?: 'NONE' | 'PHYSICAL' | 'MENTAL' | 'VISUAL' | 'HEARING';
    dependencyStatus: 'INDEPENDENT' | 'PARTIAL' | 'FULL';
  };
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
          // Active spouses are always dependants
          if (rel.metadata?.isActive !== false) {
            dependants.add(rel.targetId);
          }
          break;

        case 'CHILD':
        case 'ADOPTED_CHILD':
          dependants.add(rel.targetId);
          break;

        case 'STEPCHILD': {
          // Step-children who are minors or dependent
          const stepChild = familyNodes.find((n) => n.id === rel.targetId);
          if (stepChild && (stepChild.isMinor || stepChild.dependencyLevel !== 'INDEPENDENT')) {
            dependants.add(rel.targetId);
          }
          break;
        }

        case 'EX_SPOUSE':
          // Ex-spouses usually not dependants unless specified in maintenance orders
          break;
      }
    }

    // Incoming relationships to Target (reverse perspective)
    for (const node of familyNodes) {
      const link = node.relationships.find((r) => r.targetId === targetId);
      if (!link) continue;

      // Inverse mapping: if node has PARENT relationship pointing to target,
      // then node is a child of target
      if (link.type === 'PARENT') {
        dependants.add(node.id);
      }

      // Parents who are dependent (Section 29(1)(c))
      if (link.type === 'CHILD') {
        if (node.dependencyLevel !== 'INDEPENDENT' || (node.age !== null && node.age > 65)) {
          dependants.add(node.id);
        }
      }

      // Siblings who are dependent (Section 29(1)(e))
      if (link.type === 'SIBLING' || link.type === 'HALF_SIBLING') {
        if (node.isMinor || node.dependencyLevel !== 'INDEPENDENT') {
          dependants.add(node.id);
        }
      }
    }

    // Filter out deceased members (they cannot be dependants)
    const livingDependants = Array.from(dependants).filter((id) => {
      const member = familyNodes.find((n) => n.id === id);
      return member && !member.isDeceased;
    });

    return livingDependants;
  }
}
