// domain/entities/family-relationship.entity.ts
import { InheritanceRights, RelationshipType } from '@prisma/client';

import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { InvalidRelationshipException } from '../exceptions/family.exception';

/**
 * FamilyRelationship Entity Props (Immutable)
 *
 * Design: Directed edge in the family graph
 * - fromMember -> toMember with specific relationship type
 * - Example: John (fromMember) is PARENT of Mary (toMember)
 * - Reciprocal: Mary is CHILD of John (separate edge)
 *
 * Kenyan Law Context:
 * - Determines inheritance rights (S. 35/36 LSA)
 * - Distinguishes biological vs adopted relationships
 * - Tracks customary law recognition
 * - Critical for next-of-kin determination
 */
export interface FamilyRelationshipProps {
  // References
  familyId: UniqueEntityID;
  fromMemberId: UniqueEntityID; // Subject of relationship
  toMemberId: UniqueEntityID; // Object of relationship

  // Relationship Type
  type: RelationshipType;
  strength: 'FULL' | 'HALF' | 'STEP' | 'ADOPTED'; // Relationship strength

  // Nature
  isBiological: boolean;
  isAdopted: boolean;

  // Adoption Details (if applicable)
  adoptionOrderId?: UniqueEntityID;
  adoptionOrderNumber?: string;
  adoptionCourt?: string;
  adoptionDate?: Date;
  isCustomaryAdoption: boolean;

  // Verification
  isVerified: boolean;
  verificationMethod?: string;
  verificationDocuments?: string[]; // Document IDs
  verifiedAt?: Date;
  verifiedBy?: UniqueEntityID;

  // Relationship Timeline
  relationshipStartDate?: Date;
  relationshipEndDate?: Date;
  endReason?: string;

  // Next-of-Kin Status
  isNextOfKin: boolean;
  nextOfKinPriority: number; // 1 = primary, 2 = secondary, etc.

  // Customary Law Recognition
  recognizedUnderCustomaryLaw: boolean;
  customaryCeremonyDetails?: CustomaryCeremonyDetails;

  // Legal Disputes
  isContested: boolean;
  contestationCaseNumber?: string;
  courtValidated: boolean;
  courtValidationDate?: Date;

  // Inheritance Rights (S. 35/36 LSA)
  inheritanceRights: InheritanceRights;
}

/**
 * Customary Ceremony Details
 * For relationships recognized under customary law
 */
export interface CustomaryCeremonyDetails {
  ceremonyType: string;
  ceremonyDate: Date;
  ceremonyLocation: string;
  elderWitnesses: Array<{
    name: string;
    age: number;
    role: string;
  }>;
  clanApproval: boolean;
}

/**
 * Factory Props
 */
export interface CreateFamilyRelationshipProps {
  familyId: string;
  fromMemberId: string;
  toMemberId: string;
  type: RelationshipType;

  // Nature
  isBiological?: boolean;
  isAdopted?: boolean;
  strength?: 'FULL' | 'HALF' | 'STEP' | 'ADOPTED';

  // Adoption
  adoptionOrderId?: string;
  adoptionOrderNumber?: string;
  adoptionCourt?: string;
  adoptionDate?: Date;
  isCustomaryAdoption?: boolean;

  // Verification
  isVerified?: boolean;
  verificationMethod?: string;
  verificationDocuments?: string[];

  // Timeline
  relationshipStartDate?: Date;

  // Next-of-Kin
  isNextOfKin?: boolean;
  nextOfKinPriority?: number;

  // Customary
  recognizedUnderCustomaryLaw?: boolean;
  customaryCeremonyDetails?: {
    ceremonyType: string;
    ceremonyDate: Date;
    ceremonyLocation: string;
    elderWitnesses: Array<{
      name: string;
      age: number;
      role: string;
    }>;
    clanApproval: boolean;
  };

  // Inheritance
  inheritanceRights?: InheritanceRights;
}

