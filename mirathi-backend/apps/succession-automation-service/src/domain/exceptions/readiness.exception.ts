// src/succession-automation/src/domain/exceptions/readiness.exception.ts

/**
 * Domain Exceptions for Readiness Assessment
 *
 * PURPOSE: Express business rule violations in domain language
 *
 * DESIGN:
 * - Extend base DomainException for consistent error handling
 * - Include legal context in error messages
 * - Provide actionable error codes for API consumers
 */

export abstract class DomainException extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    details?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// ============================================================================
// Assessment Not Found
// ============================================================================

export class AssessmentNotFoundException extends DomainException {
  constructor(assessmentId: string) {
    super(`Readiness Assessment with ID ${assessmentId} not found`, 'ASSESSMENT_NOT_FOUND', 404, {
      assessmentId,
    });
  }
}

// ============================================================================
// Assessment Already Complete
// ============================================================================

export class AssessmentAlreadyCompleteException extends DomainException {
  constructor(assessmentId: string, completedAt: Date) {
    super(
      `Assessment ${assessmentId} was already completed on ${completedAt.toISOString()}. Cannot modify completed assessments.`,
      'ASSESSMENT_ALREADY_COMPLETE',
      409,
      { assessmentId, completedAt },
    );
  }
}

// ============================================================================
// Cannot Complete - Not Ready
// ============================================================================

export class CannotCompleteAssessmentException extends DomainException {
  constructor(assessmentId: string, currentScore: number, blockingRisks: number, details?: string) {
    super(
      `Cannot complete assessment ${assessmentId}. ` +
        `Current score: ${currentScore}%, Blocking risks: ${blockingRisks}. ` +
        `${details || 'Resolve all critical risks to proceed.'}`,
      'CANNOT_COMPLETE_ASSESSMENT',
      400,
      {
        assessmentId,
        currentScore,
        blockingRisks,
        minimumRequired: 80,
      },
    );
  }
}

// ============================================================================
// Duplicate Risk Flag
// ============================================================================

export class DuplicateRiskFlagException extends DomainException {
  constructor(fingerprint: string, existingRiskId: string) {
    super(
      `Risk with fingerprint ${fingerprint} already exists (Risk ID: ${existingRiskId})`,
      'DUPLICATE_RISK_FLAG',
      409,
      { fingerprint, existingRiskId },
    );
  }
}

// ============================================================================
// Risk Not Found
// ============================================================================

export class RiskNotFoundException extends DomainException {
  constructor(riskId: string, assessmentId: string) {
    super(`Risk ${riskId} not found in assessment ${assessmentId}`, 'RISK_NOT_FOUND', 404, {
      riskId,
      assessmentId,
    });
  }
}

// ============================================================================
// Risk Already Resolved
// ============================================================================

export class RiskAlreadyResolvedException extends DomainException {
  constructor(riskId: string, resolvedAt: Date) {
    super(
      `Risk ${riskId} was already resolved on ${resolvedAt.toISOString()}`,
      'RISK_ALREADY_RESOLVED',
      409,
      { riskId, resolvedAt },
    );
  }
}

// ============================================================================
// Invalid Succession Context
// ============================================================================

export class InvalidSuccessionContextException extends DomainException {
  constructor(reason: string, details?: Record<string, any>) {
    super(`Invalid succession context: ${reason}`, 'INVALID_SUCCESSION_CONTEXT', 400, details);
  }
}

// ============================================================================
// Critical Risk Exists - Cannot File
// ============================================================================

export class CriticalRiskExistsException extends DomainException {
  constructor(
    assessmentId: string,
    criticalRisks: Array<{ id: string; description: string; legalBasis?: string }>,
  ) {
    const riskDescriptions = criticalRisks
      .map((r, i) => `${i + 1}. ${r.description} ${r.legalBasis ? `(${r.legalBasis})` : ''}`)
      .join('\n');

    super(
      `Cannot proceed with filing. ${criticalRisks.length} critical risk(s) detected:\n${riskDescriptions}`,
      'CRITICAL_RISK_EXISTS',
      400,
      {
        assessmentId,
        criticalRisksCount: criticalRisks.length,
        criticalRisks: criticalRisks.map((r) => ({ id: r.id, description: r.description })),
      },
    );
  }
}

// ============================================================================
// Score Calculation Error
// ============================================================================

export class ScoreCalculationException extends DomainException {
  constructor(reason: string, details?: Record<string, any>) {
    super(
      `Failed to calculate readiness score: ${reason}`,
      'SCORE_CALCULATION_ERROR',
      500,
      details,
    );
  }
}

