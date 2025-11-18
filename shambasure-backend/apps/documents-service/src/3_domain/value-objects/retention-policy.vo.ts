// ============================================================================
// RetentionPolicy Value Object (Self-Contained)
// ============================================================================

/**
 * Represents retention durations for document lifecycle management.
 * Each policy determines how long a document should be retained
 * before automatic expiration or archival.
 */
export enum RetentionPolicyType {
  SHORT_TERM = 'SHORT_TERM', // 1 year
  MEDIUM_TERM = 'MEDIUM_TERM', // 7 years
  LONG_TERM = 'LONG_TERM', // Permanent (100 years surrogate)
  COMPLIANCE = 'COMPLIANCE', // Regulatory (default 10 years)
}

/**
 * Minimal ValueObject contract so we don’t depend on an external base class.
 */
export interface ValueObject<T> {
  equals(other: ValueObject<T>): boolean;
  valueOf(): T;
}

/**
 * RetentionPolicy enforces validity, provides helper factories,
 * and encapsulates all policy-specific logic such as expiry calculations.
 */
export class RetentionPolicy implements ValueObject<string> {
  private constructor(private readonly _value: RetentionPolicyType) {}

  // ============================================================================
  // Factory Methods
  // ============================================================================

  static create(value: string): RetentionPolicy {
    if (!this.isValid(value)) {
      throw new Error(
        `Invalid retention policy: ${value}. Must be one of: ${Object.values(
          RetentionPolicyType,
        ).join(', ')}`,
      );
    }

    return new RetentionPolicy(value as RetentionPolicyType);
  }

  static createShortTerm(): RetentionPolicy {
    return new RetentionPolicy(RetentionPolicyType.SHORT_TERM);
  }

  static createMediumTerm(): RetentionPolicy {
    return new RetentionPolicy(RetentionPolicyType.MEDIUM_TERM);
  }

  static createLongTerm(): RetentionPolicy {
    return new RetentionPolicy(RetentionPolicyType.LONG_TERM);
  }

  static createCompliance(): RetentionPolicy {
    return new RetentionPolicy(RetentionPolicyType.COMPLIANCE);
  }

  // ============================================================================
  // Business Logic
  // ============================================================================

  /**
   * Calculates expiry date from a base date according to the policy.
   * - SHORT_TERM → +1 year
   * - MEDIUM_TERM → +7 years
   * - LONG_TERM → +100 years (effectively permanent)
   * - COMPLIANCE → +10 years default (can vary per regulation)
   */
  calculateExpiryDate(fromDate: Date = new Date()): Date {
    const expiryDate = new Date(fromDate);

    switch (this._value) {
      case RetentionPolicyType.SHORT_TERM:
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        break;
      case RetentionPolicyType.MEDIUM_TERM:
        expiryDate.setFullYear(expiryDate.getFullYear() + 7);
        break;
      case RetentionPolicyType.LONG_TERM:
        expiryDate.setFullYear(expiryDate.getFullYear() + 100);
        break;
      case RetentionPolicyType.COMPLIANCE:
        expiryDate.setFullYear(expiryDate.getFullYear() + 10);
        break;
    }

    return expiryDate;
  }

  /**
   * Returns numeric duration of the policy in years.
   */
  getDurationInYears(): number {
    switch (this._value) {
      case RetentionPolicyType.SHORT_TERM:
        return 1;
      case RetentionPolicyType.MEDIUM_TERM:
        return 7;
      case RetentionPolicyType.LONG_TERM:
        return 100;
      case RetentionPolicyType.COMPLIANCE:
        return 10;
      default:
        return 0;
    }
  }

  isPermanent(): boolean {
    return this._value === RetentionPolicyType.LONG_TERM;
  }

  requiresRegularReview(): boolean {
    return this._value === RetentionPolicyType.COMPLIANCE;
  }

  // ============================================================================
  // Validation
  // ============================================================================

  private static isValid(value: string): boolean {
    return Object.values(RetentionPolicyType).includes(value as RetentionPolicyType);
  }

  // ============================================================================
  // Value Object Contract
  // ============================================================================

  equals(other: RetentionPolicy): boolean {
    return this._value === other._value;
  }

  valueOf(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  get value(): string {
    return this._value;
  }

  // ============================================================================
  // Serialization Helpers
  // ============================================================================

  toJSON(): string {
    return this._value;
  }

  // ============================================================================
  // Static Utilities
  // ============================================================================

  static getAllPolicies(): RetentionPolicyType[] {
    return Object.values(RetentionPolicyType);
  }

  static getDefaultPolicy(): RetentionPolicy {
    return this.createMediumTerm();
  }

  static isValidPolicy(value: string): boolean {
    return this.isValid(value);
  }
}
