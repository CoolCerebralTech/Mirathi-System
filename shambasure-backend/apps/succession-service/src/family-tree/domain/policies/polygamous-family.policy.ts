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
   * Based on Kenyan Marriage Act 2014 sections regarding Monogamy vs Polygamy.
   */
  checkMarriageEligibility(
    memberId: string,
    existingMarriages: Marriage[],
    newMarriageType: MarriageStatus,
  ): PolygamyCheckResult {
    // Filter active marriages for this specific member
    const activeMarriages = existingMarriages.filter(
      (m) => m.getIsActive() && (m.getSpouse1Id() === memberId || m.getSpouse2Id() === memberId),
    );

    if (activeMarriages.length === 0) {
      return { isAllowed: true };
    }

    // 1. Check Existing Monogamous Regimes
    // If the person is already in a Monogamous marriage, they cannot marry again (Polyandry/Polygyny restrictions apply to Monogamous unions).
    for (const marriage of activeMarriages) {
      const type = marriage.getMarriageType();

      // Christian, Civil, and Hindu marriages are strictly Monogamous
      if (
        type === MarriageStatus.CIVIL_UNION ||
        type === MarriageStatus.MARRIED || // Assumed Statutory/Monogamous
        type === MarriageStatus.CHRISTIAN // If Enum exists in your schema
      ) {
        return {
          isAllowed: false,
          error:
            'Existing Civil/Christian/Statutory monogamous marriage. Must dissolve before remarrying.',
        };
      }
    }

    // 2. Check New Marriage Type Compatibility
    // Cannot enter a Monogamous marriage if already in a Customary (potentially polygamous) one
    // unless converting the ONE existing customary marriage (Section 6(2) Marriage Act).
    if (
      newMarriageType === MarriageStatus.CIVIL_UNION ||
      newMarriageType === MarriageStatus.MARRIED ||
      newMarriageType === MarriageStatus.CHRISTIAN
    ) {
      if (activeMarriages.length > 1) {
        return {
          isAllowed: false,
          error: 'Cannot contract a Monogamous marriage while multiple Customary marriages exist.',
        };
      } else if (activeMarriages.length === 1) {
        return {
          isAllowed: true,
          warning:
            'Contracting a Monogamous marriage will convert the existing Customary union. Ensure legal procedures are followed.',
        };
      }
    }

    // 3. Polygamy Rules for ISLAMIC Marriages
    if (newMarriageType === MarriageStatus.ISLAMIC) {
      const islamicCount = activeMarriages.filter(
        (m) => m.getMarriageType() === MarriageStatus.ISLAMIC,
      ).length;

      // Strict limit of 4 under Islamic Law
      if (islamicCount >= 4) {
        return {
          isAllowed: false,
          error: 'Maximum 4 spouses allowed under Islamic Law.',
        };
      }
    }

    // 4. Polygamy Rules for CUSTOMARY Marriages
    if (newMarriageType === MarriageStatus.CUSTOMARY_MARRIAGE) {
      const totalSpouses = activeMarriages.length;

      // Note: Kenyan Customary Law does not have a strict numeric limit like Islamic law.
      // However, managing complex estates is difficult.
      if (totalSpouses >= 2) {
        return {
          isAllowed: true,
          warning:
            'Polygamous marriage structure - ensure clear succession provisions for all spouses and children (Section 40 Law of Succession).',
        };
      }
    }

    return { isAllowed: true };
  }
}
