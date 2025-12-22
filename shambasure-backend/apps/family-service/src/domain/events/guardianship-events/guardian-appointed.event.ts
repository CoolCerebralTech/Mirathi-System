// domain/events/guardianship-events/guardian-appointed.event.ts
import { DomainEvent } from '../../base/domain-event';

export class GuardianAppointedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      wardId: string;
      guardianId: string;
      type: string;
      courtOrderNumber?: string;
      appointmentDate: Date;
      customaryLawApplies: boolean;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      wardId: this.payload.wardId,
      guardianId: this.payload.guardianId,
      type: this.payload.type,
      courtOrderNumber: this.payload.courtOrderNumber,
      appointmentDate: this.payload.appointmentDate.toISOString(),
      customaryLawApplies: this.payload.customaryLawApplies,
    };
  }
}
