import { FileMetadata, StoragePath } from '../value-objects';
import {
  DomainEvent,
  DocumentUploadedEvent,
  DocumentVerifiedEvent,
  DocumentRejectedEvent,
  DocumentDeletedEvent,
} from '../events';

// NOTE: These will be imported from @shamba/common after you move them
import { DocumentStatus, DocumentCategory } from '@shamba/common';

// ============================================================================
// Custom Domain Errors
// ============================================================================

/** Base error for document-related business rule violations. */
export class DocumentDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentDomainError';
  }
}

/** Thrown when attempting to verify an already verified document. */
export class DocumentAlreadyVerifiedError extends DocumentDomainError {
  constructor() {
    super('Document has already been verified and cannot be modified');
    this.name = 'DocumentAlreadyVerifiedError';
  }
}

/** Thrown when non-verifier attempts verification action. */
export class UnauthorizedVerificationError extends DocumentDomainError {
  constructor() {
    super('Only VERIFIER or ADMIN roles can verify documents');
    this.name = 'UnauthorizedVerificationError';
  }
}

/** Thrown when trying to operate on deleted document. */
export class DocumentDeletedException extends DocumentDomainError {
  constructor() {
    super('Cannot perform actions on a deleted document');
    this.name = 'DocumentDeletedException';
  }
}

// ============================================================================
// Document Aggregate Root
// ============================================================================

/**
 * The properties required to rehydrate a Document from persistence.
 */
export interface DocumentProps {
  id: string;
  fileMetadata: FileMetadata;
  storagePath: StoragePath;
  category: DocumentCategory;
  status: DocumentStatus;
  uploaderId: string;
  uploaderName: string; // For events - not persisted separately
  verifiedBy: string | null;
  verifiedByName: string | null;
  verifiedAt: Date | null;
  rejectionReason: string | null;
  assetId: string | null;
  willId: string | null;
  metadata: Record<string, any> | null; // JSON metadata (e.g., OCR extracted data)
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Document Domain Model (Aggregate Root).
 * Manages the complete lifecycle of a legal document in the Shamba Sure system.
 * 
 * BUSINESS RULES:
 * - Only uploaderId owner can update/delete their own documents
 * - Only VERIFIER/ADMIN can change verification status
 * - Verified documents cannot be modified (immutable after verification)
 * - Deleted documents cannot be modified
 * - All state changes emit domain events
 */
export class Document {
  private readonly _id: string;
  private readonly _fileMetadata: FileMetadata;
  private readonly _storagePath: StoragePath;
  private readonly _category: DocumentCategory;
  private _status: DocumentStatus;
  private readonly _uploaderId: string;
  private readonly _uploaderName: string;
  private _verifiedBy: string | null;
  private _verifiedByName: string | null;
  private _verifiedAt: Date | null;
  private _rejectionReason: string | null;
  private readonly _assetId: string | null;
  private readonly _willId: string | null;
  private _metadata: Record<string, any> | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private readonly _domainEvents: DomainEvent[] = [];

  private constructor(props: DocumentProps) {
    this._id = props.id;
    this._fileMetadata = props.fileMetadata;
    this._storagePath = props.storagePath;
    this._category = props.category;
    this._status = props.status;
    this._uploaderId = props.uploaderId;
    this._uploaderName = props.uploaderName;
    this._verifiedBy = props.verifiedBy;
    this._verifiedByName = props.verifiedByName;
    this._verifiedAt = props.verifiedAt;
    this._rejectionReason = props.rejectionReason;
    this._assetId = props.assetId;
    this._willId = props.willId;
    this._metadata = props.metadata;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;
  }

