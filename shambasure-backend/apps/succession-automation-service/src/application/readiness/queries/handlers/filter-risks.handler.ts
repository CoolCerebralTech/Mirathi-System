import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { FilterRisksQuery } from '../impl/filter-risks.query';
import { RiskDetailVM } from '../view-models/risk-detail.vm';

@QueryHandler(FilterRisksQuery)
export class FilterRisksHandler implements IQueryHandler<FilterRisksQuery> {
  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly repository: IReadinessRepository,
  ) {}

  async execute(query: FilterRisksQuery): Promise<RiskDetailVM[]> {
    const { assessmentId, severity, category, status, isBlocking, includeResolved } = query.dto;

    const assessment = await this.repository.findById(assessmentId);
    if (!assessment) throw new NotFoundException('Assessment not found');

    let risks = assessment.riskFlags; // ReadonlyArray

    // Apply Filters
    if (!includeResolved) {
      risks = assessment.getUnresolvedRisks();
    } else if (status) {
      risks = risks.filter((r) => r.riskStatus === status);
    }

    if (severity) {
      risks = risks.filter((r) => r.severity === severity);
    }

    if (category) {
      risks = risks.filter((r) => r.category === category);
    }

    if (isBlocking !== undefined) {
      risks = risks.filter((r) => r.isBlocking === isBlocking);
    }

    // Sort by priority (highest first)
    const sortedRisks = [...risks].sort((a, b) => b.getPriorityScore() - a.getPriorityScore());

    return sortedRisks.map((r) => RiskDetailVM.fromDomain(r));
  }
}
