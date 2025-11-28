import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { plainToInstance } from 'class-transformer';

import type { DebtRepositoryInterface } from '../../domain/interfaces/debt.repository.interface';
import { DebtResponseDto } from '../dto/response/debt.response.dto';

export class GetDebtQuery {
  constructor(
    public readonly debtId: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetDebtQuery)
export class GetDebtHandler implements IQueryHandler<GetDebtQuery> {
  constructor(
    @Inject('DebtRepositoryInterface')
    private readonly debtRepository: DebtRepositoryInterface,
  ) {}

  async execute(query: GetDebtQuery): Promise<DebtResponseDto> {
    const { debtId, userId } = query;

    // 1. Fetch Entity
    const debt = await this.debtRepository.findById(debtId);

    // 2. Validate Existence
    if (!debt) {
      throw new NotFoundException(`Debt ${debtId} not found.`);
    }

    // 3. Validate Ownership
    if (debt.getOwnerId() !== userId) {
      throw new ForbiddenException('You do not have permission to view this debt.');
    }

    // 4. Return DTO
    return plainToInstance(
      DebtResponseDto,
      {
        ...debt,
        principalAmount: debt.getPrincipalAmount(),
        outstandingBalance: debt.getOutstandingBalance(),
      },
      { excludeExtraneousValues: true },
    );
  }
}
