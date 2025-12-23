// domain/events/guardianship-events/annual-report-filed.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface AnnualReportFiledEventPayload {
  guardianshipId: string;
  guardianId: string;
  reportDate: Date;
  summary: string;
  nextReportDue: Date;
  approvedBy?: string;
}

export class AnnualReportFiledEvent extends DomainEvent<AnnualReportFiledEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    eventVersion: number,
    payload: AnnualReportFiledEventPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, eventVersion, payload, occurredAt);
  }
}
