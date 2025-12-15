// domain/policies/law-of-succession-act/section-70-guardianship.policy.ts
import { GuardianType } from '@prisma/client';

import { FamilyMember } from '../../entities/family-member.entity';

export interface GuardianEligibilityResult {
  isEligible: boolean;
  requiresBond: boolean;
  bondReason?: string;
  rejectionReason?: string;
  warnings: string[];
  appointmentType: GuardianType;
  restrictions?: string[]; // E.g., "Property Management Excluded"
}

export interface GuardianPolicyContext {
  appointmentSource: 'WILL' | 'COURT' | 'NATURAL';
  survivingParentExists: boolean;
  candidateHasCriminalRecord?: boolean;
  candidateIsBankrupt?: boolean;
}

export class Section70GuardianshipPolicy {
  /**
   * Evaluates if a candidate can serve as a guardian for a specific ward.
   * Enforces S.70 (Testamentary), S.71 (Court), and S.72 (Security) of LSA.
   */
  static checkEligibility(
    candidate: FamilyMember,
    ward: FamilyMember,
    context: GuardianPolicyContext,
  ): GuardianEligibilityResult {
    const warnings: string[] = [];
    const restrictions: string[] = [];

    // =========================================================================
    // 1. FUNDAMENTAL CAPACITY CHECKS
    // =========================================================================

    if (candidate.isDeceased) {
      return this.reject('Candidate is deceased.');
    }

    // Guardian must be an adult (18+)
    if (candidate.isMinor) {
      return this.reject(
        `Guardian must be an adult (Candidate is ${candidate.currentAge || 'unknown'}).`,
      );
    }

    // Mental Capacity (S.70 implies soundness of mind)
    // If a guardian needs support to make their own decisions, they cannot make decisions for a ward.
    if (candidate.requiresSupportedDecisionMaking) {
      return this.reject('Candidate lacks legal capacity (requires supported decision making).');
    }

    if (candidate.id === ward.id) {
      return this.reject('A person cannot be their own guardian.');
    }

    // =========================================================================
    // 2. SUITABILITY & PROPERTY RIGHTS
    // =========================================================================

    // Criminal Record (Children Act suitability check)
    if (context.candidateHasCriminalRecord) {
      // Not an automatic hard-block in LSA, but court will likely reject.
      // We flag it as eligible-but-warned to allow Court Discretion override.
      warnings.push(
        'Candidate has a criminal record. High risk of court rejection under Children Act.',
      );
    }

    // Bankruptcy - CRITICAL DISTINCTION
    // Bankrupts cannot manage property, but can legally care for the child.
    if (context.candidateIsBankrupt) {
      restrictions.push('PROPERTY_MANAGEMENT_EXCLUDED');
      warnings.push(
        "Candidate is bankrupt. Ineligible for property management powers. Strictly 'Guardian of Person' only.",
      );
    }

    // =========================================================================
    // 3. APPOINTMENT LOGIC (S.70 & S.71)
    // =========================================================================

    // S.70(2) - Joint Guardianship
    // "On the death of the father... the mother, if surviving, shall be guardian... either alone or jointly with any guardian appointed by the father."
    if (context.appointmentSource === 'WILL' && context.survivingParentExists) {
      warnings.push(
        'S.70(2): Testamentary guardian will act JOINTLY with the surviving natural parent.',
      );
    }

    // Determine Type & Bond (S.72)
    const { type, requiresBond, bondReason } = this.determineSecurity(context);

    return {
      isEligible: true,
      requiresBond,
      bondReason,
      warnings,
      appointmentType: type,
      restrictions,
    };
  }

  /**
   * Determines if a ward actually needs a guardian.
   * Note: In Kenya, marriage of a minor is void, so marriage does NOT terminate minority.
   */
  static needsGuardian(ward: FamilyMember): boolean {
    // 1. Is Minor? (Under 18)
    if (ward.isMinor) return true;

    // 2. Adult with Incapacity?
    // Technically processed under Mental Health Act / Power of Attorney,
    // but in Succession, a "Guardian ad litem" or Manager is appointed.
    if (ward.hasDisability && ward.requiresSupportedDecisionMaking) return true;

    return false;
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  private static determineSecurity(context: GuardianPolicyContext): {
    type: GuardianType;
    requiresBond: boolean;
    bondReason: string;
  } {
    let type: GuardianType;
    let requiresBond = false;
    let bondReason = '';

    switch (context.appointmentSource) {
      case 'WILL':
        type = 'TESTAMENTARY';
        // S.72(1): Court *may* require bond.
        // Policy: If managing property, usually yes. If just care, no.
        if (context.candidateIsBankrupt) {
          // Paradox: If bankrupt, they shouldn't manage property, hence no bond needed for property,
          // but if they try to, bond is mandatory.
          requiresBond = true;
          bondReason = 'High risk: Guardian is bankrupt.';
        }
        break;

      case 'COURT':
        type = 'COURT_APPOINTED';
        // S.72(1): Court appointments generally require security.
        requiresBond = true;
        bondReason = 'S.72 Standard requirement for Court-Appointed guardians.';
        break;

      case 'NATURAL':
        type = 'NATURAL_PARENT';
        // Natural parents don't provide bonds for their own children unless mismanaging assets.
        requiresBond = false;
        break;

      default:
        type = 'DE_FACTO';
        requiresBond = true;
        bondReason = 'De-facto guardianship requires security pending formalization.';
    }

    return { type, requiresBond, bondReason };
  }

  private static reject(reason: string): GuardianEligibilityResult {
    return {
      isEligible: false,
      requiresBond: false,
      rejectionReason: reason,
      warnings: [],
      appointmentType: 'DE_FACTO', // Placeholder for rejected state
    };
  }
}
