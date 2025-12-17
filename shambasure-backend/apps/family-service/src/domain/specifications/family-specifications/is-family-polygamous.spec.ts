// domain/specifications/family-specifications/is-family-polygamous.spec.ts
import { MarriageType } from '@prisma/client';

import { Family } from '../../aggregates/family.aggregate';
import { Marriage } from '../../entities/marriage.entity';

export class IsFamilyPolygamousSpec {
  /**
   * Determines if the family setup is Polygamous under Kenyan Law.
   *
   * Criteria:
   * 1. Has multiple active marriages (simultaneous).
   * 2. OR: Has defined Polygamous Houses (S.40 structure).
   * 3. OR: Has a single marriage of a Type that is legally "Potentially Polygamous" (Islamic/Customary),
   *    AND there are children from other relationships recognized as houses.
   *
   * @param family - The Family Aggregate
   * @param activeMarriages - List of active marriages in the family
   */
  isSatisfiedBy(family: Family, activeMarriages: Marriage[]): boolean {
    // 1. Structural Check (S.40 LSA)
    // If we have explicitly created Houses, it's polygamous.
    if (family.polygamousHouseCount > 1) {
      return true;
    }

    // 2. Simultaneous Unions Check (Bigamy or Legal Polygamy)
    // If the man has > 1 active wife, it is polygamous.
    if (activeMarriages.length > 1) {
      return true;
    }

    // 3. Potential Polygamy Check (Regime)
    // Even with 1 wife, if the regime allows it (Customary/Islamic),
    // AND there are other children/houses defined (e.g. from deceased wives), it functions as polygamous.
    if (activeMarriages.length === 1) {
      const marriage = activeMarriages[0];
      const isPotential =
        marriage.type === MarriageType.CUSTOMARY || marriage.type === MarriageType.ISLAMIC;

      // If potentially polygamous regime AND family has multiple houses (e.g. 1 living wife, 1 deceased wife's house)
      if (isPotential && family.polygamousHouseCount > 1) {
        return true;
      }
    }

    // Default to Monogamous (S.35 applies)
    return false;
  }
}
