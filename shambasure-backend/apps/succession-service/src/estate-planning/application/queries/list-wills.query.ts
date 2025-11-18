// estate-planning/application/queries/list-wills.query.ts
import { WillStatus } from '@prisma/client';

export class ListWillsQuery {
  constructor(
    public readonly testatorId: string,
    public readonly status?: WillStatus,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}
