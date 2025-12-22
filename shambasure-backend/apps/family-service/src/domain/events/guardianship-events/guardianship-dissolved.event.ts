import { DomainEvent } from '../../base/domain-event';

// domain/events/guardianship-events/guardianship-dissolved.event.ts
export class GuardianshipDissolvedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      guardianshipId: string;
      wardId: string;
      reason: string;
      dissolvedDate: Date;
      courtOrderNumber?: string;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      guardianshipId: this.payload.guardianshipId,
      wardId: this.payload.wardId,
      reason: this.payload.reason,
      dissolvedDate: this.payload.dissolvedDate.toISOString(),
      courtOrderNumber: this.payload.courtOrderNumber,
    };
  }
}
