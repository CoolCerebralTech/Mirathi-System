// succession-service/src/family-tree/domain/entities/relationship.entity.ts

import { AggregateRoot } from '@nestjs/cqrs';
import { RelationshipType } from '@prisma/client';
import { RelationshipCreatedEvent } from '../events/relationship-created.event';
import { RelationshipRemovedEvent } from '../events/relationship-removed.event';
import { RelationshipVerifiedEvent } from '../events/relationship-verified.event';

export interface RelationshipMetadata {
  isAdopted?: boolean;
  adoptionOrderNumber?: string; // Critical for legal adoption proof
  isBiological?: boolean;
  bornOutOfWedlock?: boolean; // Critical for Section 29 analysis
  comments?: string;
}

export class Relationship extends AggregateRoot {
  private id: string;
  private familyId: string;

  // The Directional Edge: From A -> To B (e.g., John -> IS_PARENT_OF -> Mary)
  private fromMemberId: string;
  private toMemberId: string;
  private type: RelationshipType;

  private metadata: RelationshipMetadata;

  // Trust Level
  private isVerified: boolean;
  private verificationMethod: string | null;

  private createdAt: Date;
  private updatedAt: Date;

  // Private constructor
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

    this.id = id;
    this.familyId = familyId;
    this.fromMemberId = fromMemberId;
    this.toMemberId = toMemberId;
    this.type = type;
    this.metadata = metadata;

    this.isVerified = false;
    this.verificationMethod = null;
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

  static reconstitute(props: any): Relationship {
    const relationship = new Relationship(
      props.id,
      props.familyId,
      props.fromMemberId,
      props.toMemberId,
      props.type,
      props.metadata
        ? typeof props.metadata === 'string'
          ? JSON.parse(props.metadata)
          : props.metadata
        : {},
    );

    relationship.isVerified = props.isVerified;
    relationship.verificationMethod = props.verificationMethod || null;
    relationship.createdAt = new Date(props.createdAt);
    relationship.updatedAt = new Date(props.updatedAt);

    return relationship;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  verify(
    method: 'BIRTH_CERTIFICATE' | 'AFFIDAVIT' | 'DNA_TEST' | 'COMMUNITY_RECOGNITION',
    verifiedBy: string,
  ): void {
    if (this.isVerified) return; // Idempotent

    this.isVerified = true;
    this.verificationMethod = method;
    this.updatedAt = new Date();

    this.apply(new RelationshipVerifiedEvent(this.id, verifiedBy, method));
  }

  remove(reason?: string): void {
    this.apply(
      new RelationshipRemovedEvent(
        this.id,
        this.familyId,
        this.fromMemberId,
        this.toMemberId,
        reason,
      ),
    );
    // Persistence layer handles physical deletion or soft-delete based on strategy
  }

  updateMetadata(updates: Partial<RelationshipMetadata>): void {
    this.metadata = { ...this.metadata, ...updates };
    this.updatedAt = new Date();
    // We don't emit an event for minor metadata updates to avoid spam,
    // unless it affects legal status (e.g. changing isAdopted).
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private validateSelfReference(from: string, to: string): void {
    if (from === to) {
      throw new Error('A family member cannot have a relationship with themselves.');
    }
  }

  /**
   * Checks if this relationship grants strong inheritance rights.
   * (e.g., Biological Child or Legally Adopted)
   */
  hasStrongInheritanceClaim(): boolean {
    // 1. Parent/Child is strongest
    const isParentChild = this.type === 'CHILD' || this.type === 'PARENT';

    if (!isParentChild) return false;

    // 2. If Adopted, MUST have adoption order
    if (this.metadata.isAdopted && !this.metadata.adoptionOrderNumber) {
      return false; // Weak claim until proven
    }

    // 3. Born out of wedlock requires verification or specific flags
    if (this.metadata.bornOutOfWedlock && !this.isVerified) {
      return false; // Weak claim until proven (Section 29 analysis)
    }

    return true;
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId() {
    return this.id;
  }
  getFamilyId() {
    return this.familyId;
  }
  getFromMemberId() {
    return this.fromMemberId;
  }
  getToMemberId() {
    return this.toMemberId;
  }
  getType() {
    return this.type;
  }
  getMetadata() {
    return { ...this.metadata };
  }
  getIsVerified() {
    return this.isVerified;
  }
}
