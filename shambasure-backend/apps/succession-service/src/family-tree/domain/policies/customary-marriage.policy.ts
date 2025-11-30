import { Injectable } from '@nestjs/common';

import { CustomaryRites } from '../value-objects/customary-rites.vo';

export interface CustomaryMarriageValidationResult {
  isValid: boolean;
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  score: number;
  missingRequirements: string[];
  errors: string[];
  requirements: string[];
  legalRisk: string;
  recommendation: string;
}

@Injectable()
export class CustomaryMarriagePolicy {
  /**
   * Evaluates a customary union based on Kenyan case law and community practices.
   * References: Marriage Act 2014, Customary Marriage Rules.
   */
  validate(rites: CustomaryRites): CustomaryMarriageValidationResult {
    const score = rites.calculateLegitimacyScore();
    const missingRequirements = this.identifyMissingEvidence(rites);

    if (score >= 75) {
      return {
        isValid: true,
        strength: 'STRONG',
        score,
        missingRequirements,
        errors: [],
        requirements: [
          'Registration with Registrar of Marriages recommended (Section 55)',
          'Maintain documentation of customary ceremony',
        ],
        legalRisk:
          'Low legal risk. Union has strong supporting evidence under Customary Marriage law and jurisprudence.',
        recommendation:
          'Marriage claim is strong. Couple should formally register under the Marriage Act to avoid future probate disputes.',
      };
    }

    if (score >= 45) {
      return {
        isValid: true,
        strength: 'MODERATE',
        score,
        missingRequirements,
        errors: [],
        requirements: [
          'Obtain affidavits from elder witnesses',
          'Document bride price payment receipts',
          'Registration with Registrar of Marriages strongly recommended',
        ],
        legalRisk:
          'Moderate legal risk. Court may require corroborating witnesses, documentary proof, or elder testimonies.',
        recommendation:
          'Union is recognized but vulnerable to challenge. Strengthen claim with affidavits and confirmation from elders.',
      };
    }

    return {
      isValid: false,
      strength: 'WEAK',
      score,
      missingRequirements,
      errors: ['Insufficient evidence of customary marriage under Kenyan law'],
      requirements: [
        'Complete bride price negotiations and payment',
        'Conduct ceremony with elder witnesses',
        'Obtain witness affidavits',
        'Register marriage officially',
      ],
      legalRisk:
        'High legal risk. Union does not meet customary requirements. Courts often reject such claims in succession matters.',
      recommendation:
        'Evidence insufficient. Consider civil marriage, affidavit of cohabitation, or gathering community witness statements.',
    };
  }

  /**
   * Validates customary marriage details for relationship integrity service
   */
  validateCustomaryMarriage(customaryDetails?: {
    bridePricePaid: boolean;
    elderWitnesses: string[];
    ceremonyLocation: string;
  }): {
    isValid: boolean;
    errors: string[];
    requirements: string[];
  } {
    const errors: string[] = [];
    const requirements: string[] = [];

    if (!customaryDetails) {
      errors.push('Customary marriage details are required');
      requirements.push(
        'Provide bride price payment status',
        'List elder witnesses',
        'Specify ceremony location',
      );
      return { isValid: false, errors, requirements };
    }

    // Note: Bride Price is NOT strictly mandatory for legality under recent rulings, but highly evidentiary.
    if (!customaryDetails.bridePricePaid) {
      requirements.push('Complete bride price payment for full legal evidentiary weight');
    }

    if (!customaryDetails.elderWitnesses || customaryDetails.elderWitnesses.length === 0) {
      errors.push('Elder witnesses are required for customary marriage validity');
      requirements.push('Obtain at least 2 elder witnesses from both families');
    }

    if (!customaryDetails.ceremonyLocation || customaryDetails.ceremonyLocation.trim() === '') {
      errors.push('Ceremony location is required');
      requirements.push('Specify the location where traditional ceremony was conducted');
    }

    requirements.push(
      'Registration with Registrar of Marriages recommended',
      'Maintain documentation of customary ceremony',
      'Obtain affidavits from elder witnesses for legal proceedings',
    );

    return {
      isValid: errors.length === 0,
      errors,
      requirements,
    };
  }

  private identifyMissingEvidence(rites: CustomaryRites): string[] {
    const evidence = rites.getEvidence();
    const missing: string[] = [];

    if (evidence.dowryPaymentStatus === 'NONE') {
      missing.push('Dowry/bride price negotiations or payment');
    }
    if (!evidence.witnessedByElders) {
      missing.push('Family or elders participation');
    }
    if (!evidence.cohabitationStart) {
      missing.push('Cohabitation or public recognition');
    }
    if (!evidence.ceremonyDate) {
      missing.push('Cultural ceremony or rites');
    }
    if (!evidence.affidavitExists) {
      missing.push('Affidavit or witness statements');
    }

    return missing;
  }
}
