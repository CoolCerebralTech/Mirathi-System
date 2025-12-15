// domain/utils/age-calculator.ts

/**
 * Result object for precise age breakdown.
 */
export interface PreciseAge {
  years: number;
  months: number;
  days: number;
}

export class AgeCalculator {
  // ===========================================================================
  // KENYAN LEGAL MILESTONES
  // ===========================================================================

  /** Constitution of Kenya, Art 260: A person under 18 years. */
  static readonly AGE_OF_MAJORITY = 18;

  /** Children Act: A child of 10+ years must consent to their adoption. */
  static readonly AGE_OF_CONSENT_ADOPTION = 10;

  /** Marriage Act 2014: Minimum age for marriage is 18. */
  static readonly AGE_OF_MARRIAGE = 18;

  /** Common Law / S.29 Succession Act Interpretation: Dependency for students often extends to 25. */
  static readonly DEPENDANCY_STUDENT_LIMIT = 25;

  /** Social Protection Policies: Age for "Inua Jamii" and elderly support. */
  static readonly ELDERLY_AGE_THRESHOLD = 65; // 70 for some govt programs, but 65 generally

  // ===========================================================================
  // CORE CALCULATIONS
  // ===========================================================================

  /**
   * Calculates the precise age difference between two dates.
   * Handles leap years and month boundary crossovers accurately.
   */
  static calculate(birthDate: Date | null, referenceDate: Date = new Date()): PreciseAge {
    if (!birthDate) return { years: 0, months: 0, days: 0 };

    // Validation
    const start = new Date(birthDate);
    const end = new Date(referenceDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date provided to AgeCalculator');
    }

    if (end < start) {
      // If logic requires negative age (e.g. "5 years ago"), handle differently,
      // but for "Age", strictly throw or return 0.
      return { years: 0, months: 0, days: 0 };
    }

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    // Adjust for negative days (borrow from previous month)
    if (days < 0) {
      months--;
      // Get days in the previous month of the *reference* date
      const daysInPrevMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
      days += daysInPrevMonth;
    }

    // Adjust for negative months (borrow from year)
    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  }

  /**
   * Returns simple integer age in years.
   */
  static getAgeInYears(birthDate: Date, referenceDate: Date = new Date()): number {
    return this.calculate(birthDate, referenceDate).years;
  }

  // ===========================================================================
  // DOMAIN SPECIFIC CHECKS
  // ===========================================================================

  /**
   * Checks if person is a minor under Kenyan Constitution (Art 260).
   */
  static isMinor(birthDate: Date, referenceDate: Date = new Date()): boolean {
    return this.getAgeInYears(birthDate, referenceDate) < this.AGE_OF_MAJORITY;
  }

  /**
   * Checks if person is an adult.
   */
  static isAdult(birthDate: Date, referenceDate: Date = new Date()): boolean {
    return !this.isMinor(birthDate, referenceDate);
  }

  /**
   * Calculates the exact date a person turns 18 (Legal Majority).
   * Critical for: Trust releases, Guardian termination.
   */
  static getDateOfMajority(birthDate: Date): Date {
    const majorityDate = new Date(birthDate);
    majorityDate.setFullYear(majorityDate.getFullYear() + this.AGE_OF_MAJORITY);
    return majorityDate;
  }

  /**
   * Validates if a child is eligible for "Student" dependency status under S.29.
   * Typically: Age 18 <= x <= 25.
   */
  static isEligibleStudentDependant(birthDate: Date, referenceDate: Date = new Date()): boolean {
    const age = this.getAgeInYears(birthDate, referenceDate);
    return age >= this.AGE_OF_MAJORITY && age <= this.DEPENDANCY_STUDENT_LIMIT;
  }

  /**
   * Determines if a child is old enough to give consent for adoption (Children Act).
   */
  static requiresAdoptionConsent(birthDate: Date): boolean {
    return this.getAgeInYears(birthDate) >= this.AGE_OF_CONSENT_ADOPTION;
  }

  /**
   * Checks if person qualifies as Elderly (S.29 Parent support claims).
   */
  static isElderly(birthDate: Date): boolean {
    return this.getAgeInYears(birthDate) >= this.ELDERLY_AGE_THRESHOLD;
  }

  // ===========================================================================
  // SUCCESSION SPECIFIC
  // ===========================================================================

  /**
   * Calculates age at death.
   * Throws explicit error if dates are logically impossible (Fraud/Error detection).
   */
  static getAgeAtDeath(birthDate: Date, deathDate: Date): number {
    if (deathDate < birthDate) {
      throw new Error(
        `Invalid Dates: Date of death (${deathDate.toISOString().split('T')[0]}) cannot be before birth (${birthDate.toISOString().split('T')[0]})`,
      );
    }
    return this.getAgeInYears(birthDate, deathDate);
  }

  /**
   * Formats age into human readable string (e.g., "10 Years, 2 Months").
   * Useful for Court Filings / Affidavits.
   */
  static formatAge(birthDate: Date, referenceDate: Date = new Date()): string {
    const { years, months, days } = this.calculate(birthDate, referenceDate);

    if (years === 0 && months === 0) return `${days} Days`;
    if (years === 0) return `${months} Months, ${days} Days`;
    return `${years} Years, ${months} Months`;
  }
}
