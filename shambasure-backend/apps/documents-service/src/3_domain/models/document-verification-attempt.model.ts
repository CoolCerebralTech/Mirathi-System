import {
  DocumentId,
  UserId,
  DocumentStatus,
  RejectionReason,
  VerificationAttemptId,
} from '../value-objects';

// ============================================================================
// Domain Errors
// ============================================================================

export class VerificationAttemptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VerificationAttemptError';
  }
}

export class InvalidVerificationStatusError extends VerificationAttemptError {
  constructor(status: string) {
    super(`Invalid verification status: ${status}. Must be VERIFIED or REJECTED.`);
    this.name = 'InvalidVerificationStatusError';
  }
}

export class MissingRejectionReasonError extends VerificationAttemptError {
  constructor() {
    super('Rejection reason is required when status is REJECTED');
    this.name = 'MissingRejectionReasonError';
  }
}

export class VerificationAttemptAccessDeniedError extends VerificationAttemptError {
  constructor(userId: UserId, attemptId: VerificationAttemptId) {
    super(`User ${userId.value} does not have access to verification attempt ${attemptId.value}`);
    this.name = 'VerificationAttemptAccessDeniedError';
  }
}

export class DuplicateVerificationAttemptError extends VerificationAttemptError {
  constructor(documentId: DocumentId, verifierId: UserId) {
    super(
      `Verifier ${verifierId.value} has already attempted to verify document ${documentId.value}`,
    );
    this.name = 'DuplicateVerificationAttemptError';
  }
}

// ============================================================================
// Document Verification Attempt Entity Properties Interface
// ============================================================================

export interface DocumentVerificationAttemptProps {
  id: VerificationAttemptId;
  documentId: DocumentId;
  verifierId: UserId;
  status: DocumentStatus;
  reason: RejectionReason | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

// ============================================================================
// Document Verification Attempt Entity
// ============================================================================

/**
 * DocumentVerificationAttempt Entity - Production Ready
 *
 * BUSINESS RULES:
 * - Each attempt records a single verification decision (approve/reject)
 * - Attempts are immutable audit records
 * - Rejections must include a reason
 * - Metadata can store additional verification context (checklist, notes, etc.)
 * - Multiple attempts can exist per document (audit trail)
 * - Status must be either VERIFIED or REJECTED
 * - Tracks who made the decision and when
 */
export class DocumentVerificationAttempt {
  private readonly _id: VerificationAttemptId;
  private readonly _documentId: DocumentId;
  private readonly _verifierId: UserId;
  private readonly _status: DocumentStatus;
  private readonly _reason: RejectionReason | null;
  private readonly _metadata: Record<string, any> | null;
  private readonly _createdAt: Date;

