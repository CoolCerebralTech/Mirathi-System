// domain/services/solvency-checker.service.ts
import { Estate } from '../aggregates/estate.aggregate';
import { Asset } from '../entities/asset.entity';
import { DebtStatus } from '../entities/debt.entity';
import { DebtTier, Money } from '../value-objects';

/**
 * Solvency Checker Service
 *
 * Determines if estate can pay its debts (S.45 LSA compliance)
 *
 * CRITICAL LEGAL REQUIREMENT:
 * - Section 45 LSA: Debts must be paid in priority order
 * - Distribution CANNOT proceed if estate is insolvent
 * - Secured debts may force asset liquidation
 * - Insolvency triggers bankruptcy proceedings
 *
 * Business Rules:
 * 1. Critical debts (S.45(a)-(c)) must be paid before distribution
 * 2. If insolvent, beneficiaries get nothing
 * 3. Secured creditors can force sale of collateral
 * 4. Unsecured creditors get pro-rata share if insufficient funds
 *
 * Design Pattern: Domain Service (stateless analysis)
 */

/**
 * Solvency Report
 */
export interface SolvencyReport {
  isSolvent: boolean;
  solvencyRatio: number; // Assets / Liabilities (>1 = solvent)

  totalAssets: Money;
  totalLiabilities: Money;
  netPosition: Money; // Positive = solvent, Negative = insolvent

  criticalDebtsCovered: boolean;
  liquidAssetsCoverage: number; // Percentage of debts coverable by liquid assets

  debtsByPriority: DebtAnalysis[];
  assetLiquidityAnalysis: AssetLiquidityAnalysis;

  recommendations: string[];
  risks: SolvencyRisk[];
}

export interface DebtAnalysis {
  tier: DebtTier;
  priority: number;
  totalAmount: Money;
  settledAmount: Money;
  outstandingAmount: Money;
  percentageOfEstate: number;
  isCovered: boolean;
  debts: DebtDetail[];
}

export interface DebtDetail {
  debtId: string;
  creditorName: string;
  amount: Money;
  isSecured: boolean;
  securedAssetId?: string;
  status: DebtStatus;
}

export interface AssetLiquidityAnalysis {
  liquidAssets: Money;
  illiquidAssets: Money;
  encumberedAssets: Money;
  freeAndClearAssets: Money;
  liquidityRatio: number; // Liquid assets / Total liabilities
}

export interface SolvencyRisk {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  mitigation: string;
}

export class SolvencyCheckerService {
  /**
   * Analyze estate solvency
   */
  public analyzeSolvency(estate: Estate): SolvencyReport {
    // Step 1: Calculate totals
    const totalAssets = estate.grossValueKES;
    const totalLiabilities = estate.getTotalOutstandingDebt();
    const netPosition = totalAssets.subtract(totalLiabilities);
    const isSolvent = netPosition.greaterThanOrEqual(Money.zero());

    // Step 2: Calculate solvency ratio
    const solvencyRatio = totalLiabilities.isZero()
      ? Infinity
      : totalAssets.getAmount() / totalLiabilities.getAmount();

    // Step 3: Analyze debts by priority
    const debtsByPriority = this.analyzeDebtsByPriority(estate);

    // Step 4: Analyze asset liquidity
    const assetLiquidityAnalysis = this.analyzeAssetLiquidity(estate);

    // Step 5: Check if critical debts covered
    const criticalDebtsCovered = this.areCriticalDebtsCovered(estate, debtsByPriority);

    // Step 6: Calculate liquid assets coverage
    const liquidAssetsCoverage = totalLiabilities.isZero()
      ? 100
      : (assetLiquidityAnalysis.liquidAssets.getAmount() / totalLiabilities.getAmount()) * 100;

    // Step 7: Generate recommendations
    const recommendations = this.generateRecommendations(
      estate,
      isSolvent,
      criticalDebtsCovered,
      assetLiquidityAnalysis,
    );

    // Step 8: Identify risks
    const risks = this.identifyRisks(estate, debtsByPriority, assetLiquidityAnalysis);

    return {
      isSolvent,
      solvencyRatio,
      totalAssets,
      totalLiabilities,
      netPosition,
      criticalDebtsCovered,
      liquidAssetsCoverage,
      debtsByPriority,
      assetLiquidityAnalysis,
      recommendations,
      risks,
    };
  }

