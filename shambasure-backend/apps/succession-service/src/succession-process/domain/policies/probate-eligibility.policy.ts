import { Injectable } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';

export interface Applicant {
  applicantId: string;
  relationship: RelationshipType;
  isMinor: boolean;
  isResident: boolean;
  hasCriminalRecord: boolean;
  isBankrupt: boolean;
  consentGiven: boolean;
}

export interface EstateContext {
  hasWill: boolean;
  involvesMinors: boolean;
  hasComplexAssets: boolean;
  estateValue: number;
  isIslamic: boolean;
}

@Injectable()
export class ProbateEligibilityPolicy {
  private readonly MAX_APPLICANTS = 4;
  private readonly MIN_APPLICANTS = 1;

  /**
   * Comprehensive applicant validation
   */
  validateApplicants(
    applicants: Applicant[],
    context: EstateContext,
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
    priorityOrder: Applicant[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // 1. Number of Applicants (Section 56)
    if (applicants.length > this.MAX_APPLICANTS) {
      errors.push(`Maximum ${this.MAX_APPLICANTS} administrators allowed.`);
    }
    if (applicants.length < this.MIN_APPLICANTS) {
      errors.push('At least one administrator required.');
    }

    // 2. Minor Applicants (Section 56)
    const minorApplicants = applicants.filter((a) => a.isMinor);
    if (minorApplicants.length > 0) {
      errors.push('Minors cannot serve as administrators.');
    }

    // 3. Legal Capacity Checks
    applicants.forEach((applicant) => {
      if (applicant.hasCriminalRecord) {
        warnings.push(
          `Applicant ${applicant.applicantId} has criminal record - may affect suitability`,
        );
      }
      if (applicant.isBankrupt) {
        errors.push(
          `Applicant ${applicant.applicantId} is bankrupt - cannot serve as administrator`,
        );
      }
      if (!applicant.consentGiven) {
        errors.push(`Applicant ${applicant.applicantId} has not given consent to act`);
      }
    });

    // 4. Minority Interest Requirement (Section 58)
    if (context.involvesMinors && applicants.length < 2 && !context.hasComplexAssets) {
      recommendations.push(
        'Consider appointing at least 2 administrators when minors are involved',
      );
    }

    // 5. Complex Assets Recommendation
    if (context.hasComplexAssets && applicants.length === 1) {
      recommendations.push(
        'Complex estates benefit from multiple administrators or professional executors',
      );
    }

    // 6. Islamic Law Considerations
    if (context.isIslamic) {
      this.validateIslamicApplicants(applicants, errors, warnings);
    }

    // 7. Priority ordering for intestate cases
    const priorityOrder = context.hasWill
      ? applicants // Will specifies order
      : this.prioritizeIntestateApplicants(applicants);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      recommendations,
      priorityOrder,
    };
  }

  /**
   * Calculates priority scores for intestate administration (Section 66)
   */
  getPriorityScore(
    relationship: RelationshipType,
    context: { isResident: boolean; age: number },
  ): number {
    let baseScore: number;

    // Base relationship priority
    switch (relationship) {
      case 'SPOUSE':
        baseScore = 1;
        break;
      case 'CHILD':
        baseScore = 2;
        break;
      case 'PARENT':
        baseScore = 3;
        break;
      case 'SIBLING':
        baseScore = 4;
        break;
      case 'HALF_SIBLING':
        baseScore = 5;
        break;
      case 'GRANDCHILD':
        baseScore = 6;
        break;
      case 'GRANDPARENT':
        baseScore = 7;
        break;
      case 'AUNT_UNCLE':
        baseScore = 8;
        break;
      case 'NIECE_NEPHEW':
        baseScore = 9;
        break;
      case 'COUSIN':
        baseScore = 10;
        break;
      case 'GUARDIAN':
        baseScore = 3; // Guardian has high priority when minors involved
        break;
      case 'EX_SPOUSE':
        baseScore = 15; // Lower priority for ex-spouse
        break;
      case 'ADOPTED_CHILD':
        baseScore = 2; // Same as biological child
        break;
      case 'STEPCHILD':
        baseScore = 6; // Lower than biological child
        break;
      default:
        baseScore = 99;
    }

    // Adjustments
    let adjustment = 0;

    // Resident applicants preferred
    if (!context.isResident) {
      adjustment += 5;
    }

    // Age consideration (older may be more suitable)
    if (context.age < 25) {
      adjustment += 2;
    } else if (context.age > 70) {
      adjustment -= 1; // Slight preference for experience
    }

    return baseScore + adjustment;
  }

