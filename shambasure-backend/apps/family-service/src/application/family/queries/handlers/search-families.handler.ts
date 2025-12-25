import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import type {
  FamilySummary,
  IFamilyRepository,
  PaginatedResult,
} from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { BaseQueryHandler } from '../../../common/base/base.query-handler';
import { Result } from '../../../common/result';
import { SearchFamiliesQuery } from '../impl/search-families.query';

@QueryHandler(SearchFamiliesQuery)
export class SearchFamiliesHandler
  extends BaseQueryHandler<SearchFamiliesQuery, PaginatedResult<FamilySummary>>
  implements IQueryHandler<SearchFamiliesQuery, Result<PaginatedResult<FamilySummary>>>
{
  constructor(
    @Inject(FAMILY_REPOSITORY)
    private readonly repository: IFamilyRepository,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(query: SearchFamiliesQuery): Promise<Result<PaginatedResult<FamilySummary>>> {
    try {
      // 1. Construct Filter Object
      const filters = {
        searchText: query.searchText,
        county: query.county,
        clanName: query.clanName,
        isPolygamous: query.isPolygamous,
        creatorId: query.creatorId,
      };

      // 2. Construct Pagination Object
      const pagination = {
        page: query.page,
        pageSize: query.pageSize,
        includeCount: true,
      };

      // 3. Execute Repository Search
      // The repo returns FamilySummary objects (lightweight projections), not full Aggregates
      const result = await this.repository.search(filters, pagination);

      return Result.ok(result);
    } catch (error) {
      return this.handleError(error, query);
    }
  }
}
