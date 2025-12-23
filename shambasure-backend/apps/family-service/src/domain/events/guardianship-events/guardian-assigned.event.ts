// domain/events/guardianship-events/guardian-assigned.event.ts (updated)
import { DomainEvent } from '../../base/domain-event';

export interface GuardianAssignedEventPayload {
  guardianshipId: string;
  wardId: string;
  guardianId: string;
  guardianName: string;
  isPrimary: boolean;
  appointmentSource: string;
  canManageProperty: boolean;
  canConsentToMedical: boolean;
}

export class GuardianAssignedEvent extends DomainEvent<GuardianAssignedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    eventVersion: number,
    payload: GuardianAssignedEventPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, eventVersion, payload, occurredAt);
  }
}
