import { Injectable } from '@nestjs/common';
import { CustomaryRites } from '../value-objects/customary-rites.vo';

export interface CustomaryMarriageValidationResult {
  isValid: boolean;
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  score: number;
  missingRequirements: string[];
  legalRisk: string;
  recommendation: string;
}

@Injectable()
export class CustomaryMarriagePolicy {
  /**
   * Evaluates a customary union based on Kenyan case law and community practices.
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
      legalRisk:
        'High legal risk. Union does not meet customary requirements. Courts often reject such claims in succession matters.',
      recommendation:
        'Evidence insufficient. Consider civil marriage, affidavit of cohabitation, or gathering community witness statements.',
    };
  }

  private identifyMissingEvidence(rites: CustomaryRites): string[] {
    const evidence = rites.getEvidence();
    const missing: string[] = [];

    if (evidence.dowryPaymentStatus === 'NONE') {
      missing.push('Dowry/ bride price negotiations or payment');
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
