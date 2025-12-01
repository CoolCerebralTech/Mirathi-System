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
import { RelationshipVerificationRevokedEvent } from '../events/relationship-verification-revoked.event';
import { RelationshipVerifiedEvent } from '../events/relationship-verified.event';

// -----------------------------------------------------------------------------
// VALUE OBJECTS & INTERFACES
// -----------------------------------------------------------------------------

/**
 * Kenyan Relationship Verification Details
 */
export class KenyanRelationshipVerification {
  constructor(
    public readonly isVerified: boolean,
    public readonly verificationMethod: string | null,
    public readonly verifiedAt: Date | null,
    public readonly verifiedBy: string | null,
    public readonly verificationNotes: string | null,
    public readonly verificationDocuments: string[],
  ) {}

  static unverified(): KenyanRelationshipVerification {
    return new KenyanRelationshipVerification(false, null, null, null, null, []);
  }
}

/**
 * Kenyan Inheritance Context
 */
export class KenyanInheritanceContext {
  constructor(
    public readonly dependencyLevel: DependencyLevel,
    public readonly inheritanceRights: InheritanceRights,
    public readonly traditionalInheritanceWeight: number,
  ) {}

  static none(): KenyanInheritanceContext {
    return new KenyanInheritanceContext(DependencyLevel.NONE, InheritanceRights.NONE, 0.0);
  }
}

/**
 * Adoption Details (Kenyan Children Act, 2022)
 */
export interface AdoptionDetails {
  adoptionOrderNumber: string;
  adoptionDate: Date;
  courtOrderNumber?: string;
  isCustomaryAdoption: boolean;
}

/**
 * Relationship Reconstitution Props
 */
export interface RelationshipReconstituteProps {
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
  adoptionDate: Date | string | null;
  guardianshipType: RelationshipGuardianshipType | null;
  courtOrderNumber: string | null;
  dependencyLevel: DependencyLevel;
  inheritanceRights: InheritanceRights;
  traditionalInheritanceWeight: number | null;

  // Verification
  isVerified: boolean;
  verificationMethod: string | null;
  verifiedAt: Date | string | null;
  verifiedBy: string | null;
  verificationNotes: string | null;
  verificationDocuments: Prisma.JsonValue;

  // Metadata
  metadata: Prisma.JsonValue;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}

// -----------------------------------------------------------------------------
// ENTITY: FAMILY RELATIONSHIP
// -----------------------------------------------------------------------------

/**
 * Family Relationship Entity
 *
 * Represents a legal/biological relationship between two family members.
 * Forms the "edges" in the family tree graph.
 *
 * Legal Context:
 * - Law of Succession Act (Cap 160): Defines inheritance based on relationships
 * - Children Act (2022): Adoption and guardianship relationships
 * - Kenyan Customary Law: Traditional relationships and clan connections
 * - Section 3 (Legitimacy): Children born out of wedlock
 * - Section 40: Customary succession rules
 *
 * Entity Responsibilities:
 * - Define relationship type between two members
 * - Track adoption/biological status
 * - Verify relationships for legal validity
 * - Calculate inheritance rights based on relationship
 * - Support customary law relationships (clan, traditional roles)
 *
 * Invariants:
 * - Cannot create self-relationship
 * - Relationships must be verified for succession
 * - Adoption requires court order or customary verification
 * - Biological relationships have priority over step-relationships
 */
export class FamilyRelationship extends AggregateRoot {
  // Core Identity
  private readonly _id: string;
  private readonly _familyId: string;
  private readonly _fromMemberId: string;
  private readonly _toMemberId: string;
  private readonly _type: RelationshipType;

  // Adoption Details (Children Act, 2022)
  private _isAdopted: boolean;
  private _adoptionOrderNumber: string | null;
  private _adoptionDate: Date | null;
  private _isCustomaryAdoption: boolean;
  private _courtOrderNumber: string | null;

  // Biological Details
  private _isBiological: boolean;
  private _bornOutOfWedlock: boolean;

  // Kenyan Customary Law
  private _clanRelationship: string | null; // e.g., "Same clan", "Cross-clan marriage"
  private _traditionalRole: string | null; // e.g., "Eldest son", "Family head heir"

  // Guardianship Context (if applicable)
  private _guardianshipType: RelationshipGuardianshipType | null;