/**
 * FamilyRelationship Entity
 *
 * Represents directed edge in family graph.
 * Critical for S. 35/36 LSA intestate succession calculations.
 *
 * Examples:
 * - John is PARENT of Mary (biological)
 * - Mary is CHILD of John (reciprocal)
 * - Alice is SIBLING of Bob (HALF - same mother, different fathers)
 * - Charles is SPOUSE of Diana (through marriage)
 * - Adopted child has FULL inheritance rights
 *
 * Kenyan Law Considerations:
 * - Biological children: Full rights (S. 35 LSA)
 * - Adopted children: Full rights (Children Act 2022)
 * - Step-children: Limited/no rights (unless adopted)
 * - Half-siblings: Full rights (S. 38 LSA)
 * - Customary relationships: Recognized under S. 32 LSA
 */
export class FamilyRelationship extends Entity<FamilyRelationshipProps> {
  private constructor(id: UniqueEntityID, props: FamilyRelationshipProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.validate();
  }

  // =========================================================================
  // FACTORY METHODS
  // =========================================================================

  public static create(props: CreateFamilyRelationshipProps): FamilyRelationship {
    const id = new UniqueEntityID();
    const now = new Date();

    // Determine relationship strength
    const strength = FamilyRelationship.determineStrength(props);

    // Determine inheritance rights
    const inheritanceRights =
      props.inheritanceRights ||
      FamilyRelationship.determineInheritanceRights(props.type, props.isAdopted || false);

    const relationshipProps: FamilyRelationshipProps = {
      familyId: new UniqueEntityID(props.familyId),
      fromMemberId: new UniqueEntityID(props.fromMemberId),
      toMemberId: new UniqueEntityID(props.toMemberId),
      type: props.type,
      strength,

      // Nature
      isBiological: props.isBiological ?? true,
      isAdopted: props.isAdopted ?? false,

      // Adoption
      adoptionOrderId: props.adoptionOrderId
        ? new UniqueEntityID(props.adoptionOrderId)
        : undefined,
      adoptionOrderNumber: props.adoptionOrderNumber,
      adoptionCourt: props.adoptionCourt,
      adoptionDate: props.adoptionDate,
      isCustomaryAdoption: props.isCustomaryAdoption ?? false,

      // Verification
      isVerified: props.isVerified ?? false,
      verificationMethod: props.verificationMethod,
      verificationDocuments: props.verificationDocuments,

      // Timeline
      relationshipStartDate: props.relationshipStartDate || now,

      // Next-of-Kin
      isNextOfKin: props.isNextOfKin ?? false,
      nextOfKinPriority: props.nextOfKinPriority ?? 1,

      // Customary
      recognizedUnderCustomaryLaw: props.recognizedUnderCustomaryLaw ?? true,
      customaryCeremonyDetails: props.customaryCeremonyDetails,

      // Legal
      isContested: false,
      courtValidated: false,

      // Inheritance
      inheritanceRights,
    };

    return new FamilyRelationship(id, relationshipProps, now);
  }

  public static fromPersistence(
    id: string,
    props: FamilyRelationshipProps,
    createdAt: Date,
    updatedAt?: Date,
  ): FamilyRelationship {
    const entityId = new UniqueEntityID(id);
    const relationship = new FamilyRelationship(entityId, props, createdAt);

    if (updatedAt) {
      (relationship as any)._updatedAt = updatedAt;
    }

    return relationship;
  }

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  private static determineStrength(
    props: CreateFamilyRelationshipProps,
  ): 'FULL' | 'HALF' | 'STEP' | 'ADOPTED' {
    if (props.strength) return props.strength;

    if (props.isAdopted) return 'ADOPTED';

    // Default based on type
    switch (props.type) {
      case 'HALF_SIBLING':
        return 'HALF';
      case 'STEPCHILD':
      case 'EX_SPOUSE':
        return 'STEP';
      default:
        return 'FULL';
    }
  }

