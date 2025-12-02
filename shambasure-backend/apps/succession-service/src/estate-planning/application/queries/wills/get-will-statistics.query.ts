// get-will-statistics.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetWillStatisticsQuery implements IQuery {
  constructor(public readonly testatorId: string) {}
}
