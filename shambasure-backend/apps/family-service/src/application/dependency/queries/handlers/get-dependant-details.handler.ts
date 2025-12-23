import { Injectable } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import type { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/idependency-assessment.repository';
import { Result } from '../../../common/base/result';
import { DependencyAssessmentResponse } from '../../dto/response/dependency-assessment.response';
import { DependencyMapper } from '../../mappers/dependency.mapper';
import { ListDependenciesByDeceasedQuery } from '../impl/get-dependant-details.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(ListDependenciesByDeceasedQuery)
export class ListDependenciesByDeceasedHandler extends BaseQueryHandler<
  ListDependenciesByDeceasedQuery,
  DependencyAssessmentResponse[]
> {
  constructor(
    private readonly repository: ILegalDependantRepository,
    private readonly mapper: DependencyMapper,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(
    query: ListDependenciesByDeceasedQuery,
  ): Promise<Result<DependencyAssessmentResponse[]>> {
    try {
      const validation = this.validateQuery(query);
      if (validation.isFailure) return Result.fail(validation.error!);

      // In a real implementation, you would pass the filter criteria to the repository
      // filter = query.getFilterCriteria()
      const { result: dependants } = await this.withPerformanceMonitoring(async () => {
        return this.repository.findAllByDeceasedId(query.deceasedId);
      }, query);

      // Map to DTOs
      const response = this.mapper.toDependencyAssessmentResponseList(dependants);

      this.logSuccess(query, response, 'List Dependencies');
      return Result.ok(response);
    } catch (error) {
      return this.handleError(error, query, 'ListDependenciesByDeceasedHandler');
    }
  }
}
