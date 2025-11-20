import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import { WillResponseDto } from '../dto/response/will.response.dto';

export class GetWillQuery {
  constructor(
    public readonly willId: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetWillQuery)
export class GetWillHandler implements IQueryHandler<GetWillQuery> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
  ) {}

  async execute(query: GetWillQuery): Promise<WillResponseDto> {
    const { willId, userId } = query;

    // 1. Fetch Aggregate (Includes Assets, Beneficiaries, etc.)
    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) {
      throw new NotFoundException(`Will ${willId} not found.`);
    }

    // 2. Security Check
    if (aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('You do not have access to this will.');
    }

    // 3. Map to Response DTO
    // We extract the entities from the aggregate to flatten them for the DTO
    const willEntity = aggregate.getWill();

    // Construct raw object matching DTO structure for transformation
    // Note: The Aggregate getters we defined earlier (getAssets, etc.) allow this
    const responseData = {
      ...willEntity, // Spread getter values
      // Manually map relationships from Aggregate to DTO structure
      assets: aggregate.getAssets(),
      beneficiaries: aggregate.getBeneficiaries(),
      executors: aggregate.getExecutors(),
      witnesses: aggregate.getWitnesses(),

      // Computed properties
      requiresWitnesses: willEntity.getRequiresWitnesses(),
      witnessCount: willEntity.getWitnessCount(),
      isReadyForActivation: willEntity.isReadyForActivation(),
    };

    return plainToInstance(WillResponseDto, responseData, {
      excludeExtraneousValues: true, // Strict DTO filtering
    });
  }
}
