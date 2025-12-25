import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

// Importing Interfaces for the Result
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
      // 0. Validate Input
      query.validate();

      // 1. Construct Filter Object
      // Removing undefined keys to keep the DB query clean
      const filters: any = {};
      if (query.searchText) filters.searchText = query.searchText;
      if (query.county) filters.county = query.county;
      if (query.clanName) filters.clanName = query.clanName;
      if (query.isPolygamous !== undefined) filters.isPolygamous = query.isPolygamous;
      if (query.creatorId) filters.creatorId = query.creatorId;

      // 2. Construct Pagination Object
      const pagination = {
        page: query.page,
        pageSize: query.pageSize,
        includeCount: true,
      };

      this.logger.log(`Searching families with filters: ${JSON.stringify(filters)}`);

      // 3. Execute Repository Search
      // The repo returns FamilySummary objects (lightweight projections), not full Aggregates
      // This ensures this query is fast (milliseconds) vs loading full Aggregate trees
      const result = await this.repository.search(filters, pagination);

      return Result.ok(result);
    } catch (error) {
      return this.handleError(error, query);
    }
  }
}
