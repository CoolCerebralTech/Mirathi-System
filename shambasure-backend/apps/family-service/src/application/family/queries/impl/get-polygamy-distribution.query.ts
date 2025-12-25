import { BaseQuery } from '../../../common/base/base.query';

/**
 * Query to fetch the family structure grouped by "House".
 *
 * Legal Context:
 * Used specifically for Estate Distribution previews.
 * It returns the family tree, but clustered by:
 * - House of First Wife
 * - House of Second Wife
 * - etc.
 */
export class GetPolygamyDistributionQuery extends BaseQuery {
  public readonly familyId: string;

  constructor(props: { userId: string; familyId: string; correlationId?: string }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.familyId = props.familyId;
  }
}
