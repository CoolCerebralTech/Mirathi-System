// services/succession-distribution.service.ts

export interface FamilyMember {
  id: string;
  type: 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING';
  gender?: 'MALE' | 'FEMALE';
  age?: number;
}

export class SuccessionDistributionService {
  /**
   * Calculates distribution according to Section 40 (Polygamous)
   */
  calculatePolygamousDistribution(
    numberOfHouses: number,
    childrenPerHouse: number[],
  ): { housePercentages: number[]; childPercentages: number[][] } {
    // Section 40: Each house gets equal share
    const houseShare = 100 / numberOfHouses;

    const housePercentages = Array(numberOfHouses).fill(houseShare);
    const childPercentages = childrenPerHouse.map((children) => {
      if (children === 0) return [];
      // Children share equally within their house
      return Array(children).fill(houseShare / children);
    });

    return { housePercentages, childPercentages };
  }

  /**
   * Calculates distribution according to Section 35/36 (Intestate)
   */
  calculateIntestateDistribution(
    hasSpouse: boolean,
    hasChildren: boolean,
    numberOfChildren: number,
  ): { spouseShare: number; childShare: number } {
    if (hasSpouse && hasChildren) {
      // Section 35: Spouse gets life interest + children get equal shares
      return { spouseShare: 100, childShare: 100 / numberOfChildren };
    } else if (hasSpouse && !hasChildren) {
      // Section 36: Spouse gets everything
      return { spouseShare: 100, childShare: 0 };
    } else if (!hasSpouse && hasChildren) {
      // Section 38: Children get everything equally
      return { spouseShare: 0, childShare: 100 / numberOfChildren };
    }

    return { spouseShare: 0, childShare: 0 };
  }

  /**
   * Calculates Islamic (Faraid) distribution
   */
  calculateIslamicDistribution(
    gender: 'MALE' | 'FEMALE',
    relationship: string,
    _otherHeirs: FamilyMember[],
  ): number {
    // Simplified Faraid calculation
    const shares: Record<string, number> = {
      SPOUSE_MALE: 0.25,
      SPOUSE_FEMALE: 0.125,
      SON: 2,
      DAUGHTER: 1,
      FATHER: 0.1667,
      MOTHER: 0.1667,
    };

    const key = `${relationship}_${gender}`;
    return shares[key] || 0;
  }
}
