import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import {
  FamilyAggregate,
  FamilyDashboardService,
} from '../../../../domain/aggregates/family.aggregate';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { AppErrors } from '../../../common/application.error';
import { BaseQueryHandler } from '../../../common/base/base.query-handler';
import { Result } from '../../../common/result';
import { GetFamilyDashboardQuery } from '../impl/get-family-dashboard.query';
import { FamilyDashboardVM } from '../read-models/family-dashboard.vm';

@QueryHandler(GetFamilyDashboardQuery)
export class GetFamilyDashboardHandler
  extends BaseQueryHandler<GetFamilyDashboardQuery, FamilyDashboardVM>
  implements IQueryHandler<GetFamilyDashboardQuery, Result<FamilyDashboardVM>>
{
  constructor(
    @Inject(FAMILY_REPOSITORY)
    private readonly repository: IFamilyRepository,
    queryBus: QueryBus, // Passed to BaseQueryHandler if needed, though strictly not used here
  ) {
    super(queryBus);
  }

  async execute(query: GetFamilyDashboardQuery): Promise<Result<FamilyDashboardVM>> {
    try {
      // 1. Load the Aggregate (Full Depth needed for analysis)
      const family = await this.repository.findById(query.familyId);
      if (!family) {
        return Result.fail(new AppErrors.NotFoundError('Family', query.familyId));
      }

      // 2. Use Domain Service for Heavy Lifting
      // This service (from your aggregate file) returns the raw calculated stats
      const rawData = FamilyDashboardService.buildDashboard(family);

      // 3. Calculate "Digital Lawyer" Metrics (S.29 Dependents)
      const potentialDependents = family.props.members.filter((m) => {
        const age = m.calculateAge();
        return (age !== null && age < 18) || m.props.hasDisability || m.props.isStudent;
      }).length;

      // 4. Map to Strict "Investor-Grade" View Model
      const dashboard: FamilyDashboardVM = {
        familyId: family.id.toString(),
        name: family.props.name,
        description: family.props.description,

        // Cultural Context
        county: family.props.homeCounty || 'Unknown',
        clanName: family.props.clanName,
        totem: family.props.familyTotem,

        // Quick Stats
        stats: {
          totalMembers: family.memberCount,
          livingMembers: family.props.members.filter((m) => m.props.isAlive).length,
          deceasedMembers: family.props.members.filter((m) => !m.props.isAlive).length,
          verifiedMembers: family.props.members.filter(
            (m) => m.props.verificationStatus === 'VERIFIED',
          ).length,
          generationsCount: this.estimateGenerations(family),
          potentialDependents: potentialDependents,
        },

        // Structural Status
        structure: {
          type: rawData.summary.structureType,
          houseCount: family.props.houses.length,
          isS40Compliant: family.isPolygamous() ? family.props.houses.length > 0 : true,
          polygamyStatus: family.isPolygamous() ? 'POLYGAMOUS' : 'MONOGAMOUS',
        },

        // Succession Readiness (Mapped from Domain Service Analysis)
        successionReadiness: {
          score: rawData.analysis.dataCompleteness, // Proxy score
          status: this.mapReadinessStatus(rawData.legal.s29Readiness),
          missingKeyDocuments: 0, // Placeholder for Document Service integration
          issues: rawData.analysis.issues,
        },

        // Recent Activity
        recentEvents: rawData.timeline.map((event: any, index: number) => ({
          eventId: `evt_${index}`,
          date: event.date,
          description: event.details || event.event,
          actorName: 'System', // In a full implementation, we'd fetch the user name
          type: 'UPDATE', // Default mapping
        })),

        // Gamification
        completeness: {
          score: rawData.analysis.dataCompleteness,
          missingFieldsCount: rawData.analysis.issues.length,
          nextRecommendedAction:
            rawData.analysis.issues.length > 0
              ? {
                  title: 'Improve Data Quality',
                  route: '/family/audit',
                  reason: rawData.analysis.issues[0],
                }
              : undefined,
        },
      };

      return Result.ok(dashboard);
    } catch (error) {
      // Ensure handleError is compatible with Result return type
      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }

  /**
   * Simple heuristic to estimate tree depth
   */
  private estimateGenerations(family: FamilyAggregate): number {
    if (family.memberCount < 2) return 1;
    // In a real graph service, we traverse edges.
    // For dashboard speed, we assume a standard distribution or minimal depth.
    return 2;
  }

  private mapReadinessStatus(status: string): 'READY' | 'NEEDS_WORK' | 'CRITICAL_GAPS' {
    if (status === 'READY') return 'READY';
    if (status === 'PARTIAL') return 'NEEDS_WORK';
    return 'CRITICAL_GAPS';
  }
}
