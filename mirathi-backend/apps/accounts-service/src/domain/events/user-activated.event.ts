// src/domain/events/user-activated.event.ts
import { DomainEvent } from './domain-event';

export interface UserActivatedEventData {
  userId: string;
  activatedBy?: string;
  activatedAt: string;
}

export class UserActivatedEvent extends DomainEvent {
  constructor(private readonly data: UserActivatedEventData) {
    super({
      aggregateId: data.userId,
      eventName: 'UserActivated',
    });
  }

  protected serialize(): Record<string, any> {
    return {
      userId: this.data.userId,
      activatedBy: this.data.activatedBy,
      activatedAt: this.data.activatedAt,
    };
  }
}
