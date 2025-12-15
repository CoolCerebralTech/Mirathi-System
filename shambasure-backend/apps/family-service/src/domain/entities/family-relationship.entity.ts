import { RelationshipType } from '@prisma/client';

import { Entity } from '../base/entity';
import { NextOfKinDesignatedEvent } from '../events/relationship-events/next-of-kin-designated.event';
import { RelationshipEstablishedEvent } from '../events/relationship-events/relationship-established.event';
import { RelationshipVerifiedEvent } from '../events/relationship-events/relationship-verified.event';
import { InvalidRelationshipException } from '../exceptions/relationship.exception';
import {
  InheritanceRights,
  InheritanceRightsType,
} from '../value-objects/legal/inheritance-rights.vo';
import { RelationshipTypeVO } from '../value-objects/legal/relationship-type.vo';

export enum RelationshipStrength {
  FULL = 'FULL',
  HALF = 'HALF',
  STEP = 'STEP',
  ADOPTED = 'ADOPTED',
  FOSTER = 'FOSTER',
}

export interface FamilyRelationshipProps {
  id: string;
  familyId: string;

  // Relationship edges
  fromMemberId: string;
  toMemberId: string;
  type: RelationshipType;

  // Biological vs Legal
  isBiological: boolean;
  isAdopted: boolean;

  // Adoption details
  adoptionOrderNumber?: string;
  adoptionCourt?: string;
  adoptionDate?: Date;
  isCustomaryAdoption: boolean;

  // Relationship metadata
  strength: string; // "FULL", "HALF", "STEP", "ADOPTED"
  relationshipStartDate?: Date;
  relationshipEndDate?: Date;
  endReason?: string;

  // Verification
  isVerified: boolean;
  verificationMethod?: string;
  verificationDocuments?: any;
  verifiedAt?: Date;
  verifiedBy?: string;

  // Next of Kin
  isNextOfKin: boolean;
  nextOfKinPriority: number;

  // Customary law
  recognizedUnderCustomaryLaw: boolean;
  customaryCeremonyDetails?: any;

  // Legal disputes
  isContested: boolean;
  contestationCaseNumber?: string;
  courtValidated: boolean;

  // Inheritance rights (Value Object)
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
  strength?: string;
  isBiological?: boolean;
  isAdopted?: boolean;
  adoptionOrderNumber?: string;
  adoptionCourt?: string;
  adoptionDate?: Date;
  isCustomaryAdoption?: boolean;
  relationshipStartDate?: Date;
  verificationDocuments?: any;
  customaryCeremonyDetails?: any;
}

export class FamilyRelationship extends Entity<FamilyRelationshipProps> {
  private constructor(props: FamilyRelationshipProps) {
    super(props.id, props);
    this.validate();
  }

  static create(props: CreateRelationshipProps): FamilyRelationship {
    const id = this.generateId();
    const now = new Date();

    // Determine strength
    let strength = props.strength || 'FULL';
    if (props.isAdopted) strength = 'ADOPTED';

    // 1. Create RelationshipTypeVO (Required for InheritanceRights)
    // We assume RelationshipTypeVO has a create method that accepts the Prisma enum
    const relationshipTypeVO = RelationshipTypeVO.create(props.type);

    // 2. Determine initial Inheritance Rights Type and Share
    let rightsType: InheritanceRightsType = 'FULL';
    let sharePercentage = 100;

    if (props.type === 'STEPCHILD' || props.type === 'EX_SPOUSE') {
      rightsType = 'PARTIAL';
      sharePercentage = 50; // Default logic
    } else if (
      props.type === 'GUARDIAN' ||
      props.type === 'OTHER' ||
      props.type === 'COUSIN' ||
      props.type === 'AUNT_UNCLE' ||
      props.type === 'NIECE_NEPHEW'
    ) {
      rightsType = 'NONE';
      sharePercentage = 0;
    }

    // Override for adopted children (full rights under Children Act)
    if (props.isAdopted) {
      rightsType = 'FULL';
      sharePercentage = 100;
    }

    // 3. Create InheritanceRights VO
    const inheritanceRights = InheritanceRights.create(
      rightsType,
      relationshipTypeVO,
      sharePercentage,
    );

    const relationship = new FamilyRelationship({
      id,
      familyId: props.familyId,
      fromMemberId: props.fromMemberId,
      toMemberId: props.toMemberId,
      type: props.type,
      isBiological: props.isBiological ?? true,
      isAdopted: props.isAdopted ?? false,
      adoptionOrderNumber: props.adoptionOrderNumber,
      adoptionCourt: props.adoptionCourt,
      adoptionDate: props.adoptionDate,
      isCustomaryAdoption: props.isCustomaryAdoption ?? false,
      strength,
      relationshipStartDate: props.relationshipStartDate || now,
      isVerified: false,
      verificationDocuments: props.verificationDocuments,
      isNextOfKin: false,
      nextOfKinPriority: 99,
      recognizedUnderCustomaryLaw: true,
      customaryCeremonyDetails: props.customaryCeremonyDetails,
      isContested: false,
      courtValidated: false,
      inheritanceRights,
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
        isBiological: props.isBiological ?? true,
        isAdopted: props.isAdopted ?? false,
      }),
    );

