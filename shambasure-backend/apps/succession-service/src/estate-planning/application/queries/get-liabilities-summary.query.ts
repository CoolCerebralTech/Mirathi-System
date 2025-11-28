import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type { DebtRepositoryInterface } from '../../domain/interfaces/debt.repository.interface';

export class GetLiabilitiesSummaryQuery {
  constructor(public readonly userId: string) {}
}

export class LiabilitiesSummaryResponse {
  breakdown: { currency: string; amount: number }[];
  totalCount: number;
  hasPriorityDebts: boolean;
}

@QueryHandler(GetLiabilitiesSummaryQuery)
export class GetLiabilitiesSummaryHandler implements IQueryHandler<GetLiabilitiesSummaryQuery> {
  constructor(
    @Inject('DebtRepositoryInterface')
    private readonly debtRepository: DebtRepositoryInterface,
  ) {}

  async execute(query: GetLiabilitiesSummaryQuery): Promise<LiabilitiesSummaryResponse> {
    const { userId } = query;

    // 1. Aggregation Query (Fast)
    const breakdown = await this.debtRepository.getTotalLiabilities(userId);

    // 2. Check for Priority Debts (Fast Check)
    const priorityDebts = await this.debtRepository.findPriorityDebts(userId);

    // 3. Get Count (Optional, can be done via breakdown or separate count if needed)
    // For exact count of active debts, we might need a specific count query or just fetch metadata
    // Here we assume client might want a quick "You have 3 outstanding debts" badge
    const outstanding = await this.debtRepository.findOutstandingDebts(userId);

    return {
      breakdown,
      totalCount: outstanding.length,
      hasPriorityDebts: priorityDebts.length > 0,
    };
  }
}
