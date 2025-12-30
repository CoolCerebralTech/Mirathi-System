import { IQuery } from '@nestjs/cqrs';

import { GetDistributionReadinessDto } from '../dtos/reports/get-distribution-readiness.dto';

export class GetDistributionReadinessQuery implements IQuery {
  constructor(
    public readonly dto: GetDistributionReadinessDto,
    public readonly userId: string,
    public readonly correlationId?: string,
  ) {}
}
