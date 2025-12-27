import { BaseQuery } from '../../../../application/common/base/base.query';

export class GetWillByIdQuery extends BaseQuery {
  public readonly willId: string;
  public readonly includeDetails: boolean;

  constructor(props: {
    willId: string;
    includeDetails?: boolean;
    userId: string;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.willId = props.willId;
    this.includeDetails = props.includeDetails ?? true;
  }
}