// ============================================================================
// Estate Not Eligible for Assessment
// ============================================================================

export class EstateNotEligibleException extends DomainException {
  constructor(estateId: string, reason: string) {
    super(
      `Estate ${estateId} is not eligible for readiness assessment: ${reason}`,
      'ESTATE_NOT_ELIGIBLE',
      400,
      { estateId, reason },
    );
  }
}

// ============================================================================
// Missing Required Data
// ============================================================================

export class MissingRequiredDataException extends DomainException {
  constructor(dataType: string, details?: Record<string, any>) {
    super(
      `Cannot assess readiness - missing required ${dataType} data`,
      'MISSING_REQUIRED_DATA',
      400,
      { dataType, ...details },
    );
  }
}

// ============================================================================
// Jurisdiction Conflict
// ============================================================================

export class JurisdictionConflictException extends DomainException {
  constructor(suggestedCourt: string, currentCourt: string, reason: string) {
    super(
      `Jurisdiction conflict: Case should be filed in ${suggestedCourt}, not ${currentCourt}. Reason: ${reason}`,
      'JURISDICTION_CONFLICT',
      400,
      {
        suggestedCourt,
        currentCourt,
        reason,
        legalBasis: 'S.56 LSA - Jurisdiction based on estate value and nature',
      },
    );
  }
}

// ============================================================================
// Compliance Rule Violation
// ============================================================================

export class ComplianceRuleViolationException extends DomainException {
  constructor(ruleId: string, ruleName: string, legalBasis: string, violationDetails: string) {
    super(
      `Compliance rule "${ruleName}" violated: ${violationDetails}`,
      'COMPLIANCE_RULE_VIOLATION',
      400,
      {
        ruleId,
        ruleName,
        legalBasis,
        violationDetails,
      },
    );
  }
}

// ============================================================================
// Invalid Risk Severity Update
// ============================================================================

export class InvalidRiskSeverityUpdateException extends DomainException {
  constructor(riskId: string, currentSeverity: string, attemptedSeverity: string, reason: string) {
    super(
      `Cannot update risk ${riskId} severity from ${currentSeverity} to ${attemptedSeverity}: ${reason}`,
      'INVALID_RISK_SEVERITY_UPDATE',
      400,
      {
        riskId,
        currentSeverity,
        attemptedSeverity,
        reason,
      },
    );
  }
}

// ============================================================================
// Assessment Locked
// ============================================================================

export class AssessmentLockedException extends DomainException {
  constructor(assessmentId: string, lockedBy: string, lockedAt: Date) {
    super(
      `Assessment ${assessmentId} is currently locked by ${lockedBy} (since ${lockedAt.toISOString()})`,
      'ASSESSMENT_LOCKED',
      423, // 423 Locked
      {
        assessmentId,
        lockedBy,
        lockedAt,
      },
    );
  }
}

// ============================================================================
// Stale Assessment Data
// ============================================================================

export class StaleAssessmentDataException extends DomainException {
  constructor(assessmentId: string, lastUpdated: Date, staleDurationHours: number) {
    super(
      `Assessment ${assessmentId} is stale. Last updated ${staleDurationHours} hours ago. ` +
        `Please trigger recalculation to ensure accuracy.`,
      'STALE_ASSESSMENT_DATA',
      409,
      {
        assessmentId,
        lastUpdated,
        staleDurationHours,
        recommendedAction: 'Trigger assessment recalculation',
      },
    );
  }
}

// ============================================================================
// Invalid Document Gap
// ============================================================================

export class InvalidDocumentGapException extends DomainException {
  constructor(documentType: string, reason: string) {
    super(`Invalid document gap for ${documentType}: ${reason}`, 'INVALID_DOCUMENT_GAP', 400, {
      documentType,
      reason,
    });
  }
}

// ============================================================================
// Risk Source Unreachable
// ============================================================================

export class RiskSourceUnreachableException extends DomainException {
  constructor(sourceType: string, sourceEntityId: string, serviceName: string) {
    super(
      `Cannot validate risk source: ${serviceName} (${sourceType}:${sourceEntityId}) is unreachable`,
      'RISK_SOURCE_UNREACHABLE',
      503, // Service Unavailable
      {
        sourceType,
        sourceEntityId,
        serviceName,
        recommendedAction: 'Retry later or verify source manually',
      },
    );
  }
}
