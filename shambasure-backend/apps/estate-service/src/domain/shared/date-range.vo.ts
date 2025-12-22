import { ValueObject } from '../base/value-object';
import { DomainException } from '../exceptions/base-domain.exception';

// Define a specific exception for DateRange if one doesn't exist yet
export class InvalidDateRangeException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_DATE_RANGE');
  }
}

export interface DateRangeProps {
  start: Date;
  end?: Date; // Optional end date (open-ended range)
}

export class DateRange extends ValueObject<DateRangeProps> {
  constructor(props: DateRangeProps) {
    super(props);
  }

  protected validate(): void {
    const { start, end } = this.props;

    if (isNaN(start.getTime())) {
      throw new InvalidDateRangeException('Start date must be a valid date');
    }

    if (end) {
      if (isNaN(end.getTime())) {
        throw new InvalidDateRangeException('End date must be a valid date');
      }

      if (end < start) {
        throw new InvalidDateRangeException(
          `End date (${end.toISOString()}) cannot be before start date (${start.toISOString()})`,
        );
      }
    }
  }

  // --- Factory Methods ---

  static create(start: Date, end?: Date): DateRange {
    return new DateRange({ start, end });
  }

  static fromYears(startYear: number, endYear?: number): DateRange {
    const start = new Date(startYear, 0, 1);
    const end = endYear ? new Date(endYear, 11, 31) : undefined;
    return new DateRange({ start, end });
  }

  // --- Business Logic ---

  isActive(at: Date = new Date()): boolean {
    if (at < this.props.start) return false;
    if (!this.props.end) return true; // Open-ended
    return at <= this.props.end;
  }

  overlaps(other: DateRange): boolean {
    // Standard overlap logic: StartA < EndB && EndA > StartB
    const thisEnd = this.props.end || new Date(8640000000000000); // Max Date
    const otherEnd = other.props.end || new Date(8640000000000000);

    return this.props.start < otherEnd && thisEnd > other.props.start;
  }

  getDurationInYears(): number {
    const end = this.props.end || new Date();
    const diff = end.getTime() - this.props.start.getTime();
    return diff / (1000 * 60 * 60 * 24 * 365.25);
  }

  // Useful for S.29 Cohabitation checks (requires > X years)
  meetsDurationThreshold(years: number): boolean {
    return this.getDurationInYears() >= years;
  }

  // --- Getters ---
  get start(): Date {
    return this.props.start;
  }
  get end(): Date | undefined {
    return this.props.end;
  }

  public toJSON(): Record<string, any> {
    return {
      start: this.props.start,
      end: this.props.end,
      durationYears: parseFloat(this.getDurationInYears().toFixed(2)),
      isActive: this.isActive(),
    };
  }
}
