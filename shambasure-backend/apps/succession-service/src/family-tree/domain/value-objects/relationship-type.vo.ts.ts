import {
  RELATIONSHIP_TYPES,
  DEPENDANT_RELATIONSHIPS,
} from '../../../common/constants/relationship-types.constants';

export class RelationshipType {
  private readonly code: string;
  private readonly label: string;
  private readonly priority: number; // For Intestacy ranking (1 = Highest)

  constructor(code: string) {
    if (!RelationshipType.isValid(code)) {
      throw new Error(`Invalid Relationship Type Code: ${code}`);
    }

    this.code = code;
    // Hydrate from constants
    const definition = RELATIONSHIP_TYPES[code as keyof typeof RELATIONSHIP_TYPES];
    this.label = definition.label;
    this.priority = definition.priority ?? 99; // Default low priority
  }

  getCode(): string {
    return this.code;
  }

  getLabel(): string {
    return this.label;
  }

  /**
   * Returns true if this relationship usually qualifies as a Dependant
   * under Section 29 of the Law of Succession Act.
   */
  isLegalDependant(): boolean {
    return (DEPENDANT_RELATIONSHIPS as readonly string[]).includes(this.code);
  }

  /**
   * Returns true if this relationship implies close blood relation.
   * Used to validate marriage prohibitions (incest).
   */
  isBloodRelative(): boolean {
    // We assume "immediateFamily" plus standard extended family logic
    // In production, we might need a specific 'blood' flag in constants
    return [
      'CHILD',
      'PARENT',
      'SIBLING',
      'GRANDCHILD',
      'GRANDPARENT',
      'NIECE_NEPHEW',
      'AUNT_UNCLE',
    ].includes(this.code);
  }

  equals(other: RelationshipType): boolean {
    return this.code === other.getCode();
  }

  toString(): string {
    return this.label;
  }

  static isValid(code: string): boolean {
    return Object.keys(RELATIONSHIP_TYPES).includes(code);
  }
}