  /**
   * Analyze debts by S.45 priority
   */
  private analyzeDebtsByPriority(estate: Estate): DebtAnalysis[] {
    const debts = Array.from(estate.debts.values());
    const analyses: DebtAnalysis[] = [];

    // Group by tier
    const tiers = [
      DebtTier.FUNERAL_EXPENSES,
      DebtTier.TESTAMENTARY_EXPENSES,
      DebtTier.SECURED_DEBTS,
      DebtTier.TAXES_RATES_WAGES,
      DebtTier.UNSECURED_GENERAL,
    ];

    let remainingAssets = estate.grossValueKES;

    for (const tier of tiers) {
      const tierDebts = debts.filter((d) => d.tier === tier);

      if (tierDebts.length === 0) {
        continue;
      }

      const totalAmount = Money.sum(tierDebts.map((d) => d.originalAmount));
      const settledAmount = Money.sum(
        tierDebts.filter((d) => d.status === DebtStatus.SETTLED).map((d) => d.originalAmount),
      );
      const outstandingAmount = Money.sum(
        tierDebts
          .filter((d) => d.status !== DebtStatus.SETTLED && d.status !== DebtStatus.WRITTEN_OFF)
          .map((d) => d.outstandingBalance),
      );

      const isCovered = remainingAssets.greaterThanOrEqual(outstandingAmount);
      remainingAssets = isCovered ? remainingAssets.subtract(outstandingAmount) : Money.zero();

      const percentageOfEstate = estate.grossValueKES.isZero()
        ? 0
        : (totalAmount.getAmount() / estate.grossValueKES.getAmount()) * 100;

      analyses.push({
        tier,
        priority: this.getTierPriority(tier),
        totalAmount,
        settledAmount,
        outstandingAmount,
        percentageOfEstate,
        isCovered,
        debts: tierDebts.map((d) => ({
          debtId: d.id.toString(),
          creditorName: d.creditorName,
          amount: d.outstandingBalance,
          isSecured: d.isSecured,
          securedAssetId: d.securedAssetId?.toString(),
          status: d.status,
        })),
      });
    }

    return analyses;
  }

  /**
   * Analyze asset liquidity
   */
  private analyzeAssetLiquidity(estate: Estate): AssetLiquidityAnalysis {
    const assets = Array.from(estate.assets.values());

    let liquidAssets = Money.zero();
    let illiquidAssets = Money.zero();
    let encumberedAssets = Money.zero();
    let freeAndClearAssets = Money.zero();

    for (const asset of assets) {
      if (!asset.isActive || asset.isDeleted) {
        continue;
      }

      const assetValue = asset.getDistributableValue();

      // Liquid assets (easily converted to cash)
      if (asset.type.isLiquid()) {
        liquidAssets = liquidAssets.add(assetValue);
      } else {
        illiquidAssets = illiquidAssets.add(assetValue);
      }

      // Encumbered assets
      if (asset.isEncumbered) {
        encumberedAssets = encumberedAssets.add(assetValue);
      } else {
        freeAndClearAssets = freeAndClearAssets.add(assetValue);
      }
    }

    const totalLiabilities = estate.getTotalOutstandingDebt();
    const liquidityRatio = totalLiabilities.isZero()
      ? Infinity
      : liquidAssets.getAmount() / totalLiabilities.getAmount();

    return {
      liquidAssets,
      illiquidAssets,
      encumberedAssets,
      freeAndClearAssets,
      liquidityRatio,
    };
  }