  private static determineInheritanceRights(
    type: RelationshipType,
    isAdopted: boolean,
  ): InheritanceRights {
    // Adopted children have full rights
    if (isAdopted) return InheritanceRights.FULL;

    switch (type) {
      case 'CHILD':
      case 'PARENT':
      case 'SIBLING':
      case 'HALF_SIBLING':
      case 'SPOUSE':
        return InheritanceRights.FULL;

      case 'STEPCHILD':
        return InheritanceRights.PARTIAL;

      case 'COUSIN':
      case 'NIECE_NEPHEW':
      case 'AUNT_UNCLE':
      case 'GRANDCHILD':
      case 'GRANDPARENT':
        return InheritanceRights.CUSTOMARY;

      default:
        return InheritanceRights.NONE;
    }
  }

  // =========================================================================
  // VALIDATION
  // =========================================================================

  public validate(): void {
    // Cannot relate to self
    if (this.props.fromMemberId.equals(this.props.toMemberId)) {
      throw new InvalidRelationshipException('A person cannot have a relationship with themselves');
    }

    // Adopted relationships must have adoption details
    if (this.props.isAdopted && !this.props.adoptionOrderId && !this.props.adoptionOrderNumber) {
      console.warn('Adopted relationship should have adoption order reference');
    }

    // Verified relationships need verification method
    if (this.props.isVerified && !this.props.verificationMethod) {
      console.warn('Verified relationship should have verification method');
    }

    // Next-of-kin priority must be positive
    if (this.props.isNextOfKin && this.props.nextOfKinPriority < 1) {
      throw new InvalidRelationshipException('Next-of-kin priority must be 1 or greater');
    }

    // Relationship end must be after start
    if (this.props.relationshipEndDate && this.props.relationshipStartDate) {
      if (this.props.relationshipEndDate < this.props.relationshipStartDate) {
        throw new InvalidRelationshipException('Relationship end date cannot be before start date');
      }
    }
  }

  // =========================================================================
  // BUSINESS LOGIC
  // =========================================================================

  public verify(
    verificationMethod: string,
    verifiedBy: string,
    documents?: string[],
  ): FamilyRelationship {
    this.ensureNotDeleted();

    const newProps: FamilyRelationshipProps = {
      ...this.props,
      isVerified: true,
      verificationMethod,
      verificationDocuments: documents,
      verifiedAt: new Date(),
      verifiedBy: new UniqueEntityID(verifiedBy),
    };

    return new FamilyRelationship(this._id, newProps, this._createdAt);
  }

  public designateAsNextOfKin(priority: number): FamilyRelationship {
    this.ensureNotDeleted();

    if (priority < 1) {
      throw new InvalidRelationshipException('Priority must be 1 or greater');
    }

    const newProps: FamilyRelationshipProps = {
      ...this.props,
      isNextOfKin: true,
      nextOfKinPriority: priority,
    };

    return new FamilyRelationship(this._id, newProps, this._createdAt);
  }

  public removeNextOfKinDesignation(): FamilyRelationship {
    this.ensureNotDeleted();

    const newProps: FamilyRelationshipProps = {
      ...this.props,
      isNextOfKin: false,
    };

    return new FamilyRelationship(this._id, newProps, this._createdAt);
  }

  public endRelationship(endDate: Date, reason: string): FamilyRelationship {
    this.ensureNotDeleted();

    if (this.props.relationshipEndDate) {
      throw new InvalidRelationshipException('Relationship already ended');
    }

    const newProps: FamilyRelationshipProps = {
      ...this.props,
      relationshipEndDate: endDate,
      endReason: reason,
    };

    return new FamilyRelationship(this._id, newProps, this._createdAt);
  }

  public contest(caseNumber: string): FamilyRelationship {
    this.ensureNotDeleted();

    const newProps: FamilyRelationshipProps = {
      ...this.props,
      isContested: true,
      contestationCaseNumber: caseNumber,
    };

    return new FamilyRelationship(this._id, newProps, this._createdAt);
  }

  public validateByCourt(validationDate: Date): FamilyRelationship {
    this.ensureNotDeleted();

    const newProps: FamilyRelationshipProps = {
      ...this.props,
      courtValidated: true,
      courtValidationDate: validationDate,
      isContested: false, // Court validation resolves contestation
    };

    return new FamilyRelationship(this._id, newProps, this._createdAt);
  }

