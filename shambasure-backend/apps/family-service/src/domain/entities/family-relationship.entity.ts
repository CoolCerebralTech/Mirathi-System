// domain/entities/family-relationship.entity.ts
import { Entity } from '../base/entity';
import { NextOfKinDesignatedEvent } from '../events/relationship-events/next-of-kin-designated.event';
import { RelationshipEstablishedEvent } from '../events/relationship-events/relationship-established.event';
import { RelationshipVerifiedEvent } from '../events/relationship-events/relationship-verified.event';
import { InvalidRelationshipException } from '../exceptions/relationship.exception';
import { InheritanceRights } from '../value-objects/legal/inheritance-rights.vo';
import { RelationshipType } from '../value-objects/legal/relationship-type.vo';

// Enums matching Prisma Schema
export enum RelationshipStrength {
  FULL = 'FULL', // e.g., Same mother and father
  HALF = 'HALF', // e.g., Same father, different mother (Polygamy context)
  STEP = 'STEP', // e.g., Spouse's child from previous marriage
  ADOPTED = 'ADOPTED', // Legal adoption
  FOSTER = 'FOSTER', // Care without full legal adoption
}

export interface FamilyRelationshipProps {
  id: string;
  familyId: string;

  // The Directional Edge: From A -> To B
  fromMemberId: string; // e.g., The Father
  toMemberId: string; // e.g., The Child

  type: RelationshipType; // e.g., PARENT

  // Biological vs Legal
  isBiological: boolean;
  isAdopted: boolean;

  // Adoption Details (if applicable)
  adoptionOrderNumber?: string;
  adoptionCourt?: string;
  adoptionDate?: Date;
  isCustomaryAdoption: boolean; // "Mwana wa kuhirirya" etc.

  // Relationship Metadata
  strength: RelationshipStrength;
  startDate?: Date;
  endDate?: Date;
  endReason?: string;

  // Verification
  isVerified: boolean;
  verificationMethod?: string; // "BIRTH_CERTIFICATE", "DNA", "AFFIDAVIT"
  verifiedBy?: string;
  verifiedAt?: Date;

  // Next of Kin (NOK) Logic
  isNextOfKin: boolean;
  nextOfKinPriority: number; // 1 = Primary, 2 = Secondary

  // Customary Law
  recognizedUnderCustomaryLaw: boolean;
  customaryCeremonyDetails?: string;

  // Legal Dispute Status
  isContested: boolean;
  contestationCaseNumber?: string;
  courtValidated: boolean;

  // Inheritance
  inheritanceRights: InheritanceRights;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRelationshipProps {
  familyId: string;
  fromMemberId: string;
  toMemberId: string;
  type: RelationshipType;
  strength?: RelationshipStrength;
  isBiological?: boolean;
  isAdopted?: boolean;
  adoptionOrderNumber?: string;
  isCustomaryAdoption?: boolean;
  startDate?: Date;
}

export class FamilyRelationship extends Entity<FamilyRelationshipProps> {
  private constructor(props: FamilyRelationshipProps) {
    super(props);
    this.validate();
  }

