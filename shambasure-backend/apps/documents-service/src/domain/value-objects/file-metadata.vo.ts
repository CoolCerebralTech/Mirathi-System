/** Base error for value object validation failures. */
import { ValueObjectError } from '../exceptions/value-object.error';

/**
 * FileMetadata Value Object
 * Encapsulates and validates file properties (name, type, size).
 */
export class FileMetadata {
  private static readonly MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
  private static readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  ];

  private readonly _filename: string;
  private readonly _mimeType: string;
  private readonly _sizeBytes: number;

  private constructor(filename: string, mimeType: string, sizeBytes: number) {
    this._filename = filename;
    this._mimeType = mimeType;
    this._sizeBytes = sizeBytes;
  }

  /**
   * Factory method with validation.
   */
  static create(filename: string, mimeType: string, sizeBytes: number): FileMetadata {
    // Validate filename
    if (!filename || filename.trim().length === 0) {
      throw new ValueObjectError('Filename cannot be empty');
    }
    if (filename.length > 255) {
      throw new ValueObjectError('Filename cannot exceed 255 characters');
    }

    // Validate MIME type
    if (!FileMetadata.ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new ValueObjectError(
        `Invalid file type: ${mimeType}. Allowed types: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX`,
      );
    }

    // Validate file size
    if (sizeBytes <= 0) {
      throw new ValueObjectError('File size must be greater than 0');
    }
    if (sizeBytes > FileMetadata.MAX_FILE_SIZE_BYTES) {
      throw new ValueObjectError(
        `File size exceeds maximum allowed size of ${FileMetadata.MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`,
      );
    }

    return new FileMetadata(filename.trim(), mimeType, sizeBytes);
  }

  get filename(): string {
    return this._filename;
  }

  get mimeType(): string {
    return this._mimeType;
  }

  get sizeBytes(): number {
    return this._sizeBytes;
  }

  get sizeMB(): number {
    return Math.round((this._sizeBytes / 1024 / 1024) * 100) / 100;
  }

  /**
   * Returns file extension from filename (e.g., "pdf", "jpg")
   */
  get extension(): string {
    const parts = this._filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  equals(other: FileMetadata): boolean {
    return (
      this._filename === other._filename &&
      this._mimeType === other._mimeType &&
      this._sizeBytes === other._sizeBytes
    );
  }
}
