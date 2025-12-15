// domain/interfaces/services/ikenyan-law.service.ts
import { DependantQualificationResult } from '../../policies/law-of-succession-act/section-29-dependant.policy';
import { IntestateDistributionResult } from '../../policies/law-of-succession-act/section-35-intestate.policy';
import { PolygamousDistributionPlan } from '../../policies/law-of-succession-act/section-40-polygamy.policy';
import { GuardianEligibilityResult } from '../../policies/law-of-succession-act/section-70-guardianship.policy';

export interface IKenyanLawService {
  /**
   * Runs the full S.40 or S.35/38 calculation engine for a deceased member.
   *
   * 1. Reconstructs the Family Tree.
   * 2. Identifies the Succession Structure (Monogamous vs Polygamous).
   * 3. Applies the correct distribution policy.
   */
  calculateIntestateDistribution(
    deceasedId: string,
  ): Promise<PolygamousDistributionPlan | IntestateDistributionResult>;

  /**
   * Determines if a specific family member qualifies as a S.29 Dependant.
   * Checks relationships, age, disability, and financial maintenance history.
   */
  assessDependantEligibility(
    deceasedId: string,
    candidateId: string,
  ): Promise<DependantQualificationResult>;

  /**
   * Validates a Guardianship appointment against S.70-73 LSA.
   * Checks criminal record, bankruptcy status, and relationship to ward.
   */
  validateGuardianshipAppointment(
    guardianId: string,
    wardId: string,
    source: 'WILL' | 'COURT',
  ): Promise<GuardianEligibilityResult>;

  /**
   * Determines if a specific marriage is valid under Kenyan Law.
   * Checks for Bigamy (e.g., Civil marriage exists, trying to register Customary).
   */
  validateMarriageLegality(
    spouse1Id: string,
    spouse2Id: string,
  ): Promise<{
    isValid: boolean;
    reason?: string;
    requiresConversion?: boolean;
  }>;
}
