// domain/events/marriage-events/marriage-dissolved.event.ts
import { MarriageEndReason } from '@prisma/client';

import { DomainEvent } from '../../base/domain-event';

export interface MarriageDissolvedEventPayload {
  marriageId: string;
  reason: MarriageEndReason;
  date: Date;
  decreeNumber?: string;
  timestamp: Date;
}

export class MarriageDissolvedEvent extends DomainEvent<MarriageDissolvedEventPayload> {
  constructor(payload: Omit<MarriageDissolvedEventPayload, 'timestamp'>) {
    super('MarriageDissolved', payload.marriageId, 'Marriage', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
