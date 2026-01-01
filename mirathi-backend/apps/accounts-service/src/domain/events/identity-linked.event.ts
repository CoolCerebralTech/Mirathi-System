// src/domain/events/identity-linked.event.ts
import { DomainEvent } from './domain-event';

export interface IdentityLinkedEventData {
  userId: string;
  provider: string;
  providerUserId: string;
  email: string;
  linkedAt: string;
}

export class IdentityLinkedEvent extends DomainEvent {
  constructor(private readonly data: IdentityLinkedEventData) {
    super({
      aggregateId: data.userId,
      eventName: 'IdentityLinked',
      metadata: {
        provider: data.provider,
        providerUserId: data.providerUserId,
      },
    });
  }

  protected serialize(): Record<string, any> {
    return {
      userId: this.data.userId,
      provider: this.data.provider,
      providerUserId: this.data.providerUserId,
      email: this.data.email,
      linkedAt: this.data.linkedAt,
    };
  }
}