  /**
   * Validates if corporate executor is recommended
   */
  recommendCorporateExecutor(context: {
    estateValue: number;
    hasComplexAssets: boolean;
    familyConflict: boolean;
    internationalAssets: boolean;
  }): { recommended: boolean; reasons: string[]; alternatives: string[] } {
    const reasons: string[] = [];
    const alternatives: string[] = [];

    if (context.estateValue > 50000000) {
      // 50M KES
      reasons.push('High-value estate benefits from professional management');
    }

    if (context.hasComplexAssets) {
      reasons.push('Complex assets (businesses, trusts) require specialized expertise');
    }

    if (context.familyConflict) {
      reasons.push('Family conflicts are better managed by neutral professional');
      alternatives.push('Consider independent professional co-executor');
    }

    if (context.internationalAssets) {
      reasons.push('International assets require cross-border legal expertise');
    }

    return {
      recommended: reasons.length >= 2,
      reasons,
      alternatives: reasons.length === 1 ? alternatives : [],
    };
  }

  /**
   * Validates applicant suitability based on estate characteristics
   */
  assessApplicantSuitability(
    applicant: Applicant,
    estateContext: EstateContext,
  ): { suitable: boolean; score: number; strengths: string[]; concerns: string[] } {
    const strengths: string[] = [];
    const concerns: string[] = [];
    let score = 50; // Base score

    // Relationship strength
    const relationshipScore = this.getRelationshipScore(applicant.relationship);
    score += relationshipScore;
    if (relationshipScore > 0) {
      strengths.push('Close family relationship preferred');
    }

    // Residence status
    if (applicant.isResident) {
      score += 10;
      strengths.push('Kenyan resident for easier administration');
    } else {
      score -= 15;
      concerns.push('Non-resident may face logistical challenges');
    }

    // Legal status
    if (applicant.hasCriminalRecord) {
      score -= 20;
      concerns.push('Criminal record may affect suitability');
    }

    if (applicant.isBankrupt) {
      score = 0;
      concerns.push('Bankruptcy disqualifies from administration');
    }

    // Capacity for complex estates
    if (estateContext.hasComplexAssets && applicant.relationship === 'SPOUSE') {
      score += 5;
      strengths.push('Spouse typically familiar with family assets');
    }

    return {
      suitable: score >= 40 && !applicant.isBankrupt && !applicant.isMinor,
      score: Math.max(0, Math.min(100, score)),
      strengths,
      concerns,
    };
  }

  /**
   * Validates if applicant meets specific grant type requirements
   */
  validateGrantTypeEligibility(
    applicants: Applicant[],
    grantType: 'PROBATE' | 'LETTERS_OF_ADMINISTRATION' | 'LETTERS_OF_ADMINISTRATION_WITH_WILL',
    willExecutorId?: string,
  ): { eligible: boolean; requirements: string[]; missing: string[] } {
    const requirements: string[] = [];
    const missing: string[] = [];

    switch (grantType) {
      case 'PROBATE':
        requirements.push('Will must name the applicant as executor');
        requirements.push('Will must be valid and properly executed');
        if (!willExecutorId || !applicants.some((a) => a.applicantId === willExecutorId)) {
          missing.push('Applicant not named as executor in will');
        }
        break;

      case 'LETTERS_OF_ADMINISTRATION_WITH_WILL':
        requirements.push('Will exists but no executor named or willing to act');
        requirements.push('Applicant has beneficial interest in estate');
        if (willExecutorId && applicants.some((a) => a.applicantId === willExecutorId)) {
          missing.push('Named executor is available and should apply for probate');
        }
        break;

      case 'LETTERS_OF_ADMINISTRATION':
        requirements.push('No valid will exists (intestate)');
        requirements.push('Applicant is proper person under succession rules');
        // No specific missing requirements for basic letters
        break;
    }

    return {
      eligible: missing.length === 0,
      requirements,
      missing,
    };
  }

