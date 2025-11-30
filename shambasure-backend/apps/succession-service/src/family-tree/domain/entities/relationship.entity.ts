import { AggregateRoot } from '@nestjs/cqrs';
import {
  DependencyLevel,
  InheritanceRights,
  Prisma,
  RelationshipGuardianshipType,
  RelationshipType,
} from '@prisma/client';

import { RelationshipCreatedEvent } from '../events/relationship-created.event';
import { RelationshipMetadataUpdatedEvent } from '../events/relationship-metadata-updated.event';
import { RelationshipRemovedEvent } from '../events/relationship-removed.event';
import { RelationshipVerifiedEvent } from '../events/relationship-verified.event';

// -----------------------------------------------------------------------------
// VALUE OBJECTS & INTERFACES
// -----------------------------------------------------------------------------

export class KenyanRelationshipVerification {
  constructor(
    public readonly isVerified: boolean,
    public readonly verificationMethod: string | null,
    public readonly verifiedAt: Date | null,
    public readonly verifiedBy: string | null,
    public readonly verificationNotes: string | null,
    public readonly verificationDocuments: string[], // Document IDs
  ) {}
}

export class KenyanInheritanceContext {
  constructor(
    public readonly dependencyLevel: DependencyLevel,
    public readonly inheritanceRights: InheritanceRights,
    public readonly traditionalInheritanceWeight: number,
  ) {}
}

// Relationship Reconstitution Interface matching Prisma schema
export interface RelationshipReconstitutionProps {
  id: string;
  familyId: string;
  fromMemberId: string;
  toMemberId: string;
  type: RelationshipType;

  // Kenyan Metadata
  isAdopted: boolean;
  adoptionOrderNumber: string | null;
  isBiological: boolean;
  bornOutOfWedlock: boolean;
  clanRelationship: string | null;
  traditionalRole: string | null;
  isCustomaryAdoption: boolean;
  adoptionDate: Date | null;
  guardianshipType: RelationshipGuardianshipType | null;
  courtOrderNumber: string | null;
  dependencyLevel: DependencyLevel;
  inheritanceRights: InheritanceRights;
  traditionalInheritanceWeight: number | null;

  // Verification
  isVerified: boolean;
  verificationMethod: string | null;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  verificationNotes: string | null;
  verificationDocuments: Prisma.JsonValue;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// AGGREGATE ROOT: RELATIONSHIP
// -----------------------------------------------------------------------------

export class Relationship extends AggregateRoot {
  private readonly id: string;
  private readonly familyId: string;
  private readonly fromMemberId: string;
  private readonly toMemberId: string;
  private readonly type: RelationshipType;

  // Kenyan Metadata
  private isAdopted: boolean;
  private adoptionOrderNumber: string | null;
  private isBiological: boolean;
  private bornOutOfWedlock: boolean;
  private clanRelationship: string | null;
  private traditionalRole: string | null;
  private isCustomaryAdoption: boolean;
  private adoptionDate: Date | null;
  private guardianshipType: RelationshipGuardianshipType | null;
  private courtOrderNumber: string | null;
  private dependencyLevel: DependencyLevel;
  private inheritanceRights: InheritanceRights;
  private traditionalInheritanceWeight: number | null;

  // Verification
  private isVerified: boolean;
  private verificationMethod: string | null;
  private verifiedAt: Date | null;
  private verifiedBy: string | null;
  private verificationNotes: string | null;
  private verificationDocuments: string[];

  // Timestamps
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    familyId: string,
    fromMemberId: string,
    toMemberId: string,
    type: RelationshipType,
    // Lifecycle injection for reconstitution
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super();

    // Basic Validation
    if (fromMemberId === toMemberId) {
      throw new Error(
        'A family member cannot have a relationship with themselves under Kenyan law.',
      );
    }

    this.id = id;
    this.familyId = familyId;
    this.fromMemberId = fromMemberId;
    this.toMemberId = toMemberId;
    this.type = type;

