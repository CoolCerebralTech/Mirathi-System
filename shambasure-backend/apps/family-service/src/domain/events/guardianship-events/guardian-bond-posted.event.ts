import { DomainEvent } from '../../base/domain-event';

// domain/events/guardianship-events/guardian-bond-posted.event.ts
export class GuardianBondPostedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      guardianshipId: string;
      amount: number;
      provider: string;
      policyNumber: string;
      expiryDate: Date;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      guardianshipId: this.payload.guardianshipId,
      amount: this.payload.amount,
      provider: this.payload.provider,
      policyNumber: this.payload.policyNumber,
      expiryDate: this.payload.expiryDate.toISOString(),
    };
  }
}
