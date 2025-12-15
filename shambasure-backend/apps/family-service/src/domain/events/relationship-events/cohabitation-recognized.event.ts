// domain/events/relationship-events/cohabitation-recognized.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface CohabitationRecognizedEventPayload {
  cohabitationId: string;
  isAcknowledged?: boolean;
  isRegistered?: boolean;
  timestamp: Date;
}

export class CohabitationRecognizedEvent extends DomainEvent<CohabitationRecognizedEventPayload> {
  constructor(payload: Omit<CohabitationRecognizedEventPayload, 'timestamp'>) {
    super('CohabitationRecognized', payload.cohabitationId, 'CohabitationRecord', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
