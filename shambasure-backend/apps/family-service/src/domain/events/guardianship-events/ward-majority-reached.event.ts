// domain/events/guardianship-events/ward-majority-reached.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface WardMajorityReachedEventPayload {
  guardianshipId: string;
  wardId: string;
  majorityDate: Date;
}

export class WardMajorityReachedEvent extends DomainEvent<WardMajorityReachedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    eventVersion: number,
    payload: WardMajorityReachedEventPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, eventVersion, payload, occurredAt);
  }
}
