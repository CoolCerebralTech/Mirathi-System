// src/application/guardianship/queries/impl/get-guardianship-risk-report.query.ts
import { BaseQuery } from '../../../common/base/base.query';
import { IQuery } from '../../../common/interfaces/use-case.interface';

export class GetGuardianshipRiskReportQuery extends BaseQuery implements IQuery {
  public readonly guardianshipId: string;
  public readonly includeRecommendations: boolean;

  constructor(
    guardianshipId: string,
    userId: string,
    includeRecommendations: boolean = true,
    correlationId?: string,
  ) {
    super({ userId, correlationId });

    if (!guardianshipId) {
      throw new Error('Guardianship ID is required');
    }
    this.guardianshipId = guardianshipId;
    this.includeRecommendations = includeRecommendations;
  }
}
