// domain/policies/law-of-succession-act/section-40-polygamy.policy.ts
import { PolygamousHouse } from '../../entities/polygamous-house.entity';
import { SuccessionStructure } from '../../utils/family-tree-builder';

export interface HouseShareResult {
  houseId: string;
  houseName: string;
  houseHeadId: string | null; // The Wife (if identified)

  // S.40 Unit Calculation Details
  livingChildrenCount: number;
  deceasedChildrenWithIssueCount: number;
  survivingWifeCount: number; // 0 or 1
  totalHouseUnits: number; // Wife + Children + Issue

  // The Money
  sharePercentage: number;
  shareValue: number;

  // Breakdown of primary beneficiaries in this house (Wife + Kids + Roots of Grandkids)
  beneficiaryIds: string[];
}

export interface PolygamousDistributionPlan {
  totalEstateValue: number;
  totalUnitsAcrossAllHouses: number;
  houseAllocations: HouseShareResult[];
  unallocatedValue: number; // Should ideally be 0
  warnings: string[];
}

export class Section40PolygamyPolicy {
  /**
   * Calculates the division of the Net Intestate Estate among polygamous houses.
   *
   * Legal Basis: Section 40(1) Law of Succession Act:
   * "The personal and household effects and the residue of the net intestate estate shall...
   * be divided among the houses according to the number of children in each house,
   * but also adding any wife surviving him as an additional unit to the number of children."
   *
   * @param netEstateValue - Residue value in KES
   * @param structure - The family tree analysis
   * @param houses - The PolygamousHouse entities (for status checks)
   */
  static calculateDistribution(
    netEstateValue: number,
    structure: SuccessionStructure,
    houses: PolygamousHouse[],
  ): PolygamousDistributionPlan {
    const allocations: HouseShareResult[] = [];
    const warnings: string[] = [];
    let totalEstateUnits = 0;

    // 1. Calculate Units for Each House
    for (const houseStruct of structure.polygamousHouses) {
      // Find the House Entity to check legal status (frozen/dissolved)
      const houseEntity = houses.find((h) => h.id === houseStruct.houseId);

      if (!houseEntity) {
        warnings.push(
          `House data missing for ID ${houseStruct.houseId} - Calculation may be incomplete.`,
        );
        continue;
      }

      if (houseEntity.houseAssetsFrozen) {
        warnings.push(
          `House '${houseStruct.houseName}' assets are legally frozen. Distribution to this house is blocked pending court order.`,
        );
      }

      // A. Count Surviving Wife (1 Unit)
      // Check if house head is in the global list of surviving spouses
      const isWifeAlive = houseStruct.houseHeadId
        ? structure.survivingSpouses.includes(houseStruct.houseHeadId)
        : false;

      const wifeUnit = isWifeAlive ? 1 : 0;

      // B. Count Living Children
      const livingChildCount = houseStruct.livingChildrenIds.length;

      // C. Count Deceased Children with Issue (Per Stirpes - S.41)
      const perStirpesCount = houseStruct.deceasedChildrenWithIssue.size;

      // D. Total Units for this House
      const houseUnits = wifeUnit + livingChildCount + perStirpesCount;

      totalEstateUnits += houseUnits;

      // Compile Beneficiaries (Heads of shares within the house)
      const beneficiaryIds: string[] = [];
      if (isWifeAlive && houseStruct.houseHeadId) {
        beneficiaryIds.push(houseStruct.houseHeadId);
      }
      beneficiaryIds.push(...houseStruct.livingChildrenIds);
      beneficiaryIds.push(...Array.from(houseStruct.deceasedChildrenWithIssue.keys()));

      allocations.push({
        houseId: houseStruct.houseId,
        houseName: houseStruct.houseName,
        houseHeadId: houseStruct.houseHeadId,
        livingChildrenCount: livingChildCount,
        deceasedChildrenWithIssueCount: perStirpesCount,
        survivingWifeCount: wifeUnit,
        totalHouseUnits: houseUnits,
        sharePercentage: 0, // Calculated in Pass 2
        shareValue: 0, // Calculated in Pass 2
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
          'No eligible beneficiaries (wives/children/grandkids) found in any house. S.40 cannot apply. Estate likely devolves to S.39 (Parents/Kin).',
        ],
      };
    }

    // 3. Calculate Shares (Pass 2)
    for (const alloc of allocations) {
      // Formula: (HouseUnits / TotalUnits) * Estate
      const ratio = alloc.totalHouseUnits / totalEstateUnits;

      alloc.sharePercentage = parseFloat((ratio * 100).toFixed(4));
      alloc.shareValue = Math.floor(netEstateValue * ratio); // Use floor for safe currency handling
    }

    // 4. Handle Remainder (Penny distribution)
    // Because we floored the values, there might be a tiny remainder.
    // Standard accounting practice: Allocate remainder to the house with the largest share or the first house.
    const allocatedSum = allocations.reduce((sum, a) => sum + a.shareValue, 0);
    const remainder = netEstateValue - allocatedSum;

    if (remainder > 0 && allocations.length > 0) {
      // Sort by share size desc to give remainder to largest shareholder (fairness heuristic)
      // or just give to first. Here we give to first for deterministic behavior.
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
