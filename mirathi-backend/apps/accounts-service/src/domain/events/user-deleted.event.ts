// src/domain/events/user-deleted.event.ts
import { DomainEvent } from './domain-event';

export interface UserDeletedEventData {
  userId: string;
  deletedBy?: string;
  deletedAt: string;
}

export class UserDeletedEvent extends DomainEvent {
  constructor(private readonly data: UserDeletedEventData) {
    super({
      aggregateId: data.userId,
      eventName: 'UserDeleted',
      metadata: {
        deletedBy: data.deletedBy,
      },
    });
  }

  protected serialize(): Record<string, any> {
    return {
      userId: this.data.userId,
      deletedBy: this.data.deletedBy,
      deletedAt: this.data.deletedAt,
    };
  }
}
