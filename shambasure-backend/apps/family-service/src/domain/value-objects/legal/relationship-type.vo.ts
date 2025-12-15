// domain/value-objects/legal/relationship-type.vo.ts
import { ValueObject } from '../../base/value-object';

export type RelationshipType =
  | 'SPOUSE'
  | 'EX_SPOUSE'
  | 'CHILD'
  | 'ADOPTED_CHILD'
  | 'STEPCHILD'
  | 'PARENT'
  | 'SIBLING'
  | 'HALF_SIBLING'
  | 'GRANDCHILD'
  | 'GRANDPARENT'
  | 'NIECE_NEPHEW'
  | 'AUNT_UNCLE'
  | 'COUSIN'
  | 'GUARDIAN'
  | 'OTHER';

export type RelationshipStrength = 'FULL' | 'HALF' | 'STEP' | 'ADOPTED' | 'CUSTOMARY';

export interface RelationshipTypeProps {
  type: RelationshipType;
  strength: RelationshipStrength;
  isBiological: boolean;
  isLegal: boolean;
  isCustomary: boolean;
  description: string;
  inheritanceWeight: number; // 0-1 scale
  kenyanLawApplicable: boolean;
  applicableSections: string[];
  evidenceRequired: boolean;
  evidenceTypes: string[];
}

export class RelationshipTypeVO extends ValueObject<RelationshipTypeProps> {
  private constructor(props: RelationshipTypeProps) {
    super(props);
    this.validate();
  }

  static create(type: RelationshipType): RelationshipTypeVO {
    const details = this.getRelationshipDetails(type);

    return new RelationshipTypeVO({
      type,
      strength: 'FULL',
      isBiological: true,
      isLegal: true,
      isCustomary: false,
      description: details.description,
      inheritanceWeight: details.inheritanceWeight,
      kenyanLawApplicable: details.kenyanLawApplicable,
      applicableSections: details.applicableSections,
      evidenceRequired: details.evidenceRequired,
      evidenceTypes: details.evidenceTypes,
    });
  }

  static createFromProps(props: RelationshipTypeProps): RelationshipTypeVO {
    return new RelationshipTypeVO(props);
  }

