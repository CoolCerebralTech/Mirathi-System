import { DomainEvent } from '../../base/domain-event';

// domain/events/guardianship-events/multiple-guardians-assigned.event.ts
export class MultipleGuardiansAssignedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      guardianshipId: string;
      wardId: string;
      newGuardianId: string;
      guardianType: string;
      appointmentDate: Date;
      totalGuardians: number;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      guardianshipId: this.payload.guardianshipId,
      wardId: this.payload.wardId,
      newGuardianId: this.payload.newGuardianId,
      guardianType: this.payload.guardianType,
      appointmentDate: this.payload.appointmentDate.toISOString(),
      totalGuardians: this.payload.totalGuardians,
    };
  }
}
