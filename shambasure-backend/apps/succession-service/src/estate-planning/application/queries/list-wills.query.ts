import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { WillStatus } from '@prisma/client';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import { WillResponseDto } from '../dto/response/will.response.dto';

export class ListWillsQuery {
  constructor(
    public readonly userId: string,
    public readonly status?: WillStatus, // Optional filter
  ) {}
}

@QueryHandler(ListWillsQuery)
export class ListWillsHandler implements IQueryHandler<ListWillsQuery> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
  ) {}

  async execute(query: ListWillsQuery): Promise<WillResponseDto[]> {
    const { userId, status } = query;

    // 1. Fetch Aggregates
    // Note: Repository method findByTestatorId fetches all.
    // If status filtering is needed often, we should add findByTestatorIdAndStatus to Repo.
    // For now, we filter in memory or assume Repo handles basic fetching.
    const aggregates = await this.willRepository.findByTestatorId(userId);

    // 2. Filter & Map
    const filtered = status
      ? aggregates.filter((a) => a.getWill().getStatus() === status)
      : aggregates;

    // 3. Serialize
    return filtered.map((agg) => {
      const will = agg.getWill();
      return plainToInstance(
        WillResponseDto,
        {
          ...will, // This invokes the getters on the Entity class
          // For lists, we might not need deep relationships,
          // but ResponseDto includes them. Set to empty or populate based on requirement.
          // Here we include them for consistency.
          assets: agg.getAssets(),
          beneficiaries: agg.getBeneficiaries(),
          executors: agg.getExecutors(),
          witnesses: agg.getWitnesses(),
        },
        { excludeExtraneousValues: true },
      );
    });
  }
}
