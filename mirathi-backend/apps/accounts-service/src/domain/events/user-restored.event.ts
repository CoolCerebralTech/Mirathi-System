// src/domain/events/user-restored.event.ts
import { DomainEvent } from './domain-event';

export interface UserRestoredEventData {
  userId: string;
  restoredAt: string;
}

export class UserRestoredEvent extends DomainEvent {
  constructor(private readonly data: UserRestoredEventData) {
    super({
      aggregateId: data.userId,
      eventName: 'UserRestored',
    });
  }

  protected serialize(): Record<string, any> {
    return {
      userId: this.data.userId,
      restoredAt: this.data.restoredAt,
    };
  }
}
