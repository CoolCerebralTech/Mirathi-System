// src/domain/events/settings-updated.event.ts
import { DomainEvent } from './domain-event';

export interface SettingsUpdatedEventData {
  userId: string;
  updatedFields: string[];
  updatedAt: string;
}

export class SettingsUpdatedEvent extends DomainEvent {
  constructor(private readonly data: SettingsUpdatedEventData) {
    super({
      aggregateId: data.userId,
      eventName: 'SettingsUpdated',
    });
  }

  protected serialize(): Record<string, any> {
    return {
      userId: this.data.userId,
      updatedFields: this.data.updatedFields,
      updatedAt: this.data.updatedAt,
    };
  }
}