    return relationship;
  }

  static createFromProps(props: FamilyRelationshipProps): FamilyRelationship {
    return new FamilyRelationship(props);
  }

  // --- Domain Logic ---

  verify(params: { method: string; verifierId: string; documents?: any }): void {
    if (this.props.isContested) {
      throw new InvalidRelationshipException(
        'Cannot verify a relationship that is currently contested in court.',
      );
    }

    this.props.isVerified = true;
    this.props.verificationMethod = params.method;
    this.props.verifiedBy = params.verifierId;
    this.props.verifiedAt = new Date();
    if (params.documents) {
      this.props.verificationDocuments = params.documents;
    }
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new RelationshipVerifiedEvent({
        relationshipId: this.id,
        method: params.method,
        verifiedBy: params.verifierId,
        verificationDocuments: params.documents,
      }),
    );
  }

  designateAsNextOfKin(priority: number, legalBasis?: string, documentReference?: string): void {
    if (priority < 1) {
      throw new InvalidRelationshipException('Priority must be 1 or greater.');
    }

    this.props.isNextOfKin = true;
    this.props.nextOfKinPriority = priority;
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new NextOfKinDesignatedEvent({
        relationshipId: this.id,
        familyId: this.props.familyId,
        memberId: this.props.toMemberId,
        priority,
        legalBasis,
        documentReference,
      }),
    );
  }

  formalizeAdoption(params: {
    orderNumber: string;
    court: string;
    date: Date;
    isCustomary: boolean;
    hasConsents?: any;
    consentDocuments?: string[];
    childWelfareReport?: string;
    suitabilityReport?: string;
  }): void {
    this.props.isAdopted = true;
    this.props.isBiological = false;
    this.props.adoptionOrderNumber = params.orderNumber;
    this.props.adoptionCourt = params.court;
    this.props.adoptionDate = params.date;
    this.props.isCustomaryAdoption = params.isCustomary;
    this.props.strength = 'ADOPTED';

    // Update Inheritance Rights to FULL
    this.props.inheritanceRights = this.props.inheritanceRights.updateRightsType('FULL');

    this.props.updatedAt = new Date();
    this.props.version++;
  }

  contest(caseNumber: string): void {
    this.props.isContested = true;
    this.props.contestationCaseNumber = caseNumber;
    // Set rights to PENDING via VO method
    this.props.inheritanceRights = this.props.inheritanceRights.disputeRights(
      `Court case: ${caseNumber}`,
    );

    this.props.updatedAt = new Date();
    this.props.version++;
  }

  resolveContest(isValid: boolean, courtOrderNumber: string): void {
    this.props.isContested = false;
    this.props.courtValidated = true;
    this.props.contestationCaseNumber = undefined;

    if (isValid) {
      const rightsType =
        this.props.strength === 'STEP' || this.props.type === 'STEPCHILD' ? 'PARTIAL' : 'FULL';

      this.props.inheritanceRights = this.props.inheritanceRights.resolveDispute(
        courtOrderNumber,
        new Date(),
        rightsType,
        rightsType === 'FULL' ? 100 : 50,
      );
    } else {
      this.props.inheritanceRights = this.props.inheritanceRights.resolveDispute(
        courtOrderNumber,
        new Date(),
        'NONE',
        0,
      );
      this.props.relationshipEndDate = new Date();
      this.props.endReason = `Court Ruling: ${courtOrderNumber}`;
    }

    this.props.updatedAt = new Date();
    this.props.version++;
  }

  updateCustomaryCeremonyDetails(details: any): void {
    this.props.customaryCeremonyDetails = details;
    this.props.recognizedUnderCustomaryLaw = true;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  markEnded(endDate: Date, reason: string): void {
    this.props.relationshipEndDate = endDate;
    this.props.endReason = reason;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  updateInheritanceRights(rights: InheritanceRights): void {
    this.props.inheritanceRights = rights;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  private validate(): void {
    if (this.props.fromMemberId === this.props.toMemberId) {
      throw new InvalidRelationshipException(
        'A member cannot have a relationship with themselves.',
      );
    }

    // Validate that strength is one of the allowed values
    const validStrengths = ['FULL', 'HALF', 'STEP', 'ADOPTED', 'FOSTER'];
    if (!validStrengths.includes(this.props.strength)) {
      throw new InvalidRelationshipException(
        `Invalid relationship strength: ${this.props.strength}`,
      );
    }
  }

  private static generateId(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : `rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }
  get type(): RelationshipType {
    return this.props.type;
  }
  get strength(): string {
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
  get isNextOfKin(): boolean {
    return this.props.isNextOfKin;
  }
  get nextOfKinPriority(): number {
    return this.props.nextOfKinPriority;
  }
  get familyId(): string {
    return this.props.familyId;
  }
  get fromMemberId(): string {
    return this.props.fromMemberId;
  }
  get toMemberId(): string {
    return this.props.toMemberId;
  }
  get isBiological(): boolean {
    return this.props.isBiological;
  }
  get isAdopted(): boolean {
    return this.props.isAdopted;
  }
  get isCustomaryAdoption(): boolean {
    return this.props.isCustomaryAdoption;
  }
  get recognizedUnderCustomaryLaw(): boolean {
    return this.props.recognizedUnderCustomaryLaw;
  }
  get courtValidated(): boolean {
    return this.props.courtValidated;
  }

  get qualifiesForInheritance(): boolean {
    return (
      this.props.inheritanceRights.isEffective && this.props.inheritanceRights.sharePercentage > 0
    );
  }

  // For S.29 dependency assessment
  get isDependantRelationship(): boolean {
    const dependantTypes: RelationshipType[] = [
      'CHILD',
      'ADOPTED_CHILD',
      'STEPCHILD',
      'SPOUSE',
      'PARENT',
    ];

    return (
      dependantTypes.includes(this.props.type) &&
      (this.props.isBiological || this.props.isAdopted || this.props.type === 'SPOUSE')
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
      adoptionCourt: this.props.adoptionCourt,
      adoptionDate: this.props.adoptionDate,
      isCustomaryAdoption: this.props.isCustomaryAdoption,
      relationshipStartDate: this.props.relationshipStartDate,
      relationshipEndDate: this.props.relationshipEndDate,
      endReason: this.props.endReason,
      isVerified: this.props.isVerified,
      verificationMethod: this.props.verificationMethod,
      verificationDocuments: this.props.verificationDocuments,
      verifiedAt: this.props.verifiedAt,
      verifiedBy: this.props.verifiedBy,
      isNextOfKin: this.props.isNextOfKin,
      nextOfKinPriority: this.props.nextOfKinPriority,
      recognizedUnderCustomaryLaw: this.props.recognizedUnderCustomaryLaw,
      customaryCeremonyDetails: this.props.customaryCeremonyDetails,
      isContested: this.props.isContested,
      contestationCaseNumber: this.props.contestationCaseNumber,
      courtValidated: this.props.courtValidated,
      inheritanceRights: this.props.inheritanceRights.toJSON(),
      version: this.props.version,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
