import { DebtStatus } from '../../../../domain/enums/debt-status.enum';
import { MoneyVM } from './estate-dashboard.vm';

export class DebtItemVM {
  id: string;
  creditorName: string;
  description: string;

  // Financials
  originalAmount: MoneyVM;
  outstandingAmount: MoneyVM;

  // S.45 Logic
  priorityTier: number; // 1 (Funeral) -> 5 (Unsecured)
  tierName: string; // "Funeral & Testamentary", "Secured", etc.

  // Status
  status: DebtStatus;
  isSecured: boolean;
  securedAssetId?: string;
  dueDate?: Date;
}

export class DebtWaterfallVM {
  // Grouped by S.45 Tier for "Waterfall" visualization
  tier1_FuneralExpenses: DebtItemVM[];
  tier2_Testamentary: DebtItemVM[]; // Legal fees
  tier3_SecuredDebts: DebtItemVM[];
  tier4_TaxesAndWages: DebtItemVM[];
  tier5_Unsecured: DebtItemVM[];

  totalLiabilities: MoneyVM;
  totalPaid: MoneyVM;

  // Analysis
  highestPriorityOutstanding: number; // e.g., 1 means "We still owe funeral money"
  canPayNextTier: boolean; // Based on current cash on hand
}
