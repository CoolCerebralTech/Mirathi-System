import { IQuery } from '@nestjs/cqrs';

import { FilterRisksDto } from '../dtos/filter-risks.dto';

export class FilterRisksQuery implements IQuery {
  constructor(public readonly dto: FilterRisksDto) {}
}
