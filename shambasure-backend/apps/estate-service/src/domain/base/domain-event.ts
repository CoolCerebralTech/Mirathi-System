// domain/base/domain-event.ts
export abstract class DomainEvent<T = any> {
  public readonly eventId: string;
  public readonly timestamp: Date;
  public readonly eventName: string;
  public readonly aggregateId: string; // The ID of the aggregate root
  public readonly aggregateType: string; // e.g., 'FamilyMember', 'Family'
  public readonly payload: T;

  constructor(
    eventName: string,
    aggregateId: string,
    aggregateType: string,
    payload: T,
    eventId?: string,
    timestamp?: Date,
  ) {
    this.eventId = eventId || this.generateEventId();
    this.timestamp = timestamp || new Date();
    this.eventName = eventName;
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
    this.payload = payload;
  }

  private generateEventId(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      timestamp: this.timestamp,
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      payload: this.payload,
    };
  }
}
