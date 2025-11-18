import { randomUUID } from 'node:crypto';
import { ValueObjectError } from '../exceptions/value-object.error';

export class StoragePath {
  private readonly _path: string;

  public constructor(path: string) {
    this._path = path;
  }

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

  static fromExisting(path: string): StoragePath {
    if (!path || path.trim().length === 0) {
      throw new ValueObjectError('Storage path cannot be empty');
    }

    const pathRegex = /^[^/]+\/[^/]+\/\d+_[a-f0-9-]+\.[a-z0-9]+$/i;
    if (!pathRegex.test(path.trim())) {
      throw new ValueObjectError('Invalid storage path format');
    }

    return new StoragePath(path.trim());
  }

  /** ✅ Canonical getter expected by domain entities */
  get value(): string {
    return this._path;
  }

  getDirectory(): string {
    const parts = this._path.split('/');
    return parts.slice(0, -1).join('/');
  }

  getFilename(): string {
    return this._path.split('/').pop()!;
  }

  equals(other: StoragePath): boolean {
    return this._path === other._path;
  }
}
