import { MoneyVM } from './estate-dashboard.vm';

/**
 * Solvency Radar View Model
 *
 * A diagnostic snapshot of the Estate's financial viability.
 * Used to detect early warning signs of bankruptcy.
 */
export class SolvencyRadarVM {
  estateId: string;
  generatedAt: Date;

  // --- The Gauge (High Level) ---
  /**
   * 0-100 Score.
   * > 90: Excellent
   * > 50: Stable
   * < 50: At Risk
   * < 20: Critical/Insolvent
   */
  healthScore: number;

  /**
   * Overall solvency based on Net Worth (Assets vs Liabilities).
   * Ratio > 1.0 means Assets exceed Liabilities.
   */
  solvencyRatio: number;

  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // --- Balance Sheet Summary (The "Paper" Reality) ---
  totalAssets: MoneyVM;
  totalLiabilities: MoneyVM;
  netPosition: MoneyVM; // Assets - Liabilities

  // --- Liquidity Analysis (The "Cash" Reality) ---
  /**
   * Analyzes if the estate can meet IMMEDIATE S.45 obligations.
   * An estate can be Solvent on paper (owns land) but Illiquid (no cash for funeral).
   */
  liquidityAnalysis: {
    liquidCash: MoneyVM; // Cash at Bank + Mobile Money

    // S.45(a) + S.45(b) debts that are Due or Overdue
    immediateObligations: MoneyVM;

    // (Liquid Cash - Immediate Obligations). Negative means we need to sell assets.
    cashShortfall: MoneyVM;

    liquidityRatio: number; // Cash / Current Liabilities
    isLiquid: boolean;
  };

  // --- Asset Composition Risk ---
  /**
   * Helps determine how hard it will be to raise cash.
   */
  assetComposition: {
    liquidPercentage: number; // % of Net Worth in Cash
    realEstatePercentage: number; // % in Land (Hard to sell)
    businessPercentage: number; // % in Business (Hard to sell)
    otherPercentage: number;
  };

  // --- Recommendations ---
  /**
   * AI/Rule-based suggestions for the Executor.
   */
  alerts: string[]; // e.g., "Warning: Cash insufficient for Funeral Expenses"
  recommendations: string[]; // e.g., "Initiate Liquidation of Vehicle KAA...", "Apply for S.45(a) Priority Payment"

  constructor(props: Partial<SolvencyRadarVM>) {
    Object.assign(this, props);
  }
}
