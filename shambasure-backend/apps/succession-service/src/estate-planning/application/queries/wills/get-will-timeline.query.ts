// get-will-timeline.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetWillTimelineQuery implements IQuery {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
  ) {}
}
