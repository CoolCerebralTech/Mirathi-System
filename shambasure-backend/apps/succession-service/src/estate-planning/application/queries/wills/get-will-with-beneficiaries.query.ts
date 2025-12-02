// get-will-with-beneficiaries.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetWillWithBeneficiariesQuery implements IQuery {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
  ) {}
}
