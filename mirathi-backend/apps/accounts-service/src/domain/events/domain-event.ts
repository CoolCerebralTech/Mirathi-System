// src/domain/events/domain-event.ts

/**
 * Base class for all Domain Events
 */
export abstract class DomainEvent {
  public readonly aggregateId: string;
  public readonly eventName: string;
  public readonly occurredAt: Date;
  public readonly metadata: Record<string, any>;

  constructor(props: { aggregateId: string; eventName: string; metadata?: Record<string, any> }) {
    this.aggregateId = props.aggregateId;
    this.eventName = props.eventName;
    this.occurredAt = new Date();
    this.metadata = props.metadata || {};
  }

  toJSON(): Record<string, any> {
    return {
      aggregateId: this.aggregateId,
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
      metadata: this.metadata,
      ...this.serialize(),
    };
  }

  protected abstract serialize(): Record<string, any>;
}
