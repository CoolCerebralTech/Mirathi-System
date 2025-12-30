import { WitnessType } from '../../../../domain/entities/will-witness.entity';

/**
 * Data Transfer Object for Adding (Nominating) a Witness.
 *
 * USE CASE:
 * Populates the witness list in the Draft Will so that the generated PDF
 * contains their details for the physical signing ceremony.
 */
export interface AddWitnessDto {
  // --- WHO (The Witness) ---
  witnessIdentity: {
    type: WitnessType; // e.g., 'EXTERNAL_INDIVIDUAL', 'REGISTERED_USER'
    userId?: string;
    externalDetails?: {
      fullName: string;
      nationalId?: string; // Critical for S.11 Validity
      kraPin?: string;
      relationshipToTestator?: string;
    };
  };

  // --- CONTACT (For Notifications) ---
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };

  /**
   * Preliminary eligibility check.
   * Full validation happens at execution, but we filter obvious blockers here.
   */
  eligibilityConfirmation: {
    isOver18: boolean;
    isMentallyCompetent: boolean;
    isNotBeneficiary: boolean; // S.11(2) Check
  };
}
