// src/family-service/src/domain/events/family-relationship-events.ts
import { DomainEvent } from '../base/domain-event';
import { RelationshipType } from '../value-objects/family-enums.vo';

/**
 * RelationshipCreatedEvent
 * Emitted when a new family relationship is created
 */
export class RelationshipCreatedEvent extends DomainEvent<{
  relationshipId: string;
  fromMemberId: string;
  toMemberId: string;
  relationshipType: RelationshipType;
  createdBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    relationshipId: string;
    fromMemberId: string;
    toMemberId: string;
    relationshipType: RelationshipType;
    createdBy: string;
    timestamp: Date;
  }) {
    super(
      params.relationshipId,
      'FamilyRelationship',
      1,
      {
        relationshipId: params.relationshipId,
        fromMemberId: params.fromMemberId,
        toMemberId: params.toMemberId,
        relationshipType: params.relationshipType,
        createdBy: params.createdBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * RelationshipUpdatedEvent
 * Emitted when relationship information is updated
 */
export class RelationshipUpdatedEvent extends DomainEvent<{
  relationshipId: string;
  changes: Record<string, any>;
  updatedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    relationshipId: string;
    changes: Record<string, any>;
    updatedBy: string;
    timestamp: Date;
  }) {
    super(
      params.relationshipId,
      'FamilyRelationship',
      1,
      {
        relationshipId: params.relationshipId,
        changes: params.changes,
        updatedBy: params.updatedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * RelationshipVerifiedEvent
 * Emitted when relationship is verified with evidence
 */
export class RelationshipVerifiedEvent extends DomainEvent<{
  relationshipId: string;
  fromMemberId: string;
  toMemberId: string;
  verificationMethod?: string;
  oldScore: number;
  newScore: number;
  verifiedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    relationshipId: string;
    fromMemberId: string;
    toMemberId: string;
    verificationMethod?: string;
    oldScore: number;
    newScore: number;
    verifiedBy: string;
    timestamp: Date;
  }) {
    super(
      params.relationshipId,
      'FamilyRelationship',
      1,
      {
        relationshipId: params.relationshipId,
        fromMemberId: params.fromMemberId,
        toMemberId: params.toMemberId,
        verificationMethod: params.verificationMethod,
        oldScore: params.oldScore,
        newScore: params.newScore,
        verifiedBy: params.verifiedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * RelationshipDissolvedEvent
 * Emitted when relationship is dissolved
 */
export class RelationshipDissolvedEvent extends DomainEvent<{
  relationshipId: string;
  fromMemberId: string;
  toMemberId: string;
  relationshipType: RelationshipType;
  endDate: Date;
  reason: string;
  dissolvedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    relationshipId: string;
    fromMemberId: string;
    toMemberId: string;
    relationshipType: RelationshipType;
    endDate: Date;
    reason: string;
    dissolvedBy: string;
    timestamp: Date;
  }) {
    super(
      params.relationshipId,
      'FamilyRelationship',
      1,
      {
        relationshipId: params.relationshipId,
        fromMemberId: params.fromMemberId,
        toMemberId: params.toMemberId,
        relationshipType: params.relationshipType,
        endDate: params.endDate,
        reason: params.reason,
        dissolvedBy: params.dissolvedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}
