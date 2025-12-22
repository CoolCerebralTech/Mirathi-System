import { DomainEvent } from '../../base/domain-event';

// domain/events/guardianship-events/guardianship-terminated.event.ts
export class GuardianshipTerminatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      guardianshipId: string;
      wardId: string;
      guardianId: string;
      reason: string;
      terminationDate: Date;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      guardianshipId: this.payload.guardianshipId,
      wardId: this.payload.wardId,
      guardianId: this.payload.guardianId,
      reason: this.payload.reason,
      terminationDate: this.payload.terminationDate.toISOString(),
    };
  }
}
