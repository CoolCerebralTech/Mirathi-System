import {
  DocumentId,
  UserId,
  StoragePath,
  FileSize,
  MimeType,
  DocumentChecksum,
  DocumentVersionId,
} from '../value-objects';

// ============================================================================
// Domain Errors
// ============================================================================

export class DocumentVersionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentVersionError';
  }
}

export class InvalidVersionNumberError extends DocumentVersionError {
  constructor(versionNumber: number) {
    super(`Invalid version number: ${versionNumber}. Version numbers must be positive integers.`);
    this.name = 'InvalidVersionNumberError';
  }
}

export class DuplicateVersionError extends DocumentVersionError {
  constructor(documentId: DocumentId, versionNumber: number) {
    super(`Version ${versionNumber} already exists for document ${documentId.value}`);
    this.name = 'DuplicateVersionError';
  }
}

export class VersionSequenceError extends DocumentVersionError {
  constructor(expected: number, received: number) {
    super(`Version sequence error: expected ${expected}, received ${received}`);
    this.name = 'VersionSequenceError';
  }
}

export class VersionAccessDeniedError extends DocumentVersionError {
  constructor(userId: UserId, versionId: DocumentVersionId) {
    super(`User ${userId.value} does not have access to version ${versionId.value}`);
    this.name = 'VersionAccessDeniedError';
  }
}

// ============================================================================
// Document Version Entity Properties Interface
// ============================================================================

export interface DocumentVersionProps {
  id: DocumentVersionId;
  versionNumber: number;
  documentId: DocumentId;
  storagePath: StoragePath;
  fileSize: FileSize;
  mimeType: MimeType;
  checksum: DocumentChecksum;
  changeNote: string | null;
  uploadedBy: UserId;
  createdAt: Date;
}

// ============================================================================
// Document Version Entity
// ============================================================================

/**
 * DocumentVersion Entity - Production Ready
 *
 * BUSINESS RULES:
 * - Version numbers must be sequential positive integers starting from 1
 * - Versions are immutable once created (no updates allowed)
 * - Each version maintains its own file reference (storagePath, checksum)
 * - Versions track who uploaded them and when
 * - Change notes are optional but recommended for audit trail
 * - File integrity is validated via checksum
 */
export class DocumentVersion {
  private readonly _id: DocumentVersionId;
  private readonly _versionNumber: number;
  private readonly _documentId: DocumentId;
  private readonly _storagePath: StoragePath;
  private readonly _fileSize: FileSize;
  private readonly _mimeType: MimeType;
  private readonly _checksum: DocumentChecksum;
  private readonly _changeNote: string | null;
  private readonly _uploadedBy: UserId;
  private readonly _createdAt: Date;

