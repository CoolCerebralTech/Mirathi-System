// src/estate-service/src/domain/value-objects/execution-date.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

export interface ExecutionDateProps {
  date: Date;
  timezone: string;
  location?: string;
  witnessesPresent: number;
}

/**
 * Execution Date Value Object
 *
 * Records when and where a will was executed in Kenya
 * Legal Requirements:
 * - Date cannot be in the future
 * - Must have at least 2 witnesses present (S.11 LSA)
 * - Timezone should be recorded for cross-jurisdictional cases
 * - Location helps establish jurisdiction
 */
export class ExecutionDate extends ValueObject<ExecutionDateProps> {
  constructor(props: ExecutionDateProps) {
    super(props);
  }
  /**
   * Public accessor for the raw Date object.
   * Required by Mappers to save to the database.
   */
  public get value(): Date {
    return this.props.date;
  }

  protected validate(): void {
    const now = new Date();
    // Allow a small buffer (e.g. 1 minute) for server time differences if "now" is used
    if (this.props.date.getTime() > now.getTime() + 60000) {
      throw new ValueObjectValidationError('Execution date cannot be in the future', 'date');
    }

    if (this.props.witnessesPresent < 2) {
      throw new ValueObjectValidationError(
        'Must have at least 2 witnesses present for will execution (S.11 LSA)',
        'witnessesPresent',
      );
    }

    try {
      Intl.DateTimeFormat(undefined, { timeZone: this.props.timezone });
    } catch {
      throw new ValueObjectValidationError(`Invalid timezone: ${this.props.timezone}`, 'timezone');
    }

    if (this.props.location && this.props.location.length > 200) {
      throw new ValueObjectValidationError(
        'Location description too long (max 200 characters)',
        'location',
      );
    }
  }

  /**
   * Calculate if will was executed within last X days
   */
  public isWithinLastDays(days: number): boolean {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return this.props.date >= cutoff;
  }

  /**
   * Calculate age of will in days
   */
  public getAgeInDays(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.props.date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if execution was on same day as another date
   */
  public isSameDay(otherDate: Date): boolean {
    return this.props.date.toDateString() === otherDate.toDateString();
  }

  /**
   * Get formatted date string with Kenyan context
   */
  public toKenyanString(): string {
    return new Intl.DateTimeFormat('en-KE', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: this.props.timezone,
    }).format(this.props.date);
  }

  /**
   * Get ISO string with timezone
   */
  public toISOString(): string {
    return this.props.date.toISOString();
  }

  public toJSON(): Record<string, any> {
    return {
      date: this.props.date.toISOString(),
      timezone: this.props.timezone,
      location: this.props.location,
      witnessesPresent: this.props.witnessesPresent,
      formatted: this.toKenyanString(),
      ageInDays: this.getAgeInDays(),
      isValid: this.isWithinLastDays(365 * 50), // Roughly 50 years validity check
    };
  }
  /**
   * [NEW] Generic factory method for Mappers
   * Handles Date objects or ISO strings coming from DB/API
   */
  public static create(
    dateInput: Date | string,
    witnessesPresent: number = 2, // Default to minimum legal req if not tracked in DB column
    location?: string,
    timezone: string = 'Africa/Nairobi',
  ): ExecutionDate {
    let date: Date;

    if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) {
      throw new ValueObjectValidationError('Invalid execution date provided', 'date');
    }

    return new ExecutionDate({
      date,
      witnessesPresent,
      location,
      timezone,
    });
  }

  // Static factory methods
  public static now(witnessesPresent: number, location?: string): ExecutionDate {
    return new ExecutionDate({
      date: new Date(),
      timezone: 'Africa/Nairobi', // Default to Nairobi time
      location,
      witnessesPresent,
    });
  }

  public static fromISOString(
    isoString: string,
    witnessesPresent: number,
    timezone: string = 'Africa/Nairobi',
    location?: string,
  ): ExecutionDate {
    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
      throw new ValueObjectValidationError('Invalid ISO date string', 'date');
    }

    return new ExecutionDate({
      date,
      timezone,
      location,
      witnessesPresent,
    });
  }
}
