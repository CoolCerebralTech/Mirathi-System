// application/guardianship/queries/impl/get-guardianship-summary.query.ts
import { BaseQuery } from '../base.query';

/**
 * Lightweight query for list views or dashboards.
 * Returns only essential status/meta info, not the full aggregate.
 */
export class GetGuardianshipSummaryQuery extends BaseQuery {
  public readonly guardianshipId: string;

  constructor(guardianshipId: string, baseProps: { userId: string; correlationId?: string }) {
    super(baseProps);
    this.guardianshipId = guardianshipId;

    if (!this.guardianshipId) throw new Error('Guardianship ID is required');
  }
}
