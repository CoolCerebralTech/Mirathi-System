// get-will-summary.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetWillSummaryQuery } from './get-will-summary.query';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { WillSummaryResponseDto } from '../../dto/responses/will-summary.response.dto';
import { WillMapper } from '../../infrastructure/mappers/will.mapper';
import { Logger } from '@nestjs/common';

@QueryHandler(GetWillSummaryQuery)
export class GetWillSummaryHandler implements IQueryHandler<GetWillSummaryQuery> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly mapper: Wi
    llMapper,
    private readonly logger: Logger,
  ) {}

  async execute(query: GetWillSummaryQuery): Promise<WillSummaryResponseDto> {
    const { willId, testatorId } = query;
    
    this.logger.debug(`Fetching will summary ${willId} for testator ${testatorId}`);

    // Load the will
    const will = await this.willRepository.findById(willId);
    if (!will) {
      this.logger.warn(`Will ${willId} not found`);
      throw new Error(`Will ${willId} not found`);
    }

    // Verify testator ownership
    if (will.testatorId !== testatorId) {
      this.logger.warn(`Testator ${testatorId} does not own will ${willId}`);
      throw new Error('Unauthorized will access');
    }

    // Map to summary DTO
    const response = this.mapper.toSummaryDto(will);

    this.logger.debug(`Will summary ${willId} fetched successfully`);
    return response;
  }
}