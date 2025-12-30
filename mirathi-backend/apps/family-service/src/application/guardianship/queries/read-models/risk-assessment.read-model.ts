// src/application/guardianship/queries/read-models/risk-assessment.read-model.ts

export interface RiskFactor {
  code: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedAt: Date;
}

export interface Recommendation {
  priority: number;
  title: string;
  action: string; // e.g., "FILE_BOND", "SUBMIT_REPORT"
  legalReference?: string; // e.g., "Section 72 Children Act"
}

export class RiskAssessmentReadModel {
  public guardianshipId: string;
  public generatedAt: Date;

  public overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  public riskScore: number; // 0 (Safe) to 100 (Critical)

  public activeAlerts: RiskFactor[];
  public automatedRecommendations: Recommendation[];

  constructor(props: Partial<RiskAssessmentReadModel>) {
    Object.assign(this, props);
  }
}
