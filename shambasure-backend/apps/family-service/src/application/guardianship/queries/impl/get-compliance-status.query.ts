// application/guardianship/queries/impl/get-compliance-status.query.ts
import { BaseQuery } from '../base.query';

/**
 * Detailed S.72 (Bond) and S.73 (Report) status for a specific case.
 */
export class GetComplianceStatusQuery extends BaseQuery {
  public readonly guardianshipId: string;

  constructor(guardianshipId: string, baseProps: { userId: string; correlationId?: string }) {
    super(baseProps);
    this.guardianshipId = guardianshipId;

    if (!this.guardianshipId) throw new Error('Guardianship ID is required');
  }
}
