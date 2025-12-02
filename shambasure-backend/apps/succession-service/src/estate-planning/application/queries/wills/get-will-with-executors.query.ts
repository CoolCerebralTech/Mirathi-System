// get-will-with-executors.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetWillWithExecutorsQuery implements IQuery {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
  ) {}
}