  /**
   * Check if critical debts (S.45(a)-(c)) are covered
   */
  private areCriticalDebtsCovered(estate: Estate, debtAnalyses: DebtAnalysis[]): boolean {
    const criticalTiers = [
      DebtTier.FUNERAL_EXPENSES,
      DebtTier.TESTAMENTARY_EXPENSES,
      DebtTier.SECURED_DEBTS,
      DebtTier.TAXES_RATES_WAGES,
    ];

    const criticalAnalyses = debtAnalyses.filter((a) => criticalTiers.includes(a.tier));

    return criticalAnalyses.every((a) => a.isCovered);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    estate: Estate,
    isSolvent: boolean,
    criticalDebtsCovered: boolean,
    liquidityAnalysis: AssetLiquidityAnalysis,
  ): string[] {
    const recommendations: string[] = [];

    // Insolvency recommendations
    if (!isSolvent) {
      recommendations.push(
        'CRITICAL: Estate is insolvent. Consider filing for bankruptcy or negotiating with creditors.',
      );
      recommendations.push('Distribution cannot proceed until debts are settled or written off.');
    }

    // Critical debts not covered
    if (!criticalDebtsCovered) {
      recommendations.push(
        'URGENT: Critical debts (funeral, administration, secured, taxes) are not fully covered.',
      );
      recommendations.push(
        'Consider liquidating illiquid assets to cover S.45(a)-(c) priority debts.',
      );
    }

    // Low liquidity
    if (liquidityAnalysis.liquidityRatio < 0.5 && isSolvent) {
      recommendations.push('Liquidity concern: Liquid assets cover less than 50% of liabilities.');
      recommendations.push('May need to liquidate property, land, or other illiquid assets.');
    }

    // High encumbrance
    const encumbranceRatio =
      liquidityAnalysis.encumberedAssets.getAmount() /
      (liquidityAnalysis.encumberedAssets.getAmount() +
        liquidityAnalysis.freeAndClearAssets.getAmount());

    if (encumbranceRatio > 0.5) {
      recommendations.push('High asset encumbrance: Over 50% of assets have liens or mortgages.');
      recommendations.push('Secured creditors may force sale of collateral if debts not paid.');
    }

    // Good solvency
    if (isSolvent && criticalDebtsCovered && liquidityAnalysis.liquidityRatio >= 1) {
      recommendations.push('Estate is in good financial health with adequate liquidity.');
      recommendations.push('Can proceed with distribution after settling critical debts.');
    }

    return recommendations;
  }

  /**
   * Identify solvency risks
   */
  private identifyRisks(
    estate: Estate,
    debtAnalyses: DebtAnalysis[],
    liquidityAnalysis: AssetLiquidityAnalysis,
  ): SolvencyRisk[] {
    const risks: SolvencyRisk[] = [];

    // Risk 1: Insolvency
    if (!estate.isSolvent()) {
      risks.push({
        severity: 'CRITICAL',
        category: 'INSOLVENCY',
        description: `Estate is insolvent by ${estate.getInsolvencyShortfall().format()}`,
        mitigation: 'Negotiate debt settlements, liquidate assets, or file for bankruptcy.',
      });
    }

    // Risk 2: Illiquid estate
    if (liquidityAnalysis.liquidityRatio < 0.3) {
      risks.push({
        severity: 'HIGH',
        category: 'LIQUIDITY',
        description: 'Liquid assets cover less than 30% of liabilities',
        mitigation: 'Begin asset liquidation process early - land/property sales take time.',
      });
    }

    // Risk 3: Secured debts at risk
    const securedDebtAnalysis = debtAnalyses.find((a) => a.tier === DebtTier.SECURED_DEBTS);

    if (securedDebtAnalysis && !securedDebtAnalysis.isCovered) {
      risks.push({
        severity: 'HIGH',
        category: 'FORECLOSURE',
        description: 'Secured debts not covered - creditors may foreclose on collateral',
        mitigation: 'Prioritize payment of secured debts or negotiate with creditors.',
      });
    }

    // Risk 4: Tax obligations
    const taxDebtAnalysis = debtAnalyses.find((a) => a.tier === DebtTier.TAXES_RATES_WAGES);

    if (taxDebtAnalysis && !taxDebtAnalysis.isCovered) {
      risks.push({
        severity: 'HIGH',
        category: 'TAX_LIABILITY',
        description: 'Tax obligations not covered - KRA may levy penalties',
        mitigation: 'Negotiate payment plan with KRA before penalties accrue.',
      });
    }

    // Risk 5: Funeral expenses unpaid
    const funeralDebtAnalysis = debtAnalyses.find((a) => a.tier === DebtTier.FUNERAL_EXPENSES);

    if (funeralDebtAnalysis && funeralDebtAnalysis.outstandingAmount.greaterThan(Money.zero())) {
      risks.push({
        severity: 'MEDIUM',
        category: 'FUNERAL_DEBT',
        description: 'Funeral expenses not fully paid (S.45(a) highest priority)',
        mitigation: 'Settle funeral expenses immediately - they have top priority.',
      });
    }

    // Risk 6: High debt-to-asset ratio
    const debtRatio = estate.grossValueKES.isZero()
      ? 0
      : estate.getTotalOutstandingDebt().getAmount() / estate.grossValueKES.getAmount();

    if (debtRatio > 0.7 && debtRatio < 1) {
      risks.push({
        severity: 'MEDIUM',
        category: 'HIGH_LEVERAGE',
        description: 'Debts exceed 70% of asset value - limited margin for error',
        mitigation: 'Minimize expenses and focus on debt settlement.',
      });
    }

    return risks;
  }

