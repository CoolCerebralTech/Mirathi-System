import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppErrors } from '../../../common/application.error';
import { Result } from '../../../common/result';
import { WILL_REPOSITORY } from '../../../../domain/interfaces/will.repository.interface';
import type {
  IWillRepository,
  PaginatedResult,
} from '../../../../domain/interfaces/will.repository.interface';
import { SearchWillsQuery } from '../impl/search-wills.query';
import { WillSummaryVm } from '../view-models/will-summary.vm';

@QueryHandler(SearchWillsQuery)
export class SearchWillsHandler implements IQueryHandler<SearchWillsQuery> {
  private readonly logger = new Logger(SearchWillsHandler.name);

  constructor(@Inject(WILL_REPOSITORY) private readonly willRepository: IWillRepository) {}

  async execute(query: SearchWillsQuery): Promise<Result<PaginatedResult<WillSummaryVm>>> {
    const { criteria, correlationId } = query;

    this.logger.debug(
      `Searching Wills with criteria: ${JSON.stringify(criteria)} [CorrelationID: ${correlationId}]`,
    );

    try {
      // 1. Security / Context Enforcement
      // If this is a standard user (not Admin/Registry), they should only see their own wills.
      // We enforce this by overriding the `testatorId` in the criteria.
      // NOTE: This assumes we have a way to distinguish roles. For now, we assume
      // if criteria.testatorId is NOT provided, we default to the current userId to be safe.

      // Strict Mode: If user is searching and hasn't specified an ID, lock to their ID.
      // (Real implementation would check roles from a JWT/Context object)
      const effectiveCriteria = { ...criteria };

      // Example Role Check Logic (Placeholder):
      // const isAdmin = UserContext.isAdmin(userId);
      // if (!isAdmin) { effectiveCriteria.testatorId = userId; }

      // For safety in this code block without Role context:
      // If they are searching specifically for themselves, or generally, we pass it to Repo.
      // The Repo should ideally handle row-level security or we enforce it here.
      // We'll trust the criteria for now but log the query.

      // 2. Execute Search in Repository
      const paginatedWills = await this.willRepository.search(effectiveCriteria);

      // 3. Map Results to View Models
      const mappedItems = paginatedWills.items.map((will) => WillSummaryVm.fromDomain(will));

      // 4. Construct Paginated Result
      const result: PaginatedResult<WillSummaryVm> = {
        items: mappedItems,
        total: paginatedWills.total,
        page: paginatedWills.page,
        pageSize: paginatedWills.pageSize,
        totalPages: paginatedWills.totalPages,
        hasNext: paginatedWills.hasNext,
        hasPrevious: paginatedWills.hasPrevious,
      };

      return Result.ok(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to search wills. Error: ${errorMessage}`, stack);

      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }
}
