// domain/events/guardianship-events/guardian-appointed.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface GuardianAppointedEventPayload {
  guardianshipId: string;
  familyId: string;
  wardId: string;
  guardianId: string;
  type: string;
  courtOrderNumber?: string;
  appointmentDate: Date;
  timestamp: Date;
}

export class GuardianAppointedEvent extends DomainEvent<GuardianAppointedEventPayload> {
  constructor(payload: GuardianAppointedEventPayload) {
    super('GuardianAppointed', payload);
  }
}
