import { DomainEvent } from '../../base/domain-event';

// domain/events/guardianship-events/guardian-powers-granted.event.ts
export class GuardianPowersGrantedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      guardianshipId: string;
      powerType: string;
      courtOrderNumber?: string;
      restrictions?: string[];
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      guardianshipId: this.payload.guardianshipId,
      powerType: this.payload.powerType,
      courtOrderNumber: this.payload.courtOrderNumber,
      restrictions: this.payload.restrictions,
    };
  }
}
