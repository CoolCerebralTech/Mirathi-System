import { Injectable } from '@nestjs/common';
import { MarriageStatus } from '@prisma/client';

import type { Marriage } from '../entities/marriage.entity';

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
    existingMarriages: Marriage[],
    newMarriageType: MarriageStatus,
  ): PolygamyCheckResult {
    // Filter active marriages
    const activeMarriages = existingMarriages.filter((m) => m.getIsActive());

    if (activeMarriages.length === 0) {
      return { isAllowed: true };
    }

    // 1. Check Existing Monogamous Regimes
    for (const marriage of activeMarriages) {
      const marriageType = marriage.getMarriageType();

      if (marriageType === 'CIVIL_UNION' || marriageType === 'MARRIED') {
        return {
          isAllowed: false,
          error:
            'Existing Civil Union or statutory monogamous marriage. Must dissolve before remarrying.',
        };
      }
    }

    // 2. Check New Marriage Type Compatibility
    if (newMarriageType === 'CIVIL_UNION' || newMarriageType === 'MARRIED') {
      return {
        isAllowed: false,
        error:
          'Cannot contract a Civil Union or statutory marriage while other customary marriages exist.',
      };
    }

    // 3. Polygamy Rules for Customary Marriages
    if (newMarriageType === 'CUSTOMARY_MARRIAGE') {
      const customaryCount = activeMarriages.filter(
        (m) => m.getMarriageType() === 'CUSTOMARY_MARRIAGE',
      ).length;

      if (customaryCount >= 4) {
        return {
          isAllowed: false,
          error: 'Maximum 4 customary spouses allowed under Kenyan law.',
        };
      }

      if (customaryCount >= 2) {
        return {
          isAllowed: true,
          warning:
            'Polygamous marriage structure - ensure clear succession provisions for all spouses and children.',
        };
      }
    }

    return { isAllowed: true };
  }
}
