// application/guardianship/queries/read-models/compliance-status.read-model.ts
export interface BondComplianceStatus {
  isRequired: boolean;
  isPosted: boolean;
  isValid: boolean;
  provider?: string;
  policyNumber?: string;
  amountKES?: number;
  expiryDate?: Date;
  daysUntilExpiry?: number;
}

export interface ReportComplianceStatus {
  isRequired: boolean;
  frequency: 'ANNUAL';
  lastReportDate?: Date;
  nextReportDue?: Date;
  isOverdue: boolean;
  daysOverdue: number;
  status: 'PENDING' | 'DUE' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'OVERDUE';
}

export class ComplianceStatusReadModel {
  guardianshipId: string;
  wardId: string;

  // Overall Health
  isFullyCompliant: boolean;
  complianceScore: number; // 0-100
  warnings: string[];
  lastCheckDate: Date;

  // Breakdown by Guardian
  guardianCompliance: {
    guardianId: string;
    guardianName: string;
    s72Bond: BondComplianceStatus;
    s73Report: ReportComplianceStatus;
  }[];
}
