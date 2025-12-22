import { DomainEvent } from '../../base/domain-event';

// domain/events/guardianship-events/ward-majority-reached.event.ts
export class WardMajorityReachedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      guardianshipId: string;
      wardId: string;
      majorityDate: Date;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      guardianshipId: this.payload.guardianshipId,
      wardId: this.payload.wardId,
      majorityDate: this.payload.majorityDate.toISOString(),
    };
  }
}