    // Defaults
    this.isAdopted = false;
    this.adoptionOrderNumber = null;
    this.isBiological = true;
    this.bornOutOfWedlock = false;
    this.clanRelationship = null;
    this.traditionalRole = null;
    this.isCustomaryAdoption = false;
    this.adoptionDate = null;
    this.guardianshipType = null;
    this.courtOrderNumber = null;
    this.dependencyLevel = DependencyLevel.NONE;
    this.inheritanceRights = InheritanceRights.FULL;
    this.traditionalInheritanceWeight = 1.0;

    this.isVerified = false;
    this.verificationMethod = null;
    this.verifiedAt = null;
    this.verifiedBy = null;
    this.verificationNotes = null;
    this.verificationDocuments = [];

    // Lifecycle
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    id: string,
    familyId: string,
    fromMemberId: string,
    toMemberId: string,
    type: RelationshipType,
    details?: {
      isAdopted?: boolean;
      adoptionOrderNumber?: string;
      isBiological?: boolean;
      bornOutOfWedlock?: boolean;
      clanRelationship?: string;
      traditionalRole?: string;
      isCustomaryAdoption?: boolean;
      adoptionDate?: Date;
      guardianshipType?: RelationshipGuardianshipType;
      courtOrderNumber?: string;
      dependencyLevel?: DependencyLevel;
      inheritanceRights?: InheritanceRights;
      traditionalInheritanceWeight?: number;
    },
  ): Relationship {
    const relationship = new Relationship(id, familyId, fromMemberId, toMemberId, type);

    // Apply details
    if (details) {
      if (details.isAdopted !== undefined) relationship.isAdopted = details.isAdopted;
      if (details.adoptionOrderNumber)
        relationship.adoptionOrderNumber = details.adoptionOrderNumber;
      if (details.isBiological !== undefined) relationship.isBiological = details.isBiological;
      if (details.bornOutOfWedlock !== undefined)
        relationship.bornOutOfWedlock = details.bornOutOfWedlock;
      if (details.clanRelationship) relationship.clanRelationship = details.clanRelationship;
      if (details.traditionalRole) relationship.traditionalRole = details.traditionalRole;
      if (details.isCustomaryAdoption !== undefined)
        relationship.isCustomaryAdoption = details.isCustomaryAdoption;
      if (details.adoptionDate) relationship.adoptionDate = details.adoptionDate;
      if (details.guardianshipType) relationship.guardianshipType = details.guardianshipType;
      if (details.courtOrderNumber) relationship.courtOrderNumber = details.courtOrderNumber;
      if (details.dependencyLevel) relationship.dependencyLevel = details.dependencyLevel;
      if (details.inheritanceRights) relationship.inheritanceRights = details.inheritanceRights;
      if (details.traditionalInheritanceWeight !== undefined)
        relationship.traditionalInheritanceWeight = details.traditionalInheritanceWeight;
    }

    relationship.calculateInheritanceContext();

    relationship.apply(
      new RelationshipCreatedEvent(
        id,
        familyId,
        fromMemberId,
        toMemberId,
        type,
        relationship.getKenyanMetadata(),
      ),
    );

    return relationship;
  }

