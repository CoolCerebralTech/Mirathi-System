// domain/events/relationship-events/relationship-established.event.ts
import { RelationshipType } from '@prisma/client';

import { DomainEvent } from '../../base/domain-event';

export interface RelationshipEstablishedEventPayload {
  relationshipId: string;
  familyId: string;
  fromMemberId: string;
  toMemberId: string;
  type: RelationshipType;
  strength: string;
  isBiological: boolean;
  isAdopted: boolean;
  timestamp: Date;
}

export class RelationshipEstablishedEvent extends DomainEvent<RelationshipEstablishedEventPayload> {
  constructor(payload: Omit<RelationshipEstablishedEventPayload, 'timestamp'>) {
    super('RelationshipEstablished', payload.relationshipId, 'FamilyRelationship', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
