// get-will-compliance-status.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetWillComplianceStatusQuery implements IQuery {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
  ) {}
}
