import { BaseQuery } from '../../../common/base/base.query';

/**
 * Query to fetch full profile details of a specific person.
 * Includes Bio, Docs, and immediate kinship links.
 */
export class GetFamilyMemberQuery extends BaseQuery {
  public readonly familyId: string;
  public readonly memberId: string;

  constructor(props: {
    userId: string;
    familyId: string;
    memberId: string;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.familyId = props.familyId;
    this.memberId = props.memberId;
  }
}
