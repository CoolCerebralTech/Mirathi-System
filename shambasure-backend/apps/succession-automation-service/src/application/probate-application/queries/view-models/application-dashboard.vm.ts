import {
  ApplicationStatus,
  FilingPriority,
} from '../../../../domain/aggregates/probate-application.aggregate';

export class ApplicationSummaryVm {
  id: string;
  estateId: string;
  deceasedName: string; // Fetched from Estate Service
  applicationType: string; // Human readable
  status: ApplicationStatus;
  courtName: string;
  progressPercentage: number;
  lastUpdated: Date;
  nextAction: string;
}

export class ApplicationAlertVm {
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  actionLink?: string;
}

export class ApplicationDashboardVm {
  // Identity
  id: string;
  referenceNumber: string; // e.g., "PA-2024-001"

  // Status
  status: ApplicationStatus;
  statusLabel: string; // Human readable "Ready to File"
  priority: FilingPriority;

  // Progress
  progressPercentage: number;
  currentStep: number;
  totalSteps: number;

  // Court Details
  targetCourt: string;
  courtStation: string;
  estimatedGrantDate?: Date;

  // Actionable Insights
  nextAction: string;
  alerts: ApplicationAlertVm[];

  // Sub-module Summaries
  formsReadyCount: number;
  formsTotalCount: number;
  consentsReceivedCount: number;
  consentsTotalCount: number;

  // Financial
  filingFeePaid: boolean;
  totalFilingCost: number;

  // Metadata
  createdAt: Date;
  lastModifiedAt: Date;
}
