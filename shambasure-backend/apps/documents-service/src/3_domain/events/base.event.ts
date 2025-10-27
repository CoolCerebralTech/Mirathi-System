/**
 * Base class for all domain events.
 * Follows the pattern from accounts-service.
 */
export abstract class DomainEvent {
  public readonly occurredAt: Date;
  public readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
  }

  abstract getEventName(): string;
}