  private constructor(props: DocumentVersionProps) {
    this._id = props.id;
    this._versionNumber = props.versionNumber;
    this._documentId = props.documentId;
    this._storagePath = props.storagePath;
    this._fileSize = props.fileSize;
    this._mimeType = props.mimeType;
    this._checksum = props.checksum;
    this._changeNote = props.changeNote;
    this._uploadedBy = props.uploadedBy;
    this._createdAt = props.createdAt;
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Creates a new DocumentVersion entity
   * @throws {InvalidVersionNumberError} if version number is invalid
   */
  static create(props: {
    documentId: DocumentId;
    versionNumber: number;
    storagePath: StoragePath;
    fileSize: FileSize;
    mimeType: MimeType;
    checksum: DocumentChecksum;
    uploadedBy: UserId;
    changeNote?: string;
  }): DocumentVersion {
    // Validate version number
    if (props.versionNumber <= 0 || !Number.isInteger(props.versionNumber)) {
      throw new InvalidVersionNumberError(props.versionNumber);
    }

    const id = DocumentVersionId.generate<DocumentVersionId>();

    return new DocumentVersion({
      id,
      versionNumber: props.versionNumber,
      documentId: props.documentId,
      storagePath: props.storagePath,
      fileSize: props.fileSize,
      mimeType: props.mimeType,
      checksum: props.checksum,
      changeNote: props.changeNote ?? null,
      uploadedBy: props.uploadedBy,
      createdAt: new Date(),
    });
  }

  /**
   * Rehydrates a DocumentVersion from persistence
   */
  static fromPersistence(props: {
    id: string;
    versionNumber: number;
    documentId: string;
    storagePath: string;
    fileSize: number;
    mimeType: string;
    checksum: string;
    changeNote: string | null;
    uploadedBy: string;
    createdAt: Date;
  }): DocumentVersion {
    return new DocumentVersion({
      id: new DocumentVersionId(props.id),
      versionNumber: props.versionNumber,
      documentId: new DocumentId(props.documentId),
      storagePath: StoragePath.fromExisting(props.storagePath),
      fileSize: FileSize.create(props.fileSize),
      mimeType: MimeType.create(props.mimeType),
      checksum: DocumentChecksum.create(props.checksum),
      changeNote: props.changeNote,
      uploadedBy: new UserId(props.uploadedBy),
      createdAt: props.createdAt,
    });
  }

  // ============================================================================
  // Public API & Query Methods
  // ============================================================================

  /**
   * Checks if this is the initial version (v1)
   */
  isInitialVersion(): boolean {
    return this._versionNumber === 1;
  }

  /**
   * Checks if a specific user uploaded this version
   */
  wasUploadedBy(userId: UserId): boolean {
    return this._uploadedBy.equals(userId);
  }

  /**
   * Checks if this version belongs to a specific document
   */
  belongsToDocument(documentId: DocumentId): boolean {
    return this._documentId.equals(documentId);
  }

  /**
   * Validates file integrity by comparing checksums
   */
  validateChecksum(providedChecksum: DocumentChecksum): boolean {
    return this._checksum.equals(providedChecksum);
  }

  /**
   * Checks if this version is newer than another version
   */
  isNewerThan(otherVersion: DocumentVersion): boolean {
    if (!this.belongsToDocument(otherVersion.documentId)) {
      throw new DocumentVersionError('Cannot compare versions from different documents');
    }
    return this._versionNumber > otherVersion.versionNumber;
  }

  /**
   * Checks if this version is older than another version
   */
  isOlderThan(otherVersion: DocumentVersion): boolean {
    if (!this.belongsToDocument(otherVersion.documentId)) {
      throw new DocumentVersionError('Cannot compare versions from different documents');
    }
    return this._versionNumber < otherVersion.versionNumber;
  }

  /**
   * Returns the next version number
   */
  getNextVersionNumber(): number {
    return this._versionNumber + 1;
  }

  /**
   * Checks if change note exists
   */
  hasChangeNote(): boolean {
    return this._changeNote !== null && this._changeNote.trim().length > 0;
  }

  /**
   * Returns human-readable version string
   */
  getVersionString(): string {
    return `v${this._versionNumber}`;
  }

  /**
   * Calculates age of version in days
   */
  getAgeInDays(): number {
    const now = new Date();
    const diff = now.getTime() - this._createdAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Checks if version was created within specified days
   */
  isCreatedWithinDays(days: number): boolean {
    return this.getAgeInDays() <= days;
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get id(): DocumentVersionId {
    return this._id;
  }

  get versionNumber(): number {
    return this._versionNumber;
  }

  get documentId(): DocumentId {
    return this._documentId;
  }

  get storagePath(): StoragePath {
    return this._storagePath;
  }

  get fileSize(): FileSize {
    return this._fileSize;
  }

  get mimeType(): MimeType {
    return this._mimeType;
  }

  get checksum(): DocumentChecksum {
    return this._checksum;
  }

  get changeNote(): string | null {
    return this._changeNote;
  }

  get uploadedBy(): UserId {
    return this._uploadedBy;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // ============================================================================
  // Equality & Comparison
  // ============================================================================

  equals(other: DocumentVersion): boolean {
    return this._id.equals(other.id);
  }

  /**
   * Returns a plain object representation (for serialization)
   */
  toPlainObject(): {
    id: string;
    versionNumber: number;
    documentId: string;
    storagePath: string;
    fileSize: number;
    mimeType: string;
    checksum: string;
    changeNote: string | null;
    uploadedBy: string;
    createdAt: Date;
  } {
    return {
      id: this._id.value,
      versionNumber: this._versionNumber,
      documentId: this._documentId.value,
      storagePath: this._storagePath.value,
      fileSize: this._fileSize.sizeInBytes,
      mimeType: this._mimeType.value,
      checksum: this._checksum.value,
      changeNote: this._changeNote,
      uploadedBy: this._uploadedBy.value,
      createdAt: this._createdAt,
    };
  }
}
