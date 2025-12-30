import { BaseQuery } from '../../../common/base/base.query';

/**
 * Query to retrieve the chronological history of a Testator's wills.
 * Includes Revoked, Draft, and Active versions.
 */
export class GetTestatorHistoryQuery extends BaseQuery {
  public readonly testatorId: string;

  constructor(props: { testatorId: string; userId: string; correlationId?: string }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.testatorId = props.testatorId;
  }
}
