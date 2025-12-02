// get-active-will.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetActiveWillQuery implements IQuery {
  constructor(public readonly testatorId: string) {}
}