  public updateInheritanceRights(rights: InheritanceRights): FamilyRelationship {
    this.ensureNotDeleted();

    const newProps: FamilyRelationshipProps = {
      ...this.props,
      inheritanceRights: rights,
    };

    return new FamilyRelationship(this._id, newProps, this._createdAt);
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get familyId(): UniqueEntityID {
    return this.props.familyId;
  }

  get fromMemberId(): UniqueEntityID {
    return this.props.fromMemberId;
  }

  get toMemberId(): UniqueEntityID {
    return this.props.toMemberId;
  }

  get type(): RelationshipType {
    return this.props.type;
  }

  get strength(): 'FULL' | 'HALF' | 'STEP' | 'ADOPTED' {
    return this.props.strength;
  }

  get isBiological(): boolean {
    return this.props.isBiological;
  }

  get isAdopted(): boolean {
    return this.props.isAdopted;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get isNextOfKin(): boolean {
    return this.props.isNextOfKin;
  }

  get nextOfKinPriority(): number {
    return this.props.nextOfKinPriority;
  }

  get inheritanceRights(): InheritanceRights {
    return this.props.inheritanceRights;
  }

  get isContested(): boolean {
    return this.props.isContested;
  }

  get courtValidated(): boolean {
    return this.props.courtValidated;
  }

  get recognizedUnderCustomaryLaw(): boolean {
    return this.props.recognizedUnderCustomaryLaw;
  }

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  get isActive(): boolean {
    return !this.props.relationshipEndDate;
  }

  get hasFullInheritanceRights(): boolean {
    return this.props.inheritanceRights === InheritanceRights.FULL;
  }

  get requiresCourtValidation(): boolean {
    return this.props.isAdopted || this.props.isContested;
  }

  get isLegallyRecognized(): boolean {
    return (
      (this.props.isBiological && this.props.isVerified) ||
      (this.props.isAdopted && !!this.props.adoptionOrderId) ||
      this.props.courtValidated
    );
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  public toPlainObject(): Record<string, any> {
    return {
      id: this._id.toString(),
      familyId: this.props.familyId.toString(),
      fromMemberId: this.props.fromMemberId.toString(),
      toMemberId: this.props.toMemberId.toString(),
      type: this.props.type,
      strength: this.props.strength,
      isBiological: this.props.isBiological,
      isAdopted: this.props.isAdopted,
      adoptionOrderId: this.props.adoptionOrderId?.toString(),
      adoptionOrderNumber: this.props.adoptionOrderNumber,
      adoptionCourt: this.props.adoptionCourt,
      adoptionDate: this.props.adoptionDate,
      isCustomaryAdoption: this.props.isCustomaryAdoption,
      isVerified: this.props.isVerified,
      verificationMethod: this.props.verificationMethod,
      verificationDocuments: this.props.verificationDocuments,
      verifiedAt: this.props.verifiedAt,
      verifiedBy: this.props.verifiedBy?.toString(),
      relationshipStartDate: this.props.relationshipStartDate,
      relationshipEndDate: this.props.relationshipEndDate,
      endReason: this.props.endReason,
      isNextOfKin: this.props.isNextOfKin,
      nextOfKinPriority: this.props.nextOfKinPriority,
      recognizedUnderCustomaryLaw: this.props.recognizedUnderCustomaryLaw,
      customaryCeremonyDetails: this.props.customaryCeremonyDetails,
      isContested: this.props.isContested,
      contestationCaseNumber: this.props.contestationCaseNumber,
      courtValidated: this.props.courtValidated,
      courtValidationDate: this.props.courtValidationDate,
      inheritanceRights: this.props.inheritanceRights,
      isActive: this.isActive,
      hasFullInheritanceRights: this.hasFullInheritanceRights,
      requiresCourtValidation: this.requiresCourtValidation,
      isLegallyRecognized: this.isLegallyRecognized,
      version: this._version,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