  private constructor(props: DocumentVerificationAttemptProps) {
    // Validate status is either VERIFIED or REJECTED
    if (!props.status.isVerified() && !props.status.isRejected()) {
      throw new InvalidVerificationStatusError(props.status.value);
    }

    // Validate rejection has a reason
    if (props.status.isRejected() && !props.reason) {
      throw new MissingRejectionReasonError();
    }

    this._id = props.id;
    this._documentId = props.documentId;
    this._verifierId = props.verifierId;
    this._status = props.status;
    this._reason = props.reason;
    this._metadata = props.metadata;
    this._createdAt = props.createdAt;
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Creates a successful verification attempt
   */
  static createVerified(props: {
    documentId: DocumentId;
    verifierId: UserId;
    metadata?: Record<string, any>;
  }): DocumentVerificationAttempt {
    return new DocumentVerificationAttempt({
      id: VerificationAttemptId.generate<VerificationAttemptId>(),
      documentId: props.documentId,
      verifierId: props.verifierId,
      status: DocumentStatus.createVerified(),
      reason: null,
      metadata: props.metadata ?? null,
      createdAt: new Date(),
    });
  }

  /**
   * Creates a rejection verification attempt
   * @throws {MissingRejectionReasonError} if reason is not provided
   */
  static createRejected(props: {
    documentId: DocumentId;
    verifierId: UserId;
    reason: RejectionReason;
    metadata?: Record<string, any>;
  }): DocumentVerificationAttempt {
    return new DocumentVerificationAttempt({
      id: VerificationAttemptId.generate<VerificationAttemptId>(),
      documentId: props.documentId,
      verifierId: props.verifierId,
      status: DocumentStatus.createRejected(),
      reason: props.reason,
      metadata: props.metadata ?? null,
      createdAt: new Date(),
    });
  }

  /**
   * Rehydrates a DocumentVerificationAttempt from persistence
   */
  static fromPersistence(props: {
    id: string;
    documentId: string;
    verifierId: string;
    status: string;
    reason: string | null;
    metadata: Record<string, any> | null;
    createdAt: Date;
  }): DocumentVerificationAttempt {
    return new DocumentVerificationAttempt({
      id: new VerificationAttemptId(props.id),
      documentId: new DocumentId(props.documentId),
      verifierId: new UserId(props.verifierId),
      status: DocumentStatus.create(props.status),
      reason: props.reason ? RejectionReason.create(props.reason) : null,
      metadata: props.metadata,
      createdAt: props.createdAt,
    });
  }

  // ============================================================================
  // Public API & Query Methods
  // ============================================================================

  /**
   * Checks if this attempt was successful (approved)
   */
  isSuccessful(): boolean {
    return this._status.isVerified();
  }

  /**
   * Checks if this attempt was a rejection
   */
  isRejection(): boolean {
    return this._status.isRejected();
  }

  /**
   * Checks if a specific verifier made this attempt
   */
  wasMadeBy(verifierId: UserId): boolean {
    return this._verifierId.equals(verifierId);
  }

  /**
   * Checks if this attempt is for a specific document
   */
  isForDocument(documentId: DocumentId): boolean {
    return this._documentId.equals(documentId);
  }

  /**
   * Checks if metadata exists
   */
  hasMetadata(): boolean {
    return this._metadata !== null && Object.keys(this._metadata).length > 0;
  }

  /**
   * Gets specific metadata field
   */
  getMetadataField(key: string): unknown {
    return this._metadata?.[key];
  }

  /**
   * Checks if reason exists
   */
  hasReason(): boolean {
    return this._reason !== null;
  }

  /**
   * Calculates age of attempt in hours
   */
  getAgeInHours(): number {
    const now = new Date();
    const diff = now.getTime() - this._createdAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  }

  /**
   * Calculates age of attempt in days
   */
  getAgeInDays(): number {
    const now = new Date();
    const diff = now.getTime() - this._createdAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Checks if attempt was made within specified hours
   */
  isMadeWithinHours(hours: number): boolean {
    return this.getAgeInHours() <= hours;
  }

  /**
   * Checks if attempt was made within specified days
   */
  isMadeWithinDays(days: number): boolean {
    return this.getAgeInDays() <= days;
  }

  /**
   * Checks if this is a recent attempt (within 24 hours)
   */
  isRecent(): boolean {
    return this.isMadeWithinHours(24);
  }

  /**
   * Returns human-readable status
   */
  getStatusString(): string {
    return this.isSuccessful() ? 'Verified' : 'Rejected';
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get id(): VerificationAttemptId {
    return this._id;
  }

  get documentId(): DocumentId {
    return this._documentId;
  }

  get verifierId(): UserId {
    return this._verifierId;
  }

  get status(): DocumentStatus {
    return this._status;
  }

  get reason(): RejectionReason | null {
    return this._reason;
  }

  get metadata(): Record<string, any> | null {
    return this._metadata;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // ============================================================================
  // Equality & Serialization
  // ============================================================================

  equals(other: DocumentVerificationAttempt): boolean {
    return this._id.equals(other.id);
  }

  /**
   * Returns a plain object representation (for serialization)
   */
  toPlainObject(): {
    id: string;
    documentId: string;
    verifierId: string;
    status: string;
    reason: string | null;
    metadata: Record<string, any> | null;
    createdAt: Date;
  } {
    return {
      id: this._id.value,
      documentId: this._documentId.value,
      verifierId: this._verifierId.value,
      status: this._status.value,
      reason: this._reason?.value ?? null,
      metadata: this._metadata,
      createdAt: this._createdAt,
    };
  }

  /**
   * Creates a summary for audit logs
   */
  toAuditSummary(): {
    attemptId: string;
    verifierId: string;
    decision: 'APPROVED' | 'REJECTED';
    reason?: string;
    timestamp: Date;
  } {
    return {
      attemptId: this._id.value,
      verifierId: this._verifierId.value,
      decision: this.isSuccessful() ? 'APPROVED' : 'REJECTED',
      reason: this._reason?.value,
      timestamp: this._createdAt,
    };
  }
}
