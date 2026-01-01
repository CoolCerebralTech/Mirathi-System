// src/domain/events/identity-linked.event.ts
import { DomainEvent } from './domain-event';

export interface IdentityLinkedEventPayload {
  userId: string;
  provider: string;
  providerUserId: string;
  email?: string;
  linkedAt: string;
}

export class IdentityLinkedEvent extends DomainEvent {
  constructor(payload: IdentityLinkedEventPayload) {
    super({
      aggregateId: payload.userId,
      eventName: 'IdentityLinked',
      metadata: payload,
    });
  }

  protected serialize(): IdentityLinkedEventPayload {
    return this.metadata as IdentityLinkedEventPayload;
  }
}
