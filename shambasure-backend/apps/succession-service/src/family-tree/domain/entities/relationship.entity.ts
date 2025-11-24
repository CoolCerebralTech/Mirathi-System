import { AggregateRoot } from '@nestjs/cqrs';
import { RelationshipType } from '@prisma/client';
import { RelationshipCreatedEvent } from '../events/relationship-created.event';
import { RelationshipRemovedEvent } from '../events/relationship-removed.event';
import { RelationshipVerifiedEvent } from '../events/relationship-verified.event';
import { RelationshipMetadataUpdatedEvent } from '../events/relationship-metadata-updated.event';

export interface RelationshipMetadata {
  isAdopted?: boolean;
  adoptionOrderNumber?: string;
  isBiological?: boolean;
  bornOutOfWedlock?: boolean;
  comments?: string;
  // Kenyan-specific relationship attributes
  clanRelationship?: string; // e.g., "maternal uncle", "paternal aunt"
  traditionalRole?: string; // e.g., "family elder", "clan head"
  isCustomaryAdoption?: boolean; // Traditional adoption without legal process
  adoptionDate?: Date;
  guardianshipType?: 'TEMPORARY' | 'PERMANENT' | 'TESTAMENTARY';
  courtOrderNumber?: string;
}

export interface RelationshipReconstitutionProps {
  id: string;
  familyId: string;
  fromMemberId: string;
  toMemberId: string;
  type: RelationshipType;
  metadata?: RelationshipMetadata | string | null;
  isVerified?: boolean;
  verificationMethod?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  verifiedAt?: string | Date | null;
  verifiedBy?: string | null;
}

