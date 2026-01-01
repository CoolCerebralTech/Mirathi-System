// src/domain/events/user-deleted.event.ts
import { DomainEvent } from './domain-event';

export interface UserDeletedEventPayload {
  userId: string;
  deletedBy?: string;
  deletedAt: string;
}

export class UserDeletedEvent extends DomainEvent {
  constructor(payload: UserDeletedEventPayload) {
    super({
      aggregateId: payload.userId,
      eventName: 'UserDeleted',
      metadata: payload,
    });
  }

  protected serialize(): UserDeletedEventPayload {
    return this.metadata as UserDeletedEventPayload;
  }
}
