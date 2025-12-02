// get-will-by-status.query.ts
import { IQuery } from '@nestjs/cqrs';
import { WillStatus } from '@prisma/client';

export class GetWillByStatusQuery implements IQuery {
  constructor(
    public readonly testatorId: string,
    public readonly status: WillStatus,
  ) {}
}
