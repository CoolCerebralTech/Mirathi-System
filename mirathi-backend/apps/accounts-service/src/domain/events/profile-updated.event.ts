// src/domain/events/profile-updated.event.ts
import { DomainEvent } from './domain-event';

export interface ProfileUpdatedEventPayload {
  userId: string;
  updatedFields: string[];
  updatedAt: string;
}

export class ProfileUpdatedEvent extends DomainEvent {
  constructor(payload: ProfileUpdatedEventPayload) {
    super({
      aggregateId: payload.userId,
      eventName: 'ProfileUpdated',
      metadata: payload,
    });
  }

  protected serialize(): ProfileUpdatedEventPayload {
    return this.metadata as ProfileUpdatedEventPayload;
  }
}
