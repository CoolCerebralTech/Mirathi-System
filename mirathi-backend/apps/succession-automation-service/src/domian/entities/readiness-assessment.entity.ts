import { ReadinessScore, SuccessionContext } from '../value-objects';

// =============================================================================
// 1. READINESS ASSESSMENT ENTITY (Aggregate Root)
// =============================================================================

export interface ReadinessAssessmentProps {
  id: string;
  userId: string;
  estateId: string;
  familyId?: string;
  regime: string;
  religion: string;
  marriageType: string;
  targetCourt: string;
  hasWill: boolean;
  hasMinors: boolean;
  isPolygamous: boolean;
  isInsolvent: boolean;
  requiresGuardian: boolean;
  overallScore: number;
  status: string;
  documentScore: number;
  legalScore: number;
  familyScore: number;
  financialScore: number;
  totalRisks: number;
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  nextSteps: string[];
  estimatedDaysToReady?: number;
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
      hasWill: context.regime === 'TESTATE',
      hasMinors: context.hasMinors,
      isPolygamous: context.isPolygamous,
      isInsolvent: false,
      requiresGuardian: context.hasMinors,
      overallScore: 0,
      status: 'NOT_STARTED',
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
  get userId(): string {
    return this.props.userId;
  }
  get estateId(): string {
    return this.props.estateId;
  }
  get overallScore(): number {
    return this.props.overallScore;
  }
  get status(): string {
    return this.props.status;
  }
  get criticalRisks(): number {
    return this.props.criticalRisks;
  }
  get canGenerateForms(): boolean {
    return this.props.overallScore >= 80;
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

  updateRiskCounts(critical: number, high: number, medium: number): void {
    this.props.criticalRisks = critical;
    this.props.highRisks = high;
    this.props.mediumRisks = medium;
    this.props.totalRisks = critical + high + medium;
    this.props.updatedAt = new Date();
  }

  recordCheck(): void {
    this.props.checkCount += 1;
    this.props.lastCheckedAt = new Date();
    this.props.updatedAt = new Date();
  }

  setNextSteps(steps: string[]): void {
    this.props.nextSteps = steps;
    this.props.updatedAt = new Date();
  }

  toJSON(): ReadinessAssessmentProps {
    return { ...this.props };
  }
}