  /**
   * Factory for creating a brand new document (during upload).
   */
  static create(props: {
    id: string;
    fileMetadata: FileMetadata;
    storagePath: StoragePath;
    category: DocumentCategory;
    uploaderId: string;
    uploaderName: string;
    assetId?: string;
    willId?: string;
    metadata?: Record<string, any>;
  }): Document {
    const now = new Date();
    const document = new Document({
      id: props.id,
      fileMetadata: props.fileMetadata,
      storagePath: props.storagePath,
      category: props.category,
      status: DocumentStatus.PENDING_VERIFICATION,
      uploaderId: props.uploaderId,
      uploaderName: props.uploaderName,
      verifiedBy: null,
      verifiedByName: null,
      verifiedAt: null,
      rejectionReason: null,
      assetId: props.assetId ?? null,
      willId: props.willId ?? null,
      metadata: props.metadata ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    document.addDomainEvent(
      new DocumentUploadedEvent({
        aggregateId: document.id,
        filename: document.fileMetadata.filename,
        category: document.category,
        sizeBytes: document.fileMetadata.sizeBytes,
        uploaderId: document.uploaderId,
        uploadedBy: document.uploaderName,
        assetId: document.assetId ?? undefined,
        willId: document.willId ?? undefined,
      }),
    );

    return document;
  }

  /**
   * Factory for re-hydrating an existing document from the database.
   */
  static fromPersistence(props: DocumentProps): Document {
    return new Document(props);
  }

  // ============================================================================
  // Getters & Event Management
  // ============================================================================

  get id(): string {
    return this._id;
  }
  get fileMetadata(): FileMetadata {
    return this._fileMetadata;
  }
  get storagePath(): StoragePath {
    return this._storagePath;
  }
  get category(): DocumentCategory {
    return this._category;
  }
  get status(): DocumentStatus {
    return this._status;
  }
  get uploaderId(): string {
    return this._uploaderId;
  }
  get uploaderName(): string {
    return this._uploaderName;
  }
  get verifiedBy(): string | null {
    return this._verifiedBy;
  }
  get verifiedByName(): string | null {
    return this._verifiedByName;
  }
  get verifiedAt(): Date | null {
    return this._verifiedAt;
  }
  get rejectionReason(): string | null {
    return this._rejectionReason;
  }
  get assetId(): string | null {
    return this._assetId;
  }
  get willId(): string | null {
    return this._willId;
  }
  get metadata(): Record<string, any> | null {
    return this._metadata;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }

  // ============================================================================
  // Business Logic Methods
  // ============================================================================

  /**
   * Verify the document (approve it).
   * Only VERIFIER or ADMIN roles should call this (enforced at service layer).
   */
  verify(verifiedBy: string, verifierName: string): void {
    this.ensureNotDeleted();

    if (this._status === DocumentStatus.VERIFIED) {
      throw new DocumentAlreadyVerifiedError();
    }

    this._status = DocumentStatus.VERIFIED;
    this._verifiedBy = verifiedBy;
    this._verifiedByName = verifierName;
    this._verifiedAt = new Date();
    this._rejectionReason = null; // Clear any previous rejection
    this._updatedAt = new Date();

    this.addDomainEvent(
      new DocumentVerifiedEvent({
        aggregateId: this.id,
        filename: this.fileMetadata.filename,
        category: this.category,
        uploaderId: this.uploaderId,
        uploadedBy: this.uploaderName,
        verifiedBy: this._verifiedBy,
        verifiedByName: this._verifiedByName,
        verifiedAt: this._verifiedAt,
        assetId: this.assetId ?? undefined,
        willId: this.willId ?? undefined,
      }),
    );
  }

  /**
   * Reject the document with a reason.
   * Only VERIFIER or ADMIN roles should call this (enforced at service layer).
   */
  reject(rejectedBy: string, rejectorName: string, reason: string): void {
    this.ensureNotDeleted();

    if (this._status === DocumentStatus.VERIFIED) {
      throw new DocumentAlreadyVerifiedError();
    }

    if (!reason || reason.trim().length === 0) {
      throw new DocumentDomainError('Rejection reason is required');
    }

    this._status = DocumentStatus.REJECTED;
    this._verifiedBy = rejectedBy; // Track who rejected
    this._verifiedByName = rejectorName;
    this._verifiedAt = new Date(); // Track when rejected
    this._rejectionReason = reason.trim();
    this._updatedAt = new Date();

    this.addDomainEvent(
      new DocumentRejectedEvent({
        aggregateId: this.id,
        filename: this.fileMetadata.filename,
        category: this.category,
        uploaderId: this.uploaderId,
        uploadedBy: this.uploaderName,
        rejectedBy: rejectedBy,
        rejectedByName: rejectorName,
        rejectionReason: this._rejectionReason,
        rejectedAt: this._verifiedAt,
      }),
    );
  }

  /**
   * Update document metadata (e.g., from OCR extraction).
   * Only allowed on non-verified documents.
   */
  updateMetadata(metadata: Record<string, any>): void {
    this.ensureNotDeleted();

    if (this._status === DocumentStatus.VERIFIED) {
      throw new DocumentAlreadyVerifiedError();
    }

    this._metadata = { ...this._metadata, ...metadata };
    this._updatedAt = new Date();
  }

  /**
   * Soft delete the document.
   * Can be done by owner or admin.
   */
  softDelete(deletedBy: string, reason?: string): void {
    if (this._deletedAt) return; // Already deleted

    // Business rule: Cannot delete verified documents (optional - adjust as needed)
    if (this._status === DocumentStatus.VERIFIED) {
      throw new DocumentDomainError('Cannot delete a verified document');
    }

    this._deletedAt = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent(
      new DocumentDeletedEvent({
        aggregateId: this.id,
        filename: this.fileMetadata.filename,
        uploaderId: this.uploaderId,
        deletedBy: deletedBy,
        deletedAt: this._deletedAt,
        reason: reason,
      }),
    );
  }

  /**
   * Check if document is verified.
   */
  isVerified(): boolean {
    return this._status === DocumentStatus.VERIFIED;
  }

  /**
   * Check if document is rejected.
   */
  isRejected(): boolean {
    return this._status === DocumentStatus.REJECTED;
  }

  /**
   * Check if document is pending verification.
   */
  isPending(): boolean {
    return this._status === DocumentStatus.PENDING_VERIFICATION;
  }

  /**
   * Check if document is deleted.
   */
  isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  /**
   * Ensure document is not deleted before operations.
   */
  private ensureNotDeleted(): void {
    if (this.isDeleted()) {
      throw new DocumentDeletedException();
    }
  }

  /**
   * Check if user owns this document.
   */
  isOwnedBy(userId: string): boolean {
    return this._uploaderId === userId;
  }
}
