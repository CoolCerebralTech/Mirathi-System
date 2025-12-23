// application/guardianship/queries/read-models/annual-report-status.read-model.ts
export class AnnualReportHistoryItem {
  reportDate: Date;
  submissionDate: Date;
  summary: string;
  status: string;
  reviewedBy?: string;
  reviewDate?: Date;
}

export class AnnualReportStatusReadModel {
  guardianshipId: string;
  guardianId: string;

  reportingCycle: 'CALENDAR_YEAR' | 'APPOINTMENT_ANNIVERSARY';
  nextReportDue: Date;
  isOverdue: boolean;

  history: AnnualReportHistoryItem[];
}
