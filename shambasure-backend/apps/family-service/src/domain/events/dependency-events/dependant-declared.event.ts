// domain/events/dependency-events/dependant-declared.event.ts
import { DomainEvent } from '../../base/domain-event';

export class DependantDeclaredEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      legalDependantId: string;
      deceasedId: string;
      dependantId: string;
      relationship: string;
      dependencyLevel: string;
      isMinor: boolean;
      basisSection: string;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      legalDependantId: this.payload.legalDependantId,
      deceasedId: this.payload.deceasedId,
      dependantId: this.payload.dependantId,
      relationship: this.payload.relationship,
      dependencyLevel: this.payload.dependencyLevel,
      isMinor: this.payload.isMinor,
      basisSection: this.payload.basisSection,
    };
  }
}
