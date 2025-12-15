// domain/events/relationship-events/relationship-verified.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface RelationshipVerifiedEventPayload {
  relationshipId: string;
  method: string;
  verifiedBy: string;
  verificationDocuments?: any;
  timestamp: Date;
}

export class RelationshipVerifiedEvent extends DomainEvent<RelationshipVerifiedEventPayload> {
  constructor(payload: Omit<RelationshipVerifiedEventPayload, 'timestamp'>) {
    super('RelationshipVerified', payload.relationshipId, 'FamilyRelationship', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
