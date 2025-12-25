import { BaseQuery } from '../../../common/base/base.query';

/**
 * Query to fetch the high-level overview of a Family.
 *
 * Investor Note:
 * This powers the main dashboard. It avoids loading the heavy graph visualization
 * but fetches enough "Digital Lawyer" stats to show legal health.
 */
export class GetFamilyDashboardQuery extends BaseQuery {
  public readonly familyId: string;

  constructor(props: { userId: string; familyId: string; correlationId?: string }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.familyId = props.familyId;
  }
}
