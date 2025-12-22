import { DomainEvent } from '../../base/domain-event';

// domain/events/dependency-events/dependant-evidence-verified.event.ts
export class DependantEvidenceVerifiedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      legalDependantId: string;
      verifiedBy: string;
      verificationMethod: string;
      documentCount: number;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      legalDependantId: this.payload.legalDependantId,
      verifiedBy: this.payload.verifiedBy,
      verificationMethod: this.payload.verificationMethod,
      documentCount: this.payload.documentCount,
    };
  }
}
