// domain/events/family-events/family-updated.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface FamilyUpdatedEventPayload {
  familyId: string;
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

export class FamilyUpdatedEvent extends DomainEvent<FamilyUpdatedEventPayload> {
  constructor(payload: FamilyUpdatedEventPayload) {
    super('FamilyUpdated', payload);
  }
}
