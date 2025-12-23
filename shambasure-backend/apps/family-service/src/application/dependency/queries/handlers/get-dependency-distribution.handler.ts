import { Injectable } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import type { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/idependency-assessment.repository';
import { Result } from '../../../common/base/result';
import { DependencyAssessmentResponse } from '../../dto/response/dependency-assessment.response';
import { DependencyMapper } from '../../mappers/dependency.mapper';
import { SearchDependenciesQuery } from '../impl/get-dependency-distribution.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(SearchDependenciesQuery)
export class SearchDependenciesHandler extends BaseQueryHandler<
  SearchDependenciesQuery,
  DependencyAssessmentResponse[]
> {
  constructor(
    private readonly repository: ILegalDependantRepository,
    private readonly mapper: DependencyMapper,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(query: SearchDependenciesQuery): Promise<Result<DependencyAssessmentResponse[]>> {
    try {
      const validation = this.validateQuery(query);
      if (validation.isFailure) return Result.fail(validation.error!);

      const { result: dependants } = await this.withPerformanceMonitoring(async () => {
        // Map query search params to repository criteria
        // const criteria = query.getSearchParameters();
        // In a real implementation: return this.repository.searchByCriteria(query.deceasedId!, criteria);

        // Fallback for now if searchByCriteria isn't strictly typed for 'searchTerm'
        return this.repository.searchByCriteria(query.deceasedId || 'ALL', {});
      }, query);

      const response = this.mapper.toDependencyAssessmentResponseList(dependants);

      this.logSuccess(query, response, 'Search Dependencies');
      return Result.ok(response);
    } catch (error) {
      return this.handleError(error, query, 'SearchDependenciesHandler');
    }
  }
}
