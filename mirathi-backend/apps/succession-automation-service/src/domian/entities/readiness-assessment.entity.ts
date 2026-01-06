import {
  CourtJurisdiction,
  MarriageType,
  ReadinessStatus,
  RiskSeverity,
  SuccessionRegime,
  SuccessionReligion,
} from '@prisma/client';

import { ReadinessScore, SuccessionContext } from '../value-objects';
import { RiskFlag } from './risk-flag.entity';

export interface ReadinessAssessmentProps {
  id: string;
  userId: string;
  estateId: string;
  regime: SuccessionRegime;
  religion: SuccessionReligion;
  marriageType: MarriageType;
  targetCourt: CourtJurisdiction;
  hasWill: boolean;
  hasMinors: boolean;
  isPolygamous: boolean;
  isInsolvent: boolean;
  requiresGuardian: boolean;
  overallScore: number;
  status: ReadinessStatus;
  documentScore: number;
  legalScore: number;
  familyScore: number;
  financialScore: number;
  totalRisks: number;
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  nextSteps: string[];
  lastCheckedAt: Date;
  checkCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ReadinessAssessment {
  private constructor(private props: ReadinessAssessmentProps) {}

  static create(userId: string, estateId: string, context: SuccessionContext): ReadinessAssessment {
    return new ReadinessAssessment({
      id: crypto.randomUUID(),
      userId,
      estateId,
      regime: context.regime,
      religion: context.religion,
      marriageType: context.marriageType,
      targetCourt: context.targetCourt,
      hasWill: context.regime === SuccessionRegime.TESTATE,
      hasMinors: context.hasMinors,
      isPolygamous: context.isPolygamous,
      isInsolvent: false, // Calculated later
      requiresGuardian: context.hasMinors,
      overallScore: 0,
      status: ReadinessStatus.NOT_STARTED,
      documentScore: 0,
      legalScore: 0,
      familyScore: 0,
      financialScore: 0,
      totalRisks: 0,
      criticalRisks: 0,
      highRisks: 0,
      mediumRisks: 0,
      nextSteps: [],
      lastCheckedAt: new Date(),
      checkCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: ReadinessAssessmentProps): ReadinessAssessment {
    return new ReadinessAssessment(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }
  get status(): ReadinessStatus {
    return this.props.status;
  }

  // Business Logic
  updateScore(score: ReadinessScore): void {
    this.props.overallScore = score.overall;
    this.props.documentScore = score.document;
    this.props.legalScore = score.legal;
    this.props.familyScore = score.family;
    this.props.financialScore = score.financial;
    this.props.status = score.status;
    this.props.updatedAt = new Date();
  }

  /**
   * Recalculates risk counts based on a list of RiskFlag entities
   */
  updateRiskProfile(risks: RiskFlag[]): void {
    const activeRisks = risks.filter((r) => !r.isResolved);

    this.props.criticalRisks = activeRisks.filter(
      (r) => r.severity === RiskSeverity.CRITICAL,
    ).length;
    this.props.highRisks = activeRisks.filter((r) => r.severity === RiskSeverity.HIGH).length;
    this.props.mediumRisks = activeRisks.filter((r) => r.severity === RiskSeverity.MEDIUM).length;
    this.props.totalRisks = activeRisks.length;

    this.props.updatedAt = new Date();
  }

  toJSON(): ReadinessAssessmentProps {
    return { ...this.props };
  }
}
