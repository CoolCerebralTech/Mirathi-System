// get-will-summary.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetWillSummaryQuery implements IQuery {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
  ) {}
}
