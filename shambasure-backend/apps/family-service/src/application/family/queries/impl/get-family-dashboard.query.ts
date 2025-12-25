import { BaseQuery } from '../../../common/base/base.query';

/**
 * Query to fetch the high-level overview of a Family.
 *
 * Investor Note:
 * This powers the main dashboard. It doesn't load the whole graph (expensive).
 * Instead, it asks for:
 * 1. Summary Stats (Member counts, etc.)
 * 2. Recent Timeline Events
 * 3. Health/Completeness Score
 */
export class GetFamilyDashboardQuery extends BaseQuery {
  public readonly familyId: string;

  constructor(props: { userId: string; familyId: string; correlationId?: string }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.familyId = props.familyId;
  }
}