  /**
   * Checks for conflicts of interest among applicants
   */
  identifyConflicts(
    applicants: Applicant[],
    beneficiaries: string[],
  ): { conflicts: string[]; warnings: string[] } {
    const conflicts: string[] = [];
    const warnings: string[] = [];

    // Check if applicant is also a major beneficiary
    applicants.forEach((applicant) => {
      if (beneficiaries.includes(applicant.applicantId)) {
        warnings.push(
          `Applicant ${applicant.applicantId} is also a beneficiary - potential conflict`,
        );
      }
    });

    // Check for multiple applicants from competing family branches
    const spouseApplicants = applicants.filter((a) => a.relationship === 'SPOUSE');
    const childApplicants = applicants.filter((a) => a.relationship === 'CHILD');

    if (spouseApplicants.length > 0 && childApplicants.length > 0) {
      warnings.push('Mixed applicant group (spouse and children) may have competing interests');
    }

    // Check for ex-spouse applicants
    const exSpouseApplicants = applicants.filter((a) => a.relationship === 'EX_SPOUSE');
    if (exSpouseApplicants.length > 0) {
      conflicts.push('Ex-spouse applicants require court approval and clear justification');
    }

    return { conflicts, warnings };
  }

  private prioritizeIntestateApplicants(applicants: Applicant[]): Applicant[] {
    return [...applicants].sort((a, b) => {
      const scoreA = this.getPriorityScore(a.relationship, {
        isResident: a.isResident,
        age: 0, // Age would need to be provided
      });
      const scoreB = this.getPriorityScore(b.relationship, {
        isResident: b.isResident,
        age: 0,
      });

      return scoreA - scoreB;
    });
  }

  private getRelationshipScore(relationship: RelationshipType): number {
    const scores: Record<RelationshipType, number> = {
      SPOUSE: 20,
      CHILD: 15,
      PARENT: 10,
      SIBLING: 8,
      HALF_SIBLING: 6,
      GRANDCHILD: 4,
      GRANDPARENT: 3,
      AUNT_UNCLE: 2,
      NIECE_NEPHEW: 1,
      COUSIN: 0,
      GUARDIAN: 5,
      OTHER: -5,
      EX_SPOUSE: -10,
      STEPCHILD: 2,
      ADOPTED_CHILD: 15,
    };

    return scores[relationship] || -10;
  }

  private validateIslamicApplicants(
    applicants: Applicant[],
    errors: string[],
    warnings: string[],
  ): void {
    // Islamic law may have specific requirements
    // Check for close male relatives as preferred administrators
    const closeMaleRelationships: RelationshipType[] = ['SPOUSE', 'CHILD', 'SIBLING', 'PARENT'];
    const hasCloseMaleApplicant = applicants.some((applicant) =>
      closeMaleRelationships.includes(applicant.relationship),
    );

    if (!hasCloseMaleApplicant) {
      warnings.push(
        'Islamic estates traditionally prefer close male relatives as administrators - consult religious advisor',
      );
    }

    // Additional Islamic law considerations
    if (applicants.some((applicant) => applicant.relationship === 'EX_SPOUSE')) {
      warnings.push(
        'Ex-spouse administration in Islamic estates may require special consideration',
      );
    }
  }
}
