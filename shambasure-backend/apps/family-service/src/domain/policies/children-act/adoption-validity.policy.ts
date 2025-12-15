// domain/policies/children-act/adoption-validity.policy.ts
import { FamilyMember } from '../../entities/family-member.entity';
import { AgeCalculator } from '../../utils/age-calculator';

export interface AdoptionValidationResult {
  isValid: boolean;
  rejectionReason?: string;
}

export class AdoptionValidityPolicy {
  /**
   * Enforces adoption eligibility rules.
   */
  static checkEligibility(
    adopter: FamilyMember,
    adoptee: FamilyMember,
    isJointApplication: boolean = false,
  ): AdoptionValidationResult {
    // 1. Adoptee Status
    if (!adoptee.isMinor) {
      // Adult adoption is rare/restricted, generally "Child" is < 18
      return { isValid: false, rejectionReason: 'Adoptee must be a child (under 18).' };
    }

    if (!adoptee.identity.residesInKenya) {
      return {
        isValid: false,
        rejectionReason: 'Inter-country adoption requires specific Hague Convention processing.',
      };
    }

    // 2. Adopter Age (Must be > 25 and < 65 usually, exact gap matters)
    const adopterAge = adopter.currentAge || 0;
    const adopteeAge = adoptee.currentAge || 0;
    const ageGap = adopterAge - adopteeAge;

    if (adopterAge < 25) {
      return { isValid: false, rejectionReason: 'Adopter must be at least 25 years old.' };
    }

    if (adopterAge > 65) {
      // Note: This is often discretionary but a standard policy
      return {
        isValid: false,
        rejectionReason: 'Adopter is over 65 years. Suitability inquiry required.',
      };
    }

    if (ageGap < 21) {
      // Children Act: Must be at least 21 years older than the child (unless relative)
      // We assume non-relative for strict check, or handle in service layer
      return {
        isValid: false,
        rejectionReason: 'Adopter must be at least 21 years older than the child.',
      };
    }

    // 3. Sole Male Applicant Rule
    // "A sole male applicant cannot adopt a female child unless strict circumstances met."
    if (!isJointApplication && adopter.gender === 'MALE' && adoptee.gender === 'FEMALE') {
      // Exception: Biological relative?
      // Logic: Reject by default, require manual override/court order flag
      return {
        isValid: false,
        rejectionReason:
          'Sole male applicant cannot adopt a female child unless special circumstances (S.158 Children Act).',
      };
    }

    // 4. Mental Capacity
    if (adopter.requiresSupportedDecisionMaking) {
      return { isValid: false, rejectionReason: 'Adopter lacks capacity to care for child.' };
    }

    return { isValid: true };
  }
}
