// domain/events/guardianship-events/annual-report-filed.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface AnnualReportFiledEventPayload {
  guardianshipId: string;
  wardId: string;
  reportYear: number;
  filedBy: string;
  nextReportDue: Date;
  timestamp: Date;
}

export class AnnualReportFiledEvent extends DomainEvent<AnnualReportFiledEventPayload> {
  constructor(payload: AnnualReportFiledEventPayload) {
    super('AnnualReportFiled', payload);
  }
}
