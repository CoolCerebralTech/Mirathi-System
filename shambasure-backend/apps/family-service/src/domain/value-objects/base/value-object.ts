// domain/value-objects/base/value-object.ts
export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this._value = Object.freeze(value);
  }

  get value(): T {
    return this._value;
  }

  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (other.constructor !== this.constructor) {
      return false;
    }
    // Deep comparison might be needed for objects, but strict equality for primitives
    return JSON.stringify(this.value) === JSON.stringify(other.value);
  }

  // UPDATE: Changed to protected so subclasses can implement it without exposing it
  protected abstract validate(): void;

  toString(): string {
    if (typeof this._value === 'object') {
      return JSON.stringify(this._value);
    }
    return String(this._value);
  }
}
