// domain/policies/law-of-succession-act/section-40-polygamy.policy.ts
import { PolygamousHouse } from '../../entities/polygamous-house.entity';
import { LsaSuccessionStructure } from '../../utils/family-tree-builder';

export interface HouseShareResult {
  houseId: string;
  houseName: string;
  houseHeadId: string; // The Wife

  // The Math
  livingChildrenCount: number;
  deceasedChildrenWithIssueCount: number;
  survivingWifeCount: number; // 0 or 1
  totalUnits: number; // Children + Wife

  // The Money
  sharePercentage: number;
  shareValue: number;

  // Breakdown of beneficiaries within this house share
  beneficiaryIds: string[];
}

export interface PolygamousDistributionPlan {
  totalEstateValue: number;
  totalUnitsAcrossAllHouses: number;
  houseAllocations: HouseShareResult[];
  unallocatedValue: number; // Should be 0
  warnings: string[];
}

export class Section40PolygamyPolicy {
  /**
   * Calculates the division of the Net Intestate Estate among polygamous houses.
   * Based on S.40(1): "...according to the number of children in each house, but also adding any wife surviving him as an additional unit."
   */
  static calculateDistribution(
    netEstateValue: number,
    structure: LsaSuccessionStructure,
    houses: PolygamousHouse[],
  ): PolygamousDistributionPlan {
    const allocations: HouseShareResult[] = [];
    const warnings: string[] = [];
    let totalEstateUnits = 0;

    // 1. Calculate Units for Each House
    for (const houseStructure of structure.polygamousHouses) {
      // Find the House Entity for status checks
      const houseEntity = houses.find((h) => h.id === houseStructure.houseId);

      if (!houseEntity) {
        warnings.push(`House data missing for ID ${houseStructure.houseId}`);
        continue;
      }

      if (houseEntity.areAssetsFrozen) {
        warnings.push(
          `House '${houseEntity.houseName}' assets are legally frozen. Distribution may be blocked.`,
        );
      }

      // A. Count Surviving Wife (1 Unit)
      // Check if house head is in the global list of surviving spouses
      const isWifeAlive = structure.survivingSpouses.includes(houseStructure.houseHeadId);
      const wifeUnit = isWifeAlive ? 1 : 0;

      // B. Count Living Children
      // Intersection of house children and living children
      const livingChildrenInHouse = houseStructure.children.filter((childId) =>
        structure.children.includes(childId),
      );
      const livingChildCount = livingChildrenInHouse.length;

      // C. Count Deceased Children with Issue (Per Stirpes - S.41)
      // Intersection of house children and deceased-with-issue list
      const deceasedWithIssueInHouse = houseStructure.children.filter((childId) =>
        structure.deceasedChildrenWithIssue.includes(childId),
      );
      const perStirpesCount = deceasedWithIssueInHouse.length;

      // D. Total Units for this House
      const houseUnits = wifeUnit + livingChildCount + perStirpesCount;

      totalEstateUnits += houseUnits;

      // Compile Beneficiaries for this house share
      // (Wife + Living Kids + Grandkids representing dead kids)
      // Note: We track the *Heads* of the share here (Wife, Child, Deceased Child).
      // Expansion to grandkids happens in the House-Internal distribution phase.
      const beneficiaryIds = [
        ...(isWifeAlive ? [houseStructure.houseHeadId] : []),
        ...livingChildrenInHouse,
        ...deceasedWithIssueInHouse,
      ];

      allocations.push({
        houseId: houseStructure.houseId,
        houseName: houseStructure.houseName,
        houseHeadId: houseStructure.houseHeadId,
        livingChildrenCount: livingChildCount,
        deceasedChildrenWithIssueCount: perStirpesCount,
        survivingWifeCount: wifeUnit,
        totalUnits: houseUnits,
        sharePercentage: 0, // Calculated next
        shareValue: 0, // Calculated next
        beneficiaryIds,
      });
    }

    // 2. Validate S.40 Applicability
    if (totalEstateUnits === 0) {
      return {
        totalEstateValue: netEstateValue,
        totalUnitsAcrossAllHouses: 0,
        houseAllocations: [],
        unallocatedValue: netEstateValue,
        warnings: [
          'No eligible beneficiaries (wives/children) found in any house. S.40 cannot apply. Fallback to S.39 (Parents) or S.46 (Escheat).',
        ],
      };
    }

    // 3. Calculate Shares
    for (const alloc of allocations) {
      // Avoid division by zero
      const ratio = totalEstateUnits > 0 ? alloc.totalUnits / totalEstateUnits : 0;

      alloc.sharePercentage = parseFloat((ratio * 100).toFixed(2)); // e.g. 33.33%
      alloc.shareValue = Math.floor(netEstateValue * ratio); // Use floor to avoid floating point over-allocation
    }

    // 4. Handle Remainder (Penny Logic)
    // Distribute remainder cents to the first house (or random, but first is standard determination)
    const allocatedSum = allocations.reduce((sum, a) => sum + a.shareValue, 0);
    const remainder = netEstateValue - allocatedSum;

    if (remainder > 0 && allocations.length > 0) {
      allocations[0].shareValue += remainder;
    }

    return {
      totalEstateValue: netEstateValue,
      totalUnitsAcrossAllHouses: totalEstateUnits,
      houseAllocations: allocations,
      unallocatedValue: 0,
      warnings,
    };
  }
}
