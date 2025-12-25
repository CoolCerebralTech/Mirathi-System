// src/application/guardianship/queries/impl/get-ward-compliance-history.query.ts
import { BaseQuery } from '../../../common/base/base.query';
import { IQuery } from '../../../common/interfaces/use-case.interface';

export class GetWardComplianceHistoryQuery extends BaseQuery implements IQuery {
  public readonly guardianshipId: string;
  public readonly options: {
    includeDrafts?: boolean;
    year?: number;
  };

  constructor(
    guardianshipId: string,
    userId: string,
    options: { includeDrafts?: boolean; year?: number } = {},
    correlationId?: string,
  ) {
    super({ userId, correlationId });

    if (!guardianshipId) {
      throw new Error('Guardianship ID is required');
    }
    this.guardianshipId = guardianshipId;
    this.options = options;
  }
}
