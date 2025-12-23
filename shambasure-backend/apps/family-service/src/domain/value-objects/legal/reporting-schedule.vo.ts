// domain/value-objects/legal/reporting-schedule.vo.ts
import { ValueObject, ValueObjectValidationError } from '../../base/value-object';
import { GuardianReportStatus } from '../../entities/guardian-assignment.entity';

/**
 * Reporting Schedule Value Object (S.73 LSA)
 *
 * LEGAL REQUIREMENT (S.73 Law of Succession Act):
 * "Every guardian shall within 60 days after expiration of each year
 * from the date of his appointment render to the court full and
 * accurate accounts of all property of the infant under his control"
 *
 * PURPOSE:
 * - Ensures guardian accountability for ward's property
 * - Court monitors guardian's stewardship
 * - Prevents mismanagement or fraud
 *
 * KENYAN PRACTICE:
 * - Annual reports required (every 12 months)
 * - 60-day grace period after due date
 * - Court may impose penalties for late reports
 * - Guardian may be removed for non-compliance
 */

export type ReportingFrequency = 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'ON_DEMAND';

interface ReportingScheduleProps {
  frequency: ReportingFrequency; // How often reports are due
  firstReportDue: Date; // When first report is due
  lastReportDate?: Date; // When last report was filed
  nextReportDue?: Date; // Next report due date
  status: GuardianReportStatus; // Current status
  overdueNotificationsSent: number; // Count of overdue reminders
  lastOverdueNotification?: Date; // Last reminder sent
  gracePeriodDays: number; // Days after due date (S.73 = 60 days)
}

export class ReportingSchedule extends ValueObject<ReportingScheduleProps> {
  private constructor(props: ReportingScheduleProps) {
    super(props);
  }

  public static create(props: {
    firstReportDue: Date;
    frequency?: ReportingFrequency;
    status?: GuardianReportStatus;
    gracePeriodDays?: number;
  }): ReportingSchedule {
    return new ReportingSchedule({
      frequency: props.frequency ?? 'ANNUAL',
      firstReportDue: props.firstReportDue,
      nextReportDue: props.firstReportDue,
      status: props.status ?? GuardianReportStatus.PENDING,
      overdueNotificationsSent: 0,
      gracePeriodDays: props.gracePeriodDays ?? 60, // S.73 LSA default
    });
  }

  protected validate(): void {
    // First report due date validation
    if (this.props.firstReportDue < new Date(1900, 0, 1)) {
      throw new ValueObjectValidationError(
        'First report due date is too far in the past',
        'firstReportDue',
      );
    }

    // Grace period validation
    if (this.props.gracePeriodDays < 0) {
      throw new ValueObjectValidationError('Grace period cannot be negative', 'gracePeriodDays');
    }

    if (this.props.gracePeriodDays > 365) {
      console.warn(
        `Grace period of ${this.props.gracePeriodDays} days is unusually long (>1 year)`,
      );
    }

    // Last report date must be before or equal to today
    if (this.props.lastReportDate && this.props.lastReportDate > new Date()) {
      throw new ValueObjectValidationError(
        'Last report date cannot be in the future',
        'lastReportDate',
      );
    }

    // Next report due validation
    if (this.props.nextReportDue && this.props.lastReportDate) {
      if (this.props.nextReportDue <= this.props.lastReportDate) {
        throw new ValueObjectValidationError(
          'Next report due must be after last report date',
          'nextReportDue',
        );
      }
    }

    // Overdue notifications count
    if (this.props.overdueNotificationsSent < 0) {
      throw new ValueObjectValidationError(
        'Overdue notifications count cannot be negative',
        'overdueNotificationsSent',
      );
    }
  }

  // === GETTERS ===

  get frequency(): ReportingFrequency {
    return this.props.frequency;
  }

  get firstReportDue(): Date {
    return this.props.firstReportDue;
  }

  get lastReportDate(): Date | undefined {
    return this.props.lastReportDate;
  }

  get nextReportDue(): Date | undefined {
    return this.props.nextReportDue;
  }

  get status(): GuardianReportStatus {
    return this.props.status;
  }

  get overdueNotificationsSent(): number {
    return this.props.overdueNotificationsSent;
  }

  get lastOverdueNotification(): Date | undefined {
    return this.props.lastOverdueNotification;
  }

  get gracePeriodDays(): number {
    return this.props.gracePeriodDays;
  }

  // === BUSINESS LOGIC ===

  /**
   * Check if report is currently due
   */
  public isDue(): boolean {
    if (!this.props.nextReportDue) return false;

    const today = new Date();
    return today >= this.props.nextReportDue;
  }

  /**
   * Check if report is overdue (past grace period)
   */
  public isOverdue(): boolean {
    if (!this.props.nextReportDue) return false;

    const today = new Date();
    const gracePeriodEnd = new Date(this.props.nextReportDue);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + this.props.gracePeriodDays);

