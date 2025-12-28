import { EstateStatus } from '../../../../domain/aggregates/estate.aggregate';

/**
 * Simple Money View Model for Frontend
 */
export interface MoneyVM {
  amount: number;
  currency: string;
  formatted: string; // e.g., "KES 1,500,000.00"
}

/**
 * Estate Dashboard View Model
 *
 * The "Cockpit" view for the Executor/Lawyer.
 * Aggregates financial health, legal status, and compliance blockers.
 */
export class EstateDashboardVM {
  // --- Identity ---
  id: string;
  name: string;
  deceasedName: string;
  dateOfDeath: Date;
  daysSinceDeath: number; // Important for statutory deadlines (6 months for grants)

  // --- Legal Status ---
  status: EstateStatus;
  isFrozen: boolean;
  freezeReason?: string;
  courtCaseNumber?: string;

  // --- Financial Health ("The Truth Engine") ---
  netWorth: MoneyVM;
  grossAssets: MoneyVM;
  totalLiabilities: MoneyVM;

  // --- Liquidity ("Can we pay bills?") ---
  cashOnHand: MoneyVM;
  cashReserved: MoneyVM; // Reserved for S.45 priorities
  availableCash: MoneyVM; // Free cash

  // --- Solvency Radar ---
  solvencyRatio: number; // Assets / Liabilities ( > 1.0 is healthy)
  isSolvent: boolean;
  insolvencyRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // --- The Gatekeeper (Tax) ---
  taxStatus: string; // PENDING, CLEARED, EXEMPT
  hasTaxClearanceCertificate: boolean;

  // --- Inventory Counts ---
  assetCount: number;
  debtCount: number;
  openDisputeCount: number;
  dependantCount: number;

  // --- Progress Indicators ---
  administrationProgress: number; // 0-100% estimated completion
  nextStatutoryDeadline?: {
    action: string;
    dueDate: Date;
    daysRemaining: number;
  };

  constructor(props: Partial<EstateDashboardVM>) {
    Object.assign(this, props);
  }

  /**
   * Static factory to calculate derived metrics from raw data
   * (Ideally, mapping logic happens in the Query Handler, but simple derivations can stay here)
   */
  static calculateInsolvencyRisk(ratio: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (ratio >= 2.0) return 'LOW';
    if (ratio >= 1.2) return 'MEDIUM';
    if (ratio >= 1.0) return 'HIGH';
    return 'CRITICAL'; // Liabilities exceed Assets
  }
}
