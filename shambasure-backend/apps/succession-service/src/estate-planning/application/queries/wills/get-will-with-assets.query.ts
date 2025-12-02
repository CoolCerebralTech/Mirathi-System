// get-will-with-assets.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetWillWithAssetsQuery implements IQuery {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
  ) {}
}
