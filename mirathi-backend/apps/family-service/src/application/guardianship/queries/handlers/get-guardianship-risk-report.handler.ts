// src/application/guardianship/queries/handlers/get-guardianship-risk-report.handler.ts
import { Inject } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import { GuardianshipRiskService } from '../../../../domain/aggregates/guardianship.aggregate';
import {
  GUARDIANSHIP_REPOSITORY,
  type IGuardianshipRepository,
} from '../../../../domain/interfaces/iguardianship.repository';
import { AppErrors } from '../../../common/application.error';
import { BaseQueryHandler } from '../../../common/base/base.query-handler';
import { Result } from '../../../common/result';
import { GetGuardianshipRiskReportQuery } from '../impl/get-guardianship-risk-report.query';
import { RiskAssessmentReadModel } from '../read-models/risk-assessment.read-model';

@QueryHandler(GetGuardianshipRiskReportQuery)
export class GetGuardianshipRiskReportHandler extends BaseQueryHandler<
  GetGuardianshipRiskReportQuery,
  RiskAssessmentReadModel
> {
  constructor(
    @Inject(GUARDIANSHIP_REPOSITORY)
    private readonly guardianshipRepo: IGuardianshipRepository,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(query: GetGuardianshipRiskReportQuery): Promise<Result<RiskAssessmentReadModel>> {
    try {
      const aggregate = await this.guardianshipRepo.findById(query.guardianshipId);
      if (!aggregate) {
        return Result.fail(new AppErrors.NotFoundError('Guardianship', query.guardianshipId));
      }

      // 1. Invoke Domain Service
      const riskAnalysis = GuardianshipRiskService.assessRisk(aggregate);

      // 2. Map to Read Model
      const readModel = new RiskAssessmentReadModel({
        guardianshipId: aggregate.id.toString(),
        generatedAt: new Date(),
        overallRiskLevel: riskAnalysis.level,
        riskScore: riskAnalysis.level === 'CRITICAL' ? 90 : riskAnalysis.level === 'HIGH' ? 70 : 20,

        activeAlerts: riskAnalysis.factors.map((f, index) => ({
          code: `RISK-${index}`,
          description: f,
          severity: riskAnalysis.level, // Simplified inheritance
          detectedAt: new Date(),
        })),

        automatedRecommendations: query.includeRecommendations
          ? riskAnalysis.recommendations.map((r, index) => ({
              priority: index + 1,
              title: 'Action Required',
              action: r,
              legalReference: 'Children Act 2001',
            }))
          : [],
      });

      this.logSuccess(query, readModel);
      return Result.ok(readModel);
    } catch (error) {
      this.handleError(error, query);
    }
  }
}
