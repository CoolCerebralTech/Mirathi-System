// domain/events/relationship-events/cohabitation-started.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface CohabitationStartedEventPayload {
  cohabitationId: string;
  familyId: string;
  partner1Id: string;
  partner2Id: string;
  startDate: Date;
  timestamp: Date;
}

export class CohabitationStartedEvent extends DomainEvent<CohabitationStartedEventPayload> {
  constructor(payload: Omit<CohabitationStartedEventPayload, 'timestamp'>) {
    super('CohabitationStarted', payload.cohabitationId, 'CohabitationRecord', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
