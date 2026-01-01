// src/domain/events/role-changed.event.ts
import { UserRole } from '@prisma/client';

import { DomainEvent } from './domain-event';

export interface RoleChangedEventData {
  userId: string;
  oldRole: UserRole;
  newRole: UserRole;
  changedBy: string;
  reason?: string;
  changedAt: string;
}

export class RoleChangedEvent extends DomainEvent {
  constructor(private readonly data: RoleChangedEventData) {
    super({
      aggregateId: data.userId,
      eventName: 'RoleChanged',
      metadata: {
        changedBy: data.changedBy,
      },
    });
  }

  protected serialize(): Record<string, any> {
    return {
      userId: this.data.userId,
      oldRole: this.data.oldRole,
      newRole: this.data.newRole,
      changedBy: this.data.changedBy,
      reason: this.data.reason,
      changedAt: this.data.changedAt,
    };
  }
}
