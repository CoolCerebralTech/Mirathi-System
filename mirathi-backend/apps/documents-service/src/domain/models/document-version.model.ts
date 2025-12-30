import {
  DocumentChecksum,
  DocumentId,
  DocumentVersionId,
  FileSize,
  MimeType,
  StoragePath,
  UserId,
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
  checksum: DocumentChecksum | null;
  changeNote: string | null;
  uploadedBy: UserId;
  createdAt: Date;
}

// ============================================================================
// Document Version Entity
// ============================================================================

/**
 * DocumentVersion Entity
 *
 * This entity represents an immutable, versioned snapshot of a document's file.
 * Its consistency and lifecycle are managed by the 'Document' Aggregate Root.
 *
 * BUSINESS RULES:
 * - Version numbers must be positive integers.
 * - Versions are immutable once created.
 * - Each version maintains its own file reference (storagePath, checksum, etc.).
 */
export class DocumentVersion {
  private readonly _id: DocumentVersionId;
  private readonly _versionNumber: number;
  private readonly _documentId: DocumentId;
  private readonly _storagePath: StoragePath;
  private readonly _fileSize: FileSize;
  private readonly _mimeType: MimeType;
  private readonly _checksum: DocumentChecksum | null;
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
  static create(props: {
    documentId: DocumentId;
    versionNumber: number;
    storagePath: StoragePath;
    fileSize: FileSize;
    mimeType: MimeType;
    checksum?: DocumentChecksum;
    uploadedBy: UserId;
    changeNote?: string;
  }): DocumentVersion {
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
      checksum: props.checksum ?? null,
      changeNote: props.changeNote ?? null,
      uploadedBy: props.uploadedBy,
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: {
    id: string;
    versionNumber: number;
    documentId: string;
    storagePath: string;
    fileSize: number;
    mimeType: string;
    checksum: string | null;
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
      checksum: props.checksum ? DocumentChecksum.create(props.checksum) : null,
      changeNote: props.changeNote,
      uploadedBy: new UserId(props.uploadedBy),
      createdAt: props.createdAt,
    });
  }

  // ============================================================================
  // Public API & Query Methods
  // ============================================================================  return this._uploadedBy.equals(userId);
  isChecksumMatch(providedChecksum: DocumentChecksum): boolean {
    if (!this._checksum) {
      return false; // Cannot validate without a stored checksum.
    }
    return this._checksum.equals(providedChecksum);
  }

  /**
   * Checks if this version is newer than another version.
   * @throws {DocumentVersionError} if comparing versions from different documents.
   */
  isNewerThan(otherVersion: DocumentVersion): boolean {
    if (!this._documentId.equals(otherVersion.documentId)) {
      throw new DocumentVersionError('Cannot compare versions from different documents');
    }
    return this._versionNumber > otherVersion.versionNumber;
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

  get checksum(): DocumentChecksum | null {
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
  // Equality & Serialization
  // ============================================================================

  equals(other: DocumentVersion): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof DocumentVersion)) {
      return false;
    }
    return this._id.equals(other.id);
  }
  /**
   * Returns a plain object representation for serialization purposes (e.g., API responses).
   * This should not be used to reconstitute the entity; use `fromPersistence` for that.
   */
  toObject() {
    return {
      id: this._id.value,
      versionNumber: this._versionNumber,
      documentId: this._documentId.value,
      storagePath: this._storagePath.value,
      fileSize: this._fileSize.sizeInBytes,
      mimeType: this._mimeType.value,
      checksum: this._checksum?.value ?? null,
      changeNote: this._changeNote,
      uploadedBy: this._uploadedBy.value,
      createdAt: this._createdAt,
    };
  }
}
