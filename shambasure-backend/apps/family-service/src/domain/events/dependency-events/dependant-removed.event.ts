import { DomainEvent } from '../../base/domain-event';

// domain/events/dependency-events/dependant-removed.event.ts
export class DependantRemovedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      assessmentId: string;
      dependantId: string;
      reason: string;
      courtOrderNumber?: string;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      assessmentId: this.payload.assessmentId,
      dependantId: this.payload.dependantId,
      reason: this.payload.reason,
      courtOrderNumber: this.payload.courtOrderNumber,
    };
  }
}
