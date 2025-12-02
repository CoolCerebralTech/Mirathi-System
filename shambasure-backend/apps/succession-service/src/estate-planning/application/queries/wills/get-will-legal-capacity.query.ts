// get-will-legal-capacity.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetWillLegalCapacityQuery implements IQuery {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
  ) {}
}
