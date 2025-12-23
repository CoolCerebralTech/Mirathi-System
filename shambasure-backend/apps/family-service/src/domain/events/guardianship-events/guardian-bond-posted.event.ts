// domain/events/guardianship-events/guardian-bond-posted.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface GuardianBondPostedEventPayload {
  guardianshipId: string;
  guardianId: string;
  bondAmountKES: number;
  bondProvider: string;
  bondPolicyNumber: string;
  expiryDate: Date;
}

export class GuardianBondPostedEvent extends DomainEvent<GuardianBondPostedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    eventVersion: number,
    payload: GuardianBondPostedEventPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, eventVersion, payload, occurredAt);
  }
}
