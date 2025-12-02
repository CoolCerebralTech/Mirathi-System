// get-active-will.handler.ts
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { WillResponseDto } from '../../dto/responses/will.response.dto';
import { WillMapper } from '../../infrastructure/mappers/will.mapper';
import { EstatePlanningRepository } from '../../infrastructure/repositories/estate-planning.repository';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { GetActiveWillQuery } from './get-active-will.query';

@QueryHandler(GetActiveWillQuery)
export class GetActiveWillHandler implements IQueryHandler<GetActiveWillQuery> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly estatePlanningRepository: EstatePlanningRepository,
    private readonly mapper: WillMapper,
    private readonly logger: Logger,
  ) {}

  async execute(query: GetActiveWillQuery): Promise<WillResponseDto | null> {
    const { testatorId } = query;

    this.logger.debug(`Fetching active will for testator ${testatorId}`);

    // Get estate planning to find active will
    const estatePlanning = await this.estatePlanningRepository.findByUserId(testatorId);
    if (!estatePlanning || !estatePlanning.getActiveWillId()) {
      this.logger.debug(`No active will found for testator ${testatorId}`);
      return null;
    }

    const activeWillId = estatePlanning.getActiveWillId()!;

    // Load the active will
    const will = await this.willRepository.findById(activeWillId);
    if (!will) {
      this.logger.warn(`Active will ${activeWillId} not found for testator ${testatorId}`);
      throw new Error(`Active will ${activeWillId} not found`);
    }

    // Verify testator ownership
    if (will.testatorId !== testatorId) {
      this.logger.warn(`Testator ${testatorId} does not own active will ${activeWillId}`);
      throw new Error('Unauthorized will access');
    }

    // Map to response DTO (simplified - could load related entities if needed)
    const response = this.mapper.toResponseDto(will, [], [], [], []);

    this.logger.debug(`Active will ${activeWillId} fetched successfully`);
    return response;
  }
}
