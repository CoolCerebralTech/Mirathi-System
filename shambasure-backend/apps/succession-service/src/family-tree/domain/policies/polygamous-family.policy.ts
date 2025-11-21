import { Injectable } from '@nestjs/common';
import { Marriage } from '../entities/marriage.entity';
import { MarriageStatus } from '@prisma/client';

export interface PolygamyCheckResult {
  isAllowed: boolean;
  error?: string;
  warning?: string;
}

export type MarriageLike = {
  type: MarriageStatus;
  isActive: boolean;
};

@Injectable()
export class PolygamousFamilyPolicy {
  /**
   * Validates if a member can enter into a NEW marriage given their existing marriages.
   * Casts Marriage entities to a type-safe MarriageLike object to avoid TS errors.
   */
  checkMarriageEligibility(
    memberId: string,
    existingMarriages: Marriage[], // All marriages involving this member
    newMarriageType: MarriageStatus,
  ): PolygamyCheckResult {
    // Map to a type-safe shape
    const safeMarriages: MarriageLike[] = existingMarriages.map((m) => ({
      // Assuming the Marriage entity has public properties `type` and `isActive`
      type: (m as any).type as MarriageStatus,
      isActive: (m as any).isActive === true,
    }));

    // Filter active marriages
    const activeMarriages = safeMarriages.filter((m) => m.isActive);

    if (activeMarriages.length === 0) {
      return { isAllowed: true };
    }

    // 1. Check Existing Monogamous Regimes
    for (const marriage of activeMarriages) {
      if (
        marriage.type === MarriageStatus.CIVIL_UNION ||
        marriage.type === MarriageStatus.MARRIED
      ) {
        return {
          isAllowed: false,
          error:
            'Existing Civil Union or statutory monogamous marriage. Must dissolve before remarrying.',
        };
      }
    }

    // 2. Check New Marriage Type Compatibility
    if (
      newMarriageType === MarriageStatus.CIVIL_UNION ||
      newMarriageType === MarriageStatus.MARRIED
    ) {
      return {
        isAllowed: false,
        error:
          'Cannot contract a Civil Union or statutory marriage while other customary marriages exist.',
      };
    }

    // 3. Polygamy Rules for Customary Marriages
    if (newMarriageType === MarriageStatus.CUSTOMARY_MARRIAGE) {
      const customaryCount = activeMarriages.filter(
        (m) => m.type === MarriageStatus.CUSTOMARY_MARRIAGE,
      ).length;

      if (customaryCount >= 4) {
        return {
          isAllowed: false,
          error: 'Maximum 4 customary spouses allowed under Kenyan law.',
        };
      }
    }

    return { isAllowed: true };
  }
}
