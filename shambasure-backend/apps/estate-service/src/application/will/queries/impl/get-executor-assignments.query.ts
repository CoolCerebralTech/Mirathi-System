import { BaseQuery } from '../../../../application/common/base/base.query';

/**
 * Query to find wills where the user is an Appointed Executor.
 */
export class GetExecutorAssignmentsQuery extends BaseQuery {
  public readonly executorIdentifier: string;
  public readonly willStatus?: string[];

  constructor(props: {
    executorIdentifier: string;
    willStatus?: string[];
    userId: string;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.executorIdentifier = props.executorIdentifier;
    this.willStatus = props.willStatus;
  }
}
