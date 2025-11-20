import { Injectable } from '@nestjs/common';
import { CustomaryRites } from '../value-objects/customary-rites.vo';
import { RELATIONSHIP_RULES } from '../../../common/constants/relationship-types.constants';

@Injectable()
export class CustomaryMarriagePolicy {
  /**
   * Evaluates if a union meets the threshold for a Customary Marriage.
   * In Kenya, this is vital because unproven customary marriages are the #1 cause of succession disputes.
   */
  validateCustomaryUnion(rites: CustomaryRites): {
    isValid: boolean;
    status: string;
    advice: string;
  } {
    const score = rites.calculateLegitimacyScore();

    if (score >= 70) {
      return {
        isValid: true,
        status: 'STRONG_CLAIM',
        advice: 'Union likely to be upheld by court. Registration recommended.',
      };
    }

    if (score >= 40) {
      return {
        isValid: true,
        status: 'MODERATE_CLAIM',
        advice:
          'Union has basis (e.g. Cohabitation), but lacks key evidence like Dowry or Affidavits. Disputes likely.',
      };
    }

    return {
      isValid: false,
      status: 'WEAK_CLAIM',
      advice:
        'Insufficient evidence to prove marriage. Under Section 3 of Law of Succession, "Wife" includes separated but not divorced, but "Girlfriend" has no rights.',
    };
  }
}
