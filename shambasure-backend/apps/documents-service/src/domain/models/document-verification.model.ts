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
 * DocumentVerificationAttempt Entity
 *
 * Represents an immutable audit record of a single verification decision.
 * Its consistency is self-contained, and it is managed as part of the Document aggregate.
 *
 * BUSINESS RULES:
 * - Attempts are immutable audit records.
 * - An attempt's status must be either VERIFIED or REJECTED.
 * - A REJECTED attempt must include a reason.
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
    if (!props.status.isVerified() && !props.status.isRejected()) {
      throw new InvalidVerificationStatusError(props.status.value);
    }

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

  equals(other?: DocumentVerificationAttempt): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof DocumentVerificationAttempt)) {
      return false;
    }
    return this._id.equals(other.id);
  }

  /**
   * Returns a plain object representation for serialization purposes (e.g., API responses).
   */
  toObject(): {
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
}
