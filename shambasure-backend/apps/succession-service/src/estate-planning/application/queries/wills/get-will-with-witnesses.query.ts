// get-will-with-witnesses.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetWillWithWitnessesQuery implements IQuery {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
  ) {}
}
