// search-wills.handler.ts
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { WillSummaryResponseDto } from '../../dto/responses/will-summary.response.dto';
import { WillMapper } from '../../infrastructure/mappers/will.mapper';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { SearchWillsQuery } from './search-wills.query';

@QueryHandler(SearchWillsQuery)
export class SearchWillsHandler implements IQueryHandler<SearchWillsQuery> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly mapper: WillMapper,
    private readonly logger: Logger,
  ) {}

  async execute(query: SearchWillsQuery): Promise<{
    wills: WillSummaryResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { testatorId, searchTerm, statuses, types, startDate, endDate, page, limit } = query;

    this.logger.debug(`Searching wills for testator ${testatorId}, term: ${searchTerm}`);

    // Build search filters
    const filters: any = { testatorId };

    if (searchTerm) {
      filters.searchTerm = searchTerm;
    }

    if (statuses && statuses.length > 0) {
      filters.statuses = statuses;
    }

    if (types && types.length > 0) {
      filters.types = types;
    }

    if (startDate) {
      filters.startDate = startDate;
    }

    if (endDate) {
      filters.endDate = endDate;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Search wills
    const [wills, total] = await this.willRepository.searchWithPagination(filters, skip, limit);

    // Map to summary DTOs
    const willDtos = wills.map((will) => this.mapper.toSummaryDto(will));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    this.logger.debug(`Search found ${wills.length} wills for testator ${testatorId}`);

    return {
      wills: willDtos,
      total,
      page,
      totalPages,
    };
  }
}
