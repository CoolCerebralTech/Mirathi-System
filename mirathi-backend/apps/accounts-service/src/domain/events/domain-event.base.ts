import { randomUUID } from 'crypto';

/**
 * The abstract base class for all domain events.
 *
 * Provides:
 * - eventId: Unique identifier for this event instance.
 * - aggregateId: The ID of the aggregate root this event belongs to.
 * - eventName: The unique name of the event (e.g., 'user.created').
 * - occurredAt: Timestamp when the event was created.
 * - payload: Strongly typed event payload.
 */
export abstract class DomainEvent<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  /** A unique identifier for this specific event instance. */
  public readonly eventId: string;

  /** The ID of the aggregate root that this event pertains to. */
  public readonly aggregateId: string;

  /** The timestamp when the event was created. */
  public readonly occurredAt: Date;

  /** The unique name of the event. */
  public abstract readonly eventName: string;

  /** Strongly typed payload for the event. */
  public readonly payload: TPayload;

  protected constructor(aggregateId: string, payload: TPayload) {
    this.eventId = randomUUID();
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
    this.payload = payload;
  }

  /**
   * Convert event to a plain object for logging or persistence.
   */
  toPrimitives(): {
    eventId: string;
    aggregateId: string;
    eventName: string;
    occurredAt: string;
    payload: TPayload;
  } {
    return {
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
      payload: this.payload,
    };
  }
}
