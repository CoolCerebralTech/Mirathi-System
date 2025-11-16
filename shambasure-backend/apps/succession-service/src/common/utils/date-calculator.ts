import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { legalRulesConfig } from '../config/legal-rules.config';

export interface TimeframeCalculation {
  startDate: Date;
  endDate: Date;
  daysCount: number;
  description?: string;
}

@Injectable()
export class DateCalculator {
  // --- IMPROVEMENT: Using Dependency Injection ---
  // The calculator now receives all legal rules and timeframes from our
  // centralized configuration, eliminating hardcoded "magic numbers".
  constructor(
    @Inject(legalRulesConfig.KEY)
    private readonly rules: ConfigType<typeof legalRulesConfig>,
  ) {}

  // =========================================================================
  //  GENERIC DATE CALCULATION METHODS
  // =========================================================================

  public calculateFutureDate(
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

    return { startDate, endDate: resultDate, daysCount: days };
  }

  public calculateMonthsDeadline(startDate: Date, months: number): Date {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    return endDate;
  }

  public daysBetween(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public hasDatePassed(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to the start of the day
    return date < today;
  }

  // =========================================================================
  //  KENYAN SUCCESSION SPECIFIC DEADLINES (Consuming from Config)
  // =========================================================================

  public probateApplicationDeadline(deceasedDate: Date): TimeframeCalculation {
    // --- REFACTORED: Consumes the deadline from the injected config ---
    const deadlineDays = this.rules.probateProcess.applicationDeadline;
    const endDate = this.calculateFutureDate(deceasedDate, deadlineDays).endDate;
    return {
      startDate: deceasedDate,
      endDate,
      daysCount: deadlineDays,
      description: `Probate application deadline (${deadlineDays} days from death)`,
    };
  }

  public probateObjectionPeriod(applicationDate: Date): TimeframeCalculation {
    // --- REFACTORED: Consumes the deadline from the injected config ---
    const deadlineDays = this.rules.probateProcess.objectionPeriod;
    const endDate = this.calculateFutureDate(applicationDate, deadlineDays).endDate;
    return {
      startDate: applicationDate,
      endDate,
      daysCount: deadlineDays,
      description: `Probate objection period (${deadlineDays} days from application gazette)`,
    };
  }

  public assetDistributionDeadline(grantDate: Date): TimeframeCalculation {
    // --- REFACTORED: Consumes the deadline from the injected config ---
    const deadlineDays = this.rules.assetDistribution.timelines.distributionCompletion;
    const endDate = this.calculateFutureDate(grantDate, deadlineDays).endDate;
    return {
      startDate: grantDate,
      endDate,
      daysCount: deadlineDays,
      description: `Asset distribution completion deadline (${deadlineDays} days from grant)`,
    };
  }

  public inventorySubmissionDeadline(grantDate: Date): TimeframeCalculation {
    // --- REFACTORED: Consumes the deadline from the injected config ---
    const deadlineDays = this.rules.assetDistribution.timelines.inventorySubmission;
    const endDate = this.calculateFutureDate(grantDate, deadlineDays).endDate;
    return {
      startDate: grantDate,
      endDate,
      daysCount: deadlineDays,
      description: `Inventory submission deadline (${deadlineDays} days from grant)`,
    };
  }

  public minorMajorityDate(dateOfBirth: Date): TimeframeCalculation {
    // --- REFACTORED: Consumes the age of majority from the injected config ---
    const ageOfMajority = this.rules.assetDistribution.minorProtection.ageOfMajority;
    const endDate = new Date(dateOfBirth);
    endDate.setFullYear(endDate.getFullYear() + ageOfMajority);

    return {
      startDate: dateOfBirth,
      endDate,
      daysCount: this.daysBetween(dateOfBirth, endDate),
      description: `Minor reaches age of majority (${ageOfMajority} years)`,
    };
  }
}
