import { Injectable } from '@nestjs/common';

import { KenyanLegalResult } from '../../application/common/result';
import { KenyanFormType } from '../value-objects/kenyan-form-type.vo';
import { ReadinessScore, ReadinessStatus } from '../value-objects/readiness-score.vo';
import { SuccessionContext } from '../value-objects/succession-context.vo';

/**
 * Compliance Engine Domain Service
 *
 * PURPOSE: The "Safety Net".
 * It enforces Kenyan Succession Law (LSA Cap 160) rules that cannot be captured
 * by simple data types.
 *
 * RESPONSIBILITIES:
 * 1. Validate 'Ready to File' status against strict legal criteria.
 * 2. Cross-check Form Bundle against Context (e.g., "Did you include P&A 57 for minors?").
 * 3. Detect "Silent Risks" (e.g., Declining Readiness Score over time).
 */

@Injectable()
export class ComplianceEngineService {
  /**
   * Run a full legal compliance check before filing.
   */
  public validateFilingCompliance(
    context: SuccessionContext,
    readiness: ReadinessScore,
    generatedForms: KenyanFormType[], // The forms currently in the aggregate
    consentsReceivedCount: number,
  ): KenyanLegalResult<boolean> {
    const result = KenyanLegalResult.legalOk(true);

    // RULE 1: Readiness Score Threshold
    // We strictly enforce the context-aware threshold defined in ReadinessScore
    const requiredScore = readiness.getFilingThreshold();
    if (readiness.score < requiredScore) {
      result.addViolation(
        'Readiness',
        `Minimum Score ${requiredScore}%`,
        `Current score ${readiness.score}% is below the filing threshold for this ${context.toCaseClassification()} case.`,
        'CRITICAL',
      );
    }

    // RULE 2: Critical Blocker Check
    if (readiness.status === ReadinessStatus.BLOCKED) {
      result.addViolation(
        'Risk Assessment',
        'No Critical Risks',
        `Cannot file with ${readiness.criticalRisksCount} critical risk(s) active.`,
        'CRITICAL',
      );
    }

    // RULE 3: Section 56 - Consents
    if (context.requiresUniversalConsent()) {
      // Calculation: Total Beneficiaries vs Received Consents
      // Note: In reality, we subtract 1 (the applicant doesn't consent to themselves)
      const requiredConsents = Math.max(0, context.totalBeneficiaries - 1);
      if (consentsReceivedCount < requiredConsents) {
        result.addViolation(
          'Section 56 LSA',
          'Universal Consent',
          `Intestate/Minor cases require consents from all beneficiaries. Received ${consentsReceivedCount}/${requiredConsents}.`,
          'HIGH',
        );
      }
    }

    // RULE 4: Section 40 - Polygamy Documentation
    if (context.isSection40Applicable()) {
      const hasPolygamyAffidavit = generatedForms.some(
        (f) => f.formCode === 'Affidavit - Polygamy',
      );
      if (!hasPolygamyAffidavit) {
        result.addViolation(
          'Section 40 LSA',
          'Polygamy Disclosure',
          'Polygamous cases must include an Affidavit Supporting Polygamy detailing all houses.',
          'HIGH',
        );
      }
    }

    // RULE 5: Section 72 - Minor Protection
    if (context.isMinorInvolved) {
      const hasGuarantee = generatedForms.some((f) => f.formCode === 'P&A 57');
      if (!hasGuarantee) {
        result.addViolation(
          'Section 72 LSA',
          'Guarantee of Sureties',
          'Cases involving minors MUST include P&A 57 Guarantee of Sureties.',
          'CRITICAL',
        );
      }
    }

    // RULE 6: Jurisdiction Mismatch
    // Ensure the generated forms match the required court
    const requiredJurisdiction = context.determineCourtJurisdiction();
    const invalidForms = generatedForms.filter((f) => !f.isValidForCourt(requiredJurisdiction));

    if (invalidForms.length > 0) {
      result.addWarning(
        'Jurisdiction',
        `Forms ${invalidForms.map((f) => f.formCode).join(', ')} may not be accepted in ${requiredJurisdiction}.`,
        'MEDIUM',
      );
    }

    return result;
  }
}
