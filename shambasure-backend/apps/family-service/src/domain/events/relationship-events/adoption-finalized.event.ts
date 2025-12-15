// domain/events/relationship-events/adoption-finalized.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface AdoptionFinalizedEventPayload {
  adoptionOrderId: string;
  familyId: string;
  adopteeId: string;
  adopterId: string;
  adoptionType: string;
  adoptionDate: Date;
  registrationDate: Date;
  courtOrderNumber?: string;
  timestamp: Date;
}

export class AdoptionFinalizedEvent extends DomainEvent<AdoptionFinalizedEventPayload> {
  constructor(payload: Omit<AdoptionFinalizedEventPayload, 'timestamp'>) {
    super('AdoptionFinalized', payload.adoptionOrderId, 'AdoptionOrder', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
