// get-will-by-status.handler.ts
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { WillSummaryResponseDto } from '../../dto/responses/will-summary.response.dto';
import { WillMapper } from '../../infrastructure/mappers/will.mapper';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { GetWillByStatusQuery } from './get-will-by-status.query';

@QueryHandler(GetWillByStatusQuery)
export class GetWillByStatusHandler implements IQueryHandler<GetWillByStatusQuery> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly mapper: WillMapper,
    private readonly logger: Logger,
  ) {}

  async execute(query: GetWillByStatusQuery): Promise<WillSummaryResponseDto[]> {
    const { testatorId, status } = query;

    this.logger.debug(`Fetching wills with status ${status} for testator ${testatorId}`);

    // Fetch wills by status
    const wills = await this.willRepository.findByTestatorAndStatus(testatorId, status);

    // Map to summary DTOs
    const willDtos = wills.map((will) => this.mapper.toSummaryDto(will));

    this.logger.debug(
      `Found ${wills.length} wills with status ${status} for testator ${testatorId}`,
    );
    return willDtos;
  }
}