  private static getRelationshipDetails(type: RelationshipType): {
    description: string;
    inheritanceWeight: number;
    kenyanLawApplicable: boolean;
    applicableSections: string[];
    evidenceRequired: boolean;
    evidenceTypes: string[];
  } {
    const details: Record<
      RelationshipType,
      {
        description: string;
        inheritanceWeight: number;
        kenyanLawApplicable: boolean;
        applicableSections: string[];
        evidenceRequired: boolean;
        evidenceTypes: string[];
      }
    > = {
      SPOUSE: {
        description: 'Lawfully married spouse',
        inheritanceWeight: 1.0,
        kenyanLawApplicable: true,
        applicableSections: ['S35', 'S40'],
        evidenceRequired: true,
        evidenceTypes: ['MARRIAGE_CERTIFICATE', 'MARRIAGE_REGISTRATION'],
      },
      EX_SPOUSE: {
        description: 'Former spouse through divorce',
        inheritanceWeight: 0.0,
        kenyanLawApplicable: false,
        applicableSections: [],
        evidenceRequired: true,
        evidenceTypes: ['DIVORCE_DECREE', 'COURT_ORDER'],
      },
      CHILD: {
        description: 'Biological child',
        inheritanceWeight: 1.0,
        kenyanLawApplicable: true,
        applicableSections: ['S35', 'S40', 'S29'],
        evidenceRequired: true,
        evidenceTypes: ['BIRTH_CERTIFICATE', 'DNA_TEST'],
      },
      ADOPTED_CHILD: {
        description: 'Legally adopted child',
        inheritanceWeight: 1.0,
        kenyanLawApplicable: true,
        applicableSections: ['S35', 'S40'],
        evidenceRequired: true,
        evidenceTypes: ['ADOPTION_ORDER', 'COURT_ORDER'],
      },
      STEPCHILD: {
        description: "Child from spouse's previous relationship",
        inheritanceWeight: 0.5,
        kenyanLawApplicable: true,
        applicableSections: ['S29'],
        evidenceRequired: true,
        evidenceTypes: ['BIRTH_CERTIFICATE', 'MARRIAGE_CERTIFICATE'],
      },
      PARENT: {
        description: 'Biological or adoptive parent',
        inheritanceWeight: 0.8,
        kenyanLawApplicable: true,
        applicableSections: ['S36', 'S29'],
        evidenceRequired: true,
        evidenceTypes: ['BIRTH_CERTIFICATE', 'IDENTITY_DOCUMENT'],
      },
      SIBLING: {
        description: 'Full sibling (same both parents)',
        inheritanceWeight: 0.6,
        kenyanLawApplicable: true,
        applicableSections: ['S38'],
        evidenceRequired: true,
        evidenceTypes: ['BIRTH_CERTIFICATE', 'PARENTS_IDENTITY'],
      },
      HALF_SIBLING: {
        description: 'Half sibling (share one parent)',
        inheritanceWeight: 0.3,
        kenyanLawApplicable: true,
        applicableSections: ['S38'],
        evidenceRequired: true,
        evidenceTypes: ['BIRTH_CERTIFICATE', 'PARENT_IDENTITY'],
      },
      GRANDCHILD: {
        description: 'Child of child',
        inheritanceWeight: 0.4,
        kenyanLawApplicable: true,
        applicableSections: ['S39'],
        evidenceRequired: true,
        evidenceTypes: ['BIRTH_CERTIFICATE', 'PARENT_BIRTH_CERTIFICATE'],
      },
      GRANDPARENT: {
        description: 'Parent of parent',
        inheritanceWeight: 0.2,
        kenyanLawApplicable: true,
        applicableSections: ['S39'],
        evidenceRequired: true,
        evidenceTypes: ['BIRTH_CERTIFICATE', 'IDENTITY_DOCUMENT'],
      },
      NIECE_NEPHEW: {
        description: 'Child of sibling',
        inheritanceWeight: 0.2,
        kenyanLawApplicable: true,
        applicableSections: ['S39'],
        evidenceRequired: true,
        evidenceTypes: ['BIRTH_CERTIFICATE', 'SIBLING_BIRTH_CERTIFICATE'],
      },
      AUNT_UNCLE: {
        description: 'Sibling of parent',
        inheritanceWeight: 0.1,
        kenyanLawApplicable: true,
        applicableSections: ['S39'],
        evidenceRequired: true,
        evidenceTypes: ['BIRTH_CERTIFICATE', 'PARENT_BIRTH_CERTIFICATE'],
      },
      COUSIN: {
        description: 'Child of aunt/uncle',
        inheritanceWeight: 0.05,
        kenyanLawApplicable: true,
        applicableSections: ['S39'],
        evidenceRequired: true,
        evidenceTypes: ['BIRTH_CERTIFICATE', 'PARENT_BIRTH_CERTIFICATE'],
      },
      GUARDIAN: {
        description: 'Legal guardian',
        inheritanceWeight: 0.0,
        kenyanLawApplicable: true,
        applicableSections: ['S70', 'S71', 'S72', 'S73'],
        evidenceRequired: true,
        evidenceTypes: ['COURT_ORDER', 'GUARDIANSHIP_CERTIFICATE'],
      },
      OTHER: {
        description: 'Other relationship not listed',
        inheritanceWeight: 0.0,
        kenyanLawApplicable: false,
        applicableSections: ['S29'],
        evidenceRequired: true,
        evidenceTypes: ['AFFIDAVIT', 'COURT_ORDER'],
      },
    };

    return details[type];
  }

  validate(): void {
    if (!this._value.type) {
      throw new Error('Relationship type is required');
    }

    if (!this._value.strength) {
      throw new Error('Relationship strength is required');
    }

    if (this._value.inheritanceWeight < 0 || this._value.inheritanceWeight > 1) {
      throw new Error('Inheritance weight must be between 0 and 1');
    }

    if (!this._value.description || this._value.description.trim().length === 0) {
      throw new Error('Description is required');
    }

    // Validate that biological relationships are not also customary
    if (this._value.isBiological && this._value.isCustomary) {
      throw new Error('Relationship cannot be both biological and customary');
    }

    // Validate evidence requirements
    if (this._value.evidenceRequired && this._value.evidenceTypes.length === 0) {
      throw new Error('Evidence types are required when evidence is required');
    }
  }

  updateStrength(strength: RelationshipStrength): RelationshipTypeVO {
    let inheritanceWeight = this._value.inheritanceWeight;

    // Adjust inheritance weight based on strength
    switch (strength) {
      case 'HALF':
        inheritanceWeight *= 0.5;
        break;
      case 'STEP':
        inheritanceWeight *= 0.3;
        break;
      case 'ADOPTED':
        inheritanceWeight = 1.0; // Full inheritance for adopted
        break;
      case 'CUSTOMARY':
        inheritanceWeight *= 0.7;
        break;
    }

    return new RelationshipTypeVO({
      ...this._value,
      strength,
      inheritanceWeight,
    });
  }

  markAsBiological(): RelationshipTypeVO {
    return new RelationshipTypeVO({
      ...this._value,
      isBiological: true,
      isLegal: true,
      isCustomary: false,
    });
  }

