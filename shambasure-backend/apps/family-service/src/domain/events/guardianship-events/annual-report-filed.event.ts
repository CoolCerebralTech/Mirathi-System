import { DomainEvent } from '../../base/domain-event';

// domain/events/guardianship-events/annual-report-filed.event.ts
export class AnnualReportFiledEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      guardianshipId: string;
      reportDate: Date;
      summary: string;
      nextReportDue?: Date;
      approvedBy?: string;
      financialStatement?: Record<string, any>;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      guardianshipId: this.payload.guardianshipId,
      reportDate: this.payload.reportDate.toISOString(),
      summary: this.payload.summary,
      nextReportDue: this.payload.nextReportDue?.toISOString(),
      approvedBy: this.payload.approvedBy,
      financialStatement: this.payload.financialStatement,
    };
  }
}
