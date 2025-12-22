import { DomainEvent } from '../../base/domain-event';

// domain/events/dependency-events/court-provision-ordered.event.ts
export class CourtProvisionOrderedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      legalDependantId: string;
      courtOrderNumber: string;
      claimedAmount: number;
      approvedAmount: number;
      provisionType: string;
      orderDate: Date;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      legalDependantId: this.payload.legalDependantId,
      courtOrderNumber: this.payload.courtOrderNumber,
      claimedAmount: this.payload.claimedAmount,
      approvedAmount: this.payload.approvedAmount,
      provisionType: this.payload.provisionType,
      orderDate: this.payload.orderDate.toISOString(),
    };
  }
}
