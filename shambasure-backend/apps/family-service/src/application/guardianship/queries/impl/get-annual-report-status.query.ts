// application/guardianship/queries/impl/get-annual-report-status.query.ts
import { BaseQuery } from '../base.query';

export interface ReportStatusFilters {
  status?: 'PENDING' | 'DUE' | 'OVERDUE' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  year?: number;
}

export class GetAnnualReportStatusQuery extends BaseQuery {
  public readonly guardianshipId: string;
  public readonly filters?: ReportStatusFilters;

  constructor(
    props: { guardianshipId: string; filters?: ReportStatusFilters },
    baseProps: { userId: string; correlationId?: string },
  ) {
    super(baseProps);
    this.guardianshipId = props.guardianshipId;
    this.filters = props.filters;

    if (!this.guardianshipId) throw new Error('Guardianship ID is required');
  }
}
