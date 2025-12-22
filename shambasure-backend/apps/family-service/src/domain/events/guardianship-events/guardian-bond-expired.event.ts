import { DomainEvent } from '../../base/domain-event';

// domain/events/guardianship-events/guardian-bond-expired.event.ts
export class GuardianBondExpiredEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      guardianshipId: string;
      bondProvider: string;
      bondPolicyNumber: string;
      expiryDate: Date;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      guardianshipId: this.payload.guardianshipId,
      bondProvider: this.payload.bondProvider,
      bondPolicyNumber: this.payload.bondPolicyNumber,
      expiryDate: this.payload.expiryDate.toISOString(),
    };
  }
}