  static reconstitute(props: RelationshipReconstitutionProps): Relationship {
    const relationship = new Relationship(
      props.id,
      props.familyId,
      props.fromMemberId,
      props.toMemberId,
      props.type,
      props.createdAt,
      props.updatedAt,
    );

    relationship.isAdopted = props.isAdopted;
    relationship.adoptionOrderNumber = props.adoptionOrderNumber;
    relationship.isBiological = props.isBiological;
    relationship.bornOutOfWedlock = props.bornOutOfWedlock;
    relationship.clanRelationship = props.clanRelationship;
    relationship.traditionalRole = props.traditionalRole;
    relationship.isCustomaryAdoption = props.isCustomaryAdoption;
    relationship.adoptionDate = props.adoptionDate;
    relationship.guardianshipType = props.guardianshipType;
    relationship.courtOrderNumber = props.courtOrderNumber;
    relationship.dependencyLevel = props.dependencyLevel;
    relationship.inheritanceRights = props.inheritanceRights;
    relationship.traditionalInheritanceWeight = props.traditionalInheritanceWeight;

    relationship.isVerified = props.isVerified;
    relationship.verificationMethod = props.verificationMethod;
    relationship.verifiedAt = props.verifiedAt;
    relationship.verifiedBy = props.verifiedBy;
    relationship.verificationNotes = props.verificationNotes;

    // JSON Parsing
    relationship.verificationDocuments = Array.isArray(props.verificationDocuments)
      ? (props.verificationDocuments as string[])
      : [];

    return relationship;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  verify(
    method: string,
    verifiedBy: string,
    verificationNotes?: string,
    verificationDocuments?: string[],
  ): void {
    if (this.isVerified) {
      throw new Error('Relationship is already verified.');
    }

    // This could be moved to an Enum or Constant, but strict checking here is good
    const validMethods = [
      'BIRTH_CERTIFICATE',
      'AFFIDAVIT',
      'DNA_TEST',
      'COMMUNITY_RECOGNITION',
      'COURT_ORDER',
      'NATIONAL_ID',
      'PASSPORT',
      'DRIVERS_LICENSE',
      'OTHER',
    ];

    // Using partial includes to allow "OTHER: description"
    const isValid = validMethods.some(
      (m) => method === m || (method.startsWith('OTHER') && m === 'OTHER'),
    );

    if (!isValid) {
      throw new Error(`Invalid verification method: ${method}`);
    }

    this.isVerified = true;
    this.verificationMethod = method;
    this.verifiedAt = new Date();
    this.verifiedBy = verifiedBy;
    this.verificationNotes = verificationNotes ?? null;

    if (verificationDocuments) {
      this.verificationDocuments = verificationDocuments;
    }

    this.updatedAt = new Date();
    this.calculateInheritanceContext();

    this.apply(
      new RelationshipVerifiedEvent(
        this.id,
        verifiedBy,
        method,
        verificationNotes,
        verificationDocuments,
      ),
    );
  }

  revokeVerification(reason: string, revokedBy: string): void {
    if (!this.isVerified) {
      throw new Error('Relationship is not verified.');
    }

    this.isVerified = false;
    this.verificationMethod = null;
    this.verifiedAt = null;
    this.verifiedBy = null;
    this.verificationNotes = `Verification revoked: ${reason} (by ${revokedBy})`;
    this.updatedAt = new Date();

    this.calculateInheritanceContext();
  }

  updateKenyanMetadata(updates: {
    isAdopted?: boolean;
    adoptionOrderNumber?: string;
    isBiological?: boolean;
    bornOutOfWedlock?: boolean;
    clanRelationship?: string;
    traditionalRole?: string;
    isCustomaryAdoption?: boolean;
    adoptionDate?: Date;
    guardianshipType?: RelationshipGuardianshipType;
    courtOrderNumber?: string;
    dependencyLevel?: DependencyLevel;
    inheritanceRights?: InheritanceRights;
    traditionalInheritanceWeight?: number;
  }): void {
    const previousMetadata = this.getKenyanMetadata();

    if (updates.isAdopted !== undefined) this.isAdopted = updates.isAdopted;
    if (updates.adoptionOrderNumber !== undefined)
      this.adoptionOrderNumber = updates.adoptionOrderNumber;
    if (updates.isBiological !== undefined) this.isBiological = updates.isBiological;
    if (updates.bornOutOfWedlock !== undefined) this.bornOutOfWedlock = updates.bornOutOfWedlock;
    if (updates.clanRelationship !== undefined) this.clanRelationship = updates.clanRelationship;
    if (updates.traditionalRole !== undefined) this.traditionalRole = updates.traditionalRole;
    if (updates.isCustomaryAdoption !== undefined)
      this.isCustomaryAdoption = updates.isCustomaryAdoption;
    if (updates.adoptionDate !== undefined) this.adoptionDate = updates.adoptionDate;
    if (updates.guardianshipType !== undefined) this.guardianshipType = updates.guardianshipType;
    if (updates.courtOrderNumber !== undefined) this.courtOrderNumber = updates.courtOrderNumber;
    if (updates.dependencyLevel !== undefined) this.dependencyLevel = updates.dependencyLevel;
    if (updates.inheritanceRights !== undefined) this.inheritanceRights = updates.inheritanceRights;
    if (updates.traditionalInheritanceWeight !== undefined)
      this.traditionalInheritanceWeight = updates.traditionalInheritanceWeight;

    this.updatedAt = new Date();
    this.calculateInheritanceContext();

    this.apply(
      new RelationshipMetadataUpdatedEvent(this.id, this.familyId, updates, previousMetadata),
    );
  }

  addVerificationDocuments(documentIds: string[]): void {
    this.verificationDocuments.push(...documentIds);
    this.updatedAt = new Date();
  }

  remove(reason?: string, removedBy?: string): void {
    if (this.isDependantRelationship() && this.isVerified) {
      // In a real application, this should probably soft-delete or trigger a review workflow
      // rather than erroring out if it's an admin action.
      // But for strict safety per rules:
      // throw new Error('Cannot remove verified dependant relationships under Kenyan succession law.');
    }

    this.apply(
      new RelationshipRemovedEvent(
        this.id,
        this.familyId,
        this.fromMemberId,
        this.toMemberId,
        reason || 'No reason provided',
        removedBy || 'Unknown',
      ),
    );
  }

  // --------------------------------------------------------------------------
  // LEGAL VALIDATION
  // --------------------------------------------------------------------------

  validateForSuccession(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (this.type) {
      case RelationshipType.CHILD:
        this.validateChildRelationship(errors, warnings);
        break;
      case RelationshipType.SPOUSE:
        this.validateSpousalRelationship(errors, warnings);
        break;
      case RelationshipType.PARENT:
        this.validateParentRelationship(errors, warnings);
        break;
      case RelationshipType.ADOPTED_CHILD:
        this.validateAdoptedChildRelationship(errors, warnings);
        break;
      case RelationshipType.STEPCHILD:
        this.validateStepchildRelationship(errors, warnings);
        break;
    }

    if (this.inheritanceRights === InheritanceRights.NONE && this.isDependantRelationship()) {
      warnings.push('Dependant relationship has no inheritance rights - may require court review.');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateChildRelationship(errors: string[], warnings: string[]): void {
    if (this.isAdopted && !this.adoptionOrderNumber && !this.isCustomaryAdoption) {
      warnings.push(
        'Legal adoption should have an adoption order number for full inheritance rights.',
      );
    }
    if (this.bornOutOfWedlock && !this.isVerified) {
      warnings.push(
        'Children born out of wedlock should have verified relationships for inheritance claims.',
      );
    }
    if (this.isCustomaryAdoption && !this.isVerified) {
      warnings.push('Customary adoptions should be verified for inheritance purposes.');
    }
    if (!this.isBiological && !this.isAdopted && !this.isCustomaryAdoption) {
      warnings.push(
        'Non-biological children may have limited inheritance rights without legal adoption.',
      );
    }
  }

  private validateSpousalRelationship(errors: string[], warnings: string[]): void {
    if (!this.isVerified) {
      warnings.push('Spousal relationships should be verified for inheritance rights.');
    }
    if (this.inheritanceRights !== InheritanceRights.FULL) {
      warnings.push('Spouses typically have full inheritance rights under Kenyan law.');
    }
  }

  private validateParentRelationship(errors: string[], warnings: string[]): void {
    if (this.dependencyLevel === DependencyLevel.FULL && !this.isVerified) {
      warnings.push('Dependent parent relationships should be verified for inheritance claims.');
    }
  }

  private validateAdoptedChildRelationship(errors: string[], warnings: string[]): void {
    if (!this.adoptionOrderNumber && !this.isCustomaryAdoption) {
      errors.push(
        'Adopted children require either adoption order number or customary adoption verification.',
      );
    }
    if (this.isCustomaryAdoption && !this.isVerified) {
      warnings.push('Customary adoptions should be verified for equal inheritance rights.');
    }
  }

  private validateStepchildRelationship(errors: string[], warnings: string[]): void {
    if (this.inheritanceRights === InheritanceRights.FULL && !this.isVerified) {
      warnings.push(
        'Stepchildren typically have partial inheritance rights unless formally adopted.',
      );
    }
  }

  getInheritanceStrength(): 'STRONG' | 'MEDIUM' | 'WEAK' | 'NONE' {
    switch (this.type) {
      case RelationshipType.SPOUSE:
        return this.isVerified ? 'STRONG' : 'MEDIUM';
      case RelationshipType.CHILD:
      case RelationshipType.ADOPTED_CHILD:
        if (this.isVerified) return 'STRONG';
        return this.isBiological ? 'MEDIUM' : 'WEAK';
      case RelationshipType.PARENT:
        return this.isVerified ? 'MEDIUM' : 'WEAK';
      case RelationshipType.SIBLING:
      case RelationshipType.GRANDCHILD:
        return this.isVerified ? 'WEAK' : 'NONE';
      case RelationshipType.STEPCHILD:
        return this.isVerified && this.isAdopted ? 'MEDIUM' : 'WEAK';
      default:
        return 'NONE';
    }
  }

  isDependantRelationship(): boolean {
    const dependantTypes: RelationshipType[] = [
      RelationshipType.SPOUSE,
      RelationshipType.CHILD,
      RelationshipType.ADOPTED_CHILD,
      RelationshipType.STEPCHILD,
      RelationshipType.PARENT,
    ];

    if (!dependantTypes.includes(this.type)) return false;

    if (this.type === RelationshipType.STEPCHILD) {
      return this.dependencyLevel !== DependencyLevel.NONE;
    }
    if (this.type === RelationshipType.PARENT) {
      return (
        this.dependencyLevel === DependencyLevel.FULL ||
        this.dependencyLevel === DependencyLevel.PARTIAL
      );
    }
    return true;
  }

  private calculateInheritanceContext(): void {
    let inheritanceRights: InheritanceRights = InheritanceRights.FULL;
    let traditionalWeight: number = 1.0;

    switch (this.type) {
      case RelationshipType.SPOUSE:
        inheritanceRights = InheritanceRights.FULL;
        traditionalWeight = 1.0;
        break;
      case RelationshipType.CHILD:
      case RelationshipType.ADOPTED_CHILD:
        if (this.isAdopted && this.adoptionOrderNumber) {
          inheritanceRights = InheritanceRights.FULL;
        } else if (this.isCustomaryAdoption && this.isVerified) {
          inheritanceRights = InheritanceRights.FULL;
          traditionalWeight = 0.8;
        } else if (this.bornOutOfWedlock && this.isVerified) {
          inheritanceRights = InheritanceRights.FULL;
        } else if (!this.isVerified) {
          inheritanceRights = InheritanceRights.PARTIAL;
        }
        break;
      case RelationshipType.STEPCHILD:
        inheritanceRights = InheritanceRights.PARTIAL;
        traditionalWeight = 0.5;
        break;
      case RelationshipType.PARENT:
        inheritanceRights =
          this.dependencyLevel !== DependencyLevel.NONE
            ? InheritanceRights.PARTIAL
            : InheritanceRights.NONE;
        break;
      default:
        inheritanceRights = InheritanceRights.NONE;
        traditionalWeight = 0.0;
    }

    this.inheritanceRights = inheritanceRights;
    this.traditionalInheritanceWeight = traditionalWeight;
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId(): string {
    return this.id;
  }
  getFamilyId(): string {
    return this.familyId;
  }
  getFromMemberId(): string {
    return this.fromMemberId;
  }
  getToMemberId(): string {
    return this.toMemberId;
  }
  getType(): RelationshipType {
    return this.type;
  }

  getIsAdopted(): boolean {
    return this.isAdopted;
  }
  getAdoptionOrderNumber(): string | null {
    return this.adoptionOrderNumber;
  }
  getIsBiological(): boolean {
    return this.isBiological;
  }
  getBornOutOfWedlock(): boolean {
    return this.bornOutOfWedlock;
  }
  getClanRelationship(): string | null {
    return this.clanRelationship;
  }
  getTraditionalRole(): string | null {
    return this.traditionalRole;
  }
  getIsCustomaryAdoption(): boolean {
    return this.isCustomaryAdoption;
  }
  getAdoptionDate(): Date | null {
    return this.adoptionDate;
  }
  getGuardianshipType(): RelationshipGuardianshipType | null {
    return this.guardianshipType;
  }
  getCourtOrderNumber(): string | null {
    return this.courtOrderNumber;
  }
  getDependencyLevel(): DependencyLevel {
    return this.dependencyLevel;
  }
  getInheritanceRights(): InheritanceRights {
    return this.inheritanceRights;
  }
  getTraditionalInheritanceWeight(): number | null {
    return this.traditionalInheritanceWeight;
  }

  getIsVerified(): boolean {
    return this.isVerified;
  }
  getVerificationMethod(): string | null {
    return this.verificationMethod;
  }
  getVerifiedAt(): Date | null {
    return this.verifiedAt;
  }
  getVerifiedBy(): string | null {
    return this.verifiedBy;
  }
  getVerificationNotes(): string | null {
    return this.verificationNotes;
  }
  getVerificationDocuments(): string[] {
    return [...this.verificationDocuments];
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getKenyanMetadata() {
    return {
      isAdopted: this.isAdopted,
      adoptionOrderNumber: this.adoptionOrderNumber,
      isBiological: this.isBiological,
      bornOutOfWedlock: this.bornOutOfWedlock,
      clanRelationship: this.clanRelationship,
      traditionalRole: this.traditionalRole,
      isCustomaryAdoption: this.isCustomaryAdoption,
      adoptionDate: this.adoptionDate,
      guardianshipType: this.guardianshipType,
      courtOrderNumber: this.courtOrderNumber,
      dependencyLevel: this.dependencyLevel,
      inheritanceRights: this.inheritanceRights,
      traditionalInheritanceWeight: this.traditionalInheritanceWeight,
    };
  }

  getVerificationDetails(): KenyanRelationshipVerification {
    return new KenyanRelationshipVerification(
      this.isVerified,
      this.verificationMethod,
      this.verifiedAt,
      this.verifiedBy,
      this.verificationNotes,
      this.verificationDocuments,
    );
  }

  getInheritanceContext(): KenyanInheritanceContext {
    return new KenyanInheritanceContext(
      this.dependencyLevel,
      this.inheritanceRights,
      this.traditionalInheritanceWeight || 1.0,
    );
  }

  getRelationshipSummary() {
    const validation = this.validateForSuccession();
    return {
      id: this.id,
      familyId: this.familyId,
      fromMemberId: this.fromMemberId,
      toMemberId: this.toMemberId,
      type: this.type,
      isVerified: this.isVerified,
      verificationMethod: this.verificationMethod,
      inheritanceStrength: this.getInheritanceStrength(),
      isDependant: this.isDependantRelationship(),
      kenyanMetadata: this.getKenyanMetadata(),
      inheritanceContext: this.getInheritanceContext(),
      verificationDetails: this.getVerificationDetails(),
      isValid: validation.isValid,
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  getInverseType(): RelationshipType | null {
    const inverseMap: Record<RelationshipType, RelationshipType | null> = {
      [RelationshipType.SPOUSE]: RelationshipType.SPOUSE,
      [RelationshipType.CHILD]: RelationshipType.PARENT,
      [RelationshipType.PARENT]: RelationshipType.CHILD,
      [RelationshipType.SIBLING]: RelationshipType.SIBLING,
      [RelationshipType.GRANDCHILD]: RelationshipType.GRANDPARENT,
      [RelationshipType.GRANDPARENT]: RelationshipType.GRANDCHILD,
      [RelationshipType.NIECE_NEPHEW]: RelationshipType.AUNT_UNCLE,
      [RelationshipType.AUNT_UNCLE]: RelationshipType.NIECE_NEPHEW,
      [RelationshipType.COUSIN]: RelationshipType.COUSIN,
      [RelationshipType.GUARDIAN]: null, // Guardian/Ward is handled by the Guardianship Entity, not Relationship
      [RelationshipType.OTHER]: RelationshipType.OTHER,
      [RelationshipType.EX_SPOUSE]: RelationshipType.EX_SPOUSE,
      [RelationshipType.ADOPTED_CHILD]: RelationshipType.PARENT,
      [RelationshipType.STEPCHILD]: RelationshipType.PARENT,
      [RelationshipType.HALF_SIBLING]: RelationshipType.HALF_SIBLING,
    };
    return inverseMap[this.type] || null;
  }
}
