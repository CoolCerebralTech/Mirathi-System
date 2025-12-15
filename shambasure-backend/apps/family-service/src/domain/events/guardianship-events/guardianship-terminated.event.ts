// domain/events/guardianship-events/guardianship-terminated.event.ts
import { DomainEvent } from '../../base/domain-event';
import { GuardianAppointedEventPayload } from './guardian-appointed.event';

export interface GuardianshipTerminatedEventPayload {
  guardianshipId: string;
  wardId: string;
  guardianId: string;
  terminationDate: Date;
  terminationReason: string;
  terminatedBy: string;
  timestamp: Date;
}

export class GuardianshipTerminatedEvent extends DomainEvent<GuardianshipTerminatedEventPayload> {
  constructor(payload: GuardianAppointedEventPayload) {
    super('GuardianshipTerminated', payload);
  }
}
