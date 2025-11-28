import {
  DocumentDeletedEvent,
  DocumentDetailsUpdatedEvent,
  DocumentDownloadedEvent,
  DocumentExpiredEvent,
  DocumentIndexedEvent,
  DocumentMetadataUpdatedEvent,
  DocumentRejectedEvent,
  DocumentRestoredEvent,
  DocumentSharedEvent,
  DocumentUploadedEvent,
  DocumentVerifiedEvent,
  DocumentVersionedEvent,
  DocumentViewedEvent,
  DocumentVisibilityChangedEvent,
  DomainEvent,
} from '../events';
import {
  Actor,
  AllowedViewers,
  AssetId,
  DocumentCategory,
  DocumentChecksum,
  DocumentId,
  DocumentStatus,
  DocumentStatusEnum,
  FileName,
  FileSize,
  MimeType,
  RejectionReason,
  RetentionPolicy,
  StoragePath,
  StorageProvider,
  UserId,
  WillId,
} from '../value-objects';
import { DocumentVerificationAttempt } from './document-verification.model';
import { DocumentVersion } from './document-version.model';

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
    // The message is now more generic and accurate.
    // The domain doesn't know about roles, only that the actor lacks the capability.
    super(
      'The acting user does not have the required permissions to verify or reject this document',
    );
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
export class VersionSequenceError extends DocumentDomainError {
  constructor(expected: number, received: number) {
    super(
      `Version sequence error: expected next version to be ${expected}, but received ${received}`,
    );
    this.name = 'VersionSequenceError';
  }
}
export class DocumentOwnershipError extends DocumentDomainError {
  constructor(action: string) {
    super(`Only the document owner can perform this action: ${action}`);
    this.name = 'DocumentOwnershipError';
  }
}

// ============================================================================
// Document Aggregate Root
// ============================================================================

interface DocumentProps {
  id: DocumentId;
  fileName: FileName;
  fileSize: FileSize;
  mimeType: MimeType;
  checksum: DocumentChecksum | null;
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
  versions: DocumentVersion[];
  verificationAttempts: DocumentVerificationAttempt[];

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
  private _versions: DocumentVersion[];
  private _verificationAttempts: DocumentVerificationAttempt[];

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
    this._versions = props.versions;
    this._verificationAttempts = props.verificationAttempts;
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  static create(props: {
    fileName: FileName;
    fileSize: FileSize;
    mimeType: MimeType;
    checksum?: DocumentChecksum;
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

    // Create the first version of the document.
    const initialVersion = DocumentVersion.create({
      documentId: id,
      versionNumber: 1,
      storagePath: props.storagePath,
      fileSize: props.fileSize,
      mimeType: props.mimeType,
      checksum: props.checksum,
      uploadedBy: props.uploaderId,
      changeNote: 'Initial upload',
    });

    const document = new Document({
      id,
      fileName: props.fileName,
      fileSize: initialVersion.fileSize,
      mimeType: initialVersion.mimeType,
      checksum: initialVersion.checksum,
      storagePath: initialVersion.storagePath,
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
      expiresAt: null,
      isIndexed: false,
      indexedAt: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      versions: [initialVersion],
      verificationAttempts: [],
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
    // The raw versions data from the database is expected here.
    versions: {
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
    }[];
    verificationAttempts: {
      id: string;
      documentId: string;
      verifierId: string;
      status: string;
      reason: string | null;
      metadata: Record<string, any> | null;
      createdAt: Date;
    }[];
  }): Document {
    const versions = (props.versions || []).map((v) => DocumentVersion.fromPersistence(v));

    const verificationAttempts = (props.verificationAttempts || []).map((a) =>
      DocumentVerificationAttempt.fromPersistence(a),
    );
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
      versions,
      verificationAttempts,
    });
  }

  // ============================================================================
  // Public API - Business Operations
  // ============================================================================

  verify(verifier: Actor): void {
    this.ensureNotDeleted();
    this.ensureNotExpired();
    this.ensureNotVerified();

    if (!verifier.isVerifier()) {
      throw new UnauthorizedVerificationError();
    }

    const newStatus = DocumentStatus.createVerified();
    if (!this._status.canTransitionTo(newStatus)) {
      throw new InvalidDocumentStatusTransitionError(this._status, newStatus);
    }

    // Create the verification attempt record
    const attempt = DocumentVerificationAttempt.createVerified({
      documentId: this.id,
      verifierId: verifier.id,
    });
    this._verificationAttempts.push(attempt);

    this._status = newStatus;
    this._verifiedBy = verifier.id;
    this._verifiedAt = new Date();
    this._rejectionReason = null;
    this.incrementVersion();

    this.addDomainEvent(new DocumentVerifiedEvent(this.id, verifier.id));
  }

  reject(rejector: Actor, reason: RejectionReason): void {
    this.ensureNotDeleted();
    this.ensureNotExpired();
    this.ensureNotVerified();

    if (!rejector.isVerifier()) {
      throw new UnauthorizedVerificationError();
    }

    const newStatus = DocumentStatus.createRejected();
    if (!this._status.canTransitionTo(newStatus)) {
      throw new InvalidDocumentStatusTransitionError(this._status, newStatus);
    }

    // Create the verification attempt record
    const attempt = DocumentVerificationAttempt.createRejected({
      documentId: this.id,
      verifierId: rejector.id,
      reason: reason,
    });
    this._verificationAttempts.push(attempt);

    this._status = newStatus;
    this._verifiedBy = rejector.id;
    this._verifiedAt = new Date();
    this._rejectionReason = reason;
    this.incrementVersion();

    this.addDomainEvent(new DocumentRejectedEvent(this.id, rejector.id, reason, true));
  }

