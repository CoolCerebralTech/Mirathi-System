// src/domain/events/user-registered.event.ts
import { DomainEvent } from './domain-event';

export interface UserRegisteredEventPayload {
  userId: string;
  provider: string;
  providerUserId: string;
  email?: string;
  firstName: string;
  lastName: string;
  role: string;
  registeredAt: string;
}

export class UserRegisteredEvent extends DomainEvent {
  constructor(payload: UserRegisteredEventPayload) {
    super({
      aggregateId: payload.userId,
      eventName: 'UserRegistered',
      metadata: {
        provider: payload.provider,
        providerUserId: payload.providerUserId,
      },
    });
  }

  protected serialize(): UserRegisteredEventPayload {
    return this.metadata as UserRegisteredEventPayload;
  }
}
