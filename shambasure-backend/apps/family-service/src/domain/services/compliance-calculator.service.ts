// src/domain/services/compliance-calculator.service.ts
import { Injectable } from '@nestjs/common';

import { GuardianshipAggregate } from '../aggregates/guardianship.aggregate';
import { ComplianceCheckEntity } from '../entities/compliance-check.entity';
import { ComplianceScheduleVO } from '../value-objects/compliance-schedule.vo';

export interface ComplianceDeadline {
  type: 'ANNUAL_REPORT' | 'BOND_RENEWAL' | 'COURT_REVIEW' | 'SPECIAL_REPORT';
  dueDate: Date;
  deadlineDate: Date;
  gracePeriodEnd: Date;
  isOverdue: boolean;
  daysUntilDue: number;
  daysOverdue: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  legalReference: string;
  consequences: string[];
}

export interface ComplianceScore {
  overallScore: number; // 0-100
  categoryScores: {
    timeliness: number;
    completeness: number;
    accuracy: number;
    documentation: number;
  };
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  comparedToAverage: number; // Difference from system average
  recommendations: string[];
}

export interface ComplianceCalendar {
  month: string;
  year: number;
  deadlines: ComplianceDeadline[];
  tasks: Array<{
    type: string;
    description: string;
    dueDate: Date;
    status: 'UPCOMING' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETED';
    assignedTo: string;
  }>;
  reminders: Array<{
    type: 'EMAIL' | 'SMS' | 'PUSH';
    date: Date;
    message: string;
  }>;
}

@Injectable()
export class ComplianceCalculatorService {
  private readonly COMPLIANCE_RULES = {
    ANNUAL_REPORT_DEADLINE: 365, // Days
    BOND_RENEWAL_DEADLINE: 365,
    COURT_REVIEW_INTERVAL: 730, // Every 2 years for minors
    GRACE_PERIOD: 60, // Days after deadline
    PENALTY_START: 30, // Days after grace period
    MAX_PENALTY: 20000, // KES
  };

  /**
   * 🎯 INNOVATIVE: Calculate all compliance deadlines for a guardianship
   */
  public calculateComplianceDeadlines(guardianship: GuardianshipAggregate): ComplianceDeadline[] {
    const deadlines: ComplianceDeadline[] = [];

    // 1. Annual Report Deadline (S.73 LSA)
    const annualReportDeadline = this.calculateAnnualReportDeadline(guardianship);
    if (annualReportDeadline) {
      deadlines.push(annualReportDeadline);
    }

    // 2. Bond Renewal Deadline (S.72 LSA)
    const bondRenewalDeadline = this.calculateBondRenewalDeadline(guardianship);
    if (bondRenewalDeadline) {
      deadlines.push(bondRenewalDeadline);
    }

    // 3. Court Review Deadline
    const courtReviewDeadline = this.calculateCourtReviewDeadline(guardianship);
    if (courtReviewDeadline) {
      deadlines.push(courtReviewDeadline);
    }

    // 4. Special Deadlines based on circumstances
    const specialDeadlines = this.calculateSpecialDeadlines(guardianship);
    deadlines.push(...specialDeadlines);

    // Sort by priority and due date
    return deadlines.sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }

  /**
   * 🎯 INNOVATIVE: Calculate compliance score based on history
   */
  public calculateComplianceScore(
    guardianship: GuardianshipAggregate,
    allGuardianships: GuardianshipAggregate[] = [],
  ): ComplianceScore {
    const complianceChecks = guardianship.props.complianceChecks;

    if (complianceChecks.length === 0) {
      return this.getDefaultScore();
    }

    // Calculate category scores
    const timelinessScore = this.calculateTimelinessScore(complianceChecks);
    const completenessScore = this.calculateCompletenessScore(complianceChecks);
    const accuracyScore = this.calculateAccuracyScore(complianceChecks);
    const documentationScore = this.calculateDocumentationScore(complianceChecks);

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      timelinessScore * 0.3 +
        completenessScore * 0.3 +
        accuracyScore * 0.25 +
        documentationScore * 0.15,
    );

    // Determine trend
    const trend = this.calculateTrend(complianceChecks);

    // Compare to system average
    const systemAverage = this.calculateSystemAverage(allGuardianships);
    const comparedToAverage = overallScore - systemAverage;

