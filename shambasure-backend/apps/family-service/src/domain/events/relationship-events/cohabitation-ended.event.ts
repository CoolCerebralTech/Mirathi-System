// domain/events/relationship-events/cohabitation-ended.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface CohabitationEndedEventPayload {
  cohabitationId: string;
  endDate: Date;
  reason?: string;
  durationYears: number;
  timestamp: Date;
}

export class CohabitationEndedEvent extends DomainEvent<CohabitationEndedEventPayload> {
  constructor(payload: Omit<CohabitationEndedEventPayload, 'timestamp'>) {
    super('CohabitationEnded', payload.cohabitationId, 'CohabitationRecord', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
