// domain/events/dependency-events/court-provision-ordered.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface CourtProvisionOrderedEventPayload {
  legalDependantId: string;
  courtOrderNumber: string;
  amount: number;
  provisionType: string;
  orderDate: Date;
  timestamp: Date;
}

export class CourtProvisionOrderedEvent extends DomainEvent<CourtProvisionOrderedEventPayload> {
  constructor(payload: Omit<CourtProvisionOrderedEventPayload, 'timestamp'>) {
    super('CourtProvisionOrdered', payload.legalDependantId, 'LegalDependant', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
