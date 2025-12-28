import { MoneyVM } from './estate-dashboard.vm';

export class BeneficiaryShareVM {
  beneficiaryId: string;
  beneficiaryName: string;
  relationship: string;

  // The Math
  grossSharePercentage: number; // e.g. 25%
  grossShareValue: MoneyVM;

  // Adjustments (S.35 Hotchpot)
  lessGiftInterVivos: MoneyVM; // Deductions for past gifts

  // Final
  netDistributableValue: MoneyVM;
}

export class DistributionPreviewVM {
  estateNetValue: MoneyVM;
  totalDistributablePool: MoneyVM; // Net Value + Hotchpot Add-backs

  shares: BeneficiaryShareVM[];

  readinessCheck: {
    isReady: boolean;
    blockers: string[]; // e.g. ["Tax Not Cleared", "Active Dispute on Asset X"]
  };
}
