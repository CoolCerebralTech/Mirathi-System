// domain/events/guardianship-events/multiple-guardians-assigned.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface MultipleGuardiansAssignedEventPayload {
  guardianshipId: string;
  wardId: string;
  newGuardianId: string;
  guardianType: string;
  appointmentDate: Date;
  totalGuardians: number;
}

export class MultipleGuardiansAssignedEvent extends DomainEvent<MultipleGuardiansAssignedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    eventVersion: number,
    payload: MultipleGuardiansAssignedEventPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, eventVersion, payload, occurredAt);
  }
}
