import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { RiskSeverity } from '../../../../domain/entities/risk-flag.entity';
import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { ReadinessScore } from '../../../../domain/value-objects/readiness-score.vo';
import { SimulateScoreQuery } from '../impl/simulate-score.query';
import { SimulationResultVM } from '../view-models/simulation-result.vm';

@QueryHandler(SimulateScoreQuery)
export class SimulateScoreHandler implements IQueryHandler<SimulateScoreQuery> {
  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly repository: IReadinessRepository,
  ) {}

  async execute(query: SimulateScoreQuery): Promise<SimulationResultVM> {
    const { assessmentId, risksToResolve } = query.dto;

    const assessment = await this.repository.findById(assessmentId);
    if (!assessment) throw new NotFoundException('Assessment not found');

    // 1. Current State
    const currentScore = assessment.readinessScore;

    // 2. Simulate Resolution
    // We filter out the risks the user plans to fix from the ACTIVE list
    const simulatedRisks = assessment.riskFlags.filter(
      (risk) => !risk.isResolved && !risksToResolve.includes(risk.id.toString()),
    );

    // 3. Recalculate Logic (In-Memory)
    const criticalCount = simulatedRisks.filter((r) => r.severity === RiskSeverity.CRITICAL).length;
    const highCount = simulatedRisks.filter((r) => r.severity === RiskSeverity.HIGH).length;
    const mediumCount = simulatedRisks.filter((r) => r.severity === RiskSeverity.MEDIUM).length;
    const lowCount = simulatedRisks.filter((r) => r.severity === RiskSeverity.LOW).length;

    const projectedScore = ReadinessScore.calculate(
      { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount },
      assessment.successionContext,
    );

    // 4. Build Result
    const result = new SimulationResultVM();
    result.currentScore = currentScore.score;
    result.projectedScore = projectedScore.score;
    result.scoreImprovement = projectedScore.score - currentScore.score;
    result.newStatusLabel = projectedScore.status.replace(/_/g, ' ');
    result.willBeReadyToFile = projectedScore.canFile();
    result.remainingBlockersCount = criticalCount;

    return result;
  }
}
