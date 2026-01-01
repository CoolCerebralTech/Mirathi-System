// src/domain/events/role-changed.event.ts
import { DomainEvent } from './domain-event';

export interface RoleChangedEventPayload {
  userId: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
  reason?: string;
  changedAt: string;
}

export class RoleChangedEvent extends DomainEvent {
  constructor(payload: RoleChangedEventPayload) {
    super({
      aggregateId: payload.userId,
      eventName: 'RoleChanged',
      metadata: payload,
    });
  }

  protected serialize(): RoleChangedEventPayload {
    return this.metadata as RoleChangedEventPayload;
  }
}