  markAsLegal(): RelationshipTypeVO {
    return new RelationshipTypeVO({
      ...this._value,
      isBiological: false,
      isLegal: true,
      isCustomary: false,
    });
  }

  markAsCustomary(): RelationshipTypeVO {
    return new RelationshipTypeVO({
      ...this._value,
      isBiological: false,
      isLegal: false,
      isCustomary: true,
    });
  }

  updateInheritanceWeight(weight: number): RelationshipTypeVO {
    if (weight < 0 || weight > 1) {
      throw new Error('Inheritance weight must be between 0 and 1');
    }

    return new RelationshipTypeVO({
      ...this._value,
      inheritanceWeight: weight,
    });
  }

  addApplicableSection(section: string): RelationshipTypeVO {
    const applicableSections = [...this._value.applicableSections, section];

    return new RelationshipTypeVO({
      ...this._value,
      applicableSections,
    });
  }

  addEvidenceType(evidenceType: string): RelationshipTypeVO {
    const evidenceTypes = [...this._value.evidenceTypes, evidenceType];

    return new RelationshipTypeVO({
      ...this._value,
      evidenceTypes,
      evidenceRequired: true,
    });
  }

  get type(): RelationshipType {
    return this._value.type;
  }

  get strength(): RelationshipStrength {
    return this._value.strength;
  }

  get isBiological(): boolean {
    return this._value.isBiological;
  }

  get isLegal(): boolean {
    return this._value.isLegal;
  }

  get isCustomary(): boolean {
    return this._value.isCustomary;
  }

  get description(): string {
    return this._value.description;
  }

  get inheritanceWeight(): number {
    return this._value.inheritanceWeight;
  }

  get kenyanLawApplicable(): boolean {
    return this._value.kenyanLawApplicable;
  }

  get applicableSections(): string[] {
    return [...this._value.applicableSections];
  }

  get evidenceRequired(): boolean {
    return this._value.evidenceRequired;
  }

  get evidenceTypes(): string[] {
    return [...this._value.evidenceTypes];
  }

  // Check if this is a direct descendant relationship
  get isDirectDescendant(): boolean {
    return ['CHILD', 'ADOPTED_CHILD', 'GRANDCHILD'].includes(this._value.type);
  }

  // Check if this is a direct ascendant relationship
  get isDirectAscendant(): boolean {
    return ['PARENT', 'GRANDPARENT'].includes(this._value.type);
  }

  // Check if this is a spousal relationship
  get isSpousal(): boolean {
    return ['SPOUSE', 'EX_SPOUSE'].includes(this._value.type);
  }

  // Check if this is a sibling relationship
  get isSibling(): boolean {
    return ['SIBLING', 'HALF_SIBLING'].includes(this._value.type);
  }

  // Check if this relationship qualifies for inheritance
  get qualifiesForInheritance(): boolean {
    return this._value.inheritanceWeight > 0 && this._value.kenyanLawApplicable;
  }

  // Check if this is a parent-child relationship
  get isParentChild(): boolean {
    return ['CHILD', 'ADOPTED_CHILD', 'STEPCHILD', 'PARENT'].includes(this._value.type);
  }

  // Get relationship category for Kenyan law
  get kenyanCategory(): string {
    if (this.isSpousal) return 'SPOUSE';
    if (this.isDirectDescendant) return 'DESCENDANTS';
    if (this.isDirectAscendant) return 'ASCENDANTS';
    if (this.isSibling) return 'SIBLINGS';
    return 'EXTENDED_FAMILY';
  }

  // Get display name with strength
  get displayName(): string {
    const strengthPrefix = this._value.strength !== 'FULL' ? `${this._value.strength} ` : '';
    return `${strengthPrefix}${this._value.type.toLowerCase().replace('_', ' ')}`;
  }

  toJSON() {
    return {
      type: this._value.type,
      strength: this._value.strength,
      isBiological: this._value.isBiological,
      isLegal: this._value.isLegal,
      isCustomary: this._value.isCustomary,
      description: this._value.description,
      inheritanceWeight: this._value.inheritanceWeight,
      kenyanLawApplicable: this._value.kenyanLawApplicable,
      applicableSections: this._value.applicableSections,
      evidenceRequired: this._value.evidenceRequired,
      evidenceTypes: this._value.evidenceTypes,
      isDirectDescendant: this.isDirectDescendant,
      isDirectAscendant: this.isDirectAscendant,
      isSpousal: this.isSpousal,
      isSibling: this.isSibling,
      qualifiesForInheritance: this.qualifiesForInheritance,
      isParentChild: this.isParentChild,
      kenyanCategory: this.kenyanCategory,
      displayName: this.displayName,
    };
  }
}
