import { DomainEvent } from '../../base/domain-event';

// domain/events/guardianship-events/guardian-replaced.event.ts
export class GuardianReplacedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      guardianshipId: string;
      wardId: string;
      outgoingGuardianId: string;
      replacementGuardianId: string;
      reason: string;
      appointmentDate: Date;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      guardianshipId: this.payload.guardianshipId,
      wardId: this.payload.wardId,
      outgoingGuardianId: this.payload.outgoingGuardianId,
      replacementGuardianId: this.payload.replacementGuardianId,
      reason: this.payload.reason,
      appointmentDate: this.payload.appointmentDate.toISOString(),
    };
  }
}
