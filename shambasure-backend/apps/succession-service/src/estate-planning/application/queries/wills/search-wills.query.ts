// search-wills.query.ts
import { IQuery } from '@nestjs/cqrs';
import { WillStatus, WillType } from '@prisma/client';

export class SearchWillsQuery implements IQuery {
  constructor(
    public readonly testatorId: string,
    public readonly searchTerm?: string,
    public readonly statuses?: WillStatus[],
    public readonly types?: WillType[],
    public readonly startDate?: Date,
    public readonly endDate?: Date,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}
