/**
 * View Model representing the family grouped by "House".
 * Crucial for Estate Distribution visualization.
 */
export interface PolygamyDistributionVM {
  familyId: string;
  isPolygamous: boolean;

  houses: HouseGroupVM[];

  // Members not assigned to a house (Risk Flag)
  unassignedMembers: HouseMemberVM[];
}

export interface HouseGroupVM {
  houseId: string;
  houseName: string; // e.g., "First House"
  order: number;

  // The Matriarch
  headOfHouse: {
    memberId: string;
    name: string;
    isAlive: boolean;
    marriageStatus: string;
  };

  // The Beneficiaries (Children)
  members: HouseMemberVM[];

  // Totals
  memberCount: number;
}

export interface HouseMemberVM {
  memberId: string;
  name: string;
  relationshipToHead: 'SPOUSE' | 'CHILD' | 'OTHER';
  age?: number;
  isMinor: boolean; // Critical for S.29 Support
}
