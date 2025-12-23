// domain/events/guardianship-events/guardian-powers-granted.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface GuardianPowersGrantedEventPayload {
  guardianshipId: string;
  guardianId: string;
  powerType: string;
  courtOrderNumber?: string;
  restrictions?: string[];
}

export class GuardianPowersGrantedEvent extends DomainEvent<GuardianPowersGrantedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    eventVersion: number,
    payload: GuardianPowersGrantedEventPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, eventVersion, payload, occurredAt);
  }
}
