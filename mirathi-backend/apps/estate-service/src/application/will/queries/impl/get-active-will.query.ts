import { BaseQuery } from '../../../common/base/base.query';

/**
 * Query to find the single effective Will for a Testator.
 * Used during Probate Setup to load the "Truth".
 */
export class GetActiveWillQuery extends BaseQuery {
  public readonly testatorId: string;

  constructor(props: { testatorId: string; userId: string; correlationId?: string }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.testatorId = props.testatorId;
  }
}
