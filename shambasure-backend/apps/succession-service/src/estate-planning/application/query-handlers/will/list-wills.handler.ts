// list-wills.handler.ts
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { WillSummaryResponseDto } from '../../dto/responses/will-summary.response.dto';
import { WillMapper } from '../../infrastructure/mappers/will.mapper';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { ListWillsQuery } from './list-wills.query';

@QueryHandler(ListWillsQuery)
export class ListWillsHandler implements IQueryHandler<ListWillsQuery> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly mapper: WillMapper,
    private readonly logger: Logger,
  ) {}

  async execute(query: ListWillsQuery): Promise<{
    wills: WillSummaryResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { testatorId, status, type, page, limit, includeRevoked } = query;

    this.logger.debug(`Listing wills for testator ${testatorId}, page ${page}, limit ${limit}`);

    // Build filters
    const filters: any = { testatorId };

    if (status) {
      filters.status = status;
    }

    if (type) {
      filters.type = type;
    }

    if (!includeRevoked) {
      filters.isRevoked = false;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch paginated wills
    const [wills, total] = await this.willRepository.findWithPagination(filters, skip, limit);

    // Map to summary DTOs
    const willDtos = wills.map((will) => this.mapper.toSummaryDto(will));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    this.logger.debug(`Found ${wills.length} wills for testator ${testatorId}`);

    return {
      wills: willDtos,
      total,
      page,
      totalPages,
    };
  }
}
