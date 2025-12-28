// src/succession-automation/src/domain/events/readiness-assessment.events.ts
import { DomainEvent } from '../base/domain-event';

/**
 * Domain Events for Readiness Assessment Aggregate
 *
 * PURPOSE: Communicate state changes to other bounded contexts
 *
 * EVENT CONSUMERS:
 * - Notification Service: Send alerts to users ("You're 80% ready!")
 * - Executor Roadmap: Update task list when risks are resolved
 * - Audit Service: Track all assessment changes for legal compliance
 * - Analytics Service: Track success rates, common blockers
 *
 * LEGAL CONTEXT:
 * Events form an immutable audit trail (S.83 LSA - executor accountability)
 */

// ============================================================================
// Readiness Assessment Created
// ============================================================================

export interface ReadinessAssessmentCreatedPayload {
  estateId: string;
  successionContext: Record<string, any>; // SuccessionContext.toJSON()
}

export class ReadinessAssessmentCreated extends DomainEvent<ReadinessAssessmentCreatedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ReadinessAssessmentCreatedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'ReadinessAssessmentCreated';
  }

  public getPayload(): ReadinessAssessmentCreatedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Risk Flag Detected
// ============================================================================

export interface RiskFlagDetectedPayload {
  estateId: string;
  riskId: string;
  severity: string; // RiskSeverity enum value
  category: string; // RiskCategory enum value
  description: string;
  isBlocking: boolean;
}

export class RiskFlagDetected extends DomainEvent<RiskFlagDetectedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: RiskFlagDetectedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'RiskFlagDetected';
  }

  public getPayload(): RiskFlagDetectedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Risk Flag Resolved
// ============================================================================

export interface RiskFlagResolvedPayload {
  estateId: string;
  riskId: string;
  category: string; // RiskCategory enum value
  resolutionNotes?: string;
}

export class RiskFlagResolved extends DomainEvent<RiskFlagResolvedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: RiskFlagResolvedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'RiskFlagResolved';
  }

  public getPayload(): RiskFlagResolvedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Readiness Score Updated
// ============================================================================

export interface ReadinessScoreUpdatedPayload {
  estateId: string;
  previousScore: number;
  newScore: number;
  previousStatus: string; // ReadinessStatus enum value
  newStatus: string; // ReadinessStatus enum value
}

export class ReadinessScoreUpdated extends DomainEvent<ReadinessScoreUpdatedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ReadinessScoreUpdatedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'ReadinessScoreUpdated';
  }

  public getPayload(): ReadinessScoreUpdatedPayload {
    return super.getPayload();
  }

  /**
   * Did the score improve?
   */
  public isImprovement(): boolean {
    const payload = this.getPayload();
    return payload.newScore > payload.previousScore;
  }

  /**
   * Did the score significantly change? (>= 10 points)
   */
  public isSignificantChange(): boolean {
    const payload = this.getPayload();
    return Math.abs(payload.newScore - payload.previousScore) >= 10;
  }
}

// ============================================================================
// Readiness Status Changed
// ============================================================================

export interface ReadinessStatusChangedPayload {
  estateId: string;
  previousStatus: string; // ReadinessStatus enum value
  newStatus: string; // ReadinessStatus enum value
  newScore: number;
}

export class ReadinessStatusChanged extends DomainEvent<ReadinessStatusChangedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ReadinessStatusChangedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'ReadinessStatusChanged';
  }

  public getPayload(): ReadinessStatusChangedPayload {
    return super.getPayload();
  }

  /**
   * Did status improve?
   */
  public isImprovement(): boolean {
    const payload = this.getPayload();
    const statusOrder = {
      BLOCKED: 0,
      IN_PROGRESS: 1,
      READY_TO_FILE: 2,
    };
    return (
      statusOrder[payload.newStatus as keyof typeof statusOrder] >
      statusOrder[payload.previousStatus as keyof typeof statusOrder]
    );
  }

  /**
   * Is this the "Ready to File" milestone?
   */
  public isReadyMilestone(): boolean {
    const payload = this.getPayload();
    return payload.newStatus === 'READY_TO_FILE' && payload.previousStatus !== 'READY_TO_FILE';
  }

  /**
   * Did the case become blocked?
   */
  public becameBlocked(): boolean {
    const payload = this.getPayload();
    return payload.newStatus === 'BLOCKED' && payload.previousStatus !== 'BLOCKED';
  }
}

// ============================================================================
// Readiness Assessment Completed
// ============================================================================

export interface ReadinessAssessmentCompletedPayload {
  estateId: string;
  finalScore: number;
  completedAt: Date;
}

export class ReadinessAssessmentCompleted extends DomainEvent<ReadinessAssessmentCompletedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ReadinessAssessmentCompletedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'ReadinessAssessmentCompleted';
  }

  public getPayload(): ReadinessAssessmentCompletedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Critical Risk Detected (High Priority Alert)
// ============================================================================

export interface CriticalRiskDetectedPayload {
  estateId: string;
  riskId: string;
  category: string;
  description: string;
  legalBasis?: string;
  mitigationSteps: string[];
}

export class CriticalRiskDetected extends DomainEvent<CriticalRiskDetectedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: CriticalRiskDetectedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'CriticalRiskDetected';
  }

  public getPayload(): CriticalRiskDetectedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// All Risks Resolved (Milestone Event)
// ============================================================================

export interface AllRisksResolvedPayload {
  estateId: string;
  finalScore: number;
  totalRisksResolved: number;
  durationDays: number; // Time from first risk to all resolved
}

export class AllRisksResolved extends DomainEvent<AllRisksResolvedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: AllRisksResolvedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'AllRisksResolved';
  }

  public getPayload(): AllRisksResolvedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Assessment Recalculated (Triggered by External Events)
// ============================================================================

export interface AssessmentRecalculatedPayload {
  estateId: string;
  triggerSource: string; // E.g., "Family.GuardianAppointed", "Estate.AssetVerified"
  previousScore: number;
  newScore: number;
  risksAdded: number;
  risksResolved: number;
}

export class AssessmentRecalculated extends DomainEvent<AssessmentRecalculatedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: AssessmentRecalculatedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'AssessmentRecalculated';
  }

  public getPayload(): AssessmentRecalculatedPayload {
    return super.getPayload();
  }
}
