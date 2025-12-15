// domain/events/guardianship-events/annual-report-filed.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface AnnualReportFiledEventPayload {
  guardianshipId: string;
  reportDate: Date;
  summary: string;
  nextReportDue: Date;
  approvedBy?: string;
  timestamp: Date;
}

export class AnnualReportFiledEvent extends DomainEvent<AnnualReportFiledEventPayload> {
  constructor(payload: Omit<AnnualReportFiledEventPayload, 'timestamp'>) {
    super('AnnualReportFiled', payload.guardianshipId, 'Guardian', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
