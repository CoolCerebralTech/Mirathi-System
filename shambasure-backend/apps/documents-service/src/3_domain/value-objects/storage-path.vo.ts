import { randomUUID } from 'node:crypto';
import { ValueObjectError } from '../exceptions/value-object.error';

/**
 * StoragePath Value Object
 * Ensures storage paths are valid and follow a consistent structure.
 * Format: {uploaderId}/{category}/{timestamp}_{uuid}.{ext}
 */
export class StoragePath {
  private readonly _path: string;

  private constructor(path: string) {
    this._path = path;
  }

  /**
   * Generate a storage path for a new document.
   */
  static generate(props: { uploaderId: string; category: string; filename: string }): StoragePath {
    if (!props.uploaderId?.trim()) {
      throw new ValueObjectError('Uploader ID cannot be empty');
    }
    if (!props.category?.trim()) {
      throw new ValueObjectError('Category cannot be empty');
    }
    if (!props.filename?.trim()) {
      throw new ValueObjectError('Filename cannot be empty');
    }

    const timestamp = Date.now();
    const uuid = randomUUID();
    const ext = props.filename.includes('.') ? props.filename.split('.').pop()! : 'bin';
    const sanitizedCategory = props.category.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    const path = `${props.uploaderId}/${sanitizedCategory}/${timestamp}_${uuid}.${ext}`;
    return new StoragePath(path);
  }

  /**
   * Re-hydrate from an existing path (from database).
   */
  static fromExisting(path: string): StoragePath {
    if (!path || path.trim().length === 0) {
      throw new ValueObjectError('Storage path cannot be empty');
    }

    // Validate the structure: uploaderId/category/timestamp_uuid.ext
    const pathRegex = /^[^/]+\/[^/]+\/\d+_[a-f0-9-]+\.[a-z0-9]+$/i;
    if (!pathRegex.test(path.trim())) {
      throw new ValueObjectError('Invalid storage path format');
    }

    return new StoragePath(path.trim());
  }

  getValue(): string {
    return this._path;
  }

  /**
   * Extract the directory path (everything before the filename).
   */
  getDirectory(): string {
    const parts = this._path.split('/');
    return parts.slice(0, -1).join('/');
  }

  /**
   * Extract just the filename.
   */
  getFilename(): string {
    return this._path.split('/').pop()!;
  }

  equals(other: StoragePath): boolean {
    return this._path === other._path;
  }
}
