// domain/events/relationship-events/next-of-kin-designated.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface NextOfKinDesignatedEventPayload {
  relationshipId: string;
  familyId: string;
  memberId: string;
  priority: number;
  legalBasis?: string;
  documentReference?: string;
  timestamp: Date;
}

export class NextOfKinDesignatedEvent extends DomainEvent<NextOfKinDesignatedEventPayload> {
  constructor(payload: Omit<NextOfKinDesignatedEventPayload, 'timestamp'>) {
    super('NextOfKinDesignated', payload.relationshipId, 'FamilyRelationship', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
