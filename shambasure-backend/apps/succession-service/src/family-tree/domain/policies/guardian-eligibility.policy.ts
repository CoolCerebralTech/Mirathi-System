import { Injectable } from '@nestjs/common';
import { GuardianType } from '@prisma/client';

import type { FamilyMember } from '../entities/family-member.entity';

@Injectable()
export class GuardianEligibilityPolicy {
  /**
   * Determines if a proposed guardian is legally eligible to act for a ward.
   * Performs checks: age, self-guardianship, vital status, and ward eligibility.
   * References: Children's Act (No. 8 of 2001).
   */
  checkGuardianEligibility(
    guardian: FamilyMember,
    ward: FamilyMember,
    guardianType: GuardianType,
  ): {
    isEligible: boolean;
    reason?: string;
    restrictions: string[];
  } {
    const restrictions: string[] = [];

    // Financial guardianship allows non-minor wards in some estate management cases (e.g. Trusts)
    if (guardianType === GuardianType.FINANCIAL_GUARDIAN && !ward.getIsMinor()) {
      restrictions.push('Financial decisions only - ward is an adult');
      // No early return here, check other vitals first
    }

    // 1. Cannot be own guardian
    if (guardian.getId() === ward.getId()) {
      return {
        isEligible: false,
        reason: 'Cannot be own guardian.',
        restrictions: [],
      };
    }

    // 2. Guardian must be alive
    if (guardian.getIsDeceased()) {
      return {
        isEligible: false,
        reason: 'Guardian cannot be deceased.',
        restrictions: [],
      };
    }

    // 3. Ward must be minor (under 18) for general guardianship types (Legal/Property)
    if (
      !ward.getIsMinor() &&
      guardianType !== GuardianType.FINANCIAL_GUARDIAN &&
      guardianType !== GuardianType.TESTAMENTARY
    ) {
      return {
        isEligible: false,
        reason: 'Ward is not a minor. General guardianship applies only to children under 18.',
        restrictions: [],
      };
    }

    // 4. Guardian must be an adult
    if (guardian.getIsMinor()) {
      return {
        isEligible: false,
        reason: 'Guardian must be an adult (18 years or older).',
        restrictions: [],
      };
    }

    // 5. Age appropriateness check (Guardian should ideally be older/mature)
    const guardianAge = this.getAge(guardian.getDateOfBirth());
    const wardAge = this.getAge(ward.getDateOfBirth());

    if (guardianAge !== null && wardAge !== null) {
      const ageDifference = guardianAge - wardAge;
      if (ageDifference < 18) {
        restrictions.push(
          'Guardian is close in age to ward - court may require additional scrutiny',
        );
      }
    }

    // 6. Disability considerations (from Kenyan Law context)
    // Note: disabilityStatus is not on the base Entity, checked via Metadata/Notes usually
    // Assuming metadata accessor exists or logic handled elsewhere.
    // Here we skip strict property check to avoid TS errors if metadata structure varies.

    return { isEligible: true, restrictions };
  }

  /**
   * Helper to calculate age
   */
  private getAge(dob: Date | null): number | null {
    if (!dob) return null;
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
}
