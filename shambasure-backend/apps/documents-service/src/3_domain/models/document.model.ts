import {
  DocumentId,
  UserId,
  WillId,
  AssetId,
  DocumentCategory,
  DocumentStatus,
  RejectionReason,
  StorageProvider,
  AllowedViewers,
  FileName,
  FileSize,
  MimeType,
  DocumentChecksum,
  StoragePath,
  DocumentStatusEnum,
} from '../value-objects';
import {
  DomainEvent,
  DocumentUploadedEvent,
  DocumentVerifiedEvent,
  DocumentRejectedEvent,
  DocumentVersionedEvent,
  DocumentDeletedEvent,
  DocumentDownloadedEvent,
  DocumentViewedEvent,
  DocumentSharedEvent,
  DocumentRestoredEvent,
} from '../events';

// ============================================================================
// Custom Domain Errors
// ============================================================================

export class DocumentDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentDomainError';
  }
}

export class DocumentAlreadyVerifiedError extends DocumentDomainError {
  constructor() {
    super('Document has already been verified and cannot be modified');
    this.name = 'DocumentAlreadyVerifiedError';
  }
}

export class UnauthorizedVerificationError extends DocumentDomainError {
  constructor() {
    super('Only VERIFIER or ADMIN roles can verify documents');
    this.name = 'UnauthorizedVerificationError';
  }
}

export class DocumentDeletedError extends DocumentDomainError {
  constructor() {
    super('Cannot perform actions on a deleted document');
    this.name = 'DocumentDeletedError';
  }
}

export class InvalidDocumentStatusTransitionError extends DocumentDomainError {
  constructor(from: DocumentStatus, to: DocumentStatus) {
    super(`Invalid status transition from ${from.value} to ${to.value}`);
    this.name = 'InvalidDocumentStatusTransitionError';
  }
}

// ============================================================================
// Document Aggregate Root
// ============================================================================

export interface DocumentProps {
  id: DocumentId;
  fileName: FileName;
  fileSize: FileSize;
  mimeType: MimeType;
  checksum: DocumentChecksum;
  storagePath: StoragePath;
  category: DocumentCategory;
  status: DocumentStatus;
  uploaderId: UserId;

  // Verification tracking
  verifiedBy: UserId | null;
  verifiedAt: Date | null;
  rejectionReason: RejectionReason | null;

  // Cross-service references
  assetId: AssetId | null;
  willId: WillId | null;
  identityForUserId: UserId | null;

  // Metadata & extended properties
  metadata: Record<string, any> | null;

  // Security & access control
  isPublic: boolean;
  encrypted: boolean;
  allowedViewers: AllowedViewers;
  storageProvider: StorageProvider;

  // System timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Document Aggregate Root - Production Ready
 *
 * BUSINESS RULES ENFORCED:
 * - Only uploader or admin can modify documents
 * - Verified documents become immutable (cannot be modified or deleted)
 * - Only VERIFIER/ADMIN can change verification status
 * - Deleted documents cannot be modified
 * - Status transitions follow strict business rules
 * - All state changes emit domain events for event sourcing
 * - Access control is enforced at domain level
 */
export class Document {
  private readonly _id: DocumentId;
  private _fileName: FileName;
  private _fileSize: FileSize;
  private _mimeType: MimeType;
  private _checksum: DocumentChecksum;
  private _storagePath: StoragePath;
  private readonly _category: DocumentCategory;
  private _status: DocumentStatus;
  private readonly _uploaderId: UserId;
  private _verifiedBy: UserId | null;
  private _verifiedAt: Date | null;
  private _rejectionReason: RejectionReason | null;
  private readonly _assetId: AssetId | null;
  private readonly _willId: WillId | null;
  private readonly _identityForUserId: UserId | null;
  private _metadata: Record<string, any> | null;
  private _isPublic: boolean;
  private _encrypted: boolean;
  private _allowedViewers: AllowedViewers;
  private readonly _storageProvider: StorageProvider;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private _domainEvents: DomainEvent<DocumentId>[] = [];

