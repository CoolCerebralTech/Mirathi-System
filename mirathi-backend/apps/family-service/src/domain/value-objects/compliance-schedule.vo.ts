// src/domain/value-objects/compliance-schedule.vo.ts
import { ValueObject } from '../base/value-object';

export enum ReportFrequency {
  QUARTERLY = 'QUARTERLY',
  BIANNUAL = 'BIANNUAL',
  ANNUAL = 'ANNUAL',
  BIENNIAL = 'BIENNIAL', // Every 2 years
  CUSTOM = 'CUSTOM',
}

export interface ComplianceScheduleProps {
  frequency: ReportFrequency;
  startDate: Date;
  customMonths?: number[]; // For custom frequency
  courtMandated: boolean;

  // 🎯 INNOVATIVE: Reminder preferences
  reminderDaysBefore: number[];
  preferredNotificationChannel: 'EMAIL' | 'SMS' | 'BOTH';
  autoGenerateReport: boolean;
}

interface CalendarEntry {
  month: string;
  dueDate: Date;
  reminders: Date[];
}

export class ComplianceScheduleVO extends ValueObject<ComplianceScheduleProps> {
  constructor(props: ComplianceScheduleProps) {
    super(props);
  }

  protected validate(): void {
    if (
      this.props.frequency === ReportFrequency.CUSTOM &&
      (!this.props.customMonths || this.props.customMonths.length === 0)
    ) {
      throw new Error('Custom months required for CUSTOM frequency');
    }

    if (this.props.reminderDaysBefore.some((days) => days <= 0 || days > 90)) {
      throw new Error('Reminder days must be between 1 and 90');
    }
  }

  // 🎯 INNOVATIVE: Calculate next due date
  public getNextDueDate(lastReportDate?: Date): Date {
    const baseDate = lastReportDate || this.props.startDate;
    const nextDate = new Date(baseDate);

    switch (this.props.frequency) {
      case ReportFrequency.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case ReportFrequency.BIANNUAL:
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case ReportFrequency.ANNUAL:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case ReportFrequency.BIENNIAL:
        nextDate.setFullYear(nextDate.getFullYear() + 2);
        break;
      case ReportFrequency.CUSTOM: {
        // Find next month in custom months - wrapped in block scope
        const currentMonth = baseDate.getMonth();
        const nextMonth = this.props.customMonths?.find((m) => m > currentMonth);
        if (nextMonth) {
          nextDate.setMonth(nextMonth);
        } else {
          // Wrap to next year
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          nextDate.setMonth(this.props.customMonths![0]);
        }
        break;
      }
    }

    return nextDate;
  }

  // 🎯 INNOVATIVE: Generate all reminder dates for next report
  public getReminderDates(nextDueDate: Date): Date[] {
    return this.props.reminderDaysBefore.map((days) => {
      const reminder = new Date(nextDueDate);
      reminder.setDate(reminder.getDate() - days);
      return reminder;
    });
  }

  // 🎯 INNOVATIVE: Check if report is overdue
  public isOverdue(lastReportDate: Date): boolean {
    const nextDue = this.getNextDueDate(lastReportDate);
    return new Date() > nextDue;
  }

  // 🎯 INNOVATIVE: Get overdue days
  public getOverdueDays(lastReportDate: Date): number {
    if (!this.isOverdue(lastReportDate)) return 0;

    const nextDue = this.getNextDueDate(lastReportDate);
    const diffTime = new Date().getTime() - nextDue.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // 🎯 INNOVATIVE: Generate compliance calendar for year
  public generateCalendar(year: number): CalendarEntry[] {
    const calendar: CalendarEntry[] = [];
    let currentDate = new Date(year, 0, 1);

    if (currentDate < this.props.startDate) {
      currentDate = new Date(this.props.startDate);
    }

    while (currentDate.getFullYear() === year) {
      const dueDate = this.getNextDueDate(currentDate);
      if (dueDate.getFullYear() > year) break;

      calendar.push({
        month: dueDate.toLocaleString('default', { month: 'long' }),
        dueDate,
        reminders: this.getReminderDates(dueDate),
      });

      currentDate = dueDate;
    }

    return calendar;
  }

  public static create(props: ComplianceScheduleProps): ComplianceScheduleVO {
    return new ComplianceScheduleVO(props);
  }

  public toJSON(): Record<string, any> {
    return {
      ...this.props,
      nextDueDate: this.getNextDueDate().toISOString(),
      reminderDates: this.getReminderDates(this.getNextDueDate()).map((d) => d.toISOString()),
      calendar2024: this.generateCalendar(2024), // Example year
    };
  }
}
