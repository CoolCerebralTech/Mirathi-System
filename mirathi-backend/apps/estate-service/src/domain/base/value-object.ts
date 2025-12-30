// domain/base/value-object.ts

/**
 * Base Value Object for Kenyan Legal System
 *
 * VALUE OBJECTS are:
 * - Immutable (once created, cannot change)
 * - Defined by their values (not identity)
 * - Side-effect free (methods return new instances)
 * - Self-validating (invalid state cannot exist)
 *
 * Kenyan Legal Context:
 * - Legal values must be immutable for audit trail
 * - Examples: Money amounts, dates, court orders, identity numbers
 * - Value objects ensure domain rules (e.g., KRA PIN format)
 *
 * Design Principles:
 * - Use Value Objects instead of primitives (no "primitive obsession")
 * - Encapsulate validation logic
 * - Make illegal states unrepresentable
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
    this.validate();
  }

  /**
   * Validate value object invariants
   * Throw exception if invalid state
   */
  protected abstract validate(): void;

  /**
   * Value equality (compare by value, not reference)
   * Two value objects are equal if all their properties are equal
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }

    if (!(vo instanceof this.constructor)) {
      return false;
    }

    return this.deepEquals(this.props, vo.props);
  }

  /**
   * Deep equality check for nested objects
   */
  private deepEquals(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
      return true;
    }

    if (obj1 == null || obj2 == null) {
      return false;
    }

    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return obj1 === obj2;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false;
      }

      if (!this.deepEquals(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get hash code for collections
   */
  public hashCode(): string {
    return JSON.stringify(this.props);
  }

  /**
   * Clone value object (returns same instance since immutable)
   */
  public clone(): this {
    return this;
  }

  /**
   * Serialize to JSON
   */
  public abstract toJSON(): Record<string, any>;

  /**
   * Get underlying props (read-only)
   */
  public getValue(): Readonly<T> {
    return this.props;
  }
}

/**
 * Simple Value Object (for single-property VOs)
 *
 * Example: NationalId, KraPin, Email
 */
export abstract class SimpleValueObject<T> extends ValueObject<{ value: T }> {
  constructor(value: T) {
    super({ value });
  }

  get value(): T {
    return this.props.value;
  }

  public toString(): string {
    return String(this.props.value);
  }

  public toJSON(): Record<string, any> {
    return { value: this.props.value };
  }
}

/**
 * Validation Error for Value Objects
 */
export class ValueObjectValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'ValueObjectValidationError';
    Object.setPrototypeOf(this, ValueObjectValidationError.prototype);
  }
}
