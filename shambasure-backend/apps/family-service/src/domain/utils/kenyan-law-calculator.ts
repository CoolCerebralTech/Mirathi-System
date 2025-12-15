// domain/utils/kenyan-law-calculator.ts

export class KenyanLawCalculator {
  // Stamp Duty Act (Cap 480)
  private static readonly STAMP_DUTY_MUNICIPAL = 0.04; // 4% (Towns)
  private static readonly STAMP_DUTY_RURAL = 0.02; // 2% (Rural)

  // Public Trustee (Fees) Rules / Estate Practice
  // Used as a baseline for "Reasonable Executor Fees" under S.83
  private static readonly EXECUTOR_SCALE = [
    { limit: 1_000_000, rate: 0.05 }, // 5% on first 1M
    { limit: 10_000_000, rate: 0.03 }, // 3% on next 10M (Hypothetical standard scale)
  ];

  /**
   * Estimates Stamp Duty for land transfer.
   */
  static calculateStampDuty(landValue: number, locationType: 'MUNICIPAL' | 'RURAL'): number {
    const rate = locationType === 'MUNICIPAL' ? this.STAMP_DUTY_MUNICIPAL : this.STAMP_DUTY_RURAL;

    return Math.ceil(landValue * rate);
  }

  /**
   * Calculates Statutory Executor Fees (Public Trustee Scale).
   * Note: Private executors can charge "reasonable" fees, but this serves as the benchmark.
   */
  static calculateStatutoryExecutorFees(grossEstateValue: number): number {
    let remaining = grossEstateValue;
    let fees = 0;

    // First Tier
    const tier1 = this.EXECUTOR_SCALE[0];
    const tier1Amount = Math.min(remaining, tier1.limit);
    fees += tier1Amount * tier1.rate;
    remaining -= tier1Amount;

    if (remaining <= 0) return fees;

    // Second Tier (and beyond - simplified logic)
    const tier2 = this.EXECUTOR_SCALE[1];
    fees += remaining * tier2.rate; // Apply lower rate to remainder

    return Math.floor(fees);
  }

  /**
   * Estimates the Bond Amount required for Guardians/Administrators.
   * Typically double the value of the assets being administered (S.72 practice).
   */
  static calculateRequiredBond(assetValue: number): number {
    return assetValue * 2;
  }

  /**
   * Calculates Capital Gains Tax (CGT) for asset disposal.
   * Current Rate in Kenya: 15% (raised from 5% in 2023 Finance Act changes).
   */
  static calculateCapitalGainsTax(profit: number): number {
    const CGT_RATE = 0.15;
    return profit > 0 ? Math.floor(profit * CGT_RATE) : 0;
  }
}
