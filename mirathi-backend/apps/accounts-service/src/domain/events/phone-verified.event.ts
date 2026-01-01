// src/domain/events/phone-verified.event.ts
import { DomainEvent } from './domain-event';

export interface PhoneVerifiedEventData {
  userId: string;
  phoneNumber: string;
  verifiedAt: string;
}

export class PhoneVerifiedEvent extends DomainEvent {
  constructor(private readonly data: PhoneVerifiedEventData) {
    super({
      aggregateId: data.userId,
      eventName: 'PhoneVerified',
    });
  }

  protected serialize(): Record<string, any> {
    return {
      userId: this.data.userId,
      phoneNumber: this.data.phoneNumber,
      verifiedAt: this.data.verifiedAt,
    };
  }
}
