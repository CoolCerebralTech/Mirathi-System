// application/guardianship/queries/impl/get-guardian-active-assignments.query.ts
import { BaseQuery } from '../base.query';

/**
 * Used by Guardians to see "Who am I responsible for?"
 */
export class GetGuardianActiveAssignmentsQuery extends BaseQuery {
  public readonly guardianId: string;

  constructor(guardianId: string, baseProps: { userId: string; correlationId?: string }) {
    super(baseProps);
    this.guardianId = guardianId;

    if (!this.guardianId) throw new Error('Guardian ID is required');
  }
}