  static create(props: CreateRelationshipProps): FamilyRelationship {
    const id = this.generateId();
    const now = new Date();

    // Default Strength calculation
    let strength = props.strength || RelationshipStrength.FULL;
    if (props.isAdopted) strength = RelationshipStrength.ADOPTED;

    // Default Inheritance Rights
    // Under Kenya LSA, adopted children have same rights as biological (S.29)
    // Step-children do NOT strictly have rights unless dependent (S.29)
    let rights = InheritanceRights.FULL;
    if (strength === RelationshipStrength.STEP) {
      rights = InheritanceRights.PARTIAL; // Subject to dependency proof
    }

    const relationship = new FamilyRelationship({
      id,
      familyId: props.familyId,
      fromMemberId: props.fromMemberId,
      toMemberId: props.toMemberId,
      type: props.type,
      isBiological: props.isBiological ?? true,
      isAdopted: props.isAdopted ?? false,
      adoptionOrderNumber: props.adoptionOrderNumber,
      adoptionCourt: undefined,
      adoptionDate: undefined,
      isCustomaryAdoption: props.isCustomaryAdoption ?? false,
      strength,
      startDate: props.startDate || now,
      isVerified: false, // Default to unverified
      isNextOfKin: false,
      nextOfKinPriority: 99, // Low priority by default
      recognizedUnderCustomaryLaw: true,
      isContested: false,
      courtValidated: false,
      inheritanceRights: rights,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    relationship.addDomainEvent(
      new RelationshipEstablishedEvent({
        relationshipId: id,
        familyId: props.familyId,
        fromMemberId: props.fromMemberId,
        toMemberId: props.toMemberId,
        type: props.type,
        strength,
        timestamp: now,
      }),
    );

    return relationship;
  }

  static createFromProps(props: FamilyRelationshipProps): FamilyRelationship {
    return new FamilyRelationship(props);
  }

  // --- Domain Logic ---

  /**
   * Verifies the relationship using legal documents.
   * e.g., Uploading a Birth Certificate linking Parent to Child.
   */
  verify(method: string, verifierId: string): void {
    if (this.props.isContested) {
      throw new InvalidRelationshipException(
        'Cannot verify a relationship that is currently contested in court.',
      );
    }

    this.props.isVerified = true;
    this.props.verificationMethod = method;
    this.props.verifiedBy = verifierId;
    this.props.verifiedAt = new Date();
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new RelationshipVerifiedEvent({
        relationshipId: this.id,
        method,
        verifiedBy: verifierId,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Designates this relationship as a Next of Kin (NOK).
   * Used for administration priority (P&A Forms).
   */
  designateAsNextOfKin(priority: number): void {
    if (priority < 1) throw new InvalidRelationshipException('Priority must be 1 or greater.');

    this.props.isNextOfKin = true;
    this.props.nextOfKinPriority = priority;
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new NextOfKinDesignatedEvent({
        relationshipId: this.id,
        familyId: this.props.familyId,
        memberId: this.props.toMemberId, // The person being designated
        priority,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Handles formal adoption (Statutory or Customary).
   * Updates inheritance rights to FULL as per Children Act & LSA.
   */
  formalizeAdoption(orderNumber: string, court: string, date: Date, isCustomary: boolean): void {
    this.props.isAdopted = true;
    this.props.isBiological = false;
    this.props.adoptionOrderNumber = orderNumber;
    this.props.adoptionCourt = court;
    this.props.adoptionDate = date;
    this.props.isCustomaryAdoption = isCustomary;
    this.props.strength = RelationshipStrength.ADOPTED;

    // In Kenya, adopted children have full inheritance rights
    this.props.inheritanceRights = InheritanceRights.FULL;

    this.props.updatedAt = new Date();
    this.props.version++;
  }

  /**
   * Marks the relationship as contested (e.g., DNA dispute).
   * Suspends inheritance rights until resolved.
   */
  contest(caseNumber: string): void {
    this.props.isContested = true;
    this.props.contestationCaseNumber = caseNumber;
    this.props.inheritanceRights = InheritanceRights.PENDING; // Suspend rights
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  /**
   * Resolves a contestation via Court Order.
   */
  resolveContest(isValid: boolean, courtOrderNumber: string): void {
    this.props.isContested = false;
    this.props.courtValidated = true;
    this.props.contestationCaseNumber = undefined; // Clear active case

    // Restore or Revoke rights based on ruling
    if (isValid) {
      this.props.inheritanceRights =
        this.props.strength === RelationshipStrength.STEP
          ? InheritanceRights.PARTIAL
          : InheritanceRights.FULL;
    } else {
      this.props.inheritanceRights = InheritanceRights.NONE;
      this.props.endReason = `Court Ruling: ${courtOrderNumber}`;
    }

    this.props.updatedAt = new Date();
    this.props.version++;
  }

  private validate(): void {
    if (this.props.fromMemberId === this.props.toMemberId) {
      throw new InvalidRelationshipException(
        'A member cannot have a relationship with themselves.',
      );
    }
  }

  private static generateId(): string {
    return `rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }
  get type(): RelationshipType {
    return this.props.type;
  }
  get strength(): RelationshipStrength {
    return this.props.strength;
  }
  get inheritanceRights(): InheritanceRights {
    return this.props.inheritanceRights;
  }
  get isVerified(): boolean {
    return this.props.isVerified;
  }
  get isContested(): boolean {
    return this.props.isContested;
  }

  // LSA S.29 Logic Helper
  get qualifiesForInheritance(): boolean {
    return (
      this.inheritanceRights === InheritanceRights.FULL ||
      this.inheritanceRights === InheritanceRights.CUSTOMARY ||
      (this.inheritanceRights === InheritanceRights.PARTIAL &&
        /* requires dependency check externally */ true)
    );
  }

  toJSON() {
    return {
      id: this.id,
      familyId: this.props.familyId,
      fromMemberId: this.props.fromMemberId,
      toMemberId: this.props.toMemberId,
      type: this.props.type,
      strength: this.props.strength,
      isBiological: this.props.isBiological,
      isAdopted: this.props.isAdopted,
      adoptionOrderNumber: this.props.adoptionOrderNumber,
      isCustomaryAdoption: this.props.isCustomaryAdoption,
      isVerified: this.props.isVerified,
      isNextOfKin: this.props.isNextOfKin,
      inheritanceRights: this.props.inheritanceRights,
      isContested: this.props.isContested,
      version: this.props.version,
      createdAt: this.props.createdAt,
    };
  }
}
