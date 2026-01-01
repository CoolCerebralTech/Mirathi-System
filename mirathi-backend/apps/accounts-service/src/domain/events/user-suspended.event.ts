// src/domain/events/user-suspended.event.ts
import { DomainEvent } from './domain-event';

export interface UserSuspendedEventData {
  userId: string;
  suspendedBy: string;
  reason?: string;
  suspendedAt: string;
}

export class UserSuspendedEvent extends DomainEvent {
  constructor(private readonly data: UserSuspendedEventData) {
    super({
      aggregateId: data.userId,
      eventName: 'UserSuspended',
      metadata: {
        suspendedBy: data.suspendedBy,
      },
    });
  }

  protected serialize(): Record<string, any> {
    return {
      userId: this.data.userId,
      suspendedBy: this.data.suspendedBy,
      reason: this.data.reason,
      suspendedAt: this.data.suspendedAt,
    };
  }
}