    return {
      overallScore,
      categoryScores: {
        timeliness: timelinessScore,
        completeness: completenessScore,
        accuracy: accuracyScore,
        documentation: documentationScore,
      },
      trend,
      comparedToAverage,
      recommendations: this.generateRecommendations(
        overallScore,
        timelinessScore,
        completenessScore,
        accuracyScore,
        documentationScore,
      ),
    };
  }

  /**
   * 🎯 INNOVATIVE: Generate compliance calendar for a period
   */
  public generateComplianceCalendar(
    guardianship: GuardianshipAggregate,
    year: number,
    month?: number,
  ): ComplianceCalendar {
    const deadlines = this.calculateComplianceDeadlines(guardianship);

    // Filter deadlines for the specified period
    const periodDeadlines = deadlines.filter((deadline) => {
      const deadlineDate = deadline.dueDate;
      if (month !== undefined) {
        return deadlineDate.getFullYear() === year && deadlineDate.getMonth() + 1 === month;
      }
      return deadlineDate.getFullYear() === year;
    });

    // Generate tasks based on deadlines
    const tasks = this.generateTasksFromDeadlines(periodDeadlines, guardianship);

    // Generate reminders
    const reminders = this.generateReminders(periodDeadlines, guardianship);

    return {
      month: month
        ? new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })
        : 'Annual',
      year,
      deadlines: periodDeadlines,
      tasks,
      reminders,
    };
  }

  /**
   * 🎯 INNOVATIVE: Calculate penalties for non-compliance
   */
  public calculatePenalties(guardianship: GuardianshipAggregate): {
    totalPenalty: number;
    breakdown: Array<{
      type: string;
      amount: number;
      reason: string;
      daysOverdue: number;
      canBeWaived: boolean;
      waiverConditions: string[];
    }>;
    paymentDeadline: Date;
    paymentOptions: Array<{
      method: string;
      minimumAmount: number;
      deadline: Date;
    }>;
  } {
    const deadlines = this.calculateComplianceDeadlines(guardianship);
    const overdueDeadlines = deadlines.filter((d) => d.isOverdue);

    let totalPenalty = 0;
    const breakdown: any[] = [];

    overdueDeadlines.forEach((deadline) => {
      const penalty = this.calculateSinglePenalty(deadline);
      totalPenalty += penalty.amount;

      breakdown.push({
        type: deadline.type,
        amount: penalty.amount,
        reason: `Overdue ${deadline.type} by ${deadline.daysOverdue} days`,
        daysOverdue: deadline.daysOverdue,
        canBeWaived: penalty.canBeWaived,
        waiverConditions: penalty.waiverConditions,
      });
    });

    // Calculate payment deadline (30 days from calculation)
    const paymentDeadline = new Date();
    paymentDeadline.setDate(paymentDeadline.getDate() + 30);

    return {
      totalPenalty,
      breakdown,
      paymentDeadline,
      paymentOptions: this.generatePaymentOptions(totalPenalty, paymentDeadline),
    };
  }

  /**
   * 🎯 INNOVATIVE: Calculate optimal compliance schedule
   */
  public calculateOptimalSchedule(
    guardianship: GuardianshipAggregate,
    preferences: {
      preferredMonth?: number;
      reminderDays?: number[];
      notificationChannel?: 'EMAIL' | 'SMS' | 'BOTH';
    },
  ): ComplianceScheduleVO {
    // Analyze existing patterns
    const patterns = this.analyzeCompliancePatterns(guardianship);

    // Determine best frequency based on guardianship type
    const frequency = this.determineOptimalFrequency(guardianship);

    // Determine best reminder schedule
    const reminderDays = preferences.reminderDays || this.calculateOptimalReminderDays(patterns);

    // Calculate start date (next quarter if new, or maintain existing)
    const startDate = this.calculateOptimalStartDate(guardianship, preferences);

    return ComplianceScheduleVO.create({
      frequency,
      startDate,
      customMonths: preferences.preferredMonth ? [preferences.preferredMonth] : undefined,
      courtMandated: guardianship.props.courtOrder !== undefined,
      reminderDaysBefore: reminderDays,
      preferredNotificationChannel: preferences.notificationChannel || 'EMAIL',
      autoGenerateReport: true,
    });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private calculateAnnualReportDeadline(
    guardianship: GuardianshipAggregate,
  ): ComplianceDeadline | null {
    if (!guardianship.props.complianceSchedule) {
      return null;
    }

    const lastCheck = this.getLastComplianceCheck(guardianship);
    const nextDue = guardianship.props.complianceSchedule.getNextDueDate(
      lastCheck?.props.submissionDate,
    );

    const deadlineDate = new Date(nextDue);
    deadlineDate.setDate(deadlineDate.getDate() + 30); // 30-day submission window

    const gracePeriodEnd = new Date(deadlineDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + this.COMPLIANCE_RULES.GRACE_PERIOD);

    const today = new Date();
    const daysUntilDue = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const daysOverdue =
      today > gracePeriodEnd
        ? Math.ceil((today.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const isOverdue = today > gracePeriodEnd;

    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (daysUntilDue <= 30) priority = 'MEDIUM';
    if (daysUntilDue <= 7) priority = 'HIGH';
    if (isOverdue) priority = 'CRITICAL';

    return {
      type: 'ANNUAL_REPORT',
      dueDate: nextDue,
      deadlineDate,
      gracePeriodEnd,
      isOverdue,
      daysUntilDue: Math.max(0, daysUntilDue),
      daysOverdue,
      priority,
      legalReference: 'Section 73, Law of Succession Act',
      consequences: [
        'Court fine up to KES 20,000',
        'Possible removal as guardian',
        'Suspension of guardianship powers',
      ],
    };
  }

  private calculateBondRenewalDeadline(
    guardianship: GuardianshipAggregate,
  ): ComplianceDeadline | null {
    if (!guardianship.props.requiresPropertyManagement) {
      return null;
    }

    // Find bond expiration date
    const bondExpiry = this.getBondExpiryDate(guardianship);
    if (!bondExpiry) {
      return null;
    }

    const renewalDeadline = new Date(bondExpiry);
    renewalDeadline.setDate(renewalDeadline.getDate() - 30); // Renew 30 days before expiry

    const gracePeriodEnd = new Date(bondExpiry);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + this.COMPLIANCE_RULES.GRACE_PERIOD);

    const today = new Date();
    const daysUntilDue = Math.ceil(
      (renewalDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysOverdue =
      today > gracePeriodEnd
        ? Math.ceil((today.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const isOverdue = today > gracePeriodEnd;

    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (daysUntilDue <= 60) priority = 'MEDIUM';
    if (daysUntilDue <= 30) priority = 'HIGH';
    if (isOverdue) priority = 'CRITICAL';

    return {
      type: 'BOND_RENEWAL',
      dueDate: renewalDeadline,
      deadlineDate: bondExpiry,
      gracePeriodEnd,
      isOverdue,
      daysUntilDue: Math.max(0, daysUntilDue),
      daysOverdue,
      priority,
      legalReference: 'Section 72, Law of Succession Act',
      consequences: [
        "Cannot access ward's property",
        'Court may appoint temporary manager',
        'Personal liability for losses',
      ],
    };
  }

  private calculateCourtReviewDeadline(
    guardianship: GuardianshipAggregate,
  ): ComplianceDeadline | null {
    // Court reviews are typically every 2 years for minors
    if (!guardianship.props.period.isWardMinor()) {
      return null;
    }

    const lastReview =
      guardianship.props.courtOrder?.getValue().orderDate || guardianship.props.establishedDate;

    const nextReview = new Date(lastReview);
    nextReview.setFullYear(nextReview.getFullYear() + 2);

    const deadlineDate = new Date(nextReview);
    const gracePeriodEnd = new Date(deadlineDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 90); // Longer grace for court reviews

    const today = new Date();
    const daysUntilDue = Math.ceil(
      (nextReview.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysOverdue =
      today > gracePeriodEnd
        ? Math.ceil((today.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const isOverdue = today > gracePeriodEnd;

    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (daysUntilDue <= 180) priority = 'MEDIUM';
    if (daysUntilDue <= 90) priority = 'HIGH';
    if (isOverdue) priority = 'CRITICAL';

    return {
      type: 'COURT_REVIEW',
      dueDate: nextReview,
      deadlineDate,
      gracePeriodEnd,
      isOverdue,
      daysUntilDue: Math.max(0, daysUntilDue),
      daysOverdue,
      priority,
      legalReference: 'Children Act, Section 24',
      consequences: [
        'Court may modify guardianship terms',
        'Possible change of guardian',
        'Increased court supervision',
      ],
    };
  }

  private calculateSpecialDeadlines(guardianship: GuardianshipAggregate): ComplianceDeadline[] {
    const specialDeadlines: ComplianceDeadline[] = [];

    // Ward's 18th birthday (termination)
    if (guardianship.props.period.isWardMinor()) {
      const majorityDate = guardianship.props.period.getAgeOfMajorityDate();
      const preparationDeadline = new Date(majorityDate);
      preparationDeadline.setMonth(preparationDeadline.getMonth() - 3); // 3 months before

      specialDeadlines.push({
        type: 'SPECIAL_REPORT',
        dueDate: preparationDeadline,
        deadlineDate: majorityDate,
        gracePeriodEnd: new Date(majorityDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days grace
        isOverdue: false,
        daysUntilDue: Math.ceil(
          (preparationDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
        daysOverdue: 0,
        priority: 'MEDIUM',
        legalReference: 'Law of Succession Act',
        consequences: ['Automatic termination of guardianship'],
      });
    }

    // Bond anniversary if bond posted
    if (guardianship.props.bondStatus === 'POSTED') {
      // This would be calculated from bond posting date
    }

    return specialDeadlines;
  }

  private getLastComplianceCheck(
    guardianship: GuardianshipAggregate,
  ): ComplianceCheckEntity | undefined {
    const checks = guardianship.props.complianceChecks;
    if (checks.length === 0) return undefined;

    return checks.slice().sort((a, b) => b.props.dueDate.getTime() - a.props.dueDate.getTime())[0];
  }

  private getBondExpiryDate(guardianship: GuardianshipAggregate): Date | null {
    // This would extract from bond value object
    // For now, return a dummy date
    const bondPostedDate = guardianship.props.establishedDate;
    const expiry = new Date(bondPostedDate);
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry;
  }

  private calculateTimelinessScore(checks: ComplianceCheckEntity[]): number {
    if (checks.length === 0) return 100; // No checks = perfect score

    const submittedChecks = checks.filter((c) => c.props.submissionDate);
    if (submittedChecks.length === 0) return 0;

    let totalScore = 0;

    submittedChecks.forEach((check) => {
      const dueDate = check.props.dueDate;
      const submissionDate = check.props.submissionDate!;
      const daysLate = Math.max(
        0,
        Math.ceil((submissionDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)),
      );

      // Score based on lateness: 100 for on time, decreasing with lateness
      let score = 100;
      if (daysLate > 0) {
        score = Math.max(0, 100 - daysLate * 2); // 2 points per day late
      }

      totalScore += score;
    });

    return Math.round(totalScore / submittedChecks.length);
  }

  private calculateCompletenessScore(checks: ComplianceCheckEntity[]): number {
    if (checks.length === 0) return 100;

    const submittedChecks = checks.filter((c) => c.props.submissionDate);
    if (submittedChecks.length === 0) return 0;

    let totalScore = 0;

    submittedChecks.forEach((check) => {
      const sections = check.props.sections || [];
      const requiredSections = sections.filter((s) => s.isRequired);
      const completedSections = requiredSections.filter((s) => s.isComplete);

      const completeness =
        requiredSections.length > 0
          ? (completedSections.length / requiredSections.length) * 100
          : 100;

      totalScore += completeness;
    });

    return Math.round(totalScore / submittedChecks.length);
  }

  private calculateAccuracyScore(checks: ComplianceCheckEntity[]): number {
    if (checks.length === 0) return 100;

    const submittedChecks = checks.filter((c) => c.props.submissionDate);
    if (submittedChecks.length === 0) return 0;

    let totalScore = 0;

    submittedChecks.forEach((check) => {
      // Use quality score from check, or calculate based on validation errors
      const qualityScore = check.props.qualityScore || 100;
      const validationErrors = check.props.validationErrors || [];

      let score = qualityScore;
      if (validationErrors.length > 0) {
        // Deduct for validation errors
        const errorPenalty = Math.min(50, validationErrors.length * 5);
        score = Math.max(0, score - errorPenalty);
      }

      totalScore += score;
    });

    return Math.round(totalScore / submittedChecks.length);
  }

  private calculateDocumentationScore(checks: ComplianceCheckEntity[]): number {
    if (checks.length === 0) return 100;

    const submittedChecks = checks.filter((c) => c.props.submissionDate);
    if (submittedChecks.length === 0) return 0;

    let totalScore = 0;

    submittedChecks.forEach((check) => {
      const attachments = check.props.attachments || [];
      const requiredDocs = ['FINANCIAL_STATEMENT', 'WARD_PHOTO', 'SCHOOL_REPORT'];
      const providedDocs = attachments.map((a) => a.type);

      const docScore =
        requiredDocs.length > 0
          ? (requiredDocs.filter((doc) => providedDocs.includes(doc)).length /
              requiredDocs.length) *
            100
          : 100;

      totalScore += docScore;
    });

    return Math.round(totalScore / submittedChecks.length);
  }

  private calculateTrend(checks: ComplianceCheckEntity[]): 'IMPROVING' | 'DECLINING' | 'STABLE' {
    if (checks.length < 2) return 'STABLE';

    const recentChecks = checks
      .filter((c) => c.props.submissionDate)
      .sort((a, b) => a.props.submissionDate!.getTime() - b.props.submissionDate!.getTime())
      .slice(-3); // Last 3 checks

    if (recentChecks.length < 2) return 'STABLE';

    const scores = recentChecks.map((check) => check.props.qualityScore || 0);
    const firstScore = scores[0];
    const lastScore = scores[scores.length - 1];
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    const threshold = 5; // 5-point change is significant

    if (lastScore > firstScore + threshold) return 'IMPROVING';
    if (lastScore < firstScore - threshold) return 'DECLINING';
    if (Math.abs(lastScore - averageScore) <= threshold) return 'STABLE';

    return lastScore > averageScore ? 'IMPROVING' : 'DECLINING';
  }

  private calculateSystemAverage(allGuardianships: GuardianshipAggregate[]): number {
    if (allGuardianships.length === 0) return 75; // Default average

    let totalScore = 0;
    let count = 0;

    allGuardianships.forEach((guardianship) => {
      const checks = guardianship.props.complianceChecks;
      const submittedChecks = checks.filter((c) => c.props.submissionDate);

      if (submittedChecks.length > 0) {
        const avgCheckScore =
          submittedChecks.reduce((sum, check) => sum + (check.props.qualityScore || 0), 0) /
          submittedChecks.length;

        totalScore += avgCheckScore;
        count++;
      }
    });

    return count > 0 ? Math.round(totalScore / count) : 75;
  }

  private generateRecommendations(
    overallScore: number,
    timelinessScore: number,
    completenessScore: number,
    accuracyScore: number,
    documentationScore: number,
  ): string[] {
    const recommendations: string[] = [];

    if (overallScore < 80) {
      recommendations.push('Improve overall compliance to avoid penalties');
    }

    if (timelinessScore < 70) {
      recommendations.push('Submit reports earlier to avoid late penalties');
      recommendations.push('Set up automatic reminders for deadlines');
    }

    if (completenessScore < 80) {
      recommendations.push('Ensure all required sections are completed');
      recommendations.push('Use the report checklist before submission');
    }

    if (accuracyScore < 85) {
      recommendations.push('Double-check financial figures for accuracy');
      recommendations.push('Have another guardian review reports before submission');
    }

    if (documentationScore < 90) {
      recommendations.push('Attach all required supporting documents');
      recommendations.push('Keep digital copies of important documents');
    }

    if (overallScore >= 90) {
      recommendations.push('Maintain excellent compliance record');
      recommendations.push('Consider mentoring other guardians');
    }

    return recommendations;
  }

  private generateTasksFromDeadlines(
    deadlines: ComplianceDeadline[],
    guardianship: GuardianshipAggregate,
  ): Array<any> {
    const tasks: any[] = [];
    const primaryGuardian = guardianship.props.guardianAssignments.find((ga) => ga.isPrimary);

    deadlines.forEach((deadline) => {
      const baseTask = {
        type: deadline.type,
        description: this.getTaskDescription(deadline.type),
        dueDate: deadline.dueDate,
        status: deadline.isOverdue
          ? 'OVERDUE'
          : deadline.daysUntilDue <= 7
            ? 'DUE_SOON'
            : 'UPCOMING',
        assignedTo: primaryGuardian?.props.guardianName || 'Guardian',
      };

      tasks.push(baseTask);

      // Add preparation tasks for upcoming deadlines
      if (!deadline.isOverdue && deadline.daysUntilDue > 0) {
        const prepTask = {
          type: 'PREPARATION',
          description: `Gather documents for ${deadline.type}`,
          dueDate: new Date(deadline.dueDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before
          status: 'UPCOMING',
          assignedTo: primaryGuardian?.props.guardianName || 'Guardian',
        };
        tasks.push(prepTask);
      }
    });

    return tasks;
  }

  private generateReminders(
    deadlines: ComplianceDeadline[],
    guardianship: GuardianshipAggregate,
  ): Array<any> {
    const reminders: any[] = [];
    const guardianContact = guardianship.props.guardianAssignments.find((ga) => ga.isPrimary)?.props
      .contactInfo;

    deadlines.forEach((deadline) => {
      if (!deadline.isOverdue) {
        // Reminder 30 days before
        if (deadline.daysUntilDue > 30) {
          reminders.push({
            type: 'EMAIL',
            date: new Date(deadline.dueDate.getTime() - 30 * 24 * 60 * 60 * 1000),
            message: `Upcoming ${deadline.type} due in 30 days`,
          });
        }

        // Reminder 7 days before
        if (deadline.daysUntilDue > 7) {
          reminders.push({
            type: 'SMS',
            date: new Date(deadline.dueDate.getTime() - 7 * 24 * 60 * 60 * 1000),
            message: `Reminder: ${deadline.type} due in 7 days`,
          });
        }

        // Final reminder 1 day before
        if (deadline.daysUntilDue > 1) {
          reminders.push({
            type: 'PUSH',
            date: new Date(deadline.dueDate.getTime() - 24 * 60 * 60 * 1000),
            message: `Final reminder: ${deadline.type} due tomorrow`,
          });
        }
      } else {
        // Overdue reminders
        reminders.push({
          type: 'EMAIL',
          date: new Date(),
          message: `URGENT: ${deadline.type} is ${deadline.daysOverdue} days overdue`,
        });
      }
    });

    return reminders;
  }

  private calculateSinglePenalty(deadline: ComplianceDeadline): {
    amount: number;
    canBeWaived: boolean;
    waiverConditions: string[];
  } {
    const basePenalty = 5000; // KES
    const dailyPenalty = 500; // KES per day after grace period
    const maxPenalty = this.COMPLIANCE_RULES.MAX_PENALTY;

    let amount = basePenalty;
    if (deadline.daysOverdue > 0) {
      amount += Math.min(maxPenalty - basePenalty, deadline.daysOverdue * dailyPenalty);
    }

    const canBeWaived = deadline.daysOverdue < 30; // Can waive if less than 30 days overdue
    const waiverConditions = canBeWaived
      ? [
          'First-time offense',
          'Valid reason for delay (e.g., illness, emergency)',
          'Payment plan agreement',
          'No previous penalties in last 12 months',
        ]
      : [];

    return { amount, canBeWaived, waiverConditions };
  }

  private generatePaymentOptions(totalPenalty: number, deadline: Date): Array<any> {
    const options = [
      {
        method: 'MPESA',
        minimumAmount: Math.min(50000, totalPenalty),
        deadline,
      },
      {
        method: 'BANK_TRANSFER',
        minimumAmount: totalPenalty,
        deadline,
      },
      {
        method: 'CASH_COURT',
        minimumAmount: totalPenalty,
        deadline: new Date(deadline.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days extension
      },
    ];

    // Add installment plan if penalty is large
    if (totalPenalty > 10000) {
      options.push({
        method: 'INSTALLMENTS',
        minimumAmount: Math.ceil(totalPenalty / 3),
        deadline: new Date(deadline.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days
      });
    }

    return options;
  }

  private getDefaultScore(): ComplianceScore {
    return {
      overallScore: 100,
      categoryScores: {
        timeliness: 100,
        completeness: 100,
        accuracy: 100,
        documentation: 100,
      },
      trend: 'STABLE',
      comparedToAverage: 25, // Above average for new guardianships
      recommendations: [
        'Maintain perfect compliance record',
        'Set up automatic reminders',
        'Keep all documents organized',
      ],
    };
  }

  private getTaskDescription(taskType: string): string {
    const descriptions: Record<string, string> = {
      ANNUAL_REPORT: 'Submit annual guardianship report to court',
      BOND_RENEWAL: 'Renew guardianship bond with insurance company',
      COURT_REVIEW: 'Prepare for court review hearing',
      SPECIAL_REPORT: 'Prepare final report for ward turning 18',
    };

    return descriptions[taskType] || 'Complete compliance task';
  }

  private analyzeCompliancePatterns(guardianship: GuardianshipAggregate): any {
    const checks = guardianship.props.complianceChecks;
    const submittedChecks = checks.filter((c) => c.props.submissionDate);

    if (submittedChecks.length === 0) {
      return {
        averageSubmissionDelay: 0,
        preferredSubmissionDay: 'NONE',
        commonMissingDocuments: [],
        accuracyTrend: 'STABLE',
      };
    }

    // Analyze submission patterns
    const delays = submittedChecks.map((check) => {
      const dueDate = check.props.dueDate;
      const submissionDate = check.props.submissionDate!;
      return Math.ceil((submissionDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    });

    const averageDelay = delays.reduce((sum, delay) => sum + delay, 0) / delays.length;

    // Find preferred day of week
    const submissionDays = submittedChecks.map((check) => check.props.submissionDate!.getDay());
    const dayCounts: Record<number, number> = {};
    submissionDays.forEach((day) => {
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    const preferredDay = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'NONE';

    // Analyze missing documents
    const missingDocs: Record<string, number> = {};
    submittedChecks.forEach((check) => {
      const attachments = check.props.attachments || [];
      const providedTypes = attachments.map((a) => a.type);
      const requiredTypes = ['FINANCIAL_STATEMENT', 'WARD_PHOTO', 'SCHOOL_REPORT'];

      requiredTypes.forEach((type) => {
        if (!providedTypes.includes(type)) {
          missingDocs[type] = (missingDocs[type] || 0) + 1;
        }
      });
    });

    const commonMissingDocuments = Object.entries(missingDocs)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([doc]) => doc);

    return {
      averageSubmissionDelay: Math.round(averageDelay),
      preferredSubmissionDay: this.getDayName(parseInt(preferredDay)),
      commonMissingDocuments,
      accuracyTrend: this.calculateTrend(submittedChecks),
    };
  }

  private determineOptimalFrequency(guardianship: GuardianshipAggregate): any {
    // Determine frequency based on guardianship characteristics
    if (guardianship.props.requiresPropertyManagement) {
      return 'QUARTERLY';
    }

    if (guardianship.props.riskLevel === 'HIGH' || guardianship.props.riskLevel === 'CRITICAL') {
      return 'BIANNUAL';
    }

    if (guardianship.props.period.isWardMinor() && guardianship.props.wardAge < 5) {
      return 'ANNUAL'; // Young children need annual reports
    }

    return 'ANNUAL'; // Default
  }

  private calculateOptimalReminderDays(patterns: any): number[] {
    const baseReminders = [30, 14, 7, 3, 1];

    // Adjust based on submission patterns
    if (patterns.averageSubmissionDelay > 10) {
      // If typically late, add earlier reminders
      return [60, 45, 30, 14, 7, 3, 1];
    }

    if (patterns.averageSubmissionDelay < 0) {
      // If typically early, fewer reminders
      return [14, 7, 3, 1];
    }

    return baseReminders;
  }

  private calculateOptimalStartDate(guardianship: GuardianshipAggregate, preferences: any): Date {
    // If there's a preferred month, start in that month next year
    if (preferences.preferredMonth) {
      const startDate = new Date();
      startDate.setMonth(preferences.preferredMonth - 1);
      startDate.setFullYear(startDate.getFullYear() + 1);
      return startDate;
    }

    // Otherwise, start next quarter
    const today = new Date();
    const currentMonth = today.getMonth();
    let startMonth;

    if (currentMonth <= 2)
      startMonth = 3; // April
    else if (currentMonth <= 5)
      startMonth = 6; // July
    else if (currentMonth <= 8)
      startMonth = 9; // October
    else startMonth = 0; // January next year

    const startDate = new Date(today.getFullYear(), startMonth, 1);
    if (startDate < today) {
      startDate.setFullYear(startDate.getFullYear() + 1);
    }

    return startDate;
  }

  private getDayName(dayIndex: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'NONE';
  }
}
