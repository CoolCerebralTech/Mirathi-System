// src/succession-automation/src/domain/events/readiness-assessment.events.ts
import { DomainEvent } from '../base/domain-event';
import { RiskCategory, RiskSeverity } from '../entities/risk-flag.entity';
import { DocumentGapType } from '../value-objects/document-gap.vo';
import { ReadinessStatus } from '../value-objects/readiness-score.vo';
import { RiskSource } from '../value-objects/risk-source.vo';
import { SuccessionContext } from '../value-objects/succession-context.vo';

// ==================== ASSESSMENT LIFECYCLE EVENTS ====================

/**
 * Event: Readiness Assessment Created
 *
 * Emitted when a new readiness assessment is created for an estate.
 *
 * Legal Significance: Marks start of compliance assessment.
 * Required for audit trail of risk detection process.
 */
export class ReadinessAssessmentCreated extends DomainEvent<{
  estateId: string;
  familyId: string;
  successionContext: ReturnType<SuccessionContext['toJSON']>;
  initialScore: number;
  initialStatus: ReadinessStatus;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      estateId: string;
      familyId: string;
      successionContext: ReturnType<SuccessionContext['toJSON']>;
      initialScore: number;
      initialStatus: ReadinessStatus;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Readiness Assessment Completed
 *
 * Emitted when assessment reaches final state (ready to file).
 *
 * Legal Significance: Documents readiness for court filing.
 * Required for audit of filing readiness.
 */
export class ReadinessAssessmentCompleted extends DomainEvent<{
  estateId: string;
  familyId?: string;
  finalScore: number;
  finalStatus: ReadinessStatus;
  completedAt: Date;
  totalRecalculations: number;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      estateId: string;
      familyId?: string;
      finalScore: number;
      finalStatus: ReadinessStatus;
      completedAt: Date;
      totalRecalculations: number;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Readiness Assessment Recalculated
 *
 * Emitted when assessment is recalculated due to changes.
 *
 * Legal Significance: Documents state changes in compliance.
 * Required for audit of dynamic risk assessment.
 */
export class ReadinessAssessmentRecalculated extends DomainEvent<{
  estateId: string;
  newScore: number;
  newStatus: ReadinessStatus;
  trigger: string;
  totalRisks: number;
  unresolvedRisks: number;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      estateId: string;
      newScore: number;
      newStatus: ReadinessStatus;
      trigger: string;
      totalRisks: number;
      unresolvedRisks: number;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ==================== SCORE & STATUS EVENTS ====================

/**
 * Event: Readiness Score Updated
 *
 * Emitted when readiness score changes.
 *
 * Legal Significance: Documents compliance improvement/decline.
 * Required for progress tracking and reporting.
 */
export class ReadinessScoreUpdated extends DomainEvent<{
  estateId: string;
  previousScore: number;
  newScore: number;
  previousStatus: ReadinessStatus;
  newStatus: ReadinessStatus;
  trigger: string;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      estateId: string;
      previousScore: number;
      newScore: number;
      previousStatus: ReadinessStatus;
      newStatus: ReadinessStatus;
      trigger: string;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Readiness Status Changed
 *
 * Emitted when readiness status category changes.
 *
 * Legal Significance: Documents major compliance state changes.
 * Required for alerting and workflow transitions.
 */
export class ReadinessStatusChanged extends DomainEvent<{
  estateId: string;
  previousStatus: ReadinessStatus;
  newStatus: ReadinessStatus;
  newScore: number;
  trigger: string;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      estateId: string;
      previousStatus: ReadinessStatus;
      newStatus: ReadinessStatus;
      newScore: number;
      trigger: string;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ==================== RISK MANAGEMENT EVENTS ====================

/**
 * Event: Risk Flag Detected
 *
 * Emitted when a new risk is identified.
 *
 * Legal Significance: Documents compliance issue.
 * Required for risk register and mitigation planning.
 */
export class RiskFlagDetected extends DomainEvent<{
  estateId: string;
  riskId: string;
  severity: RiskSeverity;
  category: RiskCategory;
  description: string;
  source: ReturnType<RiskSource['toJSON']>;
  isBlocking: boolean;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      estateId: string;
      riskId: string;
      severity: RiskSeverity;
      category: RiskCategory;
      description: string;
      source: ReturnType<RiskSource['toJSON']>;
      isBlocking: boolean;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Risk Flag Resolved
 *
 * Emitted when risk is manually resolved.
 *
 * Legal Significance: Documents issue resolution.
 * Required for audit of compliance actions.
 */
export class RiskFlagResolved extends DomainEvent<{
  estateId: string;
  riskId: string;
  category: RiskCategory;
  resolutionMethod: string;
  resolvedBy: string;
  resolutionNotes?: string;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      estateId: string;
      riskId: string;
      category: RiskCategory;
      resolutionMethod: string;
      resolvedBy: string;
      resolutionNotes?: string;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Risk Flag Auto-Resolved
 *
 * Emitted when system automatically resolves risk.
 *
 * Legal Significance: Documents automated compliance resolution.
 * Required for audit of system actions.
 */
export class RiskFlagAutoResolved extends DomainEvent<{
  estateId: string;
  riskId: string;
  category: RiskCategory;
  triggeredByEvent: string;
  resolvedBy: string;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      estateId: string;
      riskId: string;
      category: RiskCategory;
      triggeredByEvent: string;
      resolvedBy: string;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ==================== DOCUMENT GAP EVENTS ====================

/**
 * Event: Document Gap Identified
 *
 * Emitted when missing document is identified.
 *
 * Legal Significance: Documents document deficiency.
 * Required for court filing checklist.
 */
export class DocumentGapIdentified extends DomainEvent<{
  estateId: string;
  documentType: DocumentGapType;
  severity: RiskSeverity;
  description: string;
  isBlocking: boolean;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      estateId: string;
      documentType: DocumentGapType;
      severity: RiskSeverity;
      description: string;
      isBlocking: boolean;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ==================== STRATEGY EVENTS ====================

/**
 * Event: Recommended Strategy Updated
 *
 * Emitted when recommended action strategy changes.
 *
 * Legal Significance: Documents guidance updates.
 * Required for audit of legal advice.
 */
export class RecommendedStrategyUpdated extends DomainEvent<{
  estateId: string;
  strategy: string;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      estateId: string;
      strategy: string;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ==================== SUPPORTING EVENTS ====================

/**
 * Event: Succession Context Updated
 *
 * Emitted when succession context changes.
 *
 * Legal Significance: Documents case characteristics changes.
 * Required for audit of case evolution.
 */
export class SuccessionContextUpdated extends DomainEvent<{
  estateId: string;
  previousContext: ReturnType<SuccessionContext['toJSON']>;
  newContext: ReturnType<SuccessionContext['toJSON']>;
  updatedAt: Date;
  trigger: string;
  impactOnRisks?: string[];
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      estateId: string;
      previousContext: ReturnType<SuccessionContext['toJSON']>;
      newContext: ReturnType<SuccessionContext['toJSON']>;
      updatedAt: Date;
      trigger: string;
      impactOnRisks?: string[];
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Risk Mitigation Action Taken
 *
 * Emitted when mitigation action is recorded.
 *
 * Legal Significance: Documents compliance action.
 * Required for audit of risk management.
 */
export class RiskMitigationActionTaken extends DomainEvent<{
  estateId: string;
  riskId: string;
  action: string;
  actionBy: string;
  actionAt: Date;
  expectedOutcome: string;
  followUpDate?: Date;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      estateId: string;
      riskId: string;
      action: string;
      actionBy: string;
      actionAt: Date;
      expectedOutcome: string;
      followUpDate?: Date;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Document Gap Resolved
 *
 * Emitted when missing document is provided.
 *
 * Legal Significance: Documents compliance with document requirements.
 * Required for audit of document collection.
 */
export class DocumentGapResolved extends DomainEvent<{
  estateId: string;
  documentType: DocumentGapType;
  resolvedBy: string;
  resolvedAt: Date;
  documentReference?: string;
  verifiedBy?: string;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      estateId: string;
      documentType: DocumentGapType;
      resolvedBy: string;
      resolvedAt: Date;
      documentReference?: string;
      verifiedBy?: string;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Blocking Issue Cleared
 *
 * Emitted when blocking issue is resolved.
 *
 * Legal Significance: Documents removal of filing barrier.
 * Required for court filing readiness tracking.
 */
export class BlockingIssueCleared extends DomainEvent<{
  estateId: string;
  issue: string;
  clearedBy: string;
  clearedAt: Date;
  clearingMethod: string;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      estateId: string;
      issue: string;
      clearedBy: string;
      clearedAt: Date;
      clearingMethod: string;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ==================== ANALYTICS EVENTS ====================

/**
 * Event: Risk Trend Identified
 *
 * Emitted when system identifies risk patterns.
 *
 * Legal Significance: Documents proactive risk detection.
 * Required for compliance analytics.
 */
export class RiskTrendIdentified extends DomainEvent<{
  estateId: string;
  trend: string;
  confidence: number;
  identifiedAt: Date;
  recommendedAction?: string;
  impactedCategories?: RiskCategory[];
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      estateId: string;
      trend: string;
      confidence: number;
      identifiedAt: Date;
      recommendedAction?: string;
      impactedCategories?: RiskCategory[];
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Compliance Milestone Reached
 *
 * Emitted when key compliance milestones are reached.
 *
 * Legal Significance: Documents progress toward filing.
 * Required for stakeholder reporting.
 */
export class ComplianceMilestoneReached extends DomainEvent<{
  estateId: string;
  milestone: string;
  reachedAt: Date;
  impactOnScore: number;
  nextMilestone?: string;
  estimatedDaysToNext?: number;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      estateId: string;
      milestone: string;
      reachedAt: Date;
      impactOnScore: number;
      nextMilestone?: string;
      estimatedDaysToNext?: number;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// Export all events
export const ReadinessAssessmentEvents = {
  ReadinessAssessmentCreated,
  ReadinessAssessmentCompleted,
  ReadinessAssessmentRecalculated,
  ReadinessScoreUpdated,
  ReadinessStatusChanged,
  RiskFlagDetected,
  RiskFlagResolved,
  RiskFlagAutoResolved,
  DocumentGapIdentified,
  RecommendedStrategyUpdated,
  SuccessionContextUpdated,
  RiskMitigationActionTaken,
  DocumentGapResolved,
  BlockingIssueCleared,
  RiskTrendIdentified,
  ComplianceMilestoneReached,
};
