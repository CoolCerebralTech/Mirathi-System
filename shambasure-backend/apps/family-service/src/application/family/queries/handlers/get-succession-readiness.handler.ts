import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { SuccessionReadinessService } from '../../../../domain/aggregates/family.aggregate';
// Defined in initial prompt
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { AppErrors } from '../../../common/application.error';
import { BaseQueryHandler } from '../../../common/base/base.query-handler';
import { Result } from '../../../common/result';
import { GetSuccessionReadinessQuery } from '../impl/get-succession-readiness.query';
import { SuccessionReadinessVM } from '../read-models/succession-readiness.vm';

@QueryHandler(GetSuccessionReadinessQuery)
export class GetSuccessionReadinessHandler
  extends BaseQueryHandler<GetSuccessionReadinessQuery, SuccessionReadinessVM>
  implements IQueryHandler<GetSuccessionReadinessQuery, Result<SuccessionReadinessVM>>
{
  constructor(
    @Inject(FAMILY_REPOSITORY)
    private readonly repository: IFamilyRepository,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(query: GetSuccessionReadinessQuery): Promise<Result<SuccessionReadinessVM>> {
    try {
      const family = await this.repository.findById(query.familyId);
      if (!family) {
        return Result.fail(new AppErrors.NotFoundError('Family', query.familyId));
      }

      // 1. Run Domain Analysis
      const analysis = SuccessionReadinessService.analyzeSuccessionReadiness(family);

      // 2. Calculate Score (Simple weighted logic)
      let score = 0;
      if (analysis.s29Readiness === 'READY') score += 40;
      if (analysis.s29Readiness === 'PARTIAL') score += 20;

      if (analysis.s40Readiness === 'READY' || analysis.s40Readiness === 'NOT_APPLICABLE')
        score += 40;
      if (analysis.s40Readiness === 'PARTIAL') score += 20;

      if (analysis.legalClarity === 'CLEAR') score += 20;
      if (analysis.legalClarity === 'MODERATE') score += 10;

      // 3. Map to VM
      const report: SuccessionReadinessVM = {
        familyId: family.id.toString(),
        generatedAt: new Date(),

        overallScore: score,
        readinessLevel: score >= 80 ? 'READY_TO_FILE' : score >= 50 ? 'PARTIAL' : 'NOT_READY',

        dependencyAnalysis: {
          status: analysis.s29Readiness === 'READY' ? 'PASS' : 'WARNING',
          potentialClaimantsCount: 0, // Would need count logic from service
          issues: analysis.missingElements.filter((e) => e.includes('S.29')),
        },

        polygamyAnalysis: {
          isPolygamous: family.isPolygamous(),
          status:
            analysis.s40Readiness === 'READY'
              ? 'PASS'
              : analysis.s40Readiness === 'NOT_APPLICABLE'
                ? 'NOT_APPLICABLE'
                : 'FAIL',
          definedHouses: family.props.houses.length,
          issues: analysis.missingElements.filter(
            (e) => e.includes('Polygamous') || e.includes('House'),
          ),
        },

        dataIntegrity: {
          verifiedMembersPercentage: 0, // Placeholder
          missingCriticalDocuments: analysis.missingElements,
        },

        recommendations: analysis.recommendations.map((rec) => ({
          priority: 'HIGH',
          title: 'Legal Recommendation',
          description: rec,
        })),
      };

      return Result.ok(report);
    } catch (error) {
      return this.handleError(error, query);
    }
  }
}
