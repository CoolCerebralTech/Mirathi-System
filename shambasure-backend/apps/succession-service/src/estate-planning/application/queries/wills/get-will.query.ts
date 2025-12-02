// get-will.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetWillQuery implements IQuery {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
  ) {}
}