  /**
   * Calculate debt payment waterfall (S.45 order)
   *
   * Shows how available cash would be distributed to creditors
   */
  public calculateDebtPaymentWaterfall(
    estate: Estate,
    availableCash: Money,
  ): DebtPaymentWaterfall[] {
    const debts = estate.getDebtsByPriority();
    const waterfall: DebtPaymentWaterfall[] = [];
    let remainingCash = availableCash;

    for (const debt of debts) {
      if (debt.status === DebtStatus.SETTLED || debt.status === DebtStatus.WRITTEN_OFF) {
        continue;
      }

      const outstanding = debt.outstandingBalance;
      const payment = remainingCash.greaterThanOrEqual(outstanding) ? outstanding : remainingCash;

      waterfall.push({
        debtId: debt.id.toString(),
        creditorName: debt.creditorName,
        priority: debt.priority.getTier(),
        outstandingAmount: outstanding,
        proposedPayment: payment,
        remainingAfterPayment: outstanding.subtract(payment),
        isFullyPaid: payment.equals(outstanding),
      });

      remainingCash = remainingCash.subtract(payment);

      if (remainingCash.isZero()) {
        break;
      }
    }

    return waterfall;
  }

  /**
   * Simulate asset liquidation scenarios
   */
  public simulateLiquidation(estate: Estate, assetsToLiquidate: string[]): LiquidationSimulation {
    const assets = assetsToLiquidate
      .map((id) => estate.getAsset(new (require('../base/unique-entity-id').UniqueEntityID)(id)))
      .filter((a) => a !== undefined) as Asset[];

    const liquidationValue = Money.sum(assets.map((a) => a.getDistributableValue()));
    const currentCash = estate.grossValueKES; // Assuming current assets include some cash
    const totalAvailableAfterLiquidation = currentCash.add(liquidationValue);

    const waterfall = this.calculateDebtPaymentWaterfall(estate, totalAvailableAfterLiquidation);

    const totalDebtsPaid = Money.sum(waterfall.map((w) => w.proposedPayment));
    const remainingDebts = estate.getTotalOutstandingDebt().subtract(totalDebtsPaid);

    return {
      assetsLiquidated: assets.map((a) => ({
        assetId: a.id.toString(),
        assetName: a.name,
        liquidationValue: a.getDistributableValue(),
      })),
      totalLiquidationValue: liquidationValue,
      totalAvailableCash: totalAvailableAfterLiquidation,
      debtPaymentWaterfall: waterfall,
      totalDebtsPaid,
      remainingDebts,
      wouldBeSolventAfterLiquidation: remainingDebts.isZero() || remainingDebts.isNegative(),
    };
  }

  /**
   * Get tier priority (lower = higher priority)
   */
  private getTierPriority(tier: DebtTier): number {
    const priorities: Record<DebtTier, number> = {
      [DebtTier.FUNERAL_EXPENSES]: 1,
      [DebtTier.TESTAMENTARY_EXPENSES]: 2,
      [DebtTier.SECURED_DEBTS]: 3,
      [DebtTier.TAXES_RATES_WAGES]: 4,
      [DebtTier.UNSECURED_GENERAL]: 5,
    };

    return priorities[tier];
  }

