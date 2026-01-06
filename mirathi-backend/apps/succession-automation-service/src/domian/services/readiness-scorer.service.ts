// =============================================================================
// 2. READINESS SCORER SERVICE
// Calculates the 0-100 readiness score
// =============================================================================
import { Injectable } from '@nestjs/common';

import { ReadinessScore } from '../value-objects/readiness-score.vo';

@Injectable()
export class ReadinessScorerService {
  /**
   * Calculates readiness score based on checklist completion
   */
  calculateScore(checklist: {
    hasDeathCertificate: boolean;
    hasKraPin: boolean;
    assetsListed: boolean;
    assetsValued: boolean;
    debtsListed: boolean;
    hasWill: boolean;
    willHasWitnesses: boolean;
    hasExecutor: boolean;
    hasGuardianForMinors: boolean;
    taxClearance: boolean;
    familyConsentsObtained: boolean;
  }): ReadinessScore {
    let documentScore = 0;
    let legalScore = 0;
    let familyScore = 0;
    let financialScore = 0;

    // DOCUMENT SCORE (30 points)
    if (checklist.hasDeathCertificate) documentScore += 10;
    if (checklist.hasKraPin) documentScore += 10;
    if (checklist.assetsListed) documentScore += 5;
    if (checklist.debtsListed) documentScore += 5;

    // LEGAL SCORE (30 points)
    if (checklist.hasWill) {
      legalScore += 10;
      if (checklist.willHasWitnesses) legalScore += 10;
    } else {
      legalScore += 20; // No will is also valid (intestate)
    }
    if (checklist.hasExecutor) legalScore += 5;
    if (checklist.hasGuardianForMinors) legalScore += 5;

    // FAMILY SCORE (20 points)
    if (checklist.familyConsentsObtained) familyScore += 20;

    // FINANCIAL SCORE (20 points)
    if (checklist.assetsValued) financialScore += 10;
    if (checklist.taxClearance) financialScore += 10;

    const overall = documentScore + legalScore + familyScore + financialScore;

    return new ReadinessScore(overall, documentScore, legalScore, familyScore, financialScore);
  }

  /**
   * Estimates days until ready based on missing items
   */
  estimateDaysToReady(missingItems: string[]): number {
    const dayEstimates: Record<string, number> = {
      death_certificate: 3,
      kra_pin: 7,
      asset_valuation: 14,
      guardian_appointment: 30,
      tax_clearance: 21,
      family_consents: 10,
      chiefs_letter: 14,
    };

    let totalDays = 0;
    missingItems.forEach((item) => {
      totalDays += dayEstimates[item] || 7;
    });

    return totalDays;
  }
}
