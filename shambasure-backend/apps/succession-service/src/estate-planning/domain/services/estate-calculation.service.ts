import { Injectable, Inject } from '@nestjs/common';
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
    // 1. Get Basic Summary
    const summary = estate.getEstateSummary('KES'); // Force KES for Kenyan Legal Context

    const grossAssets = summary.totalAssets.getAmount();
    const totalLiabilities = summary.totalDebts.getAmount();
    const netValue = summary.netValue.getAmount();

    // 2. Calculate Estimated Court Fees
    const courtFees = this.calculateProbateFees(grossAssets);

    return {
      grossAssets,
      totalLiabilities,
      netEstateValue: netValue,
      isSolvent: netValue >= 0,
      estimatedCourtFees: courtFees,
      currency: 'KES',
    };
  }

  /**
   * Calculates Probate Fees based on the Ad Valorem schedule.
   * Source: Judiciary Fee Schedule (Defined in court-fees.config)
   */
  public calculateProbateFees(grossEstateValue: number): number {
    const filingFee = this.feesConfig.probateFees.filingFee.highCourt; // Assume High Court for safety

    // Find the correct Ad Valorem band
    const bands = this.feesConfig.probateFees.adValorem.tiers;
    let adValoremFee = 0;

    for (const band of bands) {
      if (grossEstateValue >= band.range.min && grossEstateValue <= band.range.max) {
        if (band.rate > 0) {
          adValoremFee = grossEstateValue * band.rate;
        }

        // Apply Min/Max caps
        if (band.minFee && adValoremFee < band.minFee) adValoremFee = band.minFee;
        if (band.maxFee && adValoremFee > band.maxFee) adValoremFee = band.maxFee;

        break;
      }

      // Handle the "Infinity" case (last band)
      if (band.range.max === null || band.range.max === Infinity) {
        if (grossEstateValue >= band.range.min) {
          adValoremFee = grossEstateValue * band.rate;
          if (band.minFee && adValoremFee < band.minFee) adValoremFee = band.minFee;
          // No max fee usually for top tier
          break;
        }
      }
    }

    // Miscellaneous costs (gazette notice, etc.) - conservative estimate
    const misc =
      this.feesConfig.probateFees.miscellaneous.serviceFees.gazetteNotice +
      this.feesConfig.probateFees.miscellaneous.certificateFees.grantOfProbate;

    return filingFee + adValoremFee + misc;
  }

  /**
   * Projections for Tax Liability (Capital Gains, etc.)
   * Placeholder for complex tax logic.
   */
  public estimateTaxLiability(): number {
    // In Kenya, there is NO Inheritance Tax (Estate Duty was abolished).
    // However, Capital Gains Tax (CGT) might apply on transfer of property
    // depending on the relationship (Spouse is exempt).

    // For now, return 0 as safe default for Inheritance Tax.
    return 0;
  }
}
