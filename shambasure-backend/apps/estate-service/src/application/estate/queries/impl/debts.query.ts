import { IQuery } from '@nestjs/cqrs';

import { GetEstateDebtsDto } from '../dtos/debts/get-estate-debts.dto';

export class GetEstateDebtsQuery implements IQuery {
  constructor(
    public readonly dto: GetEstateDebtsDto,
    public readonly userId: string,
    public readonly correlationId?: string,
  ) {}
}
