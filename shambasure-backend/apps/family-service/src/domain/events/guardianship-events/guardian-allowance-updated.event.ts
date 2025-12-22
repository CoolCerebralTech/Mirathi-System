import { DomainEvent } from '../../base/domain-event';

// domain/events/guardianship-events/guardian-allowance-updated.event.ts
export class GuardianAllowanceUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      guardianshipId: string;
      newAmount: number;
      approvedBy: string;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      guardianshipId: this.payload.guardianshipId,
      newAmount: this.payload.newAmount,
      approvedBy: this.payload.approvedBy,
    };
  }
}
