import { DomainEvent } from '../../base/domain-event';

// domain/events/dependency-events/s26-claim-filed.event.ts
export class S26ClaimFiledEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      legalDependantId: string;
      claimAmount: number;
      claimBasis: string;
      evidenceCount: number;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      legalDependantId: this.payload.legalDependantId,
      claimAmount: this.payload.claimAmount,
      claimBasis: this.payload.claimBasis,
      evidenceCount: this.payload.evidenceCount,
    };
  }
}
