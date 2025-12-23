import { Injectable } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import type { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/idependency-assessment.repository';
import { Result } from '../../../common/base/result';
import { DependencyAssessmentResponse } from '../../dto/response/dependency-assessment.response';
import { DependencyMapper } from '../../mappers/dependency.mapper';
import { GetDependencyByIdQuery } from '../impl/get-dependency-assessment-summary.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(GetDependencyByIdQuery)
export class GetDependencyByIdHandler extends BaseQueryHandler<
  GetDependencyByIdQuery,
  DependencyAssessmentResponse
> {
  constructor(
    private readonly repository: ILegalDependantRepository,
    private readonly mapper: DependencyMapper,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(query: GetDependencyByIdQuery): Promise<Result<DependencyAssessmentResponse>> {
    try {
      // 1. Validate
      const validation = this.validateQuery(query);
      if (validation.isFailure) return Result.fail(validation.error!);

      // 2. Fetch
      const { result: entity } = await this.withPerformanceMonitoring(async () => {
        return this.repository.findById(query.dependencyId);
      }, query);

      if (!entity) {
        return Result.fail(new Error(`Dependency not found: ${query.dependencyId}`));
      }

      // 3. Map
      const response = this.mapper.toDependencyAssessmentResponse(entity);

      // 4. Enrich (Simulation)
      if (query.includeDeceasedDetails) {
        response.deceasedName = 'Enriched Deceased Name (Simulated)';
      }
      if (query.includeDependantDetails) {
        response.dependantName = 'Enriched Dependant Name (Simulated)';
      }

      this.logSuccess(query, response, 'Get Dependency By ID');
      return Result.ok(response);
    } catch (error) {
      return this.handleError(error, query, 'GetDependencyByIdHandler');
    }
  }
}
