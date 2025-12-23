// domain/events/guardianship-events/compliance-check-filed.event.ts (updated)
import { DomainEvent } from '../../base/domain-event';

export interface ComplianceCheckFiledEventPayload {
  guardianshipId: string;
  wardId: string;
  guardianId: string;
  year: number;
  filingDate: Date;
  reportDocumentId: string;
}

export class ComplianceCheckFiledEvent extends DomainEvent<ComplianceCheckFiledEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    eventVersion: number,
    payload: ComplianceCheckFiledEventPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, eventVersion, payload, occurredAt);
  }
}
