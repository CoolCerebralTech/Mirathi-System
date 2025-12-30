import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { EstateStatus } from '../../../../../domain/aggregates/estate.aggregate';
import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { Result } from '../../../../common/result';
import { GetEstateDashboardQuery } from '../../impl/estate-dashboard.query';
import { EstateDashboardVM } from '../../view-models/estate-dashboard.vm';

@QueryHandler(GetEstateDashboardQuery)
export class GetEstateDashboardHandler implements IQueryHandler<GetEstateDashboardQuery> {
  private readonly logger = new Logger(GetEstateDashboardHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(query: GetEstateDashboardQuery): Promise<Result<EstateDashboardVM>> {
    const { dto } = query;
    try {
      this.logger.log(`Fetching estate dashboard for Estate ID: ${dto.estateId}`);

      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) {
        this.logger.warn(`Estate not found: ${dto.estateId}`);
        return Result.fail(new Error(`Estate not found: ${dto.estateId}`));
      }

      const netWorth = estate.calculateNetWorth();
      const grossAssets = estate.assets.reduce((sum, a) => sum + a.currentValue.amount, 0);
      const totalLiabilities = estate.debts.reduce(
        (sum, d) => sum + d.getCurrentLiability().amount,
        0,
      );

      const vm = new EstateDashboardVM({
        id: estate.id.toString(),
        name: estate.name,
        deceasedName: estate.deceasedName,
        dateOfDeath: estate.dateOfDeath,
        daysSinceDeath: Math.floor(
          (new Date().getTime() - estate.dateOfDeath.getTime()) / (1000 * 3600 * 24),
        ),
        status: estate.status,
        isFrozen: estate.isFrozen,
        freezeReason: estate.freezeReason,
        courtCaseNumber: estate.courtCaseNumber,
        netWorth: {
          amount: netWorth.amount,
          currency: netWorth.currency,
          formatted: netWorth.toString(),
        },
        grossAssets: { amount: grossAssets, currency: 'KES', formatted: `KES ${grossAssets}` },
        totalLiabilities: {
          amount: totalLiabilities,
          currency: 'KES',
          formatted: `KES ${totalLiabilities}`,
        },
        cashOnHand: {
          amount: estate.cashOnHand.amount,
          currency: estate.cashOnHand.currency,
          formatted: estate.cashOnHand.toString(),
        },
        cashReserved: {
          amount: estate.cashReservedForDebts.amount,
          currency: estate.cashReservedForDebts.currency,
          formatted: estate.cashReservedForDebts.toString(),
        },
        availableCash: {
          amount: estate.calculateAvailableCash().amount,
          currency: estate.calculateAvailableCash().currency,
          formatted: estate.calculateAvailableCash().toString(),
        },
        solvencyRatio: totalLiabilities > 0 ? grossAssets / totalLiabilities : 100,
        isSolvent: !estate.isInsolvent,
        taxStatus: estate.taxCompliance.status.value,
        hasTaxClearanceCertificate: !!estate.taxCompliance.clearanceCertificateNo,
        assetCount: estate.assets.length,
        debtCount: estate.debts.length,
        dependantCount: estate.dependants.length,
        openDisputeCount: estate.hasActiveDisputes ? 1 : 0,
        administrationProgress:
          estate.status === EstateStatus.DISTRIBUTING // ✅ use enum
            ? 90
            : estate.status === EstateStatus.LIQUIDATING
              ? 50
              : 20,
      });

      this.logger.log(`Estate dashboard built successfully for Estate ID: ${dto.estateId}`);
      return Result.ok(vm);
    } catch (error) {
      this.logger.error(
        `Failed to build estate dashboard for Estate ID: ${dto.estateId}`,
        error instanceof Error ? error.stack : undefined,
      );
      return Result.fail(error as Error);
    }
  }
}
