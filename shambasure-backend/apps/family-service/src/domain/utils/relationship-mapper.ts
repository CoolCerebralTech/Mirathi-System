// domain/utils/relationship-mapper.ts
import { RelationshipType } from '../value-objects/legal/relationship-type.vo';

export class RelationshipMapper {
  /**
   * Converts a graph path or direct type into a Human-Readable Legal Term.
   * e.g., "Parent" + Female -> "Mother"
   */
  static toLegalTerm(type: RelationshipType, gender: string | undefined): string {
    const g = gender?.toUpperCase();

    switch (type) {
      case RelationshipType.PARENT:
        return g === 'MALE' ? 'Father' : g === 'FEMALE' ? 'Mother' : 'Parent';

      case RelationshipType.CHILD:
        return g === 'MALE' ? 'Son' : g === 'FEMALE' ? 'Daughter' : 'Child';

      case RelationshipType.SIBLING:
        return g === 'MALE' ? 'Brother' : g === 'FEMALE' ? 'Sister' : 'Sibling';

      case RelationshipType.GRANDPARENT:
        return g === 'MALE' ? 'Grandfather' : g === 'FEMALE' ? 'Grandmother' : 'Grandparent';

      case RelationshipType.GRANDCHILD:
        return g === 'MALE' ? 'Grandson' : g === 'FEMALE' ? 'Granddaughter' : 'Grandchild';

      case RelationshipType.AUNT_UNCLE:
        return g === 'MALE' ? 'Uncle' : g === 'FEMALE' ? 'Aunt' : 'Relative';

      case RelationshipType.NIECE_NEPHEW:
        return g === 'MALE' ? 'Nephew' : g === 'FEMALE' ? 'Niece' : 'Relative';

      case RelationshipType.STEPCHILD:
        return g === 'MALE' ? 'Step-son' : g === 'FEMALE' ? 'Step-daughter' : 'Step-child';

      case RelationshipType.SPOUSE:
        return g === 'MALE' ? 'Husband' : g === 'FEMALE' ? 'Wife' : 'Spouse';

      default:
        return 'Relative';
    }
  }

  /**
   * Determines the LSA Priority Code for administration.
   * Lower number = Higher priority for grant of letters.
   */
  static getAdministrationPriority(type: RelationshipType): number {
    switch (type) {
      case RelationshipType.SPOUSE:
        return 1;
      case RelationshipType.CHILD:
        return 2;
      case RelationshipType.PARENT:
        return 3;
      case RelationshipType.SIBLING:
        return 4;
      case RelationshipType.HALF_SIBLING:
        return 5;
      case RelationshipType.AUNT_UNCLE:
        return 6; // And other relatives
      default:
        return 99; // Strangers/Creditors
    }
  }

  /**
   * Normalizes generic terms into Enum types.
   */
  static mapStringToEnum(term: string): RelationshipType {
    const t = term.toUpperCase();
    if (t.includes('MOTHER') || t.includes('FATHER')) return RelationshipType.PARENT;
    if (t.includes('SON') || t.includes('DAUGHTER')) return RelationshipType.CHILD;
    if (t.includes('WIFE') || t.includes('HUSBAND')) return RelationshipType.SPOUSE;
    if (t.includes('BROTHER') || t.includes('SISTER')) return RelationshipType.SIBLING;
    return RelationshipType.OTHER;
  }
}
