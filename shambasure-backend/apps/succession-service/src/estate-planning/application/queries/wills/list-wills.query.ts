// list-wills.query.ts
import { IQuery } from '@nestjs/cqrs';
import { WillStatus, WillType } from '@prisma/client';

export class ListWillsQuery implements IQuery {
  constructor(
    public readonly testatorId: string,
    public readonly status?: WillStatus,
    public readonly type?: WillType,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly includeRevoked: boolean = false,
  ) {}
}
