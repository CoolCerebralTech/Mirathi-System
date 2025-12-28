import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { AssetType } from '../../../../../domain/enums/asset-type.enum';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { Result } from '../../../../common/result';
import { CheckSolvencyQuery } from '../../impl/estate-dashboard.query';
import { SolvencyRadarVM } from '../../view-models/solvency-radar.vm';

@QueryHandler(CheckSolvencyQuery)
export class CheckSolvencyHandler implements IQueryHandler<CheckSolvencyQuery> {
  private readonly logger = new Logger(CheckSolvencyHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(query: CheckSolvencyQuery): Promise<Result<SolvencyRadarVM>> {
    const { dto } = query;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found: ${dto.estateId}`));

      // 1. Calculate Aggregates
      const totalAssets = estate.assets.reduce((sum, a) => sum + a.currentValue.amount, 0);
      const totalDebts = estate.debts.reduce((sum, d) => sum + d.getCurrentLiability().amount, 0);
      const cashOnHand = estate.cashOnHand.amount;

      // 2. Liquidity Analysis
      const financialAssets = estate.assets
        .filter((a) => a.type.value === AssetType.FINANCIAL)
        .reduce((sum, a) => sum + a.currentValue.amount, 0);

      const liquidTotal = cashOnHand + financialAssets;

      // 3. Immediate Obligations (Tier 1-3)
      const immediateObligations = estate.debts
        .filter((d) => d.priority.getNumericalPriority() <= 3)
        .reduce((sum, d) => sum + d.getCurrentLiability().amount, 0);

      // 4. Ratios
      const solvencyRatio = totalDebts > 0 ? totalAssets / totalDebts : 999;
      const liquidityRatio = immediateObligations > 0 ? liquidTotal / immediateObligations : 999;

      // 5. Risk Assessment
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      let healthScore = 100;

      if (solvencyRatio < 1.0) {
        riskLevel = 'CRITICAL';
        healthScore = 10;
      } else if (liquidityRatio < 1.0) {
        riskLevel = 'HIGH';
        healthScore = 40;
      } else if (solvencyRatio < 1.5) {
        riskLevel = 'MEDIUM';
        healthScore = 70;
      }

      // 6. Generate Alerts
      const alerts: string[] = [];
      const recommendations: string[] = [];

      if (riskLevel === 'CRITICAL') {
        alerts.push('ESTATE IS INSOLVENT: Liabilities exceed Assets.');
        recommendations.push('File for bankruptcy administration immediately.');
      } else if (riskLevel === 'HIGH') {
        alerts.push('LIQUIDITY CRISIS: Insufficient cash for priority debts.');
        recommendations.push('Initiate liquidation of non-essential assets.');
      }

      // 7. Construct VM
      const vm = new SolvencyRadarVM({
        estateId: estate.id.toString(),
        generatedAt: new Date(),
        healthScore,
        solvencyRatio,
        riskLevel,
        totalAssets: { amount: totalAssets, currency: 'KES', formatted: `KES ${totalAssets}` },
        totalLiabilities: { amount: totalDebts, currency: 'KES', formatted: `KES ${totalDebts}` },
        netPosition: {
          amount: totalAssets - totalDebts,
          currency: 'KES',
          formatted: `KES ${totalAssets - totalDebts}`,
        },
        liquidityAnalysis: {
          liquidCash: { amount: liquidTotal, currency: 'KES', formatted: `KES ${liquidTotal}` },
          immediateObligations: {
            amount: immediateObligations,
            currency: 'KES',
            formatted: `KES ${immediateObligations}`,
          },
          cashShortfall: {
            amount: Math.min(0, liquidTotal - immediateObligations),
            currency: 'KES',
            formatted: `KES ${Math.min(0, liquidTotal - immediateObligations)}`,
          },
          liquidityRatio,
          isLiquid: liquidityRatio >= 1.0,
        },
        assetComposition: {
          liquidPercentage: totalAssets > 0 ? (liquidTotal / totalAssets) * 100 : 0,
          realEstatePercentage: 0,
          businessPercentage: 0,
          otherPercentage: 0,
        },
        alerts,
        recommendations,
      });

      return Result.ok(vm);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
