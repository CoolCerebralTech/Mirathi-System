// src/domain/events/user-suspended.event.ts
import { DomainEvent } from './domain-event';

export interface UserSuspendedEventPayload {
  userId: string;
  suspendedBy: string;
  reason?: string;
  suspendedAt: string;
}

export class UserSuspendedEvent extends DomainEvent {
  constructor(payload: UserSuspendedEventPayload) {
    super({
      aggregateId: payload.userId,
      eventName: 'UserSuspended',
      metadata: payload,
    });
  }

  protected serialize(): UserSuspendedEventPayload {
    return this.metadata as UserSuspendedEventPayload;
  }
}
