// application/guardianship/queries/impl/get-customary-guardianship-details.query.ts
import { BaseQuery } from '../base.query';

/**
 * Specific query for extracting Cultural/Customary Law metadata
 * (Elder approvals, ceremonies, ethnic group rules)
 */
export class GetCustomaryGuardianshipDetailsQuery extends BaseQuery {
  public readonly guardianshipId: string;

  constructor(guardianshipId: string, baseProps: { userId: string; correlationId?: string }) {
    super(baseProps);
    this.guardianshipId = guardianshipId;

    if (!this.guardianshipId) throw new Error('Guardianship ID is required');
  }
}
