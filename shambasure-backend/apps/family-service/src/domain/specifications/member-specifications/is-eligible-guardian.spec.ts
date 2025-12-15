// domain/specifications/member-specifications/is-eligible-guardian.spec.ts
import { FamilyMember } from '../../entities/family-member.entity';

export class IsEligibleGuardianSpec {
  /**
   * Filters members who are legally capable of being guardians.
   *
   * Criteria:
   * 1. Alive.
   * 2. Adult (18+).
   * 3. Has Legal Capacity (No supported decision making).
   * 4. Identity Verified (Practical requirement for court).
   */
  isSatisfiedBy(candidate: FamilyMember): boolean {
    // 1. Life Status
    if (candidate.isDeceased || !candidate.isPresumedAlive) {
      return false;
    }

    // 2. Age (Must be adult)
    if (candidate.isMinor) {
      return false;
    }

    // 3. Legal Capacity
    // If they need a guardian themselves, they can't be one.
    if (candidate.requiresSupportedDecisionMaking) {
      return false;
    }

    // 4. Verification
    // Courts rarely appoint someone whose ID is not verified.
    if (!candidate.isIdentityVerified) {
      return false;
    }

    return true;
  }
}
