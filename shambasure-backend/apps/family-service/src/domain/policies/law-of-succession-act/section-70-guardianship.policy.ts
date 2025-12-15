// domain/policies/law-of-succession-act/section-70-guardianship.policy.ts
import { FamilyMember } from '../../entities/family-member.entity';
import { GuardianType } from '../../entities/guardian.entity';

export interface GuardianEligibilityResult {
  isEligible: boolean;
  requiresBond: boolean;
  bondReason?: string;
  rejectionReason?: string;
  warnings: string[];
  appointmentType: GuardianType;
}

export class Section70GuardianshipPolicy {
  /**
   * Evaluates if a candidate can serve as a guardian for a specific ward.
   * Enforces S.70 (Testamentary) and S.71 (Court) rules.
   */
  static checkEligibility(
    candidate: FamilyMember,
    ward: FamilyMember,
    context: {
      appointmentSource: 'WILL' | 'COURT' | 'NATURAL';
      survivingParentExists: boolean;
      candidateHasCriminalRecord?: boolean;
      candidateIsBankrupt?: boolean;
    },
  ): GuardianEligibilityResult {
    const warnings: string[] = [];

    // 1. Basic Capacity Checks (S.70 & Children Act)
    if (candidate.isDeceased) {
      return this.reject('Candidate is deceased.');
    }

    if (candidate.isMinor) {
      return this.reject('Guardian must be an adult (18+).');
    }

    // Mental Capacity (S.70 implies soundness of mind)
    // We check disability status for "requiresSupportedDecisionMaking"
    // If a guardian needs support to make their own decisions, they cannot make decisions for a ward.
    if (candidate.requiresSupportedDecisionMaking) {
      return this.reject('Candidate lacks legal capacity (requires supported decision making).');
    }

    if (candidate.id === ward.id) {
      return this.reject('A person cannot be their own guardian.');
    }

    // 2. Conflict of Interest / Suitability
    if (context.candidateHasCriminalRecord) {
      // While LSA is silent, Children Act is strict on child protection
      warnings.push('Candidate has a criminal record. Court approval unlikely.');
    }

    // 3. Property Management Capacity
    if (context.candidateIsBankrupt) {
      warnings.push(
        "Candidate is bankrupt. Ineligible for property management powers, strictly 'Guardian of Person' only.",
      );
    }

    // 4. Section 70(2) - Joint Guardianship
    // "On the death of the father... the mother, if surviving, shall be guardian... either alone or jointly with any guardian appointed by the father."
    if (context.appointmentSource === 'WILL' && context.survivingParentExists) {
      warnings.push(
        'S.70(2): Testamentary guardian will act JOINTLY with the surviving natural parent.',
      );
    }

    // 5. Determine Guardian Type & Bond Requirements (S.72)
    let type: GuardianType;
    let requiresBond = false;
    let bondReason = '';

    switch (context.appointmentSource) {
      case 'WILL':
        type = GuardianType.TESTAMENTARY;
        // S.72(1): "The court may... require... to give security."
        // Default: No bond for testamentary unless court orders (usually if property involved).
        if (context.candidateIsBankrupt) {
          requiresBond = true;
          bondReason = 'Risk factor: Guardian is bankrupt.';
        }
        break;

      case 'COURT':
        type = GuardianType.COURT_APPOINTED;
        // S.72(1): Court almost always requires bond for court-appointed guardians handling property.
        requiresBond = true;
        bondReason = 'S.72 Requirement for Court-Appointed Guardians managing estate.';
        break;

      case 'NATURAL':
        type = GuardianType.NATURAL_PARENT;
        // Natural parents rarely need bonds for their own children's inheritance unless dispute arises.
        requiresBond = false;
        break;

      default:
        type = GuardianType.DE_FACTO;
        requiresBond = true; // De-facto guardians are high risk
        bondReason = 'De-facto guardianship requires security pending formalization.';
    }

    return {
      isEligible: true,
      requiresBond,
      bondReason,
      warnings,
      appointmentType: type,
    };
  }

  /**
   * Determines if a ward actually needs a guardian.
   * (e.g. they turned 18, or they are married - marriage terminates minority in some contexts, though 18 is statutory age).
   */
  static needsGuardian(ward: FamilyMember): boolean {
    // 1. Is Minor?
    if (ward.isMinor) return true;

    // 2. Has Disability requiring decision support?
    // In Kenya, "Guardianship" usually refers to minors.
    // Adults with mental incapacity fall under "Power of Attorney" or specific Mental Health Act provisions,
    // but colloquially processed as guardianship in succession cases.
    if (ward.hasDisability && ward.requiresSupportedDecisionMaking) return true;

    return false;
  }

  // --- Helper ---
  private static reject(reason: string): GuardianEligibilityResult {
    return {
      isEligible: false,
      requiresBond: false,
      rejectionReason: reason,
      warnings: [],
      appointmentType: GuardianType.DE_FACTO, // Placeholder
    };
  }
}
