// domain/events/guardianship-events/guardian-removed.event.ts (updated)
import { DomainEvent } from '../../base/domain-event';

export interface GuardianRemovedEventPayload {
  guardianshipId: string;
  wardId: string;
  guardianId: string;
  removalReason: string;
  wasPrimary: boolean;
}

export class GuardianRemovedEvent extends DomainEvent<GuardianRemovedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    eventVersion: number,
    payload: GuardianRemovedEventPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, eventVersion, payload, occurredAt);
  }
}
