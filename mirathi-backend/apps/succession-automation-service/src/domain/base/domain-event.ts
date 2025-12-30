// domain/base/domain-event.ts
import { v4 as uuidv4 } from 'uuid';

/**
 * Base Domain Event
 *
 * Every state change in the system emits an event for:
 * 1. Legal Audit Trail (S. 83 LSA - executor accountability)
 * 2. Event Sourcing (rebuild aggregate state)
 * 3. Integration (notify other bounded contexts)
 * 4. Temporal Queries (query historical state)
 *
 * Kenyan Legal Requirements:
 * - Events are immutable (can't alter legal history)
 * - Every event has timestamp (statute of limitations)
 * - Events form chain of evidence for court disputes
 */
export abstract class DomainEvent<T = any> {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly aggregateType: string;
  public readonly version: number;
  protected readonly payload: T;

  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: T,
    occurredAt?: Date,
  ) {
    this.eventId = uuidv4();
    this.occurredAt = occurredAt ?? new Date();
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
    this.version = version;
    this.payload = payload;
  }

  /**
   * Get event type name (for event store)
   */
  public getEventType(): string {
    return this.constructor.name;
  }

  /**
   * Get event payload
   */
  public getPayload(): T {
    return this.payload;
  }

  /**
   * Serialize event for persistence
   */
  public toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventType: this.getEventType(),
      occurredAt: this.occurredAt.toISOString(),
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      version: this.version,
      payload: this.getPayload(),
    };
  }
}

/**
 * Event Metadata for Integration Events
 */
export interface EventMetadata {
  userId?: string;
  correlationId?: string;
  causationId?: string;
  timestamp: Date;
}
