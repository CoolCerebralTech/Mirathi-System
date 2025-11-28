import {
  RELATIONSHIP_TYPES,
  DEPENDANT_RELATIONSHIPS,
} from '../../../common/constants/relationship-types.constants';

type RelationshipCode = keyof typeof RELATIONSHIP_TYPES;
type BloodRelativeCode =
  | 'CHILD'
  | 'PARENT'
  | 'SIBLING'
  | 'GRANDCHILD'
  | 'GRANDPARENT'
  | 'NIECE_NEPHEW'
  | 'AUNT_UNCLE';

export class RelationshipType {
  private readonly code: RelationshipCode;
  private readonly label: string;
  private readonly priority: number;
  private readonly isDependant: boolean;

  constructor(code: string) {
    if (!RelationshipType.isValid(code)) {
      throw new Error(`Invalid Relationship Type Code: ${code}`);
    }

    this.code = code;

    const definition = RELATIONSHIP_TYPES[this.code];

    this.label = definition.label;
    this.priority = 'priority' in definition ? definition.priority : 99;
    this.isDependant = (DEPENDANT_RELATIONSHIPS as readonly string[]).includes(this.code);
  }

  getCode(): RelationshipCode {
    return this.code;
  }

  getLabel(): string {
    return this.label;
  }

  getPriority(): number {
    return this.priority;
  }

  isLegalDependant(): boolean {
    return this.isDependant;
  }

  isBloodRelative(): boolean {
    const bloodRelatives: readonly BloodRelativeCode[] = [
      'CHILD',
      'PARENT',
      'SIBLING',
      'GRANDCHILD',
      'GRANDPARENT',
      'NIECE_NEPHEW',
      'AUNT_UNCLE',
    ];

    return bloodRelatives.includes(this.code as BloodRelativeCode);
  }

  equals(other: RelationshipType): boolean {
    return this.code === other.getCode();
  }

  toString(): string {
    return this.label;
  }

  static isValid(code: string): code is RelationshipCode {
    return Boolean((RELATIONSHIP_TYPES as Record<string, unknown>)[code]);
  }

  static getAllCodes(): RelationshipCode[] {
    return Object.keys(RELATIONSHIP_TYPES) as RelationshipCode[];
  }
}