export class Relationship extends AggregateRoot {
  private id: string;
  private familyId: string;
  private fromMemberId: string;
  private toMemberId: string;
  private type: RelationshipType;
  private metadata: RelationshipMetadata;
  private isVerified: boolean;
  private verificationMethod: string | null;
  private verifiedAt: Date | null;
  private verifiedBy: string | null;
  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    familyId: string,
    fromMemberId: string,
    toMemberId: string,
    type: RelationshipType,
    metadata: RelationshipMetadata = {},
  ) {
    super();
    this.validateSelfReference(fromMemberId, toMemberId);
    this.validateRelationshipType(type);

    this.id = id;
    this.familyId = familyId;
    this.fromMemberId = fromMemberId;
    this.toMemberId = toMemberId;
    this.type = type;
    this.metadata = metadata;

    this.isVerified = false;
    this.verificationMethod = null;
    this.verifiedAt = null;
    this.verifiedBy = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
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
    metadata?: RelationshipMetadata,
  ): Relationship {
    const relationship = new Relationship(id, familyId, fromMemberId, toMemberId, type, metadata);

    relationship.apply(
      new RelationshipCreatedEvent(id, familyId, fromMemberId, toMemberId, type, metadata),
    );

    return relationship;
  }

  static reconstitute(props: RelationshipReconstitutionProps): Relationship {
    // Parse metadata safely
    let metadata: RelationshipMetadata = {};

    if (props.metadata) {
      if (typeof props.metadata === 'string') {
        try {
          const parsed = JSON.parse(props.metadata) as Partial<RelationshipMetadata>;
          metadata = { ...metadata, ...parsed };
        } catch (error) {
          console.warn('Failed to parse relationship metadata JSON:', error);
          metadata = {};
        }
      } else {
        metadata = { ...metadata, ...props.metadata };
      }
    }

    const relationship = new Relationship(
      props.id,
      props.familyId,
      props.fromMemberId,
      props.toMemberId,
      props.type,
      metadata,
    );

    relationship.isVerified = props.isVerified ?? false;
    relationship.verificationMethod = props.verificationMethod || null;

    // Safe date assignments
    relationship.createdAt =
      props.createdAt instanceof Date ? props.createdAt : new Date(props.createdAt);
    relationship.updatedAt =
      props.updatedAt instanceof Date ? props.updatedAt : new Date(props.updatedAt);

    if (props.verifiedAt) {
      relationship.verifiedAt =
        props.verifiedAt instanceof Date ? props.verifiedAt : new Date(props.verifiedAt);
    } else {
      relationship.verifiedAt = null;
    }

    relationship.verifiedBy = props.verifiedBy || null;

    return relationship;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC - KENYAN SUCCESSION LAW FOCUSED
  // --------------------------------------------------------------------------

  verify(
    method:
      | 'BIRTH_CERTIFICATE'
      | 'AFFIDAVIT'
      | 'DNA_TEST'
      | 'COMMUNITY_RECOGNITION'
      | 'COURT_ORDER',
    verifiedBy: string,
    verificationNotes?: string,
  ): void {
    if (this.isVerified) return; // Idempotent

    this.isVerified = true;
    this.verificationMethod = method;
    this.verifiedAt = new Date();
    this.verifiedBy = verifiedBy;
    this.updatedAt = new Date();

    this.apply(new RelationshipVerifiedEvent(this.id, verifiedBy, method, verificationNotes));
  }

  revokeVerification(): void {
    if (!this.isVerified) return; // Idempotent

    this.isVerified = false;
    this.verificationMethod = null;
    this.verifiedAt = null;
    this.verifiedBy = null;
    this.updatedAt = new Date();

    // Note: We might want to emit a RelationshipVerificationRevokedEvent here
  }

  remove(reason?: string, removedBy?: string): void {
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

  updateMetadata(updates: Partial<RelationshipMetadata>): void {
    const previousMetadata = { ...this.metadata };
    this.metadata = { ...this.metadata, ...updates };
    this.updatedAt = new Date();

    // Emit event for significant metadata changes that affect legal status
    const significantChanges = [
      'isAdopted',
      'adoptionOrderNumber',
      'isBiological',
      'bornOutOfWedlock',
      'isCustomaryAdoption',
      'guardianshipType',
    ];

    const hasSignificantChange = Object.keys(updates).some((key) =>
      significantChanges.includes(key),
    );

    if (hasSignificantChange) {
      this.apply(
        new RelationshipMetadataUpdatedEvent(this.id, this.familyId, updates, previousMetadata),
      );
    }
  }

  // --------------------------------------------------------------------------
  // KENYAN LAW COMPLIANCE VALIDATION
  // --------------------------------------------------------------------------

  /**
   * Validates if this relationship is legally recognized under Kenyan succession law
   */
  validateForSuccession(): { isValid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Basic validation
    if (this.fromMemberId === this.toMemberId) {
      errors.push('Relationship cannot be self-referential.');
    }

    // Kenyan law specific validations
    if (this.type === 'CHILD' || this.type === 'PARENT') {
      // Parent-child relationships require special attention
      if (
        this.metadata.isAdopted &&
        !this.metadata.adoptionOrderNumber &&
        !this.metadata.isCustomaryAdoption
      ) {
        warnings.push(
          'Legal adoption should have an adoption order number for full inheritance rights.',
        );
      }

      if (this.metadata.bornOutOfWedlock && !this.isVerified) {
        warnings.push(
          'Children born out of wedlock should have verified relationships for inheritance claims.',
        );
      }

      if (this.metadata.isCustomaryAdoption && !this.isVerified) {
        warnings.push('Customary adoptions should be verified for inheritance purposes.');
      }
    }

    // Spousal relationships
    if (this.type === 'SPOUSE' && !this.isVerified) {
      warnings.push('Spousal relationships should be verified for inheritance rights.');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Determines inheritance strength under Kenyan Law of Succession Act
   */
  getInheritanceStrength(): 'STRONG' | 'MEDIUM' | 'WEAK' | 'NONE' {
    switch (this.type) {
      case 'SPOUSE':
        return this.isVerified ? 'STRONG' : 'MEDIUM';

      case 'CHILD':
        if (this.metadata.isAdopted && this.metadata.adoptionOrderNumber) {
          return 'STRONG';
        }
        if (this.metadata.isBiological && !this.metadata.bornOutOfWedlock) {
          return 'STRONG';
        }
        if (this.metadata.isCustomaryAdoption && this.isVerified) {
          return 'MEDIUM';
        }
        if (this.metadata.bornOutOfWedlock && this.isVerified) {
          return 'MEDIUM';
        }
        return 'WEAK';

      case 'PARENT':
        return this.isVerified ? 'MEDIUM' : 'WEAK';

      case 'SIBLING':
      case 'GRANDCHILD':
        return this.isVerified ? 'WEAK' : 'NONE';

      default:
        return 'NONE';
    }
  }

  /**
   * Checks if this relationship qualifies the "toMember" as a dependant under Section 29
   */
  isDependantRelationship(): boolean {
    // Under Kenyan law, dependants include:
    // - Spouse and children
    // - Parents who were dependent on the deceased
    // - Siblings who were dependent on the deceased
    const dependantTypes: RelationshipType[] = ['SPOUSE', 'CHILD', 'PARENT', 'SIBLING'];

    if (!dependantTypes.includes(this.type)) {
      return false;
    }

    // Additional conditions for non-immediate family
    if (this.type === 'SIBLING' || this.type === 'PARENT') {
      // Would need additional dependency information, but for now assume potential
      return true;
    }

    return true;
  }

  // --------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------

  private validateSelfReference(from: string, to: string): void {
    if (from === to) {
      throw new Error('A family member cannot have a relationship with themselves.');
    }
  }

  private validateRelationshipType(type: RelationshipType): void {
    const validTypes: RelationshipType[] = [
      'SPOUSE',
      'CHILD',
      'PARENT',
      'SIBLING',
      'GRANDCHILD',
      'GRANDPARENT',
      'NIECE_NEPHEW',
      'AUNT_UNCLE',
      'COUSIN',
      'GUARDIAN',
      'OTHER',
    ];

    if (!validTypes.includes(type)) {
      throw new Error(`Invalid relationship type: ${type}`);
    }
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
  getMetadata(): RelationshipMetadata {
    return { ...this.metadata };
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
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
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
      metadata: this.metadata,
      isValid: validation.isValid,
      warnings: validation.warnings,
      errors: validation.errors,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Gets the inverse relationship type (e.g., CHILD -> PARENT)
   */
  getInverseType(): RelationshipType | null {
    const inverseMap: Record<RelationshipType, RelationshipType | null> = {
      SPOUSE: 'SPOUSE',
      CHILD: 'PARENT',
      PARENT: 'CHILD',
      SIBLING: 'SIBLING',
      GRANDCHILD: 'GRANDPARENT',
      GRANDPARENT: 'GRANDCHILD',
      NIECE_NEPHEW: 'AUNT_UNCLE',
      AUNT_UNCLE: 'NIECE_NEPHEW',
      COUSIN: 'COUSIN',
      GUARDIAN: 'OTHER', // Guardian relationship is directional
      OTHER: 'OTHER',
      EX_SPOUSE: 'EX_SPOUSE',
      ADOPTED_CHILD: 'PARENT',
      STEPCHILD: 'PARENT',
      HALF_SIBLING: 'HALF_SIBLING',
    };

    return inverseMap[this.type] || null;
  }
}
