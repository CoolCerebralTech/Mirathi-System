import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { courtFeesConfig } from '../../../common/config/court-fees.config';
import { EstateAggregate } from '../aggregates/estate.aggregate';

export interface FinancialSnapshot {
  grossAssets: number;
  totalLiabilities: number;
  netEstateValue: number;
  isSolvent: boolean;
  estimatedCourtFees: number;
  currency: string;
}

@Injectable()
export class EstateCalculationService {
  constructor(
    @Inject(courtFeesConfig.KEY)
    private readonly feesConfig: ConfigType<typeof courtFeesConfig>,
  ) {}

  /**
   * Generates a complete financial snapshot of the estate.
   * Note: Currently assumes a single dominant currency (KES) for court fee calculation.
   */
  public calculateEstateFinancials(estate: EstateAggregate): FinancialSnapshot {
    // 1. Get Basic Summary from Aggregate
    // The aggregate now returns primitives (number), ensuring we don't rely on obsolete VOs.
    const summary = estate.getEstateSummary('KES');

    // 2. Calculate Estimated Court Fees
    // In Kenya, court fees (Ad Valorem) are calculated on the Gross Estate Value, not Net.
    const courtFees = this.calculateProbateFees(summary.totalAssets);

    return {
      grossAssets: summary.totalAssets,
      totalLiabilities: summary.totalDebts,
      netEstateValue: summary.netValue,
      isSolvent: summary.netValue >= 0,
      estimatedCourtFees: courtFees,
      currency: 'KES',
    };
  }

  /**
   * Calculates Probate Fees based on the Ad Valorem schedule.
   * Source: Judiciary Fee Schedule (Defined in court-fees.config)
   */
  public calculateProbateFees(grossEstateValue: number): number {
    const filingFee = this.feesConfig.probateFees.filingFee.highCourt; // Default to High Court

    // Find the correct Ad Valorem band
    const bands = this.feesConfig.probateFees.adValorem.tiers;
    let adValoremFee = 0;

    for (const band of bands) {
      const min = band.range.min;
      const max = band.range.max ?? Infinity;

      if (grossEstateValue >= min && grossEstateValue <= max) {
        if (band.rate > 0) {
          adValoremFee = grossEstateValue * band.rate;
        }

        // Apply Min/Max caps defined in the fee schedule
        if (band.minFee && adValoremFee < band.minFee) adValoremFee = band.minFee;
        if (band.maxFee && adValoremFee > band.maxFee) adValoremFee = band.maxFee;

        break;
      }
    }

    // Miscellaneous costs (gazette notice, certificates, etc.)
    const misc =
      this.feesConfig.probateFees.miscellaneous.serviceFees.gazetteNotice +
      this.feesConfig.probateFees.miscellaneous.certificateFees.grantOfProbate;

    return filingFee + adValoremFee + misc;
  }

  /**
   * Projections for Tax Liability.
   *
   * Legal Context:
   * - Estate Duty: Abolished in Kenya (Cap 483 suspended).
   * - Capital Gains Tax (CGT): Applicable on transfer of property, BUT transfers to
   *   Spouses are typically exempt under the Income Tax Act.
   */
  public estimateTaxLiability(): number {
    // TODO: Integrate with Asset types to determine CGT applicability.
    // For now, we return 0 as Estate Duty is 0.
    // Real implementation would sum (Asset Value - Base Cost) * 15% for non-exempt transfers.
    return 0;
  }
}
