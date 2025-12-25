/**
 * View Model representing the family grouped by "House" (Section 40 Compliance).
 *
 * Investor Note:
 * This is the "Digital Lawyer" visualization. It transforms a messy family tree
 * into a clear Legal Distribution Chart as per Kenyan Succession Law.
 */
export interface PolygamyDistributionVM {
  familyId: string;
  isPolygamous: boolean;

  // Legal Context
  distributionMethod: 'PER_STIRPES' | 'PER_CAPITA'; // S.40 (By House) or S.38 (No Spouse)
  totalHouses: number;

  houses: HouseGroupVM[];

  // Risk Flag: Children/Wives not assigned to a house cannot inherit under S.40 easily
  unassignedMembers: HouseMemberVM[];
  hasUnassignedRisks: boolean;
}

export interface HouseGroupVM {
  houseId: string;
  houseName: string; // e.g., "First House (Mama Wanjiku)"
  order: number; // 1, 2, 3...

  // S.40 entitlement (The "Pie Chart" slice)
  theoreticalSharePercentage: number; // e.g., 50% if 2 houses

  // The Matriarch (House Head)
  headOfHouse: {
    memberId: string;
    name: string;
    isAlive: boolean;
    marriageStatus: string; // "MARRIED", "WIDOWED"
  };

  // The Beneficiaries (Units of issue)
  members: HouseMemberVM[];

  // Stats
  memberCount: number;
  minorCount: number; // Critical for creating Trusts
}

export interface HouseMemberVM {
  memberId: string;
  name: string;
  relationshipToHead: 'SPOUSE' | 'CHILD' | 'GRANDCHILD' | 'OTHER';

  age?: number;
  isMinor: boolean; // < 18 (Needs Trustee)
  isStudent: boolean; // 18-24 (May still be dependent)
  hasDisability: boolean; // S.29 Dependent regardless of age

  // Inheritance Status
  isEligibleBeneficiary: boolean; // True usually
}
