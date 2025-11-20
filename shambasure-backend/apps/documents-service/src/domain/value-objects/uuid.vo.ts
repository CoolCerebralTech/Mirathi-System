import { v4 as uuidv4 } from 'uuid';

export abstract class Uuid {
  constructor(protected readonly _value: string) {
    this.validate();
  }

  /**
   * Generate a new UUID for any subclass (e.g., DocumentId, UserId)
   */
  static generate<T extends Uuid>(this: new (value: string) => T): T {
    return new this(uuidv4());
  }

  protected validate(): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(this._value)) {
      throw new Error(`Invalid UUID format: ${this._value}`);
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: Uuid): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
