// domain/events/guardianship-events/guardianship-terminated.event.ts (updated)
import { DomainEvent } from '../../base/domain-event';

export interface GuardianshipTerminatedEventPayload {
  guardianshipId: string;
  wardId: string;
  terminationReason: string;
  terminationDate: Date;
  courtOrderNumber?: string;
  activeGuardiansCount: number;
}

export class GuardianshipTerminatedEvent extends DomainEvent<GuardianshipTerminatedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    eventVersion: number,
    payload: GuardianshipTerminatedEventPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, eventVersion, payload, occurredAt);
  }
}
