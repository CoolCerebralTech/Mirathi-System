import { Injectable } from '@nestjs/common';
import { FamilyMember } from '../entities/family-member.entity';

@Injectable()
export class GuardianEligibilityPolicy {
  checkEligibility(
    guardian: FamilyMember,
    ward: FamilyMember,
  ): { isEligible: boolean; error?: string } {
    // 1. Age Requirement
    if (guardian.getIsMinor()) {
      return { isEligible: false, error: 'Guardian must be an adult (18+).' };
    }

    // 2. Self-Guardianship
    if (guardian.getId() === ward.getId()) {
      return { isEligible: false, error: 'Cannot be own guardian.' };
    }

    // 3. Vital Status
    if (guardian.getIsDeceased()) {
      return { isEligible: false, error: 'Guardian cannot be deceased.' };
    }

    // 4. Ward Status
    if (!ward.getIsMinor()) {
      // Warning rather than strict false, as guardianship for incapacitated adults exists
      // but usually handled via different legal instrument (Power of Attorney)
      // For this system:
      return {
        isEligible: false,
        error: 'Ward is not a minor. Guardianship applies to children under 18.',
      };
    }

    return { isEligible: true };
  }
}
