import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { DebtTier } from '../../../../../domain/enums/debt-tier.enum';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { Result } from '../../../../common/result';
import { GetEstateDebtsQuery } from '../../impl/debts.query';
import { DebtItemVM, DebtWaterfallVM } from '../../view-models/debt-waterfall.vm';

@QueryHandler(GetEstateDebtsQuery)
export class GetEstateDebtsHandler implements IQueryHandler<GetEstateDebtsQuery> {
  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(query: GetEstateDebtsQuery): Promise<Result<DebtWaterfallVM>> {
    const { dto } = query;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      const debts = estate.debts;

      const mapDebt = (d: any): DebtItemVM => ({
        id: d.id.toString(),
        creditorName: d.creditorName,
        description: d.description,
        originalAmount: {
          amount: d.initialAmount.amount,
          currency: d.initialAmount.currency,
          formatted: d.initialAmount.toString(),
        },
        outstandingAmount: {
          amount: d.outstandingBalance.amount,
          currency: d.outstandingBalance.currency,
          formatted: d.outstandingBalance.toString(),
        },
        priorityTier: d.priority.getNumericalPriority(),
        tierName: d.priority.tier,
        status: d.status,
        isSecured: d.isSecured,
        securedAssetId: d.securedAssetId,
        dueDate: d.dueDate,
      });

      const tier1 = debts.filter((d) => d.priority.tier === DebtTier.FUNERAL_EXPENSES).map(mapDebt);
      const tier2 = debts
        .filter((d) => d.priority.tier === DebtTier.TESTAMENTARY_EXPENSES)
        .map(mapDebt);
      const tier3 = debts.filter((d) => d.priority.tier === DebtTier.SECURED_DEBTS).map(mapDebt);
      const tier4 = debts
        .filter((d) => d.priority.tier === DebtTier.TAXES_RATES_WAGES)
        .map(mapDebt);
      const tier5 = debts
        .filter((d) => d.priority.tier === DebtTier.UNSECURED_GENERAL)
        .map(mapDebt);

      const totalLiabilities = debts.reduce((sum, d) => sum + d.outstandingBalance.amount, 0);
      const totalPaid = debts.reduce((sum, d) => sum + d.totalPaid.amount, 0);

      let highestPriority = 0;
      if (tier1.some((d) => d.outstandingAmount.amount > 0)) highestPriority = 1;
      else if (tier2.some((d) => d.outstandingAmount.amount > 0)) highestPriority = 2;
      else if (tier3.some((d) => d.outstandingAmount.amount > 0)) highestPriority = 3;
      else if (tier4.some((d) => d.outstandingAmount.amount > 0)) highestPriority = 4;
      else if (tier5.some((d) => d.outstandingAmount.amount > 0)) highestPriority = 5;

      return Result.ok({
        tier1_FuneralExpenses: tier1,
        tier2_Testamentary: tier2,
        tier3_SecuredDebts: tier3,
        tier4_TaxesAndWages: tier4,
        tier5_Unsecured: tier5,
        totalLiabilities: {
          amount: totalLiabilities,
          currency: 'KES',
          formatted: `KES ${totalLiabilities}`,
        },
        totalPaid: { amount: totalPaid, currency: 'KES', formatted: `KES ${totalPaid}` },
        highestPriorityOutstanding: highestPriority,
        canPayNextTier: estate.cashOnHand.amount > 0,
      });
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
