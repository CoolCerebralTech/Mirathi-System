import {
  DocumentId,
  UserId,
  StoragePath,
  FileSize,
  MimeType,
  DocumentChecksum,
} from '../value-objects';

// We need a specific ID for this entity
import { DocumentVersionId } from '../value-objects/document-version-id.vo';

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
  checksum: DocumentChecksum;
  changeNote: string | null;
  uploadedBy: UserId;
  createdAt: Date;
}

// ============================================================================
// Document Version Entity
// ============================================================================
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

  isInitialVersion(): boolean {
    return this._versionNumber === 1;
  }

  wasUploadedBy(userId: UserId): boolean {
    return this._uploadedBy.equals(userId);
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
}
