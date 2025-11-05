import { ValueObjectError } from '../exceptions/value-object.error';

/**
 * FileName Value Object
 * Encapsulates and validates a file's name.
 */
export class FileName {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Factory method with validation.
   * @param filename The original filename from the user.
   */
  public static create(filename: string): FileName {
    if (!filename || filename.trim().length === 0) {
      throw new ValueObjectError('Filename cannot be empty.');
    }

    if (filename.length > 255) {
      throw new ValueObjectError('Filename cannot exceed 255 characters.');
    }

    // Prevents path traversal attacks by disallowing slashes.
    if (/[/\\]/.test(filename)) {
      throw new ValueObjectError('Filename cannot contain slashes.');
    }

    return new FileName(filename.trim());
  }

  /**
   * Returns the file extension (e.g., "pdf", "jpg").
   */
  public get extension(): string {
    const parts = this.value.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }
}
