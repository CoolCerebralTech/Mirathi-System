import { randomUUID } from 'crypto';

/**
 * The abstract base class for all domain events.
 *
 * It provides common properties that every event should have:
 * - eventId: A unique identifier for this specific event instance.
 * - aggregateId: The ID of the aggregate root that this event belongs to (e.g., a UserId).
 * - eventName: The unique name of the event (e.g., 'user.created').
 * - occurredAt: The timestamp when the event was created.
 */
export abstract class DomainEvent {
  /** A unique identifier for this specific event instance. */
  public readonly eventId: string;

  /** The ID of the aggregate root that this event pertains to. */
  public readonly aggregateId: string;

  /** The timestamp when the event was created. */
  public readonly occurredAt: Date;

  /** The unique name of the event. */
  public abstract readonly eventName: string;

  constructor(aggregateId: string) {
    this.eventId = randomUUID();
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
  }
}