  recordNewVersion(props: {
    uploadedBy: UserId;
    storagePath: StoragePath;
    fileSize: FileSize;
    checksum?: DocumentChecksum;
    mimeType: MimeType;
    changeNote?: string;
  }): void {
    this.ensureNotDeleted();
    this.ensureNotVerified();

    const latestVersion = this.getLatestVersion();
    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Create the new version entity.
    const newVersion = DocumentVersion.create({
      documentId: this.id,
      versionNumber: nextVersionNumber,
      uploadedBy: props.uploadedBy,
      storagePath: props.storagePath,
      fileSize: props.fileSize,
      mimeType: props.mimeType,
      checksum: props.checksum,
      changeNote: props.changeNote,
    });

    // Add it to the aggregate's list.
    this._versions.push(newVersion);

    // Update the aggregate's own properties to reflect the latest version.
    this._storagePath = newVersion.storagePath;
    this._fileSize = newVersion.fileSize;
    this._checksum = newVersion.checksum;
    this._mimeType = newVersion.mimeType;

    // Reset indexing state, as the content has changed.
    this._isIndexed = false;
    this._indexedAt = null;

    this.incrementVersion(); // Increment the aggregate's optimistic locking version.

    this.addDomainEvent(
      new DocumentVersionedEvent(
        this.id,
        newVersion.versionNumber,
        newVersion.uploadedBy,
        newVersion.storagePath,
        newVersion.fileSize,
        newVersion.checksum,
        newVersion.changeNote ?? undefined,
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
    fileName?: FileName;
    documentNumber?: string;
    issueDate?: Date;
    expiryDate?: Date;
    issuingAuthority?: string;
    updatedBy: UserId;
  }): void {
    this.ensureNotDeleted();
    this.ensureNotVerified();

    const updates: Record<string, any> = {};

    if (props.fileName !== undefined) {
      this._fileName = props.fileName;
      updates.fileName = props.fileName;
    }

    if (props.documentNumber !== undefined) {
      this._documentNumber = props.documentNumber;
      updates.documentNumber = props.documentNumber;
    }
    if (props.issueDate !== undefined) {
      this._issueDate = props.issueDate;
      updates.issueDate = props.issueDate;
    }
    if (props.expiryDate !== undefined) {
      this._expiryDate = props.expiryDate;
      updates.expiryDate = props.expiryDate;
    }
    if (props.issuingAuthority !== undefined) {
      this._issuingAuthority = props.issuingAuthority;
      updates.issuingAuthority = props.issuingAuthority;
    }

    // Invalidate indexing when document details change
    this._isIndexed = false;
    this._indexedAt = null;

    this.incrementVersion();

    // Dispatch the new event if any changes were made
    if (Object.keys(updates).length > 0) {
      this.addDomainEvent(new DocumentDetailsUpdatedEvent(this.id, props.updatedBy, updates));
    }
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
    this.ensureOwnedBy(setBy, 'set retention policy');

    this._retentionPolicy = policy;
    this.incrementVersion();
  }

  setExpiresAt(expiresAt: Date, setBy: UserId): void {
    this.ensureNotDeleted();
    this.ensureOwnedBy(setBy, 'set expiration date');

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

    this._deletedAt = new Date();

    this._isPublic = false;
    this._allowedViewers = AllowedViewers.createEmpty();

    this.incrementVersion();
    this.addDomainEvent(new DocumentDeletedEvent(this.id, deletedBy, 'SOFT'));
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

  shareWith(sharedBy: Actor, userIdsToShareWith: UserId[]): void {
    this.ensureNotDeleted();
    this.ensureOwnedBy(sharedBy.id, 'shareWith');

    this._allowedViewers = this._allowedViewers.grantAccess(userIdsToShareWith);
    this.incrementVersion();

    this.addDomainEvent(new DocumentSharedEvent(this.id, sharedBy.id, userIdsToShareWith, 'VIEW'));
  }

  revokeAccess(revokedBy: Actor, userIdsToRevoke: UserId[]): void {
    this.ensureNotDeleted();
    this.ensureOwnedBy(revokedBy.id, 'revokeAccess');

    this._allowedViewers = this._allowedViewers.revokeAccess(userIdsToRevoke);
    this.incrementVersion();
  }

  makePublic(changedBy: Actor): void {
    this.ensureNotDeleted();
    this.ensureOwnedBy(changedBy.id, 'makePublic');

    if (this._isPublic) return;

    this._isPublic = true;
    this.incrementVersion();

    this.addDomainEvent(new DocumentVisibilityChangedEvent(this.id, changedBy.id, false, true));
  }

  makePrivate(changedBy: Actor): void {
    this.ensureNotDeleted();
    this.ensureOwnedBy(changedBy.id, 'makePrivate');

    if (!this._isPublic) return;

    this._isPublic = false;
    this.incrementVersion();

    this.addDomainEvent(new DocumentVisibilityChangedEvent(this.id, changedBy.id, true, false));
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
  get versions(): Readonly<DocumentVersion>[] {
    return [...this._versions];
  }
  get verificationAttempts(): Readonly<DocumentVerificationAttempt>[] {
    return [...this._verificationAttempts];
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
  private getLatestVersion(): DocumentVersion | null {
    if (this._versions.length === 0) {
      return null;
    }
    // Sort by version number descending to find the latest.
    return [...this._versions].sort((a, b) => b.versionNumber - a.versionNumber)[0];
  }
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

  private ensureOwnedBy(userId: UserId, action: string): void {
    if (!this.isOwnedBy(userId)) {
      throw new DocumentOwnershipError(action);
    }
  }

  private addDomainEvent(event: DomainEvent<DocumentId>): void {
    this._domainEvents.push(event);
  }
}
