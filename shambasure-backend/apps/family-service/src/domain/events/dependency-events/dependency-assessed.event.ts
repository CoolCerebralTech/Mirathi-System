import { DomainEvent } from '../../base/domain-event';

// domain/events/dependency-events/dependency-assessed.event.ts
export class DependencyAssessedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      legalDependantId: string;
      dependencyPercentage: number;
      dependencyLevel: string;
      monthlySupport?: number;
      dependencyRatio?: number;
      assessmentMethod: string;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      legalDependantId: this.payload.legalDependantId,
      dependencyPercentage: this.payload.dependencyPercentage,
      dependencyLevel: this.payload.dependencyLevel,
      monthlySupport: this.payload.monthlySupport,
      dependencyRatio: this.payload.dependencyRatio,
      assessmentMethod: this.payload.assessmentMethod,
    };
  }
}
