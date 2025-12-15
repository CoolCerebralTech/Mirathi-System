// domain/events/guardianship-events/guardian-appointed.event.ts
import { GuardianType } from '@prisma/client';

import { DomainEvent } from '../../base/domain-event';

export interface GuardianAppointedEventPayload {
  guardianshipId: string;
  wardId: string;
  guardianId: string;
  type: GuardianType;
  courtOrderNumber?: string;
  courtStation?: string;
  appointmentDate: Date;
  timestamp: Date;
}

export class GuardianAppointedEvent extends DomainEvent<GuardianAppointedEventPayload> {
  constructor(payload: Omit<GuardianAppointedEventPayload, 'timestamp'>) {
    super('GuardianAppointed', payload.guardianshipId, 'Guardian', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
