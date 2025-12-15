// domain/policies/next-of-kin-determination.policy.ts
import { RelationshipType } from '../value-objects/legal/relationship-type.vo';

export interface AdministrationPriority {
  rank: number; // 1 is highest
  category: string;
  description: string;
}

export class NextOfKinPolicy {
  /**
   * Returns the priority rank for administration rights based on S.66 LSA.
   * "The court shall have regard to the rights of all persons interested in the estate..."
   */
  static getAdministrationPriority(
    relationshipType: RelationshipType,
    isMinor: boolean = false,
  ): AdministrationPriority {
    // Minors cannot administer an estate
    if (isMinor) {
      return {
        rank: 99,
        category: 'INELIGIBLE',
        description: 'Minor cannot act as administrator.',
      };
    }

    switch (relationshipType) {
      case RelationshipType.SPOUSE:
        return {
          rank: 1,
          category: 'SURVIVING_SPOUSE',
          description: 'Surviving spouse has first priority (S.66).',
        };

      case RelationshipType.CHILD:
      case RelationshipType.ADOPTED_CHILD:
        return {
          rank: 2,
          category: 'CHILDREN',
          description: 'Children of the deceased (Adults only).',
        };

      case RelationshipType.PARENT:
        return {
          rank: 3,
          category: 'PARENTS',
          description: 'Parents of the deceased.',
        };

      case RelationshipType.SIBLING:
      case RelationshipType.HALF_SIBLING:
        return {
          rank: 4,
          category: 'SIBLINGS',
          description: 'Brothers and sisters of the deceased.',
        };

      case RelationshipType.STEPCHILD:
        // Step-children usually rank lower unless adopted
        return {
          rank: 5,
          category: 'STEP_CHILDREN',
          description: 'Step-children (if maintained/integrated).',
        };

      case RelationshipType.AUNT_UNCLE:
      case RelationshipType.NIECE_NEPHEW:
        return {
          rank: 6,
          category: 'EXTENDED_FAMILY',
          description: 'Uncles, Aunts, Nephews, Nieces.',
        };

      default:
        return {
          rank: 10,
          category: 'CREDITOR_OR_PUBLIC',
          description: 'Creditors or Public Trustee (if no family found).',
        };
    }
  }

  /**
   * Resolves conflict between two applicants.
   */
  static compare(
    applicantA: { type: RelationshipType; isMinor: boolean },
    applicantB: { type: RelationshipType; isMinor: boolean },
  ): number {
    const priorityA = this.getAdministrationPriority(applicantA.type, applicantA.isMinor).rank;
    const priorityB = this.getAdministrationPriority(applicantB.type, applicantB.isMinor).rank;

    return priorityA - priorityB; // Negative if A is higher priority
  }
}