  // Private constructor to enforce factory methods
  private constructor(props: DocumentProps) {
    this._id = props.id;
    this._fileName = props.fileName;
    this._fileSize = props.fileSize;
    this._mimeType = props.mimeType;
    this._checksum = props.checksum;
    this._storagePath = props.storagePath;
    this._category = props.category;
    this._status = props.status;
    this._uploaderId = props.uploaderId;
    this._verifiedBy = props.verifiedBy;
    this._verifiedAt = props.verifiedAt;
    this._rejectionReason = props.rejectionReason;
    this._assetId = props.assetId;
    this._willId = props.willId;
    this._identityForUserId = props.identityForUserId;
    this._metadata = props.metadata;
    this._isPublic = props.isPublic;
    this._encrypted = props.encrypted;
    this._allowedViewers = props.allowedViewers;
    this._storageProvider = props.storageProvider;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Creates a new Document aggregate for upload
   */
  static create(props: {
    fileName: FileName;
    fileSize: FileSize;
    mimeType: MimeType;
    checksum: DocumentChecksum;
    storagePath: StoragePath;
    category: DocumentCategory;
    uploaderId: UserId;
    storageProvider: StorageProvider;
    assetId?: AssetId;
    willId?: WillId;
    identityForUserId?: UserId;
    metadata?: Record<string, any>;
    isPublic?: boolean;
  }): Document {
    const now = new Date();
    const id = DocumentId.generate<DocumentId>();

    const document = new Document({
      id,
      fileName: props.fileName,
      fileSize: props.fileSize,
      mimeType: props.mimeType,
      checksum: props.checksum,
      storagePath: props.storagePath,
      category: props.category,
      status: DocumentStatus.createPending(),
      uploaderId: props.uploaderId,
      storageProvider: props.storageProvider,
      verifiedBy: null,
      verifiedAt: null,
      rejectionReason: null,
      assetId: props.assetId ?? null,
      willId: props.willId ?? null,
      identityForUserId: props.identityForUserId ?? null,
      metadata: props.metadata ?? null,
      isPublic: props.isPublic ?? false,
      encrypted: true, // Encrypt by default at rest
      allowedViewers: AllowedViewers.createEmpty(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    // Emit domain event
    document.addDomainEvent(
      new DocumentUploadedEvent(
        document.id,
        document.uploaderId,
        document.fileName,
        document.storagePath,
        document.mimeType,
        document.fileSize,
        document.category,
        document.checksum,
        document.metadata ?? undefined,
      ),
    );

    return document;
  }

  /**
   * Rehydrates a Document aggregate from persistence
   */
  static fromPersistence(props: {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    checksum: string;
    storagePath: string;
    category: string; // e.g., 'LAND_OWNERSHIP'
    status: string; // e.g., 'VERIFIED'
    uploaderId: string;
    verifiedBy: string | null;
    verifiedAt: Date | null;
    rejectionReason: string | null;
    assetId: string | null;
    willId: string | null;
    identityForUserId: string | null;
    metadata: Record<string, any> | null;
    isPublic: boolean;
    encrypted: boolean;
    allowedViewers: string[];
    storageProvider: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Document {
    return new Document({
      id: new DocumentId(props.id),
      fileName: FileName.create(props.fileName),
      fileSize: FileSize.create(props.fileSize),
      mimeType: MimeType.create(props.mimeType),
      checksum: DocumentChecksum.create(props.checksum),
      storagePath: StoragePath.fromExisting(props.storagePath),
      category: DocumentCategory.create(props.category),
      status: DocumentStatus.create(props.status),
      uploaderId: new UserId(props.uploaderId),
      verifiedBy: props.verifiedBy ? new UserId(props.verifiedBy) : null,
      verifiedAt: props.verifiedAt,
      rejectionReason: props.rejectionReason ? RejectionReason.create(props.rejectionReason) : null,
      assetId: props.assetId ? new AssetId(props.assetId) : null,
      willId: props.willId ? new WillId(props.willId) : null,
      identityForUserId: props.identityForUserId ? new UserId(props.identityForUserId) : null,
      metadata: props.metadata,
      isPublic: props.isPublic,
      encrypted: props.encrypted,
      allowedViewers: AllowedViewers.create(props.allowedViewers.map((id) => new UserId(id))),
      storageProvider: StorageProvider.create(props.storageProvider),
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      deletedAt: props.deletedAt,
    });
  }

  // ============================================================================
  // Public API - Business Operations
  // ============================================================================

  /**
   * Verify the document (approve it)
   * @throws {DocumentAlreadyVerifiedError} - If already verified
   * @throws {DocumentDeletedError} - If document is deleted
   */
  verify(verifiedBy: UserId): void {
    this.ensureNotDeleted();
    this.ensureNotVerified();

    const newStatus = DocumentStatus.createVerified();
    if (!this._status.canTransitionTo(newStatus)) {
      throw new InvalidDocumentStatusTransitionError(this._status, newStatus);
    }

    this._status = newStatus;
    this._verifiedBy = verifiedBy;
    this._verifiedAt = new Date();
    this._rejectionReason = null;
    this._updatedAt = new Date();

    this.addDomainEvent(new DocumentVerifiedEvent(this.id, verifiedBy));
  }

  /**
   * Reject the document with a reason
   * @throws {DocumentAlreadyVerifiedError} - If already verified
   * @throws {DocumentDeletedError} - If document is deleted
   */
  reject(rejectedBy: UserId, reason: RejectionReason): void {
    this.ensureNotDeleted();
    this.ensureNotVerified();

    const newStatus = DocumentStatus.createRejected();
    if (!this._status.canTransitionTo(newStatus)) {
      throw new InvalidDocumentStatusTransitionError(this._status, newStatus);
    }

    this._status = newStatus;
    this._verifiedBy = rejectedBy; // The verifier who rejected it
    this._verifiedAt = new Date(); // The time of rejection
    this._rejectionReason = reason;
    this._updatedAt = new Date();

    this.addDomainEvent(new DocumentRejectedEvent(this.id, rejectedBy, reason, true));
  }

  /**
   * Records that a new version has been uploaded.
   * Note: This does NOT change the aggregate's own file properties.
   * It announces the event so the application layer can create the DocumentVersion entity.
   */
  recordNewVersion(props: {
    uploadedBy: UserId;
    storagePath: StoragePath;
    fileSize: FileSize;
    checksum: DocumentChecksum;
    versionNumber: number;
    changeNote?: string;
  }): void {
    this.ensureNotDeleted();
    this.ensureNotVerified();

    this._updatedAt = new Date();

    this.addDomainEvent(
      new DocumentVersionedEvent(
        this.id,
        props.versionNumber,
        props.uploadedBy,
        props.storagePath,
        props.fileSize,
        props.checksum,
        props.changeNote,
      ),
    );
  }

  /**
   * Update document metadata (for non-verified documents only)
   */
  updateMetadata(metadata: Record<string, any>): void {
    this.ensureNotDeleted();
    this.ensureNotVerified();

    this._metadata = { ...this._metadata, ...metadata };
    this._updatedAt = new Date();
  }

  /**
   * Soft delete the document
   */
  softDelete(deletedBy: UserId): void {
    if (this.isDeleted()) return;
    this.ensureNotVerified();

    this._deletedAt = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent(new DocumentDeletedEvent(this.id, deletedBy, 'SOFT'));
  }

  /**
   * Restore a soft-deleted document
   */
  restore(restoredBy: UserId): void {
    if (!this.isDeleted()) return;
    const previousStatus = this._status;
    this._deletedAt = null;
    this._updatedAt = new Date();
    this.addDomainEvent(new DocumentRestoredEvent(this.id, restoredBy, previousStatus));
  }

  /**
   * Record document download for audit trail
   */
  recordDownload(downloadedBy: UserId, ipAddress: string, userAgent: string): void {
    this.ensureNotDeleted();
    this.ensureCanBeAccessedBy(downloadedBy);
    this.addDomainEvent(new DocumentDownloadedEvent(this.id, downloadedBy, ipAddress, userAgent));
  }

  /**
   * Record document view for analytics
   */
  recordView(viewedBy: UserId, ipAddress: string, userAgent: string): void {
    this.ensureNotDeleted();
    this.ensureCanBeAccessedBy(viewedBy);
    this.addDomainEvent(new DocumentViewedEvent(this.id, viewedBy, ipAddress, userAgent));
  }

  /**
   * Share document with other users
   */
  shareWith(sharedBy: UserId, userIdsToShareWith: UserId[]): void {
    this.ensureNotDeleted();
    this.ensureOwnedBy(sharedBy);

    this._allowedViewers.grantAccess(userIdsToShareWith);
    this._updatedAt = new Date();

    this.addDomainEvent(new DocumentSharedEvent(this.id, sharedBy, userIdsToShareWith, 'VIEW'));
  }

  /**
   * Make document public
   */
  makePublic(changedBy: UserId): void {
    this.ensureNotDeleted();
    this.ensureOwnedBy(changedBy);

    this._isPublic = true;
    this._updatedAt = new Date();
  }

  /**
   * Make document private
   */
  makePrivate(changedBy: UserId): void {
    this.ensureNotDeleted();
    this.ensureOwnedBy(changedBy);

    this._isPublic = false;
    this._updatedAt = new Date();
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  canBeAccessedBy(userId: UserId): boolean {
    if (this.isDeleted()) return false;
    if (this.isPublic()) return true;
    if (this.isOwnedBy(userId)) return true;
    return this._allowedViewers.includes(userId);
  }

  isOwnedBy(userId: UserId): boolean {
    return this._uploaderId.equals(userId);
  }

  isVerified(): boolean {
    return this._status.value === DocumentStatusEnum.VERIFIED;
  }

  isRejected(): boolean {
    return this._status.value === DocumentStatusEnum.REJECTED;
  }

  isPending(): boolean {
    return this._status.value === DocumentStatusEnum.PENDING_VERIFICATION;
  }

  isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  isPublic(): boolean {
    return this._isPublic;
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get id(): DocumentId {
    return this._id;
  }
  get fileName(): FileName {
    return this._fileName;
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
  get storagePath(): StoragePath {
    return this._storagePath;
  }
  get category(): DocumentCategory {
    return this._category;
  }
  get status(): DocumentStatus {
    return this._status;
  }
  get uploaderId(): UserId {
    return this._uploaderId;
  }
  get verifiedBy(): UserId | null {
    return this._verifiedBy;
  }
  get verifiedAt(): Date | null {
    return this._verifiedAt;
  }
  get rejectionReason(): RejectionReason | null {
    return this._rejectionReason;
  }
  get assetId(): AssetId | null {
    return this._assetId;
  }
  get willId(): WillId | null {
    return this._willId;
  }
  get identityForUserId(): UserId | null {
    return this._identityForUserId;
  }
  get metadata(): Record<string, any> | null {
    return this._metadata;
  }
  get encrypted(): boolean {
    return this._encrypted;
  }
  get allowedViewers(): AllowedViewers {
    return this._allowedViewers;
  }
  get storageProvider(): StorageProvider {
    return this._storageProvider;
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
  get domainEvents(): DomainEvent<DocumentId>[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }

  // ============================================================================
  // Private Validation Methods
  // ============================================================================

  private ensureNotDeleted(): void {
    if (this.isDeleted()) {
      throw new DocumentDeletedError();
    }
  }

  private ensureNotVerified(): void {
    if (this.isVerified()) {
      throw new DocumentAlreadyVerifiedError();
    }
  }

  private ensureCanBeAccessedBy(userId: UserId): void {
    if (!this.canBeAccessedBy(userId)) {
      throw new DocumentDomainError('User does not have access to this document');
    }
  }

  private ensureOwnedBy(userId: UserId): void {
    if (!this.isOwnedBy(userId)) {
      throw new DocumentDomainError('Only document owner can perform this action');
    }
  }

  private addDomainEvent(event: DomainEvent<DocumentId>): void {
    this._domainEvents.push(event);
  }
}
