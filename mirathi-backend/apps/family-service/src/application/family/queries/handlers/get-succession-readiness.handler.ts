import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { SuccessionReadinessService } from '../../../../domain/aggregates/family.aggregate';
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
      // 1. Load the Aggregate
      const family = await this.repository.findById(query.familyId);
      if (!family) {
        return Result.fail(new AppErrors.NotFoundError('Family', query.familyId));
      }

      // 2. Run Domain Service Analysis (The Legal Brain)
      const analysis = SuccessionReadinessService.analyzeSuccessionReadiness(family);

      // 3. Enhance with Real-time metrics (The Handler's job)

      // Calculate Potential Claimants (S.29)
      const potentialClaimants = family.props.members.filter((m) => {
        const age = m.calculateAge();
        // S.29: Children < 18, or anyone dependent (student/disabled)
        return (age !== null && age < 18) || m.props.hasDisability || m.props.isStudent;
      });

      // Calculate Data Integrity
      const totalMembers = family.memberCount;
      const verifiedMembers = family.props.members.filter(
        (m) => m.props.verificationStatus === 'VERIFIED',
      ).length;
      const verifiedPercentage =
        totalMembers > 0 ? Math.round((verifiedMembers / totalMembers) * 100) : 0;

      // 4. Calculate Weighted Score
      // We weight S.40 (Polygamy) heavily because it causes the most disputes
      let score = 0;
      if (analysis.s29Readiness === 'READY') score += 30;
      else if (analysis.s29Readiness === 'PARTIAL') score += 15;

      if (analysis.s40Readiness === 'READY' || analysis.s40Readiness === 'NOT_APPLICABLE')
        score += 40;
      else if (analysis.s40Readiness === 'PARTIAL') score += 20;

      if (analysis.legalClarity === 'CLEAR') score += 20;
      else if (analysis.legalClarity === 'MODERATE') score += 10;

      // Bonus for verification
      if (verifiedPercentage > 80) score += 10;

      // Cap at 100
      score = Math.min(score, 100);

      // 5. Map to VM
      const report: SuccessionReadinessVM = {
        familyId: family.id.toString(),
        generatedAt: new Date(),

        overallScore: score,
        readinessLevel: score >= 80 ? 'READY_TO_FILE' : score >= 50 ? 'PARTIAL' : 'NOT_READY',

        dependencyAnalysis: {
          status:
            analysis.s29Readiness === 'READY'
              ? 'PASS'
              : analysis.s29Readiness === 'PARTIAL'
                ? 'WARNING'
                : 'FAIL',
          potentialClaimantsCount: potentialClaimants.length,
          claimantNames: potentialClaimants.map((c) => c.props.name.getFullName()),
          issues: analysis.missingElements.filter(
            (e) => e.includes('S.29') || e.includes('dependent'),
          ),
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
          verifiedMembersPercentage: verifiedPercentage,
          missingCriticalDocuments: analysis.missingElements,
        },

        // Map recommendations with dynamic priorities
        recommendations: analysis.recommendations.map((rec) => {
          const isHighPriority =
            rec.toLowerCase().includes('polygam') || rec.toLowerCase().includes('verify');
          return {
            priority: isHighPriority ? 'HIGH' : 'MEDIUM',
            title: isHighPriority ? 'Critical Action Required' : 'Recommended Improvement',
            description: rec,
            // Simple routing logic based on content
            actionLink: rec.includes('Verify')
              ? `/family/members`
              : rec.includes('House')
                ? `/family/structure`
                : undefined,
          };
        }),
      };

      return Result.ok(report);
    } catch (error) {
      // Ensure compatible error return
      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }
}
