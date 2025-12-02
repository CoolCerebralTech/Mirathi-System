// get-will.handler.ts
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { WillResponseDto } from '../../dto/responses/will.response.dto';
import { WillMapper } from '../../infrastructure/mappers/will.mapper';
import { AssetRepository } from '../../infrastructure/repositories/asset.repository';
import { BeneficiaryAssignmentRepository } from '../../infrastructure/repositories/beneficiary-assignment.repository';
import { ExecutorRepository } from '../../infrastructure/repositories/executor.repository';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { WitnessRepository } from '../../infrastructure/repositories/witness.repository';
import { GetWillQuery } from './get-will.query';

@QueryHandler(GetWillQuery)
export class GetWillHandler implements IQueryHandler<GetWillQuery> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly witnessRepository: WitnessRepository,
    private readonly beneficiaryRepository: BeneficiaryAssignmentRepository,
    private readonly assetRepository: AssetRepository,
    private readonly executorRepository: ExecutorRepository,
    private readonly mapper: WillMapper,
    private readonly logger: Logger,
  ) {}

  async execute(query: GetWillQuery): Promise<WillResponseDto> {
    const { willId, testatorId } = query;

    this.logger.debug(`Fetching will ${willId} for testator ${testatorId}`);

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

    // Load related entities for rich response
    const witnesses = await this.witnessRepository.findByWillId(willId);
    const beneficiaries = await this.beneficiaryRepository.findByWillId(willId);
    const assets = await this.assetRepository.findByIds(will.assetIds);
    const executors = await this.executorRepository.findByWillId(willId);

    // Map to response DTO
    const response = this.mapper.toResponseDto(will, assets, beneficiaries, executors, witnesses);

    this.logger.debug(`Will ${willId} fetched successfully`);
    return response;
  }
}
