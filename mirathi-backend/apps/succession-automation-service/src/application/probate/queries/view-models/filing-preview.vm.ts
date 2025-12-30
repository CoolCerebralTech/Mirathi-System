export class FeeItemVm {
  description: string; // "Court Filing Fee"
  amount: number;
  currency: string; // "KES"
  isOptional: boolean;
}

export class FilingFeeBreakdownVm {
  items: FeeItemVm[];
  subtotal: number;
  serviceFee: number;
  total: number;

  isPaid: boolean;
  paidAt?: Date;
  receiptNumber?: string;
}

export class ComplianceViolationVm {
  section: string;
  requirement: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class FilingReadinessVm {
  applicationId: string;

  // Can we file?
  isReady: boolean;

  // Fee Status
  fees: FilingFeeBreakdownVm;

  // Compliance Report
  complianceStatus: 'PASS' | 'WARNING' | 'FAIL';
  violations: ComplianceViolationVm[];
  warnings: string[];

  // Court Destination
  courtName: string;
  registryLocation: string;

  // Estimated Timeline
  estimatedFilingDate: Date;
  estimatedGrantDate: Date;
}
