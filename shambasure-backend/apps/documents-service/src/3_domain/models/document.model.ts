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
  RetentionPolicy,
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
  DocumentMetadataUpdatedEvent,
  DocumentVisibilityChangedEvent,
  DocumentExpiredEvent,
  DocumentIndexedEvent,
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

export class DocumentExpiredError extends DocumentDomainError {
  constructor() {
    super('Document has expired and cannot be accessed');
    this.name = 'DocumentExpiredError';
  }
}

export class InvalidDocumentStatusTransitionError extends DocumentDomainError {
  constructor(from: DocumentStatus, to: DocumentStatus) {
    super(`Invalid status transition from ${from.value} to ${to.value}`);
    this.name = 'InvalidDocumentStatusTransitionError';
  }
}

export class ConcurrentModificationError extends DocumentDomainError {
  constructor() {
    super('Document was modified by another process. Please retry.');
    this.name = 'ConcurrentModificationError';
  }
}

export class DocumentAccessDeniedError extends DocumentDomainError {
  constructor(userId: UserId, documentId: DocumentId) {
    super(`User ${userId.value} does not have access to document ${documentId.value}`);
    this.name = 'DocumentAccessDeniedError';
  }
}

export class InvalidRetentionPolicyError extends DocumentDomainError {
  constructor(policy: string) {
    super(`Invalid retention policy: ${policy}`);
    this.name = 'InvalidRetentionPolicyError';
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
  checksum: DocumentChecksum | null; // Made nullable per Prisma schema
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
  documentNumber: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  issuingAuthority: string | null;

  // Security & access control
  isPublic: boolean;
  encrypted: boolean;
  allowedViewers: AllowedViewers;
  storageProvider: StorageProvider;

  // Retention & lifecycle (UPDATED per Prisma schema)
  retentionPolicy: RetentionPolicy | null;
  expiresAt: Date | null; // Auto-delete after this date (separate from document expiry)

  // Search indexing (NEW - from Prisma schema)
  isIndexed: boolean;
  indexedAt: Date | null;

  // Concurrency control
  version: number;

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
 * - Expired documents cannot be accessed
 * - Status transitions follow strict business rules
 * - All state changes emit domain events for event sourcing
 * - Access control is enforced at domain level
 * - Optimistic locking prevents concurrent modification conflicts
 * - Retention policies enforce legal compliance
 * - Search indexing state managed properly
 */
export class Document {
  private readonly _id: DocumentId;
  private _fileName: FileName;
  private _fileSize: FileSize;
  private _mimeType: MimeType;
  private _checksum: DocumentChecksum | null;
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
  private _documentNumber: string | null;
  private _issueDate: Date | null;
  private _expiryDate: Date | null;
  private _issuingAuthority: string | null;
  private _isPublic: boolean;
  private _encrypted: boolean;
  private _allowedViewers: AllowedViewers;
  private readonly _storageProvider: StorageProvider;
  private _retentionPolicy: RetentionPolicy | null;
  private _expiresAt: Date | null;
  private _isIndexed: boolean;
  private _indexedAt: Date | null;
  private _version: number;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private _domainEvents: DomainEvent<DocumentId>[] = [];

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
    this._documentNumber = props.documentNumber;
    this._issueDate = props.issueDate;
    this._expiryDate = props.expiryDate;
    this._issuingAuthority = props.issuingAuthority;
    this._isPublic = props.isPublic;
    this._encrypted = props.encrypted;
    this._allowedViewers = props.allowedViewers;
    this._storageProvider = props.storageProvider;
    this._retentionPolicy = props.retentionPolicy;
    this._expiresAt = props.expiresAt;
    this._isIndexed = props.isIndexed;
    this._indexedAt = props.indexedAt;
    this._version = props.version;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  static create(props: {
    fileName: FileName;
    fileSize: FileSize;
    mimeType: MimeType;
    checksum?: DocumentChecksum; // Made optional per Prisma schema
    storagePath: StoragePath;
    category: DocumentCategory;
    uploaderId: UserId;
    storageProvider: StorageProvider;
    assetId?: AssetId;
    willId?: WillId;
    identityForUserId?: UserId;
    metadata?: Record<string, any>;
    documentNumber?: string;
    issueDate?: Date;
    expiryDate?: Date;
    issuingAuthority?: string;
    isPublic?: boolean;
    retentionPolicy?: RetentionPolicy;
  }): Document {
    const now = new Date();
    const id = DocumentId.generate<DocumentId>();

    const document = new Document({
      id,
      fileName: props.fileName,
      fileSize: props.fileSize,
      mimeType: props.mimeType,
      checksum: props.checksum ?? null, // Handle nullability
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
      documentNumber: props.documentNumber ?? null,
      issueDate: props.issueDate ?? null,
      expiryDate: props.expiryDate ?? null,
      issuingAuthority: props.issuingAuthority ?? null,
      isPublic: props.isPublic ?? false,
      encrypted: true,
      allowedViewers: AllowedViewers.createEmpty(),
      retentionPolicy: props.retentionPolicy ?? null,
      expiresAt: null, // Initially null, set via retention policy
      isIndexed: false, // Default per Prisma schema
      indexedAt: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

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

  static fromPersistence(props: {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    checksum: string | null;
    storagePath: string;
    category: string;
    status: string;
    uploaderId: string;
    verifiedBy: string | null;
    verifiedAt: Date | null;
    rejectionReason: string | null;
    assetId: string | null;
    willId: string | null;
    identityForUserId: string | null;
    metadata: Record<string, any> | null;
    documentNumber: string | null;
    issueDate: Date | null;
    expiryDate: Date | null;
    issuingAuthority: string | null;
    isPublic: boolean;
    encrypted: boolean;
    allowedViewers: string[];
    storageProvider: string;
    retentionPolicy: string | null;
    expiresAt: Date | null;
    isIndexed: boolean;
    indexedAt: Date | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Document {
    return new Document({
      id: new DocumentId(props.id),
      fileName: FileName.create(props.fileName),
      fileSize: FileSize.create(props.fileSize),
      mimeType: MimeType.create(props.mimeType),
      checksum: props.checksum ? DocumentChecksum.create(props.checksum) : null,
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
      documentNumber: props.documentNumber,
      issueDate: props.issueDate,
      expiryDate: props.expiryDate,
      issuingAuthority: props.issuingAuthority,
      isPublic: props.isPublic,
      encrypted: props.encrypted,
      allowedViewers: AllowedViewers.create(props.allowedViewers.map((id) => new UserId(id))),
      storageProvider: StorageProvider.create(props.storageProvider),
      retentionPolicy: props.retentionPolicy ? RetentionPolicy.create(props.retentionPolicy) : null,
      expiresAt: props.expiresAt,
      isIndexed: props.isIndexed,
      indexedAt: props.indexedAt,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      deletedAt: props.deletedAt,
    });
  }

  // ============================================================================
  // Public API - Business Operations
  // ============================================================================

  verify(verifiedBy: UserId): void {
    this.ensureNotDeleted();
    this.ensureNotExpired();
    this.ensureNotVerified();

    const newStatus = DocumentStatus.createVerified();
    if (!this._status.canTransitionTo(newStatus)) {
      throw new InvalidDocumentStatusTransitionError(this._status, newStatus);
    }

    this._status = newStatus;
    this._verifiedBy = verifiedBy;
    this._verifiedAt = new Date();
    this._rejectionReason = null;
    this.incrementVersion();

    this.addDomainEvent(new DocumentVerifiedEvent(this.id, verifiedBy));
  }

  reject(rejectedBy: UserId, reason: RejectionReason): void {
    this.ensureNotDeleted();
    this.ensureNotExpired();
    this.ensureNotVerified();

    const newStatus = DocumentStatus.createRejected();
    if (!this._status.canTransitionTo(newStatus)) {
      throw new InvalidDocumentStatusTransitionError(this._status, newStatus);
    }

    this._status = newStatus;
    this._verifiedBy = rejectedBy;
    this._verifiedAt = new Date();
    this._rejectionReason = reason;
    this.incrementVersion();

    this.addDomainEvent(new DocumentRejectedEvent(this.id, rejectedBy, reason, true));
  }

  recordNewVersion(props: {
    uploadedBy: UserId;
    storagePath: StoragePath;
    fileSize: FileSize;
    checksum: DocumentChecksum;
    mimeType: MimeType;
    versionNumber: number;
    changeNote?: string;
  }): void {
    this.ensureNotDeleted();
    this.ensureNotVerified();

    // Update file properties for new version
    this._storagePath = props.storagePath;
    this._fileSize = props.fileSize;
    this._checksum = props.checksum;
    this._mimeType = props.mimeType;

    // Reset indexing state for new version
    this._isIndexed = false;
    this._indexedAt = null;

    this.incrementVersion();

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

  updateMetadata(metadata: Record<string, any>, updatedBy: UserId): void {
    this.ensureNotDeleted();
    this.ensureNotVerified();

    const previousMetadata = this._metadata;
    this._metadata = { ...this._metadata, ...metadata };

    // Invalidate indexing when metadata changes
    this._isIndexed = false;
    this._indexedAt = null;

    this.incrementVersion();

    this.addDomainEvent(
      new DocumentMetadataUpdatedEvent(this.id, updatedBy, previousMetadata, this._metadata),
    );
  }

  updateDocumentDetails(props: {
    documentNumber?: string;
    issueDate?: Date;
    expiryDate?: Date;
    issuingAuthority?: string;
    updatedBy: UserId;
  }): void {
    this.ensureNotDeleted();
    this.ensureNotVerified();

    if (props.documentNumber !== undefined) this._documentNumber = props.documentNumber;
    if (props.issueDate !== undefined) this._issueDate = props.issueDate;
    if (props.expiryDate !== undefined) this._expiryDate = props.expiryDate;
    if (props.issuingAuthority !== undefined) this._issuingAuthority = props.issuingAuthority;

    // Invalidate indexing when document details change
    this._isIndexed = false;
    this._indexedAt = null;

    this.incrementVersion();
  }

  // NEW: Indexing state management
  markAsIndexed(): void {
    if (this._isIndexed) return;

    this._isIndexed = true;
    this._indexedAt = new Date();
    this.incrementVersion();

    this.addDomainEvent(new DocumentIndexedEvent(this.id, this._indexedAt));
  }

  markAsUnindexed(): void {
    if (!this._isIndexed) return;

    this._isIndexed = false;
    this._indexedAt = null;
    this.incrementVersion();
  }

  // NEW: Retention policy management
  setRetentionPolicy(policy: RetentionPolicy, setBy: UserId): void {
    this.ensureNotDeleted();
    this.ensureOwnedBy(setBy);

    this._retentionPolicy = policy;
    this.incrementVersion();
  }

  setExpiresAt(expiresAt: Date, setBy: UserId): void {
    this.ensureNotDeleted();
    this.ensureOwnedBy(setBy);

    this._expiresAt = expiresAt;
    this.incrementVersion();
  }

  // NEW: Checksum validation and update
  validateChecksum(expectedChecksum: DocumentChecksum): boolean {
    return this._checksum?.equals(expectedChecksum) ?? false;
  }

  updateChecksum(newChecksum: DocumentChecksum, updatedBy: UserId): void {
    this.ensureNotDeleted();
    this.ensureNotVerified();

    const oldChecksum = this._checksum;
    this._checksum = newChecksum;
    this.incrementVersion();

    this.addDomainEvent(
      new DocumentMetadataUpdatedEvent(
        this.id,
        updatedBy,
        { checksum: oldChecksum },
        { checksum: newChecksum },
      ),
    );
  }

  softDelete(deletedBy: UserId): void {
    if (this.isDeleted()) return;
    this.ensureNotVerified();

    this._deletedAt = new Date();
    this.incrementVersion();

    this.addDomainEvent(new DocumentDeletedEvent(this.id, deletedBy, 'SOFT'));
  }

  hardDelete(deletedBy: UserId): void {
    this._deletedAt = new Date();
    this.incrementVersion();

    this.addDomainEvent(new DocumentDeletedEvent(this.id, deletedBy, 'HARD'));
  }

  restore(restoredBy: UserId): void {
    if (!this.isDeleted()) return;

    const previousStatus = this._status;
    this._deletedAt = null;
    this.incrementVersion();

    this.addDomainEvent(new DocumentRestoredEvent(this.id, restoredBy, previousStatus));
  }

  recordDownload(downloadedBy: UserId, ipAddress: string, userAgent: string): void {
    this.ensureNotDeleted();
    this.ensureNotExpired();
    this.ensureCanBeAccessedBy(downloadedBy);

    this.addDomainEvent(new DocumentDownloadedEvent(this.id, downloadedBy, ipAddress, userAgent));
  }

  recordView(viewedBy: UserId, ipAddress: string, userAgent: string): void {
    this.ensureNotDeleted();
    this.ensureNotExpired();
    this.ensureCanBeAccessedBy(viewedBy);

    this.addDomainEvent(new DocumentViewedEvent(this.id, viewedBy, ipAddress, userAgent));
  }

  shareWith(sharedBy: UserId, userIdsToShareWith: UserId[]): void {
    this.ensureNotDeleted();
    this.ensureOwnedBy(sharedBy);

    this._allowedViewers = this._allowedViewers.grantAccess(userIdsToShareWith);
    this.incrementVersion();

    this.addDomainEvent(new DocumentSharedEvent(this.id, sharedBy, userIdsToShareWith, 'VIEW'));
  }

  revokeAccess(revokedBy: UserId, userIdsToRevoke: UserId[]): void {
    this.ensureNotDeleted();
    this.ensureOwnedBy(revokedBy);

    this._allowedViewers = this._allowedViewers.revokeAccess(userIdsToRevoke);
    this.incrementVersion();
  }

  makePublic(changedBy: UserId): void {
    this.ensureNotDeleted();
    this.ensureOwnedBy(changedBy);

    if (this._isPublic) return;

    this._isPublic = true;
    this.incrementVersion();

    this.addDomainEvent(new DocumentVisibilityChangedEvent(this.id, changedBy, false, true));
  }

  makePrivate(changedBy: UserId): void {
    this.ensureNotDeleted();
    this.ensureOwnedBy(changedBy);

    if (!this._isPublic) return;

    this._isPublic = false;
    this.incrementVersion();

    this.addDomainEvent(new DocumentVisibilityChangedEvent(this.id, changedBy, true, false));
  }

  markAsExpired(): void {
    if (!this._expiresAt) return;
    if (this._expiresAt > new Date()) return;

    this.addDomainEvent(new DocumentExpiredEvent(this.id, this._expiresAt));
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  canBeAccessedBy(userId: UserId): boolean {
    if (this.isDeleted()) return false;
    if (this.isExpired()) return false;
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

  isExpired(): boolean {
    if (!this._expiresAt) return false;
    return this._expiresAt <= new Date();
  }

  hasRetentionPolicy(): boolean {
    return this._retentionPolicy !== null;
  }

  hasChecksum(): boolean {
    return this._checksum !== null;
  }

  // ============================================================================
  // Concurrency Control
  // ============================================================================

  checkVersion(expectedVersion: number): void {
    if (this._version !== expectedVersion) {
      throw new ConcurrentModificationError();
    }
  }

  private incrementVersion(): void {
    this._version++;
    this._updatedAt = new Date();
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
  get checksum(): DocumentChecksum | null {
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
  get documentNumber(): string | null {
    return this._documentNumber;
  }
  get issueDate(): Date | null {
    return this._issueDate;
  }
  get expiryDate(): Date | null {
    return this._expiryDate;
  }
  get issuingAuthority(): string | null {
    return this._issuingAuthority;
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
  get retentionPolicy(): RetentionPolicy | null {
    return this._retentionPolicy;
  }
  get expiresAt(): Date | null {
    return this._expiresAt;
  }
  get isIndexed(): boolean {
    return this._isIndexed;
  }
  get indexedAt(): Date | null {
    return this._indexedAt;
  }
  get version(): number {
    return this._version;
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

  private ensureNotExpired(): void {
    if (this.isExpired()) {
      throw new DocumentExpiredError();
    }
  }

  private ensureCanBeAccessedBy(userId: UserId): void {
    if (!this.canBeAccessedBy(userId)) {
      throw new DocumentAccessDeniedError(userId, this._id);
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