  /**
   * Generate solvency report (for court/executor)
   */
  public generateSolvencyReport(report: SolvencyReport): string {
    const lines: string[] = [];

    lines.push('='.repeat(80));
    lines.push('ESTATE SOLVENCY ANALYSIS (S.45 LSA COMPLIANCE)');
    lines.push('='.repeat(80));
    lines.push('');

    lines.push('OVERALL SOLVENCY:');
    lines.push('-'.repeat(80));
    lines.push(`Status:          ${report.isSolvent ? '✅ SOLVENT' : '❌ INSOLVENT'}`);
    lines.push(`Solvency Ratio:  ${report.solvencyRatio.toFixed(2)} (Assets/Liabilities)`);
    lines.push(`Total Assets:    ${report.totalAssets.format()}`);
    lines.push(`Total Liabilities: ${report.totalLiabilities.format()}`);
    lines.push(`Net Position:    ${report.netPosition.format()}`);
    lines.push('');

    lines.push('LIQUIDITY ANALYSIS:');
    lines.push('-'.repeat(80));
    lines.push(`Liquid Assets:       ${report.assetLiquidityAnalysis.liquidAssets.format()}`);
    lines.push(`Illiquid Assets:     ${report.assetLiquidityAnalysis.illiquidAssets.format()}`);
    lines.push(`Encumbered Assets:   ${report.assetLiquidityAnalysis.encumberedAssets.format()}`);
    lines.push(`Free & Clear Assets: ${report.assetLiquidityAnalysis.freeAndClearAssets.format()}`);
    lines.push(`Liquidity Ratio:     ${report.assetLiquidityAnalysis.liquidityRatio.toFixed(2)}`);
    lines.push(`Liquid Coverage:     ${report.liquidAssetsCoverage.toFixed(1)}%`);
    lines.push('');

    lines.push('DEBT ANALYSIS (S.45 PRIORITY ORDER):');
    lines.push('-'.repeat(80));

    for (const debtAnalysis of report.debtsByPriority) {
      lines.push(`${debtAnalysis.tier} (Priority ${debtAnalysis.priority}):`);
      lines.push(`  Total:       ${debtAnalysis.totalAmount.format()}`);
      lines.push(`  Settled:     ${debtAnalysis.settledAmount.format()}`);
      lines.push(`  Outstanding: ${debtAnalysis.outstandingAmount.format()}`);
      lines.push(`  % of Estate: ${debtAnalysis.percentageOfEstate.toFixed(1)}%`);
      lines.push(`  Covered:     ${debtAnalysis.isCovered ? '✅ Yes' : '❌ No'}`);
      lines.push(`  Debts:       ${debtAnalysis.debts.length}`);
      lines.push('');
    }

    if (report.risks.length > 0) {
      lines.push('RISKS IDENTIFIED:');
      lines.push('-'.repeat(80));
      report.risks.forEach((risk) => {
        lines.push(`[${risk.severity}] ${risk.category}`);
        lines.push(`  ${risk.description}`);
        lines.push(`  Mitigation: ${risk.mitigation}`);
        lines.push('');
      });
    }

    if (report.recommendations.length > 0) {
      lines.push('RECOMMENDATIONS:');
      lines.push('-'.repeat(80));
      report.recommendations.forEach((rec, index) => {
        lines.push(`${index + 1}. ${rec}`);
      });
      lines.push('');
    }

    lines.push('='.repeat(80));
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('='.repeat(80));

    return lines.join('\n');
  }
}

/**
 * Supporting Types
 */
export interface DebtPaymentWaterfall {
  debtId: string;
  creditorName: string;
  priority: DebtTier;
  outstandingAmount: Money;
  proposedPayment: Money;
  remainingAfterPayment: Money;
  isFullyPaid: boolean;
}

export interface LiquidationSimulation {
  assetsLiquidated: Array<{
    assetId: string;
    assetName: string;
    liquidationValue: Money;
  }>;
  totalLiquidationValue: Money;
  totalAvailableCash: Money;
  debtPaymentWaterfall: DebtPaymentWaterfall[];
  totalDebtsPaid: Money;
  remainingDebts: Money;
  wouldBeSolventAfterLiquidation: boolean;
}
