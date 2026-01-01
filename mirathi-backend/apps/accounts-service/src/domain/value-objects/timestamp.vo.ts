// src/domain/value-objects/timestamp.vo.ts
import { SingleValueObject } from './base.vo';

/**
 * Timestamp Value Object
 *
 * Business Rules:
 * 1. Must be a valid date
 * 2. Cannot be in the future (for creation dates)
 * 3. Immutable once created
 */
export class Timestamp extends SingleValueObject<Date> {
  protected validate(): void {
    if (!(this._value instanceof Date) || isNaN(this._value.getTime())) {
      throw new Error('Invalid date provided');
    }
  }

  /**
   * Factory method to create Timestamp from Date, string, or number
   */
  static create(value: Date | string | number): Timestamp {
    if (value instanceof Date) {
      return new Timestamp(value);
    }
    return new Timestamp(new Date(value));
  }

  /**
   * Create a Timestamp for now
   */
  static now(): Timestamp {
    return new Timestamp(new Date());
  }

  /**
   * Check if this timestamp is in the future
   */
  get isFuture(): boolean {
    return this._value.getTime() > Date.now();
  }

  /**
   * Check if this timestamp is in the past
   */
  get isPast(): boolean {
    return this._value.getTime() < Date.now();
  }

  /**
   * Check if this timestamp is today
   */
  get isToday(): boolean {
    const today = new Date();
    return (
      this._value.getDate() === today.getDate() &&
      this._value.getMonth() === today.getMonth() &&
      this._value.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Get the difference in days from another timestamp
   */
  daysDifference(other: Timestamp): number {
    const diff = Math.abs(this._value.getTime() - other.value.getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if this timestamp is within a certain number of days from now
   */
  isWithinDays(days: number): boolean {
    const now = new Date();
    const diff = Math.abs(this._value.getTime() - now.getTime());
    const diffDays = diff / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  }

  /**
   * Format the timestamp as ISO string
   */
  toISOString(): string {
    return this._value.toISOString();
  }

  /**
   * Format for display (Kenyan locale)
   */
  toDisplayString(): string {
    return this._value.toLocaleString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Nairobi',
    });
  }

  /**
   * Format as date only (Kenyan locale)
   */
  toDateString(): string {
    return this._value.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Africa/Nairobi',
    });
  }

  /**
   * Get the age in years (useful for date of birth)
   */
  get ageInYears(): number {
    const now = new Date();
    const diff = now.getTime() - this._value.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }
}
