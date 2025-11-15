import { Injectable } from '@nestjs/common';

export interface TimeframeCalculation {
  startDate: Date;
  endDate: Date;
  daysCount: number;
  description?: string;
}

@Injectable()
export class DateCalculator {
  /**
   * General future date calculator
   * @param startDate
   * @param days
   * @param includeWeekends
   */
  calculateFutureDate(
    startDate: Date,
    days: number,
    includeWeekends: boolean = true,
  ): TimeframeCalculation {
    const resultDate = new Date(startDate);
    let daysAdded = 0;

    while (daysAdded < days) {
      resultDate.setDate(resultDate.getDate() + 1);

      if (!includeWeekends) {
        const day = resultDate.getDay();
        if (day === 0 || day === 6) continue; // Skip Sundays and Saturdays
      }

      daysAdded++;
    }

    return {
      startDate,
      endDate: resultDate,
      daysCount: days,
    };
  }

  /**
   * Month-based deadline (e.g., 6 months from death)
   */
  calculateMonthsDeadline(
    startDate: Date,
    months: number,
    description?: string,
  ): TimeframeCalculation {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    const daysCount = this.daysBetween(startDate, endDate);

    return {
      startDate,
      endDate,
      daysCount,
      description: description || `${months} months legal deadline`,
    };
  }

  /**
   * Days between two dates
   */
  daysBetween(startDate: Date, endDate: Date): number {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Has a date passed relative to today
   */
  hasDatePassed(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  /**
   * Extend a deadline by given days
   */
  extendDeadline(
    originalDeadline: Date,
    extensionDays: number,
    includeWeekends: boolean = true,
  ): Date {
    return this.calculateFutureDate(originalDeadline, extensionDays, includeWeekends).endDate;
  }

  /**
   * === Kenyan Probate & Succession Specific Deadlines ===
   */

  // 6 months from date of death for filing probate (Law of Succession Act Sec 51)
  probateApplicationDeadline(deceasedDate: Date): TimeframeCalculation {
    return this.calculateMonthsDeadline(
      deceasedDate,
      6,
      'Probate application deadline (6 months from death)',
    );
  }

  // 30 days objection period after probate application (Sec 55)
  probateObjectionPeriod(applicationDate: Date): TimeframeCalculation {
    return this.calculateFutureDate(applicationDate, 30, true); // Calendar days
  }

  // Executor to file accounts: 1 year from grant
  executorAccountsDeadline(grantDate: Date): TimeframeCalculation {
    return this.calculateMonthsDeadline(
      grantDate,
      12,
      'Executor filing accounts deadline (1 year from grant)',
    );
  }

  // Executor to close estate: 2 years from grant
  executorEstateClosureDeadline(grantDate: Date): TimeframeCalculation {
    return this.calculateMonthsDeadline(
      grantDate,
      24,
      'Executor estate closure deadline (2 years from grant)',
    );
  }

  // Minor reaches majority (18 years) – relevant for trust distribution
  minorMajorityDate(dateOfBirth: Date): TimeframeCalculation {
    const endDate = new Date(dateOfBirth);
    endDate.setFullYear(endDate.getFullYear() + 18);
    const daysCount = this.daysBetween(dateOfBirth, endDate);

    return {
      startDate: dateOfBirth,
      endDate,
      daysCount,
      description: 'Minor reaches age of majority (18 years)',
    };
  }

  // Time to notify heirs after grant: 30 days
  heirsNotificationDeadline(grantDate: Date): TimeframeCalculation {
    return this.calculateFutureDate(grantDate, 30, true);
  }

  // Time to submit inventory of estate: 90 days from grant
  inventorySubmissionDeadline(grantDate: Date): TimeframeCalculation {
    return this.calculateFutureDate(grantDate, 90, true);
  }

  // Time to distribute assets: 1 year from grant
  assetDistributionDeadline(grantDate: Date): TimeframeCalculation {
    return this.calculateMonthsDeadline(
      grantDate,
      12,
      'Asset distribution completion deadline (1 year from grant)',
    );
  }

  // Conditional bequest max duration: 25 years
  conditionalBequestExpiry(startDate: Date): TimeframeCalculation {
    return this.calculateYearsDeadline(startDate, 25, 'Conditional bequest expiry (max 25 years)');
  }

  /**
   * Year-based deadline
   */
  calculateYearsDeadline(
    startDate: Date,
    years: number,
    description?: string,
  ): TimeframeCalculation {
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + years);

    const daysCount = this.daysBetween(startDate, endDate);

    return {
      startDate,
      endDate,
      daysCount,
      description: description || `${years} years legal deadline`,
    };
  }
}
