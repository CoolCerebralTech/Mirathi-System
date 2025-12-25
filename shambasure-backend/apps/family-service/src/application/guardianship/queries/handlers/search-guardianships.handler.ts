// src/application/guardianship/queries/handlers/search-guardianships.handler.ts
import { Inject } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import { GuardianshipRiskService } from '../../../../domain/aggregates/guardianship.aggregate';
import {
  GUARDIANSHIP_REPOSITORY,
  type IGuardianshipRepository,
  type PaginatedResult,
} from '../../../../domain/interfaces/iguardianship.repository';
import { BaseQueryHandler } from '../../../common/base/base.query-handler';
import { Result } from '../../../common/result';
import { SearchGuardianshipsQuery } from '../impl/search-guardianships.query';
import { GuardianshipListItemReadModel } from '../read-models/guardianship-list-item.read-model';

@QueryHandler(SearchGuardianshipsQuery)
export class SearchGuardianshipsHandler extends BaseQueryHandler<
  SearchGuardianshipsQuery,
  PaginatedResult<GuardianshipListItemReadModel>
> {
  constructor(
    @Inject(GUARDIANSHIP_REPOSITORY)
    private readonly guardianshipRepo: IGuardianshipRepository,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(
    query: SearchGuardianshipsQuery,
  ): Promise<Result<PaginatedResult<GuardianshipListItemReadModel>>> {
    try {
      // 1. Fetch from Repository
      const result = await this.guardianshipRepo.search(query.filters, {
        page: query.filters.page,
        pageSize: query.filters.pageSize,
      });

      // 2. Map items to lightweight Read Models
      const mappedItems = result.items.map((agg) => {
        const props = (agg as any).props;
        const risk = GuardianshipRiskService.assessRisk(agg);
        const primaryGuardian = agg.getPrimaryGuardian();

        return new GuardianshipListItemReadModel({
          id: agg.id.toString(),
          caseNumber: props.caseNumber || 'N/A',
          wardName: props.wardFullName,
          wardAge: props.wardReference.getAge(),
          primaryGuardianName: primaryGuardian
            ? (primaryGuardian as any).props.guardianName
            : 'NONE',
          status: props.status,
          riskLevel: risk.level,
          nextComplianceDue: agg.getNextComplianceDue() || new Date(),
          establishedDate: props.establishedDate,
        });
      });

      // 3. Construct response
      const paginatedResponse: PaginatedResult<GuardianshipListItemReadModel> = {
        items: mappedItems,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      };

      this.logSuccess(query, undefined, `Found ${result.total} items`);
      return Result.ok(paginatedResponse);
    } catch (error) {
      this.handleError(error, query);
    }
  }
}
