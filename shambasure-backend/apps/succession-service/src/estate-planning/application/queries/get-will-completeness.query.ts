import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import { WillValidationService } from '../../domain/services/will-validation.service';

export class GetWillCompletenessQuery {
  constructor(
    public readonly willId: string,
    public readonly userId: string,
  ) {}
}

export class WillCompletenessResponse {
  isValid: boolean;
  score: number;
  criticalErrors: string[];
  warnings: string[];
  suggestions: string[];
}

@QueryHandler(GetWillCompletenessQuery)
export class GetWillCompletenessHandler implements IQueryHandler<GetWillCompletenessQuery> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    private readonly validationService: WillValidationService,
  ) {}

  async execute(query: GetWillCompletenessQuery): Promise<WillCompletenessResponse> {
    const { willId, userId } = query;

    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) throw new NotFoundException(`Will ${willId} not found.`);

    if (aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('Access denied.');
    }

    // Run Validation Service logic
    // Note: We aren't passing family members here, so Dependant checks might be skipped
    // or return generic warnings. Ideally, we'd fetch family members here too.
    const result = this.validationService.validateWill(aggregate, []);

    return {
      isValid: result.isValid,
      score: result.complianceScore,
      criticalErrors: result.criticalErrors,
      warnings: result.warnings,
      suggestions: result.suggestions,
    };
  }
}
