import { Injectable } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import type { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/ilegal-dependant.repository';
import { Result } from '../../../common/base/result';
import { DependencyStatistics } from '../../dto/response/dependency-status.response';
import { DependencyMapper } from '../../mappers/dependency.mapper';
import { GetDependencyStatisticsQuery } from '../impl/get-dependency-statistics.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(GetDependencyStatisticsQuery)
export class GetDependencyStatisticsHandler extends BaseQueryHandler<
  GetDependencyStatisticsQuery,
  DependencyStatistics
> {
  constructor(
    private readonly repository: ILegalDependantRepository,
    private readonly mapper: DependencyMapper,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(query: GetDependencyStatisticsQuery): Promise<Result<DependencyStatistics>> {
    try {
      const validation = this.validateQuery(query);
      if (validation.isFailure) return Result.fail(validation.error!);

      const { result: stats } = await this.withPerformanceMonitoring(async () => {
        return this.repository.getDependencyStatistics(query.deceasedId);
      }, query);

      const response = this.mapper.toDependencyStatistics(stats);

      this.logSuccess(query, response, 'Get Dependency Statistics');
      return Result.ok(response);
    } catch (error) {
      return this.handleError(error, query, 'GetDependencyStatisticsHandler');
    }
  }
}
