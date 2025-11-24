import { Injectable } from '@nestjs/common';
import { LegalGrounds } from '../value-objects/legal-grounds.vo';
import { DisputeType } from '@prisma/client';

@Injectable()
export class DisputeGroundsPolicy {
  private readonly MIN_DESCRIPTION_LENGTH = 50;
  private readonly FRIVOLOUS_KEYWORDS = ['hate', 'dislike', 'annoying', 'unfair', 'should have'];

  /**
   * Validates objection grounds comprehensively
   */
  validateObjection(
    type: DisputeType,
    description: string,
    stage: 'PRE_GRANT' | 'POST_GRANT',
    supportingEvidence: string[] = [],
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    legalBasis?: string;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Minimum detail requirement
    if (description.length < this.MIN_DESCRIPTION_LENGTH) {
      errors.push(
        `Description too short. Minimum ${this.MIN_DESCRIPTION_LENGTH} characters required for proper legal grounds.`,
      );
    }

    // 2. Evidence requirement
    if (supportingEvidence.length === 0) {
      warnings.push(
        'No supporting evidence provided. Strong evidence is recommended for successful objection.',
      );
    }

    // 3. Post-grant revocation rules (Section 76)
    if (stage === 'POST_GRANT') {
      // Use the factory method that handles DisputeType conversion
      const grounds = LegalGrounds.createFromDisputeType(type, description, supportingEvidence);

      if (!grounds.isValidGroundForRevocation()) {
        errors.push(
          'Invalid grounds for Revocation of Grant. Valid grounds include: Fraud, Concealment of material fact, False statement, Defective process, or Procedural irregularity.',
        );
      }

      // Additional post-grant specific checks
      if (type === 'OMITTED_HEIR') {
        warnings.push(
          'Omitted heir claims must be filed within 6 months of grant confirmation (Section 26 application)',
        );
      }
    }

    // 4. Pre-grant objection checks
    if (stage === 'PRE_GRANT') {
      if (
        type === 'LACK_CAPACITY' &&
        !description.includes('mental') &&
        !description.includes('incapacity')
      ) {
        warnings.push(
          "Lack of capacity claims should specifically describe the testator's mental state at execution",
        );
      }
    }

    // 5. Frivolous content check
    const hasFrivolousLanguage = this.FRIVOLOUS_KEYWORDS.some((word) =>
      description.toLowerCase().includes(word),
    );

    if (hasFrivolousLanguage) {
      warnings.push(
        'Objection contains language that may be considered frivolous. Focus on legal grounds rather than personal feelings.',
      );
    }

    // 6. Legal basis identification
    const legalBasis = this.getLegalBasis(type, stage);

    // 7. Specific ground validations
    this.validateSpecificGrounds(type, description, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      legalBasis,
    };
  }

  /**
   * Determines if mediation is recommended for the dispute
   */
  recommendMediation(
    type: DisputeType,
    relationship: string,
    estateValue: number,
  ): { recommended: boolean; reason: string; urgency: 'LOW' | 'MEDIUM' | 'HIGH' } {
    // Cases not suitable for mediation
    const nonMediableTypes: DisputeType[] = ['FRAUD', 'LACK_CAPACITY']; // Removed FORGERY since it's not in DisputeType

    if (nonMediableTypes.includes(type)) {
      return {
        recommended: false,
        reason: 'Serious allegations requiring judicial determination',
        urgency: 'HIGH',
      };
    }

    // Family disputes are good candidates for mediation
    if (['OMITTED_HEIR', 'UNDUE_INFLUENCE', 'OTHER'].includes(type)) {
      return {
        recommended: true,
        reason: 'Family relationship disputes are suitable for mediation',
        urgency: estateValue > 10000000 ? 'HIGH' : 'MEDIUM',
      };
    }

    // Technical disputes may benefit from mediation
    if (['ASSET_VALUATION', 'EXECUTOR_MISCONDUCT'].includes(type)) {
      return {
        recommended: true,
        reason: 'Technical disputes can often be resolved through mediation',
        urgency: 'MEDIUM',
      };
    }

    return {
      recommended: false,
      reason: 'Case requires court intervention',
      urgency: 'HIGH',
    };
  }

