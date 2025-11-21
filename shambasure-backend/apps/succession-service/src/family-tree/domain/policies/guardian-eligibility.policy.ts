import { Injectable } from '@nestjs/common';
import { FamilyMember } from '../entities/family-member.entity';
import { GuardianType } from '@prisma/client';

@Injectable()
export class GuardianEligibilityPolicy {
  /**
   * Determines if a proposed guardian is legally eligible to act for a ward.
   * Performs basic checks: age, self-guardianship, vital status, and ward eligibility.
   */
  checkEligibility(
    guardian: FamilyMember,
    ward: FamilyMember,
    type?: GuardianType,
  ): { isEligible: boolean; reason?: string } {
    // example: Financial guardianship allows non-minor wards
    if (type === 'FINANCIAL_GUARDIAN' && !ward.getIsMinor()) {
      return { isEligible: true };
    }

    // 2. Cannot be own guardian
    if (guardian.getId() === ward.getId()) {
      return { isEligible: false, reason: 'Cannot be own guardian.' };
    }

    // 3. Guardian must be alive
    if (guardian.getIsDeceased()) {
      return { isEligible: false, reason: 'Guardian cannot be deceased.' };
    }

    // 4. Ward must be minor (under 18)
    if (!ward.getIsMinor()) {
      return {
        isEligible: false,
        reason: 'Ward is not a minor. Guardianship applies only to children under 18.',
      };
    }

    // 5. Optional: Check if guardian already has max wards (could be a configurable limit)
    // Example:
    // if (guardian.getCurrentWardsCount() >= MAX_WARDS) {
    //   return { isEligible: false, error: 'Guardian has reached the maximum number of wards.' };
    // }

    return { isEligible: true };
  }
}