  // Inheritance Calculation (Section 40)
  private _dependencyLevel: DependencyLevel;
  private _inheritanceRights: InheritanceRights;
  private _traditionalInheritanceWeight: number;

  // Verification (Critical for Legal Validity)
  private _isVerified: boolean;
  private _verificationMethod: string | null;
  private _verifiedAt: Date | null;
  private _verifiedBy: string | null;
  private _verificationNotes: string | null;
  private _verificationDocuments: string[];

  // Flexible Metadata
  private _metadata: Prisma.JsonValue;

  // Timestamps
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  // --------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------
  private constructor(
    id: string,
    familyId: string,
    fromMemberId: string,
    toMemberId: string,
    type: RelationshipType,
  ) {
    super();

    if (!id?.trim()) throw new Error('Relationship ID is required');
    if (!familyId?.trim()) throw new Error('Family ID is required');
    if (!fromMemberId?.trim()) throw new Error('From member ID is required');
    if (!toMemberId?.trim()) throw new Error('To member ID is required');

    if (fromMemberId === toMemberId) {
      throw new Error('Cannot create self-relationship (Kenyan law)');
    }

    this._id = id;
    this._familyId = familyId;
    this._fromMemberId = fromMemberId;
    this._toMemberId = toMemberId;
    this._type = type;

    // Adoption Defaults
    this._isAdopted = false;
    this._adoptionOrderNumber = null;
    this._adoptionDate = null;
    this._isCustomaryAdoption = false;
    this._courtOrderNumber = null;

    // Biological Defaults
    this._isBiological = true; // Default assumption
    this._bornOutOfWedlock = false;

    // Customary Defaults
    this._clanRelationship = null;
    this._traditionalRole = null;

    // Guardianship Default
    this._guardianshipType = null;

    // Inheritance Defaults (will be calculated)
    this._dependencyLevel = DependencyLevel.NONE;
    this._inheritanceRights = InheritanceRights.FULL;
    this._traditionalInheritanceWeight = 1.0;

    // Verification Defaults
    this._isVerified = false;
    this._verificationMethod = null;
    this._verifiedAt = null;
    this._verifiedBy = null;
    this._verificationNotes = null;
    this._verificationDocuments = [];

    // Metadata
    this._metadata = null;

    // Timestamps
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  /**
   * Creates a biological relationship.
   */
  static createBiological(
    id: string,
    familyId: string,
    fromMemberId: string,
    toMemberId: string,
    type: RelationshipType,
    details?: {
      bornOutOfWedlock?: boolean;
      clanRelationship?: string;
      traditionalRole?: string;
    },
  ): FamilyRelationship {
    const relationship = new FamilyRelationship(id, familyId, fromMemberId, toMemberId, type);

    relationship._isBiological = true;
    relationship._isAdopted = false;

    if (details) {
      if (details.bornOutOfWedlock !== undefined)
        relationship._bornOutOfWedlock = details.bornOutOfWedlock;
      if (details.clanRelationship) relationship._clanRelationship = details.clanRelationship;
      if (details.traditionalRole) relationship._traditionalRole = details.traditionalRole;
    }

    relationship.calculateInheritanceContext();

    relationship.apply(
      new RelationshipCreatedEvent(
        relationship._id,
        relationship._familyId,
        relationship._fromMemberId,
        relationship._toMemberId,
        relationship._type,
        {
          isBiological: true,
          isAdopted: false,
          bornOutOfWedlock: relationship._bornOutOfWedlock,
        },
      ),
    );

    return relationship;
  }

  /**
   * Creates an adopted relationship (Children Act, 2022).
   */
  static createAdopted(
    id: string,
    familyId: string,
    fromMemberId: string,
    toMemberId: string,
    adoptionDetails: AdoptionDetails,
    traditionalRole?: string,
  ): FamilyRelationship {
    if (adoptionDetails.isCustomaryAdoption && !adoptionDetails.adoptionOrderNumber) {
      // Customary adoption may not have formal court order
    } else if (!adoptionDetails.isCustomaryAdoption && !adoptionDetails.adoptionOrderNumber) {
      throw new Error('Legal adoption requires adoption order number (Children Act, 2022)');
    }

    const relationship = new FamilyRelationship(
      id,
      familyId,
      fromMemberId,
      toMemberId,
      RelationshipType.ADOPTED_CHILD,
    );

    relationship._isAdopted = true;
    relationship._isBiological = false;
    relationship._adoptionOrderNumber = adoptionDetails.adoptionOrderNumber;
    relationship._adoptionDate = adoptionDetails.adoptionDate;
    relationship._isCustomaryAdoption = adoptionDetails.isCustomaryAdoption;
    relationship._courtOrderNumber = adoptionDetails.courtOrderNumber || null;
    relationship._traditionalRole = traditionalRole || null;

    relationship.calculateInheritanceContext();

    relationship.apply(
      new RelationshipCreatedEvent(
        relationship._id,
        relationship._familyId,
        relationship._fromMemberId,
        relationship._toMemberId,
        relationship._type,
        {
          isAdopted: true,
          isBiological: false,
          adoptionOrderNumber: relationship._adoptionOrderNumber,
          adoptionDate: relationship._adoptionDate,
          isCustomaryAdoption: relationship._isCustomaryAdoption,
        },
      ),
    );

    return relationship;
  }

  /**
   * Creates a step-relationship.
   */
  static createStep(
    id: string,
    familyId: string,
    fromMemberId: string,
    toMemberId: string,
    traditionalRole?: string,
  ): FamilyRelationship {
    const relationship = new FamilyRelationship(
      id,
      familyId,
      fromMemberId,
      toMemberId,
      RelationshipType.STEPCHILD,
    );

    relationship._isBiological = false;
    relationship._isAdopted = false;
    relationship._traditionalRole = traditionalRole || null;

    relationship.calculateInheritanceContext();

    relationship.apply(
      new RelationshipCreatedEvent(
        relationship._id,
        relationship._familyId,
        relationship._fromMemberId,
        relationship._toMemberId,
        relationship._type,
        {
          isAdopted: false,
          isBiological: false,
          isStepRelationship: true,
        },
      ),
    );

    return relationship;
  }

  /**
   * Creates a marriage relationship.
   */
  static createMarriage(
    id: string,
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    clanRelationship?: string,
  ): FamilyRelationship {
    const relationship = new FamilyRelationship(
      id,
      familyId,
      spouse1Id,
      spouse2Id,
      RelationshipType.SPOUSE,
    );

    relationship._isBiological = false; // Marriage is not biological
    relationship._clanRelationship = clanRelationship || null;

    relationship.calculateInheritanceContext();

    relationship.apply(
      new RelationshipCreatedEvent(
        relationship._id,
        relationship._familyId,
        relationship._fromMemberId,
        relationship._toMemberId,
        relationship._type,
        {
          isMarriage: true,
          clanRelationship: relationship._clanRelationship,
        },
      ),
    );

    return relationship;
  }

  static reconstitute(props: RelationshipReconstituteProps): FamilyRelationship {
    const relationship = new FamilyRelationship(
      props.id,
      props.familyId,
      props.fromMemberId,
      props.toMemberId,
      props.type,
    );

    // Adoption
    relationship._isAdopted = props.isAdopted;
    relationship._adoptionOrderNumber = props.adoptionOrderNumber;
    relationship._adoptionDate = props.adoptionDate ? new Date(props.adoptionDate) : null;
    relationship._isCustomaryAdoption = props.isCustomaryAdoption;
    relationship._courtOrderNumber = props.courtOrderNumber;

    // Biological
    relationship._isBiological = props.isBiological;
    relationship._bornOutOfWedlock = props.bornOutOfWedlock;

    // Customary
    relationship._clanRelationship = props.clanRelationship;
    relationship._traditionalRole = props.traditionalRole;

    // Guardianship
    relationship._guardianshipType = props.guardianshipType;

    // Inheritance
    relationship._dependencyLevel = props.dependencyLevel;
    relationship._inheritanceRights = props.inheritanceRights;
    relationship._traditionalInheritanceWeight = props.traditionalInheritanceWeight || 1.0;

    // Verification
    relationship._isVerified = props.isVerified;
    relationship._verificationMethod = props.verificationMethod;
    relationship._verifiedAt = props.verifiedAt ? new Date(props.verifiedAt) : null;
    relationship._verifiedBy = props.verifiedBy;
    relationship._verificationNotes = props.verificationNotes;
    relationship._verificationDocuments = Array.isArray(props.verificationDocuments)
      ? (props.verificationDocuments as string[])
      : [];

    // Metadata
    relationship._metadata = props.metadata;

    // Timestamps
    (relationship as any)._createdAt = new Date(props.createdAt);
    relationship._updatedAt = new Date(props.updatedAt);

    return relationship;
  }

  // --------------------------------------------------------------------------
  // VERIFICATION (Critical for Legal Validity)
  // --------------------------------------------------------------------------

  /**
   * Verifies relationship with supporting evidence.
   *
   * Valid Methods:
   * - BIRTH_CERTIFICATE
   * - DEATH_CERTIFICATE (for inheritance)
   * - MARRIAGE_CERTIFICATE
   * - ADOPTION_ORDER
   * - COURT_ORDER
   * - DNA_TEST
   * - AFFIDAVIT
   * - COMMUNITY_ELDER_ATTESTATION (customary)
   * - NATIONAL_ID
   */
  verify(
    method: string,
    verifiedBy: string,
    verificationNotes?: string,
    documentIds?: string[],
  ): void {
    if (this._isVerified) {
      throw new Error('Relationship already verified');
    }

    if (!method?.trim()) {
      throw new Error('Verification method is required');
    }

    if (!verifiedBy?.trim()) {
      throw new Error('Verifier ID is required');
    }

    const validMethods = [
      'BIRTH_CERTIFICATE',
      'DEATH_CERTIFICATE',
      'MARRIAGE_CERTIFICATE',
      'ADOPTION_ORDER',
      'COURT_ORDER',
      'DNA_TEST',
      'AFFIDAVIT',
      'COMMUNITY_ELDER_ATTESTATION',
      'NATIONAL_ID',
      'PASSPORT',
      'OTHER',
    ];

    const methodUpper = method.toUpperCase();
    const isValid = validMethods.includes(methodUpper) || methodUpper.startsWith('OTHER:');

    if (!isValid) {
      throw new Error(`Invalid verification method: ${method}`);
    }

    this._isVerified = true;
    this._verificationMethod = method;
    this._verifiedAt = new Date();
    this._verifiedBy = verifiedBy;
    this._verificationNotes = verificationNotes?.trim() || null;

    if (documentIds && documentIds.length > 0) {
      this._verificationDocuments = documentIds;
    }

    this.markAsUpdated();
    this.calculateInheritanceContext();

    this.apply(
      new RelationshipVerifiedEvent(
        this._id,
        this._familyId,
        verifiedBy,
        method,
        this._verifiedAt,
        verificationNotes || null,
        documentIds || [],
      ),
    );
  }

  /**
   * Revokes verification (e.g., if documents found fraudulent).
   */
  revokeVerification(reason: string, revokedBy: string): void {
    if (!this._isVerified) {
      throw new Error('Relationship is not verified');
    }

    if (!reason?.trim()) {
      throw new Error('Revocation reason is required');
    }

    const previousMethod = this._verificationMethod;
    const previousVerifier = this._verifiedBy;

    this._isVerified = false;
    this._verificationMethod = null;
    this._verifiedAt = null;
    this._verifiedBy = null;
    this._verificationNotes = `REVOKED: ${reason.trim()}`;

    this.markAsUpdated();
    this.calculateInheritanceContext();

    this.apply(
      new RelationshipVerificationRevokedEvent(
        this._id,
        this._familyId,
        reason,
        revokedBy,
        previousMethod,
        previousVerifier,
      ),
    );
  }

  /**
   * Adds supporting verification documents.
   */
  addVerificationDocuments(documentIds: string[]): void {
    if (!documentIds || documentIds.length === 0) {
      throw new Error('At least one document ID is required');
    }

    this._verificationDocuments.push(...documentIds);
    this.markAsUpdated();
  }

  // --------------------------------------------------------------------------
  // METADATA UPDATES
  // --------------------------------------------------------------------------

  /**
   * Updates Kenyan-specific relationship metadata.
   */
  updateMetadata(updates: {
    clanRelationship?: string;
    traditionalRole?: string;
    guardianshipType?: RelationshipGuardianshipType;
    dependencyLevel?: DependencyLevel;
    customData?: Record<string, any>;
  }): void {
    const previousMetadata = this.getMetadataSummary();

    if (updates.clanRelationship !== undefined)
      this._clanRelationship = updates.clanRelationship?.trim() || null;

    if (updates.traditionalRole !== undefined)
      this._traditionalRole = updates.traditionalRole?.trim() || null;

    if (updates.guardianshipType !== undefined)
      this._guardianshipType = updates.guardianshipType || null;

    if (updates.dependencyLevel !== undefined) {
      this._dependencyLevel = updates.dependencyLevel;
    }

    if (updates.customData) {
      this._metadata = updates.customData as Prisma.JsonValue;
    }

    this.markAsUpdated();
    this.calculateInheritanceContext();

    this.apply(
      new RelationshipMetadataUpdatedEvent(this._id, this._familyId, updates, previousMetadata),
    );
  }

  // --------------------------------------------------------------------------
  // INHERITANCE CALCULATIONS (Section 40 - Customary Law)
  // --------------------------------------------------------------------------

  /**
   * Calculates inheritance context based on relationship type and verification.
   *
   * Rules (Law of Succession Act, Section 40):
   * - Spouse: Full rights
   * - Biological children: Full rights
   * - Adopted children (legal): Full rights
   * - Adopted children (customary, verified): Full rights, lower weight
   * - Children born out of wedlock (verified): Full rights (Section 3)
   * - Step-children: Partial rights
   * - Unverified relationships: Reduced/no rights
   */
  private calculateInheritanceContext(): void {
    let inheritanceRights: InheritanceRights = InheritanceRights.FULL;
    let traditionalWeight: number = 1.0;
    let dependencyLevel: DependencyLevel = this._dependencyLevel;

    switch (this._type) {
      case RelationshipType.SPOUSE:
        inheritanceRights = InheritanceRights.FULL;
        traditionalWeight = 1.0;
        dependencyLevel = DependencyLevel.FULL;
        break;

      case RelationshipType.CHILD:
        if (this._isBiological) {
          inheritanceRights = InheritanceRights.FULL;
          traditionalWeight = 1.0;
        } else if (this._bornOutOfWedlock && this._isVerified) {
          // Section 3: Legitimacy - equal rights when verified
          inheritanceRights = InheritanceRights.FULL;
          traditionalWeight = 1.0;
        } else if (!this._isVerified) {
          inheritanceRights = InheritanceRights.PARTIAL;
          traditionalWeight = 0.7;
        }
        break;

      case RelationshipType.ADOPTED_CHILD:
        if (this._adoptionOrderNumber && !this._isCustomaryAdoption) {
          // Legal adoption: full rights (Children Act, 2022)
          inheritanceRights = InheritanceRights.FULL;
          traditionalWeight = 1.0;
        } else if (this._isCustomaryAdoption && this._isVerified) {
          // Customary adoption: full rights, lower traditional weight
          inheritanceRights = InheritanceRights.FULL;
          traditionalWeight = 0.8;
        } else {
          inheritanceRights = InheritanceRights.PARTIAL;
          traditionalWeight = 0.5;
        }
        break;

      case RelationshipType.STEPCHILD:
        inheritanceRights = InheritanceRights.PARTIAL;
        traditionalWeight = 0.5;
        dependencyLevel = DependencyLevel.PARTIAL;
        break;

      case RelationshipType.PARENT:
        inheritanceRights =
          dependencyLevel !== DependencyLevel.NONE
            ? InheritanceRights.PARTIAL
            : InheritanceRights.NONE;
        traditionalWeight = dependencyLevel !== DependencyLevel.NONE ? 0.5 : 0.0;
        break;

      case RelationshipType.SIBLING:
      case RelationshipType.HALF_SIBLING:
        inheritanceRights = InheritanceRights.CUSTOMARY;
        traditionalWeight = 0.3;
        break;

      default:
        inheritanceRights = InheritanceRights.CUSTOMARY;
        traditionalWeight = 0.2;
        dependencyLevel = DependencyLevel.NONE;
    }

    // Verification penalty
    if (!this._isVerified && this._type !== RelationshipType.SPOUSE) {
      traditionalWeight *= 0.7; // 30% penalty for unverified
    }

    this._inheritanceRights = inheritanceRights;
    this._traditionalInheritanceWeight = traditionalWeight;
    this._dependencyLevel = dependencyLevel;
  }

  // --------------------------------------------------------------------------
  // VALIDATION & QUERIES
  // --------------------------------------------------------------------------

  /**
   * Validates relationship for succession purposes.
   */
  validateForSuccession(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Critical validations
    if (this._isAdopted && !this._isCustomaryAdoption && !this._adoptionOrderNumber) {
      errors.push('Legal adoption requires adoption order number (Children Act, 2022)');
    }

    if (
      this._type === RelationshipType.ADOPTED_CHILD &&
      !this._isVerified &&
      !this._adoptionOrderNumber
    ) {
      errors.push('Adopted children must be verified for inheritance rights');
    }

    // Warnings
    if (!this._isVerified && this.isDependantRelationship()) {
      warnings.push('Dependant relationships should be verified for succession');
    }

    if (this._bornOutOfWedlock && !this._isVerified && this._type === RelationshipType.CHILD) {
      warnings.push('Children born out of wedlock require verification (Section 3)');
    }

    if (this._isCustomaryAdoption && !this._isVerified) {
      warnings.push('Customary adoptions should be verified by community elders');
    }

    if (
      this._type === RelationshipType.STEPCHILD &&
      this._inheritanceRights === InheritanceRights.FULL
    ) {
      warnings.push('Step-children typically have partial rights unless formally adopted');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Checks if this is a dependant relationship under Section 29.
   */
  isDependantRelationship(): boolean {
    const dependantTypes: RelationshipType[] = [
      RelationshipType.SPOUSE,
      RelationshipType.CHILD,
      RelationshipType.ADOPTED_CHILD,
      RelationshipType.STEPCHILD,
      RelationshipType.PARENT,
    ];

    if (!dependantTypes.includes(this._type)) return false;

    // Parents only dependants if they have dependency level
    if (this._type === RelationshipType.PARENT) {
      return this._dependencyLevel !== DependencyLevel.NONE;
    }

    // Step-children only if dependency exists
    if (this._type === RelationshipType.STEPCHILD) {
      return this._dependencyLevel !== DependencyLevel.NONE;
    }

    return true;
  }

  /**
   * Gets inheritance strength classification.
   */
  getInheritanceStrength(): 'STRONG' | 'MEDIUM' | 'WEAK' | 'NONE' {
    if (this._inheritanceRights === InheritanceRights.NONE) return 'NONE';

    const weight = this._traditionalInheritanceWeight;

    if (weight >= 0.9 && this._isVerified) return 'STRONG';
    if (weight >= 0.7 || (weight >= 0.5 && this._isVerified)) return 'MEDIUM';
    if (weight > 0) return 'WEAK';

    return 'NONE';
  }

  /**
   * Gets the inverse relationship type.
   * Useful for creating bidirectional relationships.
   */
  getInverseType(): RelationshipType | null {
    const inverseMap: Partial<Record<RelationshipType, RelationshipType>> = {
      [RelationshipType.SPOUSE]: RelationshipType.SPOUSE,
      [RelationshipType.CHILD]: RelationshipType.PARENT,
      [RelationshipType.PARENT]: RelationshipType.CHILD,
      [RelationshipType.ADOPTED_CHILD]: RelationshipType.PARENT,
      [RelationshipType.STEPCHILD]: RelationshipType.PARENT,
      [RelationshipType.SIBLING]: RelationshipType.SIBLING,
      [RelationshipType.HALF_SIBLING]: RelationshipType.HALF_SIBLING,
      [RelationshipType.GRANDCHILD]: RelationshipType.GRANDPARENT,
      [RelationshipType.GRANDPARENT]: RelationshipType.GRANDCHILD,
      [RelationshipType.NIECE_NEPHEW]: RelationshipType.AUNT_UNCLE,
      [RelationshipType.AUNT_UNCLE]: RelationshipType.NIECE_NEPHEW,
      [RelationshipType.COUSIN]: RelationshipType.COUSIN,
      [RelationshipType.EX_SPOUSE]: RelationshipType.EX_SPOUSE,
    };

    return inverseMap[this._type] || null;
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private markAsUpdated(): void {
    this._updatedAt = new Date();
  }

  private getMetadataSummary(): Record<string, any> {
    return {
      clanRelationship: this._clanRelationship,
      traditionalRole: this._traditionalRole,
      guardianshipType: this._guardianshipType,
      dependencyLevel: this._dependencyLevel,
      inheritanceRights: this._inheritanceRights,
      traditionalInheritanceWeight: this._traditionalInheritanceWeight,
    };
  }

  /**
   * Complete relationship summary for UI/reporting.
   */
  getSummary(): {
    id: string;
    familyId: string;
    fromMemberId: string;
    toMemberId: string;
    type: RelationshipType;
    isVerified: boolean;
    verificationMethod: string | null;
    inheritanceStrength: 'STRONG' | 'MEDIUM' | 'WEAK' | 'NONE';
    isDependant: boolean;
    isAdopted: boolean;
    isBiological: boolean;
    bornOutOfWedlock: boolean;
    inheritanceContext: KenyanInheritanceContext;
    verificationDetails: KenyanRelationshipVerification;
    validation: { isValid: boolean; errors: string[]; warnings: string[] };
  } {
    const validation = this.validateForSuccession();

    return {
      id: this._id,
      familyId: this._familyId,
      fromMemberId: this._fromMemberId,
      toMemberId: this._toMemberId,
      type: this._type,
      isVerified: this._isVerified,
      verificationMethod: this._verificationMethod,
      inheritanceStrength: this.getInheritanceStrength(),
      isDependant: this.isDependantRelationship(),
      isAdopted: this._isAdopted,
      isBiological: this._isBiological,
      bornOutOfWedlock: this._bornOutOfWedlock,
      inheritanceContext: this.getInheritanceContext(),
      verificationDetails: this.getVerificationDetails(),
      validation,
    };
  }
  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------
  get id(): string {
    return this._id;
  }
  get familyId(): string {
    return this._familyId;
  }
  get fromMemberId(): string {
    return this._fromMemberId;
  }
  get toMemberId(): string {
    return this._toMemberId;
  }
  get type(): RelationshipType {
    return this._type;
  }
  get isAdopted(): boolean {
    return this._isAdopted;
  }
  get adoptionOrderNumber(): string | null {
    return this._adoptionOrderNumber;
  }
  get isBiological(): boolean {
    return this._isBiological;
  }
  get bornOutOfWedlock(): boolean {
    return this._bornOutOfWedlock;
  }
  get clanRelationship(): string | null {
    return this._clanRelationship;
  }
  get traditionalRole(): string | null {
    return this._traditionalRole;
  }
  get isCustomaryAdoption(): boolean {
    return this._isCustomaryAdoption;
  }
  get adoptionDate(): Date | null {
    return this._adoptionDate;
  }
  get guardianshipType(): RelationshipGuardianshipType | null {
    return this._guardianshipType;
  }
  get courtOrderNumber(): string | null {
    return this._courtOrderNumber;
  }
  get dependencyLevel(): DependencyLevel {
    return this._dependencyLevel;
  }
  get inheritanceRights(): InheritanceRights {
    return this._inheritanceRights;
  }
  get traditionalInheritanceWeight(): number {
    return this._traditionalInheritanceWeight;
  }
  get isVerified(): boolean {
    return this._isVerified;
  }
  get verificationMethod(): string | null {
    return this._verificationMethod;
  }
  get verifiedAt(): Date | null {
    return this._verifiedAt;
  }
  get verifiedBy(): string | null {
    return this._verifiedBy;
  }
  get verificationNotes(): string | null {
    return this._verificationNotes;
  }
  get verificationDocuments(): string[] {
    return [...this._verificationDocuments];
  }
  get metadata(): Prisma.JsonValue {
    return this._metadata;
  }
  get createdAt(): Date {
    return new Date(this._createdAt);
  }
  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }
  getVerificationDetails(): KenyanRelationshipVerification {
    return new KenyanRelationshipVerification(
      this._isVerified,
      this._verificationMethod,
      this._verifiedAt,
      this._verifiedBy,
      this._verificationNotes,
      this._verificationDocuments,
    );
  }
  getInheritanceContext(): KenyanInheritanceContext {
    return new KenyanInheritanceContext(
      this._dependencyLevel,
      this._inheritanceRights,
      this._traditionalInheritanceWeight,
    );
  }
}