  /**
   * Calculates likelihood of success based on grounds
   */
  assessSuccessLikelihood(
    type: DisputeType,
    evidenceStrength: 'WEAK' | 'MODERATE' | 'STRONG',
    stage: 'PRE_GRANT' | 'POST_GRANT',
  ): { likelihood: 'LOW' | 'MEDIUM' | 'HIGH'; factors: string[] } {
    const factors: string[] = [];
    let likelihood: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    // Evidence strength is primary factor
    switch (evidenceStrength) {
      case 'STRONG':
        likelihood = 'HIGH';
        factors.push('Strong supporting evidence available');
        break;
      case 'MODERATE':
        likelihood = 'MEDIUM';
        factors.push('Moderate evidence requires corroboration');
        break;
      case 'WEAK':
        likelihood = 'LOW';
        factors.push('Weak evidence may not meet legal standards');
        break;
    }

    // Grounds-specific factors
    switch (type) {
      case 'LACK_CAPACITY':
        factors.push('Requires medical evidence and witness testimony');
        if (stage === 'POST_GRANT') likelihood = 'LOW'; // Hard to prove after the fact
        break;
      case 'UNDUE_INFLUENCE':
        factors.push('Difficult to prove without direct evidence');
        break;
      case 'OMITTED_HEIR':
        factors.push('Strong grounds if dependancy can be proven');
        likelihood = 'MEDIUM'; // Courts often provide for omitted dependants
        break;
      case 'FRAUD':
        factors.push('Requires clear and convincing evidence');
        if (evidenceStrength === 'STRONG') likelihood = 'HIGH';
        break;
      // Removed FORGERY case since it's not in DisputeType
    }

    // Stage impact
    if (stage === 'POST_GRANT') {
      factors.push('Post-grant revocation requires stronger evidence');
      if (likelihood === 'HIGH') likelihood = 'MEDIUM';
    }

    return { likelihood, factors };
  }

  /**
   * Validates if dispute can proceed to court filing
   */
  validateCourtFiling(
    type: DisputeType,
    description: string,
    evidence: string[],
    estateValue: number,
  ): { canFile: boolean; requirements: string[]; missingRequirements: string[] } {
    const requirements: string[] = [];
    const missingRequirements: string[] = [];

    // Basic requirements for all disputes
    if (description.length < this.MIN_DESCRIPTION_LENGTH) {
      missingRequirements.push(`Detailed description (min ${this.MIN_DESCRIPTION_LENGTH} chars)`);
    } else {
      requirements.push('Adequate description provided');
    }

    if (evidence.length === 0) {
      missingRequirements.push('Supporting evidence/documents');
    } else {
      requirements.push('Supporting evidence provided');
    }

    // Type-specific requirements
    switch (type) {
      case 'LACK_CAPACITY':
        requirements.push('Medical evidence required');
        requirements.push('Witness affidavits from time of will execution');
        break;
      case 'FRAUD':
        requirements.push('Clear evidence of fraudulent intent');
        requirements.push('Documentation showing misrepresentation');
        break;
      case 'UNDUE_INFLUENCE':
        requirements.push('Evidence of coercion or pressure');
        requirements.push('Relationship dynamics documentation');
        break;
      case 'OMITTED_HEIR':
        requirements.push('Proof of relationship');
        requirements.push('Evidence of dependency on deceased');
        break;
    }

    // High-value estate additional requirements
    if (estateValue > 10000000) {
      requirements.push('Legal representation recommended for high-value estates');
    }

    return {
      canFile: missingRequirements.length === 0,
      requirements,
      missingRequirements,
    };
  }

  private getLegalBasis(type: DisputeType, stage: 'PRE_GRANT' | 'POST_GRANT'): string {
    const bases: Record<DisputeType, string> = {
      LACK_CAPACITY: 'Law of Succession Act, Section 7',
      UNDUE_INFLUENCE: 'Law of Succession Act, Section 7',
      FRAUD: 'Law of Succession Act, Section 76(a)',
      OMITTED_HEIR: 'Law of Succession Act, Section 26',
      ASSET_VALUATION: 'Law of Succession Act, Section 83',
      EXECUTOR_MISCONDUCT: 'Law of Succession Act, Section 83(h)',
      OTHER: 'Various applicable laws',
      VALIDITY_CHALLENGE: '',
    };

    const base = bases[type] || 'Various applicable laws';
    return stage === 'POST_GRANT' ? `${base} (Revocation)` : base;
  }

  private validateSpecificGrounds(
    type: DisputeType,
    description: string,
    errors: string[],
    warnings: string[],
  ): void {
    switch (type) {
      case 'LACK_CAPACITY':
        if (!description.match(/(mental|incapacity|dementia|alzheimer|unsound mind|incapable)/i)) {
          warnings.push('Lack of capacity claims should describe specific mental conditions');
        }
        break;

      case 'UNDUE_INFLUENCE':
        if (!description.match(/(pressure|coercion|influence|domination|control)/i)) {
          warnings.push('Undue influence claims should describe the nature of influence exerted');
        }
        break;

      case 'OMITTED_HEIR':
        if (!description.match(/(dependant|maintenance|support|child|spouse|parent)/i)) {
          warnings.push('Omitted heir claims should specify the relationship and dependency');
        }
        break;
    }
  }
}
