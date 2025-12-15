// domain/utils/dependency-validator.ts
import { MarriageEndReason, MarriageType } from '@prisma/client';

import { AgeCalculator } from './age-calculator';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[]; // Added warnings for non-blocking but risky issues
}

export interface ExistingMarriageInfo {
  type: MarriageType;
  startDate: Date;
  endDate?: Date; // If null, assumed active
  endReason: MarriageEndReason;
}

export class DependencyValidator {
  // ===========================================================================
  // STUDENT DEPENDANCY (S.29)
  // ===========================================================================

  /**
   * Validates a Student Dependency Claim.
   * Checks age limits (usually 25) and term dates.
   * @param dateOfBirth - Student's DOB
   * @param schoolStartDate - Enrollment start
   * @param schoolEndDate - Expected graduation
   * @param hasDisability - If true, age limits are ignored (S.29 protection)
   */
  static validateStudentClaim(
    dateOfBirth: Date,
    schoolStartDate?: Date,
    schoolEndDate?: Date,
    hasDisability: boolean = false,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Age Logic
    const age = AgeCalculator.getAgeInYears(dateOfBirth);
    const isMinor = age < AgeCalculator.AGE_OF_MAJORITY;

    if (!isMinor && !hasDisability) {
      if (age > AgeCalculator.DEPENDANCY_STUDENT_LIMIT) {
        errors.push(
          `Claimant is ${age} years old. Student dependency typically ceases at ${AgeCalculator.DEPENDANCY_STUDENT_LIMIT} unless disabled.`,
        );
      }
    }

    // 2. Term Date Logic
    if (schoolStartDate && schoolEndDate) {
      if (schoolEndDate < schoolStartDate) {
        errors.push('School end date cannot be before start date.');
      }

      const now = new Date();

      // If end date is in the past, they are no longer a student
      if (schoolEndDate < now) {
        errors.push(
          'School completion date is in the past. Status as "Student Dependant" has ceased.',
        );
      }

      // If start date is far in future
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(now.getMonth() + 3);
      if (schoolStartDate > threeMonthsFromNow) {
        warnings.push(
          'School start date is significantly in the future. Dependency may not start immediately.',
        );
      }
    } else if (!isMinor && !schoolEndDate) {
      warnings.push(
        'Adult student claim missing "Expected Completion Date". Court may reject without timeline.',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ===========================================================================
  // COHABITATION & "WIFE" CLAIMS (S.29(5))
  // ===========================================================================

  /**
   * Validates Cohabitation ("Living as wife") claims.
   * CRITICAL: Checks if an existing Monogamous marriage invalidates this claim.
   *
   * @param cohabitationStart - When living together began
   * @param cohabitationEnd - When it ended (or null if ongoing until death)
   * @param existingMarriages - Array of deceased's other marriages
   */
  static validateCohabitationClaim(
    cohabitationStart: Date,
    cohabitationEnd: Date | null,
    existingMarriages: ExistingMarriageInfo[],
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const cohabEnd = cohabitationEnd || new Date(); // Defaults to now/death

    // S.29(5) requires "Continuous" period. This is a factual check,
    // but here we check Legal Capacity.

    for (const marriage of existingMarriages) {
      const marriageEnd = marriage.endDate || new Date();

      // Check Overlap: (StartA < EndB) and (EndA > StartB)
      const hasOverlap = cohabitationStart < marriageEnd && cohabEnd > marriage.startDate;

      if (hasOverlap) {
        // 1. MONOGAMOUS BARRIER (Civil & Christian)
        // If deceased had a valid Civil/Christian marriage during cohabitation,
        // the cohabitation is NOT a marriage and arguably fails "Living as wife" test
        // because they lacked capacity to be wife.
        if (marriage.type === MarriageType.CIVIL || marriage.type === MarriageType.CHRISTIAN) {
          if (
            marriage.endReason === MarriageEndReason.STILL_ACTIVE ||
            marriage.endReason === MarriageEndReason.DEATH_OF_SPOUSE
          ) {
            errors.push(
              `Invalid Claim: Cohabitation overlaps with a strict Monogamous marriage (${marriage.type}). The deceased lacked capacity to take a second wife.`,
            );
          }
        }

        // 2. POLYGAMOUS CONTEXT
        // If existing marriage is Customary/Islamic, overlap is legally possible (as a 2nd house),
        // but S.29(5) usually applies to UNMARRIED women. If they were married under custom,
        // they are a Spouse (S.29(a)), not a Cohabitee (S.29(a)).
        if (marriage.type === MarriageType.CUSTOMARY || marriage.type === MarriageType.ISLAMIC) {
          warnings.push(
            `Note: Deceased had an existing polygamous marriage. If this cohabitation met customary rites, claimant should register as a Spouse (S.29(a)) rather than Cohabitee.`,
          );
        }
      }
    }

    // Duration Warning (Case law often looks for > 2-3 years)
    const durationYears = AgeCalculator.getAgeInYears(cohabitationStart, cohabEnd);
    if (durationYears < 2) {
      warnings.push(
        'Cohabitation duration is less than 2 years. Courts may hesitate to affirm "Living as wife" status.',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ===========================================================================
  // DISABILITY & EVIDENCE
  // ===========================================================================

  /**
   * Validates that disability claims (which override age limits) have evidence.
   */
  static validateDisabilityStatus(
    hasDisability: boolean,
    disabilityCertificateId?: string | null,
    medicalNotes?: string | null,
  ): ValidationResult {
    const errors: string[] = [];

    if (hasDisability) {
      if (!disabilityCertificateId && (!medicalNotes || medicalNotes.length < 10)) {
        errors.push(
          'Disability status asserted but no NCPWD Certificate ID or detailed medical notes provided.',
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }
}
