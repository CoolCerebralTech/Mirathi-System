// src/application/guardianship/queries/impl/get-guardianship-by-id.query.ts
import { BaseQuery } from '../../../common/base/base.query';
import { IQuery } from '../../../common/interfaces/use-case.interface';

export class GetGuardianshipByIdQuery extends BaseQuery implements IQuery {
  public readonly guardianshipId: string;

  constructor(
    guardianshipId: string,
    userId: string,
    correlationId?: string,
  ) {
    super({ userId, correlationId });
    
    if (!guardianshipId) {
      throw new Error('Guardianship ID is required');
    }
    this.guardianshipId = guardianshipId;
  }
}