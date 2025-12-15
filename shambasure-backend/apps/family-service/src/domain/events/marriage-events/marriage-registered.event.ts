// domain/events/marriage-events/marriage-registered.event.ts
import { MarriageType } from '@prisma/client';

import { DomainEvent } from '../../base/domain-event';

export interface MarriageRegisteredEventPayload {
  marriageId: string;
  familyId: string;
  spouse1Id: string;
  spouse2Id: string;
  marriageType: MarriageType;
  startDate: Date;
  registrationNumber?: string;
  timestamp: Date;
}

export class MarriageRegisteredEvent extends DomainEvent<MarriageRegisteredEventPayload> {
  constructor(payload: Omit<MarriageRegisteredEventPayload, 'timestamp'>) {
    super('MarriageRegistered', payload.marriageId, 'Marriage', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
