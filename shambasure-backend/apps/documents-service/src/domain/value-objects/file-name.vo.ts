import { ValueObjectError } from '../exceptions/value-object.error';

export class FileName {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(filename: string): FileName {
    if (!filename || filename.trim().length === 0) {
      throw new ValueObjectError('Filename cannot be empty.');
    }
    if (filename.length > 255) {
      throw new ValueObjectError('Filename cannot exceed 255 characters.');
    }
    if (/[/\\]/.test(filename)) {
      throw new ValueObjectError('Filename cannot contain slashes.');
    }

    return new FileName(filename.trim());
  }

  get extension(): string {
    const parts = this.value.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /** ✅ Add equals() for deep comparison */
  public equals(other: FileName): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  /** ✅ Optional: safer string representation */
  public toString(): string {
    return this.value;
  }
}
