import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type { AssetRepositoryInterface } from '../../domain/interfaces/asset.repository.interface';

export class GetPortfolioValueQuery {
  constructor(public readonly userId: string) {}
}

export class PortfolioValueResponse {
  breakdown: { currency: string; amount: number }[];
}

@QueryHandler(GetPortfolioValueQuery)
export class GetPortfolioValueHandler implements IQueryHandler<GetPortfolioValueQuery> {
  constructor(
    @Inject('AssetRepositoryInterface')
    private readonly assetRepository: AssetRepositoryInterface,
  ) {}

  async execute(query: GetPortfolioValueQuery): Promise<PortfolioValueResponse> {
    const { userId } = query;

    // Efficient Aggregation Query
    const totals = await this.assetRepository.getTotalPortfolioValue(userId);

    return {
      breakdown: totals,
    };
  }
}
