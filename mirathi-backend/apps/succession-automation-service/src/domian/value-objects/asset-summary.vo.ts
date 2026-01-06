import { AssetCategory, AssetStatus } from '@prisma/client';

export interface AssetSimple {
  category: AssetCategory;
  value: number;
  status: AssetStatus;
  isEncumbered: boolean;
}

export interface DebtSimple {
  amount: number;
  isSecured: boolean;
}

export class AssetSummary {
  constructor(
    public readonly grossValue: number,
    public readonly totalDebts: number,
    public readonly assets: AssetSimple[],
  ) {}

  get netValue(): number {
    return this.grossValue - this.totalDebts;
  }

  get isInsolvent(): boolean {
    return this.netValue < 0;
  }

  /**
   * Calculates the Estimated Court Filing Fees.
   * Based on the Judiciary's Court Fees Schedule (approximate).
   */
  get estimatedCourtFees(): number {
    // Minimum base fee usually applies
    let fees = 2000;

    // Specific fee scales for Kenya High Court vs Magistrate
    if (this.grossValue < 500_000) {
      fees += 500; // Small estate fee
    } else if (this.grossValue < 1_000_000) {
      fees += 2000;
    } else {
      // Larger estates often have higher assessment fees
      // This is a simplified calculation for the roadmap
      fees += Math.ceil(this.grossValue * 0.001); // e.g., 0.1% estimate
    }

    return fees;
  }

  /**
   * Checks if specific asset categories exist to trigger specific forms/processes.
   */
  hasLand(): boolean {
    return this.assets.some((a) => a.category === AssetCategory.LAND);
  }

  hasShares(): boolean {
    return this.assets.some((a) => a.category === AssetCategory.INVESTMENT);
  }

  hasEncumberedAssets(): boolean {
    return this.assets.some((a) => a.isEncumbered);
  }

  /**
   * Returns a risk flag if the estate has assets that often cause delays.
   */
  getAssetRisks(): string[] {
    const risks: string[] = [];

    if (this.hasEncumberedAssets()) {
      risks.push('ENCUMBERED_ASSETS'); // Requires Bank Consent
    }

    // Land without verification is a high risk
    const unverifiedLand = this.assets.find(
      (a) => a.category === AssetCategory.LAND && a.status !== AssetStatus.VERIFIED,
    );
    if (unverifiedLand) {
      risks.push('UNVERIFIED_LAND'); // Needs Search at Land Registry
    }

    if (this.isInsolvent) {
      risks.push('INSOLVENCY'); // Section 421 - Estate administered in Bankruptcy
    }

    return risks;
  }
}
