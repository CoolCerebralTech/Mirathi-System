import { DomainEvent } from '../../base/domain-event';

export class GuardianshipCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      guardianshipId: string;
      wardId: string;
      primaryGuardianId: string;
      guardianType: string;
      appointmentDate: Date;
      customaryLawApplies: boolean;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      guardianshipId: this.payload.guardianshipId,
      wardId: this.payload.wardId,
      primaryGuardianId: this.payload.primaryGuardianId,
      guardianType: this.payload.guardianType,
      appointmentDate: this.payload.appointmentDate.toISOString(),
      customaryLawApplies: this.payload.customaryLawApplies,
    };
  }
}
