// application/guardianship/queries/impl/get-guardianship-by-id.query.ts
import { BaseQuery } from '../base.query';

export class GetGuardianshipByIdQuery extends BaseQuery {
  public readonly guardianshipId: string;

  constructor(guardianshipId: string, baseProps: { userId: string; correlationId?: string }) {
    super(baseProps);
    this.guardianshipId = guardianshipId;

    if (!this.guardianshipId) throw new Error('Guardianship ID is required');
  }
}
