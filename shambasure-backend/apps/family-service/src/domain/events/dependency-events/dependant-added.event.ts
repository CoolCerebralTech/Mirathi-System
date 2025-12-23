import { DomainEvent } from '../../base/domain-event';

// domain/events/dependency-events/dependant-added.event.ts
export class DependantAddedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      assessmentId: string;
      dependantId: string;
      relationship: string;
      isMinor: boolean;
      isPriorityDependant: boolean;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      assessmentId: this.payload.assessmentId,
      dependantId: this.payload.dependantId,
      relationship: this.payload.relationship,
      isMinor: this.payload.isMinor,
      isPriorityDependant: this.payload.isPriorityDependant,
    };
  }
}
