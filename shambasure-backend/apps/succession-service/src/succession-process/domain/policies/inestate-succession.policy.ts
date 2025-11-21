import { Injectable } from '@nestjs/common';
import { ShareType } from '../../../common/types/kenyan-law.types';

export interface FamilyUnit {
  spouseId?: string;
  childrenIds: string[];
  isHouse: boolean; // True for polygamous units
}

export interface DistributionResult {
  beneficiaryId: string;
  sharePercentage: number;
  shareType: ShareType;
}

@Injectable()
export class IntestateSuccessionPolicy {
  /**
   * Calculates shares based on Kenyan Intestacy Rules.
   */
  calculateShares(
    units: FamilyUnit[],
    estateNetValue: number, // Used if we need specific amounts, here we assume % logic
  ): DistributionResult[] {
    const results: DistributionResult[] = [];

    // 1. Polygamous Case (Section 40)
    // Logic: Estate divided by number of "Units".
    // Unit = 1 (for the Wife) + Total Children in that House.
    if (units.length > 1 && units.every((u) => u.isHouse)) {
      return this.calculatePolygamousShares(units);
    }

    // 2. Monogamous / Single Unit (Section 35 or 38)
    const unit = units[0];

    if (unit.spouseId && unit.childrenIds.length > 0) {
      // Section 35: Spouse + Children
      // Spouse: Personal Effects + Life Interest in Residue
      // Children: Absolute Interest in Residue (held in trust till age/marriage)

      // Simplified Percentage Split for "Residue":
      // Usually, Spouse keeps it in trust. For distribution logic, we flag types.

      results.push({
        beneficiaryId: unit.spouseId,
        sharePercentage: 0, // Special flag: "LIFE INTEREST IN WHOLE"
        shareType: 'LIFE_INTEREST',
      });

      unit.childrenIds.forEach((childId) => {
        results.push({
          beneficiaryId: childId,
          sharePercentage: 100 / unit.childrenIds.length, // Future absolute share
          shareType: 'ABSOLUTE_INTEREST', // Deferred
        });
      });
    } else if (unit.spouseId && unit.childrenIds.length === 0) {
      // Section 36: Spouse Only
      // Spouse gets 100% Absolute
      results.push({
        beneficiaryId: unit.spouseId,
        sharePercentage: 100,
        shareType: 'ABSOLUTE_INTEREST',
      });
    } else if (!unit.spouseId && unit.childrenIds.length > 0) {
      // Section 38: Children Only
      // Equal division
      const share = 100 / unit.childrenIds.length;
      unit.childrenIds.forEach((childId) => {
        results.push({
          beneficiaryId: childId,
          sharePercentage: share,
          shareType: 'ABSOLUTE_INTEREST',
        });
      });
    }

    return results;
  }

  private calculatePolygamousShares(houses: FamilyUnit[]): DistributionResult[] {
    const results: DistributionResult[] = [];

    // Calculate Total Units in the System
    // Section 40: "The number of units... shall be the number of children + 1 (for the wife)"
    let totalUnits = 0;
    houses.forEach((h) => {
      // Wife counts as 1 unit, each child counts as 1 unit
      totalUnits += (h.spouseId ? 1 : 0) + h.childrenIds.length;
    });

    // Value per Unit
    const percentagePerUnit = 100 / totalUnits;

    houses.forEach((house) => {
      // Wife's Share
      if (house.spouseId) {
        results.push({
          beneficiaryId: house.spouseId,
          sharePercentage: percentagePerUnit, // 1 Unit
          shareType: 'LIFE_INTEREST', // Still life interest in her share
        });
      }

      // Children's Shares
      house.childrenIds.forEach((childId) => {
        results.push({
          beneficiaryId: childId,
          sharePercentage: percentagePerUnit, // 1 Unit
          shareType: 'ABSOLUTE_INTEREST',
        });
      });
    });

    return results;
  }
}
