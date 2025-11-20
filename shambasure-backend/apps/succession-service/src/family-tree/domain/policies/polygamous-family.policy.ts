import { Injectable } from '@nestjs/common';
import { Marriage } from '../entities/marriage.entity';
import { MarriageStatus } from '@prisma/client';
import { KENYAN_FAMILY_LAW } from '../../../common/constants/kenyan-law.constants';

export interface PolygamyCheckResult {
  isAllowed: boolean;
  error?: string;
  warning?: string;
}

@Injectable()
export class PolygamousFamilyPolicy {
  /**
   * Validates if a member can enter into a NEW marriage given their existing marriages.
   */
  checkMarriageEligibility(
    memberId: string,
    existingMarriages: Marriage[], // All marriages involving this member
    newMarriageType: MarriageStatus,
  ): PolygamyCheckResult {
    // Filter for ACTIVE marriages only
    const activeMarriages = existingMarriages.filter((m) => m.getIsActive());

    if (activeMarriages.length === 0) {
      return { isAllowed: true };
    }

    // 1. Check Existing Regimes
    for (const marriage of activeMarriages) {
      const type = marriage.getType();

      // Rule: If you have a Civil/Christian marriage, you CANNOT have another spouse.
      if (type === 'CIVIL_MARRIAGE' || type === 'CHRISTIAN_MARRIAGE') {
        return {
          isAllowed: false,
          error:
            'Existing Civil/Christian marriage is strictly monogamous. You must dissolve it before remarrying.',
        };
      }
    }

    // 2. Check New Regime Compatibility
    // If currently in a Customary (Polygamous) marriage, you generally cannot contract a Civil marriage
    // without dissolving the customary ones or converting (if to the same spouse).
    // Here we assume adding a DIFFERENT spouse.
    if (newMarriageType === 'CIVIL_MARRIAGE' || newMarriageType === 'CHRISTIAN_MARRIAGE') {
      return {
        isAllowed: false,
        error:
          'Cannot contract a Civil/Christian marriage while other Customary marriages exist. You must be monogamous to enter a Civil Union.',
      };
    }

    // 3. Islamic Limits (Max 4)
    if (newMarriageType === 'ISLAMIC_MARRIAGE') {
      // Assuming all active are Islamic
      if (activeMarriages.length >= 4) {
        return { isAllowed: false, error: 'Islamic law limits men to 4 wives.' };
      }
    }

    // 4. Gender Checks (Kenyan Statutory Law does not recognize Polyandry - 1 Wife, Multiple Husbands)
    // This requires knowing Gender of the central member.
    // Assuming logic in Service handles gender retrieval:
    // if (member.gender === 'FEMALE' && activeMarriages.length > 0) return { isAllowed: false, error: 'Polyandry not recognized' };

    return { isAllowed: true };
  }
}
