import { BaseQuery } from '../../../common/base/base.query';

/**
 * Query to run the Legal Compliance Radar (S.11 & S.26 checks).
 * Does not change state; strictly analysis.
 */
export class GetWillComplianceReportQuery extends BaseQuery {
  public readonly willId: string;
  public readonly scope: 'INTERNAL' | 'FULL';

  constructor(props: {
    willId: string;
    scope?: 'INTERNAL' | 'FULL';
    userId: string;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.willId = props.willId;
    this.scope = props.scope ?? 'INTERNAL';
  }
}
