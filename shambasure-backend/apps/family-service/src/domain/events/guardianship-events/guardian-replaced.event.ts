// domain/events/guardianship-events/guardian-replaced.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface GuardianReplacedEventPayload {
  guardianshipId: string;
  wardId: string;
  outgoingGuardianId: string;
  replacementGuardianId: string;
  reason: string;
  appointmentDate: Date;
}

export class GuardianReplacedEvent extends DomainEvent<GuardianReplacedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    eventVersion: number,
    payload: GuardianReplacedEventPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, eventVersion, payload, occurredAt);
  }
}
