// domain/utils/dependency-validator.ts
import { AgeCalculator } from './age-calculator';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class DependencyValidator {
  /**
   * Validates the integrity of a Student Dependency Claim.
   * Ensures dates align and age is reasonable.
   */
  static validateStudentClaim(
    dateOfBirth: Date,
    schoolStartDate?: Date,
    schoolEndDate?: Date,
  ): ValidationResult {
    const errors: string[] = [];
    const age = AgeCalculator.calculate(dateOfBirth);

    // 1. Age sanity check
    if (age.years > 30) {
      errors.push(
        'Claimant is likely too old (>30) for standard student dependency claim without special circumstances.',
      );
    }

    // 2. Date logic
    if (schoolStartDate && schoolEndDate) {
      if (schoolEndDate < schoolStartDate) {
        errors.push('School end date cannot be before start date.');
      }

      const now = new Date();
      if (schoolEndDate < now) {
        errors.push(
          'School completion date is in the past. Student dependency has theoretically ceased.',
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates overlap in Cohabitation claims.
   * Prevents claiming "Living as wife" during a period where another marriage existed.
   */
  static validateCohabitationDates(
    cohabitationStart: Date,
    cohabitationEnd: Date | undefined,
    existingMarriageStart: Date,
    existingMarriageEnd: Date | undefined,
  ): ValidationResult {
    const errors: string[] = [];
    const cohabEnd = cohabitationEnd || new Date();
    const marrEnd = existingMarriageEnd || new Date();

    // Check overlap
    const overlap = cohabitationStart < marrEnd && cohabEnd > existingMarriageStart;

    if (overlap) {
      errors.push(
        'Cohabitation period overlaps with an existing registered marriage. This may invalidate S.29(5) claim.',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
