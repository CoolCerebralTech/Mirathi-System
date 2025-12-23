// domain/events/dependency-events/dependency-assessment-created.event.ts
import { DomainEvent } from '../../base/domain-event';

export class DependencyAssessmentCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      assessmentId: string;
      deceasedId: string;
      deceasedName: string;
      dateOfDeath: Date;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      assessmentId: this.payload.assessmentId,
      deceasedId: this.payload.deceasedId,
      deceasedName: this.payload.deceasedName,
      dateOfDeath: this.payload.dateOfDeath.toISOString(),
    };
  }
}
