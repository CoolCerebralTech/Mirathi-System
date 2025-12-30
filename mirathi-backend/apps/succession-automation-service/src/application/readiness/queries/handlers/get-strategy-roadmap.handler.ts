import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { StrategyGeneratorService } from '../../services/strategy-generator.service';
import { GetStrategyRoadmapQuery } from '../impl/get-strategy-roadmap.query';
import { StrategyRoadmapVM } from '../view-models/strategy-roadmap.vm';

@QueryHandler(GetStrategyRoadmapQuery)
export class GetStrategyRoadmapHandler implements IQueryHandler<GetStrategyRoadmapQuery> {
  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly repository: IReadinessRepository,
    private readonly strategyService: StrategyGeneratorService,
  ) {}

  async execute(query: GetStrategyRoadmapQuery): Promise<StrategyRoadmapVM> {
    const { assessmentId, estateId } = query.dto;

    let assessment;
    if (assessmentId) assessment = await this.repository.findById(assessmentId);
    else if (estateId) assessment = await this.repository.findByEstateId(estateId);

    if (!assessment) throw new NotFoundException('Assessment not found');

    const vm = new StrategyRoadmapVM();

    // Generate the Markdown text
    vm.strategyContent = this.strategyService.generateStrategy(
      assessment.successionContext,
      assessment.readinessScore,
      [...assessment.riskFlags], // Pass copy of risks
    );

    // Simplistic milestone generation based on status
    // In a real app, this might come from a Roadmap Aggregate
    const score = assessment.readinessScore.score;
    vm.milestones = [
      {
        title: 'Initial Data Collection',
        isCompleted: score > 20,
        blockers: [],
      },
      {
        title: 'Document Verification',
        isCompleted: score > 50,
        blockers: assessment
          .getUnresolvedRisks()
          .filter((r) => r.category.includes('DOCUMENT'))
          .map((r) => r.id.toString()),
      },
      {
        title: 'Legal Compliance Check',
        isCompleted: score > 80,
        blockers: assessment.getBlockingRisks().map((r) => r.id.toString()),
      },
      {
        title: 'Court Filing',
        isCompleted: assessment.canFile(),
        blockers: assessment.getBlockingRisks().map((r) => r.id.toString()),
      },
    ];

    vm.filingFeeEstimate = this.estimateFees(assessment.successionContext.estateValueKES || 0);

    return vm;
  }

  private estimateFees(value: number): number {
    // Simplified Kenyan Court Fees logic
    if (value === 0) return 3000;
    // Standard logic often involves a base + percentage for some matters, or fixed tiers
    // Using a simple tier for now
    if (value < 500000) return 2000;
    return 5000; // Standard High Court filing fee approximation
  }
}
