import { RiskDetailVM } from './risk-detail.vm';

export class ReadinessDashboardVM {
  assessmentId: string;
  estateId: string;
  lastUpdated: Date;

  // The Traffic Light
  score: number; // 0-100
  statusLabel: string; // "Ready to File", "Needs Work"
  statusColor: 'green' | 'yellow' | 'orange' | 'red';
  confidenceLevel: string;

  // The "Digital Lawyer" Advice
  summaryMessage: string;
  nextBestAction: string;

  // Stats
  totalRisks: number;
  criticalRisks: number;

  // The Data
  topRisks: RiskDetailVM[]; // Limited to top 3-5 for dashboard

  // Context Summary (The "Lens")
  caseContext: {
    courtJurisdiction: string; // "High Court", "Kadhi's Court"
    applicationType: string; // "P&A 80", "P&A 1"
    estimatedTimeline: string;
    isComplex: boolean;
  };
}
