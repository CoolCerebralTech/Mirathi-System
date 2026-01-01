// src/domain/events/phone-verified.event.ts
import { DomainEvent } from './domain-event';

export interface PhoneVerifiedEventPayload {
  userId: string;
  phoneNumber: string;
  verifiedAt: string;
}

export class PhoneVerifiedEvent extends DomainEvent {
  constructor(payload: PhoneVerifiedEventPayload) {
    super({
      aggregateId: payload.userId,
      eventName: 'PhoneVerified',
      metadata: payload,
    });
  }

  protected serialize(): PhoneVerifiedEventPayload {
    return this.metadata as PhoneVerifiedEventPayload;
  }
}
