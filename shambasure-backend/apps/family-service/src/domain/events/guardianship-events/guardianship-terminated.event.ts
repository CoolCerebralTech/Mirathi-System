// domain/events/guardianship-events/guardianship-terminated.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface GuardianshipTerminatedEventPayload {
  guardianshipId: string;
  wardId: string;
  guardianId: string;
  reason: string;
  terminationDate: Date;
  timestamp: Date;
}

export class GuardianshipTerminatedEvent extends DomainEvent<GuardianshipTerminatedEventPayload> {
  constructor(payload: Omit<GuardianshipTerminatedEventPayload, 'timestamp'>) {
    super('GuardianshipTerminated', payload.guardianshipId, 'Guardian', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