    return today > gracePeriodEnd;
  }

  /**
   * Check if in grace period (due but not yet overdue)
   */
  public isInGracePeriod(): boolean {
    return this.isDue() && !this.isOverdue();
  }

  /**
   * Get days until next report is due (negative if overdue)
   */
  public getDaysUntilDue(): number | null {
    if (!this.props.nextReportDue) return null;

    const today = new Date();
    const diffMs = this.props.nextReportDue.getTime() - today.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Get days overdue (0 if not overdue)
   */
  public getDaysOverdue(): number {
    if (!this.isOverdue()) return 0;

    const today = new Date();
    const gracePeriodEnd = new Date(this.props.nextReportDue!);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + this.props.gracePeriodDays);

    const diffMs = today.getTime() - gracePeriodEnd.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate interval in months based on frequency
   */
  private getIntervalMonths(): number {
    switch (this.props.frequency) {
      case 'ANNUAL':
        return 12;
      case 'SEMI_ANNUAL':
        return 6;
      case 'QUARTERLY':
        return 3;
      case 'ON_DEMAND':
        return 0;
      default:
        return 12;
    }
  }

  /**
   * Calculate next report due date
   */
  private calculateNextDueDate(fromDate: Date): Date {
    const intervalMonths = this.getIntervalMonths();
    if (intervalMonths === 0) {
      // ON_DEMAND - no automatic next date
      return fromDate;
    }

    const nextDate = new Date(fromDate);
    nextDate.setMonth(nextDate.getMonth() + intervalMonths);
    return nextDate;
  }

  /**
   * Check if reminder should be sent
   * (Don't spam - at most once per week)
   */
  public shouldSendOverdueReminder(): boolean {
    if (!this.isOverdue()) return false;

    // First reminder
    if (!this.props.lastOverdueNotification) return true;

    // Subsequent reminders: once per week
    const daysSinceLastReminder = Math.floor(
      (new Date().getTime() - this.props.lastOverdueNotification.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysSinceLastReminder >= 7;
  }

  // === MUTATIONS (Return new instances - immutable) ===

  /**
   * File report (returns new schedule with updated dates)
   */
  public fileReport(reportDate: Date, newStatus: GuardianReportStatus): ReportingSchedule {
    // Calculate next due date based on frequency
    const nextDue = this.calculateNextDueDate(reportDate);

    return new ReportingSchedule({
      ...this.props,
      lastReportDate: reportDate,
      nextReportDue: nextDue,
      status: newStatus,
      overdueNotificationsSent: 0, // Reset counter
      lastOverdueNotification: undefined, // Reset reminder
    });
  }

  /**
   * Record overdue notification sent
   */
  public recordOverdueNotification(): ReportingSchedule {
    return new ReportingSchedule({
      ...this.props,
      overdueNotificationsSent: this.props.overdueNotificationsSent + 1,
      lastOverdueNotification: new Date(),
      status: GuardianReportStatus.OVERDUE,
    });
  }

  /**
   * Update status
   */
  public updateStatus(newStatus: GuardianReportStatus): ReportingSchedule {
    return new ReportingSchedule({
      ...this.props,
      status: newStatus,
    });
  }

  /**
   * Extend due date (court granted extension)
   */
  public extendDueDate(newDueDate: Date): ReportingSchedule {
    if (!this.props.nextReportDue) {
      throw new ValueObjectValidationError('Cannot extend - no current due date', 'nextReportDue');
    }

    if (newDueDate <= this.props.nextReportDue) {
      throw new ValueObjectValidationError(
        'New due date must be after current due date',
        'nextReportDue',
      );
    }

    return new ReportingSchedule({
      ...this.props,
      nextReportDue: newDueDate,
    });
  }

  /**
   * Change frequency (returns new schedule)
   */
  public changeFrequency(newFrequency: ReportingFrequency): ReportingSchedule {
    const nextDue = this.props.lastReportDate
      ? this.calculateNextDueDate(this.props.lastReportDate)
      : this.props.nextReportDue;

    return new ReportingSchedule({
      ...this.props,
      frequency: newFrequency,
      nextReportDue: nextDue,
    });
  }

  // === SERIALIZATION ===

  public toJSON(): Record<string, any> {
    return {
      frequency: this.props.frequency,
      firstReportDue: this.props.firstReportDue.toISOString(),
      lastReportDate: this.props.lastReportDate?.toISOString(),
      nextReportDue: this.props.nextReportDue?.toISOString(),
      status: this.props.status,
      gracePeriodDays: this.props.gracePeriodDays,
      overdueNotificationsSent: this.props.overdueNotificationsSent,
      lastOverdueNotification: this.props.lastOverdueNotification?.toISOString(),

      // Computed properties
      isDue: this.isDue(),
      isOverdue: this.isOverdue(),
      isInGracePeriod: this.isInGracePeriod(),
      daysUntilDue: this.getDaysUntilDue(),
      daysOverdue: this.getDaysOverdue(),
      shouldSendOverdueReminder: this.shouldSendOverdueReminder(),
    };
  }

  public toString(): string {
    if (this.isOverdue()) {
      return `OVERDUE by ${this.getDaysOverdue()} days`;
    }
    if (this.isDue()) {
      return `DUE (grace period: ${this.props.gracePeriodDays} days)`;
    }
    const daysUntil = this.getDaysUntilDue();
    return daysUntil !== null ? `Due in ${daysUntil} days` : 'No due date';
  }
}
