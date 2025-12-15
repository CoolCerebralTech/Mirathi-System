// domain/events/marriage-events/customary-marriage-recognized.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface CustomaryMarriageRecognizedEventPayload {
  marriageId: string;
  bridePriceStatus?: string;
  clanApproval?: boolean;
  familyConsent?: boolean;
  timestamp: Date;
}

export class CustomaryMarriageRecognizedEvent extends DomainEvent<CustomaryMarriageRecognizedEventPayload> {
  constructor(payload: Omit<CustomaryMarriageRecognizedEventPayload, 'timestamp'>) {
    super('CustomaryMarriageRecognized', payload.marriageId, 'Marriage', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
