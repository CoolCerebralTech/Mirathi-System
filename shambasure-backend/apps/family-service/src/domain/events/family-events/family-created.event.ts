// domain/events/family-events/family-created.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface FamilyCreatedEventPayload {
  familyId: string;
  creatorId: string;
  name: string;
  clanName?: string;
  homeCounty?: string;
  timestamp: Date;
}

export class FamilyCreatedEvent extends DomainEvent<FamilyCreatedEventPayload> {
  constructor(payload: FamilyCreatedEventPayload) {
    super('FamilyCreated', payload);
  }
}
