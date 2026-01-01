// src/domain/value-objects/base.vo.ts

/**
 * Base class for all Value Objects in the domain.
 * Value Objects:
 * - Are immutable
 * - Have no identity (compared by their attributes)
 * - Are self-validating
 * - Can be used to encapsulate business rules
 */
export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this._value = value;
    this.validate();
  }

  /**
   * Validates the value object's data.
   * Must be implemented by all value objects.
   * @throws {DomainError} if validation fails
   */
  protected abstract validate(): void;

  /**
   * Gets the primitive value of the value object
   */
  get value(): T {
    return this._value;
  }

  /**
   * Value objects are equal if their values are equal
   */
  equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (vo.constructor.name !== this.constructor.name) {
      return false;
    }
    return JSON.stringify(vo.value) === JSON.stringify(this.value);
  }

  /**
   * String representation of the value object
   */
  toString(): string {
    if (typeof this._value === 'object') {
      return JSON.stringify(this._value);
    }
    return String(this._value);
  }

  /**
   * For JSON serialization
   */
  toJSON(): T {
    return this.value;
  }
}

/**
 * Base class for single-value Value Objects
 */
export abstract class SingleValueObject<T> extends ValueObject<T> {
  get value(): T {
    return this._value;
  }

  toString(): string {
    return String(this._value);
  }
}
