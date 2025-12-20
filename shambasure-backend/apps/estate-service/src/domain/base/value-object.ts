// src/domain/base/value-object.ts

export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this._value = Object.freeze(value);
    this.validate();
  }

  get value(): T {
    return this._value;
  }

  protected abstract validate(): void;

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (vo.constructor.name !== this.constructor.name) {
      return false;
    }
    return JSON.stringify(this._value) === JSON.stringify(vo.value);
  }

  public toString(): string {
    if (typeof this._value === 'object' && this._value !== null) {
      return JSON.stringify(this._value);
    }
    return String(this._value);
  }
}
