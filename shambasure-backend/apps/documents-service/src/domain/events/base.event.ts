import { Uuid } from '../value-objects';

/**
 * Base class for all domain events. It is generic to enforce strong
 * typing of the aggregate ID.
 */
export abstract class DomainEvent<T extends Uuid> {
  // Timestamp of when the event occurred
  public readonly occurredAt: Date;

  // The unique name of the event (e.g., 'document.uploaded')
  public readonly eventName: string;

  // The version of the event schema
  public readonly eventVersion: number;

  // The ID of the aggregate root this event belongs to
  public readonly aggregateId: T;

  protected constructor(aggregateId: T, eventName: string, eventVersion: number) {
    this.aggregateId = aggregateId;
    this.eventName = eventName;
    this.eventVersion = eventVersion;
    this.occurredAt = new Date();
  }
}
