import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { plainToInstance } from 'class-transformer';

import type { DebtRepositoryInterface } from '../../domain/interfaces/debt.repository.interface';
import { DebtResponseDto } from '../dto/response/debt.response.dto';

export class GetDebtsQuery {
  constructor(
    public readonly userId: string,
    public readonly filter?: 'ALL' | 'OUTSTANDING' | 'PAID' | 'PRIORITY',
  ) {}
}

@QueryHandler(GetDebtsQuery)
export class GetDebtsHandler implements IQueryHandler<GetDebtsQuery> {
  constructor(
    @Inject('DebtRepositoryInterface')
    private readonly debtRepository: DebtRepositoryInterface,
  ) {}

  async execute(query: GetDebtsQuery): Promise<DebtResponseDto[]> {
    const { userId, filter } = query;

    let debts;

    // 1. Select Query based on Filter
    switch (filter) {
      case 'OUTSTANDING':
        debts = await this.debtRepository.findOutstandingDebts(userId);
        break;
      case 'PAID':
        debts = await this.debtRepository.findPaidDebts(userId);
        break;
      case 'PRIORITY':
        // Section 83: Funeral & Taxes first
        debts = await this.debtRepository.findPriorityDebts(userId);
        break;
      case 'ALL':
      default:
        debts = await this.debtRepository.findByOwnerId(userId);
        break;
    }

    // 2. Map to DTO
    return debts.map((debt) =>
      plainToInstance(
        DebtResponseDto,
        {
          ...debt,
          // Explicitly map Value Objects to ensure DTO serialization works
          principalAmount: debt.getPrincipalAmount(),
          outstandingBalance: debt.getOutstandingBalance(),
        },
        { excludeExtraneousValues: true },
      ),
    );
  }
}
