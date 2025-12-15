// domain/interfaces/services/ifamily-validation.service.ts

export interface IFamilyValidationService {
  /**
   * Checks if adding a member to a family would violate any structural rules.
   * e.g., Cyclic relationships, impossible dates (child born before parent).
   */
  validateMemberAddition(familyId: string, memberId: string): Promise<void>;

  /**
   * Verifies that a Polygamous House structure is compliant with S.40.
   * e.g., Ensuring the House Head is a valid wife of the Family Creator/Head.
   */
  validatePolygamousHouseStructure(familyId: string, houseId: string): Promise<void>;

  /**
   * Checks for Bigamy across the entire system.
   * Ensures a person in a MONOGAMOUS union is not registered in another active marriage.
   */
  checkBigamyRisk(personId: string): Promise<{
    hasRisk: boolean;
    existingMarriageId?: string;
    conflictType?: 'CIVIL_vs_CUSTOMARY' | 'CIVIL_vs_CIVIL';
  }>;
}
