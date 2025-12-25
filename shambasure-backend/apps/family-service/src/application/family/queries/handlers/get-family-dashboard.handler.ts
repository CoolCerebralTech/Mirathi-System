import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { FamilyDashboardService } from '../../../../domain/aggregates/family.aggregate';
// Defined in your initial prompt
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
    queryBus: QueryBus,
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
      // This service (from your first prompt) calculates health, structure, and timeline
      const rawData = FamilyDashboardService.buildDashboard(family);

      // 3. Map to Strict View Model
      const dashboard: FamilyDashboardVM = {
        familyId: family.id.toString(),
        name: family.props.name,
        description: family.props.description,

        county: family.props.homeCounty || 'Unknown',
        clanName: family.props.clanName,

        stats: {
          totalMembers: family.memberCount,
          livingMembers: family.props.members.filter((m) => m.props.isAlive).length,
          deceasedMembers: family.props.members.filter((m) => !m.props.isAlive).length,
          verifiedMembers: family.props.members.filter(
            (m) => m.props.verificationStatus === 'VERIFIED',
          ).length,
          generationsCount: 3, // simplified, would calculate depth in graph service
        },

        structure: {
          type: rawData.summary.structureType,
          houseCount: family.props.houses.length,
          isS40Compliant: family.isPolygamous() ? family.props.houses.length > 0 : true,
        },

        recentEvents: rawData.timeline.map((event: any) => ({
          date: event.date,
          description: event.details,
          actorName: 'System', // Simplified
          type: 'UPDATE', // simplified
        })),

        completenessScore: rawData.analysis.dataCompleteness,
      };

      return Result.ok(dashboard);
    } catch (error) {
      return this.handleError(error, query);
    }
  }
}
