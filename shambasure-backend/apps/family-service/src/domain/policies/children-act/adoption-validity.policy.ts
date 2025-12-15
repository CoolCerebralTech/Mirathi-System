// domain/policies/children-act/adoption-validity.policy.ts
import { FamilyMember } from '../../entities/family-member.entity';

// Context object to capture the full scope of the adoption application
export interface AdoptionPolicyContext {
  adopter: FamilyMember;
  adoptee: FamilyMember;
  spouse?: FamilyMember; // Required if isJointApplication is true
  isJointApplication: boolean;
  isBiologicalRelative: boolean;
  hasContinuousCareHistory: boolean; // S.157 - Has child been in care for >3 months?
  childConsents: boolean; // S.186(7) - Has child >10 given consent?
  adoptionType: 'LOCAL' | 'INTERNATIONAL';
}

export interface AdoptionValidationResult {
  isValid: boolean;
  rejectionReason?: string;
  legalCitation?: string;
  requiresCourtDiscretion: boolean; // For cases legal in principle but requiring specific judicial clearance
  warning?: string; // Non-blocking issues that the court will scrutinize
}

export class AdoptionValidityPolicy {
  // Kenyan Children Act 2022 Constants
  private static readonly MIN_ADOPTER_AGE = 25;
  private static readonly MAX_ADOPTER_AGE = 65;
  private static readonly MIN_AGE_GAP = 21;
  private static readonly AGE_OF_CHILD_CONSENT = 10;
  private static readonly MIN_FOSTER_CARE_MONTHS = 3;

  /**
   * Evaluates the full legal validity of an adoption application against the Children Act 2022.
   */
  static validate(context: AdoptionPolicyContext): AdoptionValidationResult {
    const { adopter, adoptee } = context;

    // 0. PRE-FLIGHT INTEGRITY CHECKS
    if (!adopter.isIdentityVerified) {
      return this.fail('Adopter identity must be legally verified (S.14 Children Act).');
    }
    if (!adoptee.currentAge || !adopter.currentAge) {
      return this.fail('Birth dates are required for legal age calculations.');
    }

    // 1. ADOPTEE ELIGIBILITY (S.154 & S.158)
    if (!adoptee.isMinor) {
      return this.fail(
        'Adoptee must be a child (under 18 years of age).',
        'Children Act 2022, Section 154',
      );
    }

    // 2. MENTAL & LEGAL CAPACITY (S.186(1)(d))
    if (adopter.requiresSupportedDecisionMaking) {
      return this.fail(
        'Adopter lacks legal capacity to exercise guardianship (requires supported decision making).',
        'Children Act 2022, Section 186(1)(d)',
      );
    }

    // 3. ADOPTER AGE RESTRICTIONS (S.186(1)(a) & (b))
    const adopterAge = adopter.currentAge;

    if (adopterAge < this.MIN_ADOPTER_AGE) {
      return this.fail(
        `Adopter must be at least ${this.MIN_ADOPTER_AGE} years old.`,
        'Children Act 2022, Section 186(1)(a)',
      );
    }

    if (adopterAge > this.MAX_ADOPTER_AGE) {
      return {
        isValid: false,
        rejectionReason: `Adopter is over ${this.MAX_ADOPTER_AGE} years old. Requires exceptional court approval.`,
        legalCitation: 'Children Act 2022, Section 186(1)(b)',
        requiresCourtDiscretion: true,
      };
    }

    // 4. AGE GAP REQUIREMENT (S.186(1)(c))
    const ageGap = adopterAge - adoptee.currentAge;

    if (ageGap < this.MIN_AGE_GAP) {
      if (!context.isBiologicalRelative) {
        return this.fail(
          `Adopter must be at least ${this.MIN_AGE_GAP} years older than the child (Current gap: ${ageGap} yrs).`,
          'Children Act 2022, Section 186(1)(c)',
        );
      }
    }

    // 5. SOLE MALE APPLICANT RESTRICTION (S.186(2))
    if (!context.isJointApplication && adopter.gender === 'MALE' && adoptee.gender === 'FEMALE') {
      if (!context.isBiologicalRelative) {
        return this.fail(
          'A sole male applicant cannot adopt a female child unless special circumstances (e.g., kinship) exist.',
          'Children Act 2022, Section 186(2)',
        );
      }
      return {
        isValid: true,
        requiresCourtDiscretion: true,
        legalCitation: 'Children Act 2022, Section 186(2) - Kinship Exception',
      };
    }

    // 6. JOINT APPLICATION RULES (S.185)
    if (context.isJointApplication) {
      if (!context.spouse) {
        return this.fail('Joint applications require a spouse entity.');
      }
      if (context.spouse.gender === adopter.gender) {
        return this.fail(
          'Joint adoption is currently restricted to spouses in a marriage recognized under the Marriage Act.',
          'Children Act 2022, Section 185',
        );
      }
    }

    // 7. CHILD'S CONSENT (S.186(7))
    const childAge = adoptee.currentAge;
    if (childAge >= this.AGE_OF_CHILD_CONSENT && !context.childConsents) {
      return this.fail(
        `Child is ${childAge} years old and must give consent to be adopted.`,
        'Children Act 2022, Section 186(7)',
      );
    }

    // 8. RESIDENCY & INTERNATIONAL ADOPTION (Part XIV)
    if (context.adoptionType === 'LOCAL') {
      // FIX: Safely access citizenship via unknown casting if interface definition is hidden
      // or assume Kenyan if not specified.
      const citizenship = (adopter.identity as any).citizenship || 'KENYAN';

      if (citizenship !== 'KENYAN' && !this.isResident(adopter)) {
        return this.fail(
          'For local adoption, applicant must be resident in Kenya.',
          'Children Act 2022, Section 184',
        );
      }
    } else if (context.adoptionType === 'INTERNATIONAL') {
      return {
        isValid: true,
        requiresCourtDiscretion: true,
        legalCitation: 'Children Act 2022, Part XIV - International Adoption',
        warning: 'Must prove child cannot be adopted locally.',
      };
    }

    // 9. CONTINUOUS CARE (S.157)
    if (!context.hasContinuousCareHistory && !context.isBiologicalRelative) {
      return {
        isValid: false,
        rejectionReason: `Child must be in the continuous care of the applicant for at least ${this.MIN_FOSTER_CARE_MONTHS} months.`,
        legalCitation: 'Children Act 2022, Section 157',
        requiresCourtDiscretion: true,
      };
    }

    return { isValid: true, requiresCourtDiscretion: false };
  }

  // --- Helpers ---

  private static fail(reason: string, citation?: string): AdoptionValidationResult {
    return {
      isValid: false,
      rejectionReason: reason,
      legalCitation: citation,
      requiresCourtDiscretion: false,
    };
  }

  private static isResident(member: FamilyMember): boolean {
    // FIX: Use optional chaining and casting to handle 'county' existence safely
    const contactCounty = (member.contactInfo as any)?.county;
    const birthCounty = member.birthLocation?.county;

    // If they have a contact address (county) or were born here, assume resident for MVP
    return !!contactCounty || !!birthCounty;
  }
}
