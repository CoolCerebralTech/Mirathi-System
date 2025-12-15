// domain/utils/age-calculator.ts

export interface AgeResult {
  years: number;
  months: number;
  days: number;
}

export class AgeCalculator {
  // Kenyan Legal Milestones
  static readonly AGE_OF_MAJORITY = 18; // Constitution Art 260
  static readonly AGE_OF_CONSENT_ADOPTION = 10; // Children Act (Child must consent)
  static readonly AGE_OF_CONSENT_SEXUAL = 16; // Sexual Offences Act
  static readonly RETIREMENT_AGE_PUBLIC = 60;
  static readonly ELDERLY_AGE = 65; // Social Protection Policy

  /**
   * Precise age calculation handling leap years.
   */
  static calculate(birthDate: Date, targetDate: Date = new Date()): AgeResult {
    let years = targetDate.getFullYear() - birthDate.getFullYear();
    let months = targetDate.getMonth() - birthDate.getMonth();
    let days = targetDate.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      // Get days in previous month
      const prevMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  }

  static isMinor(dateOfBirth: Date, referenceDate: Date = new Date()): boolean {
    const age = this.calculate(dateOfBirth, referenceDate);
    return age.years < this.AGE_OF_MAJORITY;
  }

  static isStudentAge(dateOfBirth: Date): boolean {
    const age = this.calculate(dateOfBirth);
    // Generally up to 24/25 for university completion in dependency cases
    return age.years >= this.AGE_OF_MAJORITY && age.years <= 25;
  }

  /**
   * Determines if a child is old enough to give consent for their own adoption.
   * Under Kenyan Children Act, a child > 10 years must consent.
   */
  static requiresAdoptionConsent(dateOfBirth: Date): boolean {
    const age = this.calculate(dateOfBirth);
    return age.years >= this.AGE_OF_CONSENT_ADOPTION;
  }

  /**
   * Calculates age at time of death.
   */
  static getAgeAtDeath(dateOfBirth: Date, dateOfDeath: Date): number {
    if (dateOfDeath < dateOfBirth) {
      throw new Error('Date of death cannot be before date of birth');
    }
    return this.calculate(dateOfBirth, dateOfDeath).years;
  }
}
